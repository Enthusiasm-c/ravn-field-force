import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MapPin, Phone, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { prisma } from "@/lib/db";
import { ConsoleTopbar } from "@/components/console-topbar";
import { SalesTrend } from "@/components/sales-trend";
import { MapView } from "@/components/map/map-view";
import { formatIDR, compactIDR, freshness } from "@/lib/utils";
import { OUTLET_TYPE_LABEL, PIN, STATUS_META } from "@/lib/demo";

export const dynamic = "force-dynamic";

const monthKeyFmt = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  timeZone: "Asia/Makassar",
});
const monthLabelFmt = new Intl.DateTimeFormat("en", {
  month: "short",
  timeZone: "Asia/Makassar",
});
const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  timeZone: "Asia/Makassar",
});

const MONTH_ANCHORS = [
  "2025-10-15", "2025-11-15", "2025-12-15",
  "2026-01-15", "2026-02-15", "2026-03-15", "2026-04-15",
].map((d) => new Date(`${d}T06:00:00+08:00`));

export default async function OutletDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const outlet = await prisma.outlet.findUnique({ where: { id } });
  if (!outlet) notFound();

  const [orders, visits] = await Promise.all([
    prisma.order.findMany({
      where: { outletId: id },
      orderBy: { createdAt: "desc" },
      include: { lines: { include: { product: true } }, rep: true },
    }),
    prisma.visit.findMany({
      where: { outletId: id },
      orderBy: { checkInAt: "desc" },
      include: { rep: true },
      take: 6,
    }),
  ]);

  const earning = orders.filter((o) => o.status !== "REJECTED");
  const lifetime = earning.reduce((s, o) => s + o.total, 0);
  const avg = earning.length ? Math.round(lifetime / earning.length) : 0;
  const visitCount = await prisma.visit.count({ where: { outletId: id } });
  const f = freshness(outlet.lastVisitAt);

  // monthly revenue series
  const byMonth = new Map<string, number>();
  for (const o of earning) {
    const k = monthKeyFmt.format(o.createdAt);
    byMonth.set(k, (byMonth.get(k) ?? 0) + o.total);
  }
  const series = MONTH_ANCHORS.map((a) => ({
    label: monthLabelFmt.format(a),
    value: byMonth.get(monthKeyFmt.format(a)) ?? 0,
  }));
  const lastV = series[series.length - 1].value;
  const prevV = series[series.length - 2].value;
  const deltaPct = prevV > 0 ? Math.round(((lastV - prevV) / prevV) * 100) : 0;

  // SKU mix
  const skuMap = new Map<string, number>();
  for (const o of earning)
    for (const l of o.lines)
      skuMap.set(l.product.name, (skuMap.get(l.product.name) ?? 0) + l.lineTotal);
  const skuMix = [...skuMap.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  const skuTotal = skuMix.reduce((s, x) => s + x.value, 0) || 1;

  return (
    <div className="flex min-h-dvh flex-col">
      <ConsoleTopbar
        title="Outlet"
        subtitle="Master record · sales & activity"
        initials="SW"
        name="Siti Wulandari"
        role="Sales Manager · Bali"
      />

      <div className="px-6 py-5">
        <Link
          href="/console/outlets"
          className="mb-4 inline-flex items-center gap-1 text-[12px] text-muted hover:text-text"
        >
          <ChevronLeft className="h-4 w-4" /> Outlets
        </Link>

        {/* header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="serif text-3xl tracking-tight">{outlet.name}</h1>
              {outlet.priority && (
                <span className="rounded-full bg-ice/10 px-2 py-0.5 text-[10px] text-ice">
                  Priority
                </span>
              )}
            </div>
            <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-muted">
              <MapPin className="h-3 w-3" />
              {outlet.area} · {OUTLET_TYPE_LABEL[outlet.type]} · {outlet.address}
            </p>
            <div className="mt-2 flex items-center gap-2">
              {outlet.brands.map((b) => (
                <span
                  key={b}
                  className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted"
                >
                  {b}
                </span>
              ))}
              {outlet.contactName && (
                <span className="flex items-center gap-1 text-[11px] text-faint">
                  <Phone className="h-3 w-3" /> {outlet.contactName} · {outlet.contactPhone}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi label="Revenue · lifetime" value={`IDR ${compactIDR(lifetime)}`} />
          <Kpi label="Orders" value={String(earning.length)} />
          <Kpi label="Avg order" value={`IDR ${compactIDR(avg)}`} />
          <Kpi
            label="Last visit"
            value={f.label.replace("Last visit · ", "")}
            tone={f.stale ? "glow" : undefined}
            foot={`${visitCount} visits logged`}
          />
        </div>

        {/* main grid */}
        <div className="mt-3 grid gap-3 lg:grid-cols-[1.6fr_1fr]">
          {/* trend + sku */}
          <div className="space-y-3">
            <Card>
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-medium">Sales trend · monthly revenue</p>
                <Delta pct={deltaPct} />
              </div>
              <div className="mt-4">
                <SalesTrend data={series} />
              </div>
            </Card>

            <Card>
              <p className="text-[13px] font-medium">Product mix</p>
              <div className="mt-3 space-y-2.5">
                {skuMix.map((s) => {
                  const pct = Math.round((s.value / skuTotal) * 100);
                  return (
                    <div key={s.name}>
                      <div className="flex items-center justify-between text-[12px]">
                        <span>{s.name}</span>
                        <span className="tabular text-muted">
                          {compactIDR(s.value)} · {pct}%
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
                        <div
                          className="h-full rounded-full bg-ice"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* location + visits */}
          <div className="space-y-3">
            <Card padded={false}>
              <div className="h-[180px] overflow-hidden rounded-t-2xl">
                <MapView
                  points={[
                    {
                      id: outlet.id,
                      lat: outlet.lat,
                      lng: outlet.lng,
                      label: outlet.name,
                      sublabel: outlet.area,
                      color: f.stale ? PIN.stale : PIN.active,
                    },
                  ]}
                  zoom={15}
                  className="z-0"
                />
              </div>
              <div className="p-4 text-[11px] text-muted">
                {outlet.lat.toFixed(4)}, {outlet.lng.toFixed(4)} · {outlet.distanceKm} km from rep
              </div>
            </Card>

            <Card>
              <p className="text-[13px] font-medium">Recent visits</p>
              <div className="mt-3 space-y-2">
                {visits.map((v) => (
                  <div key={v.id} className="border-b border-border/60 pb-2 last:border-0">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="font-medium">{v.rep.name.split(" ")[0]}</span>
                      <span className="text-faint">{dateFmt.format(v.checkInAt)}</span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-muted">{v.notes}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* order history */}
        <Card className="mt-3">
          <p className="text-[13px] font-medium">Order history</p>
          <table className="mt-3 w-full border-collapse">
            <thead>
              <tr className="eyebrow border-b border-border text-left">
                <th className="py-2 pr-3 font-normal">Order #</th>
                <th className="py-2 pr-3 font-normal">Date</th>
                <th className="py-2 pr-3 font-normal">Rep</th>
                <th className="py-2 pr-3 font-normal">Lines</th>
                <th className="py-2 pr-3 text-right font-normal">Total IDR</th>
                <th className="py-2 pr-3 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 14).map((o) => {
                const meta = STATUS_META[o.status];
                return (
                  <tr key={o.id} className="border-t border-border/60">
                    <td className="tabular py-2 pr-3 text-[12px] font-medium">#{o.code}</td>
                    <td className="py-2 pr-3 text-[12px] text-muted">
                      {dateFmt.format(o.createdAt)}
                    </td>
                    <td className="py-2 pr-3 text-[12px] text-muted">{o.rep.initials}</td>
                    <td className="py-2 pr-3 text-[12px] text-muted">{o.lines.length}</td>
                    <td className="tabular py-2 pr-3 text-right text-[12px]">
                      {formatIDR(o.total)}
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className="inline-flex items-center gap-1.5 text-[11px]"
                        style={{ color: meta.color }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
                        {meta.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

function Card({
  children,
  className = "",
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-surface ${padded ? "p-5" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

function Kpi({
  label,
  value,
  foot,
  tone,
}: {
  label: string;
  value: string;
  foot?: string;
  tone?: "glow";
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="eyebrow">{label}</p>
      <p className={`mt-1.5 text-2xl font-semibold ${tone === "glow" ? "text-glow" : ""}`}>
        {value}
      </p>
      {foot && <p className="mt-1 text-[10px] text-faint">{foot}</p>}
    </div>
  );
}

function Delta({ pct }: { pct: number }) {
  const flat = pct === 0;
  const up = pct > 0;
  const Icon = flat ? Minus : up ? ArrowUp : ArrowDown;
  const color = flat ? "text-muted" : up ? "text-ok" : "text-danger";
  return (
    <span className={`flex items-center gap-1 text-[12px] ${color}`}>
      <Icon className="h-3.5 w-3.5" />
      {up ? "+" : ""}
      {pct}% vs last month
    </span>
  );
}
