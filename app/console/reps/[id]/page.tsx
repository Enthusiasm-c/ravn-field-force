import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ArrowUp, ArrowDown, Minus, Store } from "lucide-react";
import { prisma } from "@/lib/db";
import { ConsoleTopbar } from "@/components/console-topbar";
import { SalesTrend } from "@/components/sales-trend";
import { MapView } from "@/components/map/map-view";
import { formatIDR, compactIDR, freshness } from "@/lib/utils";
import { OUTLET_TYPE_LABEL, PIN, STATUS_META, LEADERBOARD } from "@/lib/demo";

export const dynamic = "force-dynamic";

const monthKeyFmt = new Intl.DateTimeFormat("en-CA", {
  year: "numeric", month: "2-digit", timeZone: "Asia/Makassar",
});
const monthLabelFmt = new Intl.DateTimeFormat("en", {
  month: "short", timeZone: "Asia/Makassar",
});
const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit", month: "short", timeZone: "Asia/Makassar",
});
const MONTH_ANCHORS = [
  "2025-10-15", "2025-11-15", "2025-12-15",
  "2026-01-15", "2026-02-15", "2026-03-15", "2026-04-15",
].map((d) => new Date(`${d}T06:00:00+08:00`));

export default async function RepDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rep = await prisma.rep.findUnique({ where: { id } });
  if (!rep) notFound();

  const [orders, visitCount] = await Promise.all([
    prisma.order.findMany({
      where: { repId: id },
      orderBy: { createdAt: "desc" },
      include: { outlet: true, lines: { include: { product: true } } },
    }),
    prisma.visit.count({ where: { repId: id } }),
  ]);

  const earning = orders.filter((o) => o.status !== "REJECTED");
  const lifetime = earning.reduce((s, o) => s + o.total, 0);
  const avg = earning.length ? Math.round(lifetime / earning.length) : 0;
  const week = LEADERBOARD.find((l) => l.name === rep.name);

  // outlets covered + revenue per outlet
  const perOutlet = new Map<string, { outlet: (typeof orders)[0]["outlet"]; rev: number }>();
  for (const o of earning) {
    const cur = perOutlet.get(o.outletId) ?? { outlet: o.outlet, rev: 0 };
    cur.rev += o.total;
    perOutlet.set(o.outletId, cur);
  }
  const covered = [...perOutlet.values()].sort((a, b) => b.rev - a.rev);

  // monthly revenue
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

  // product mix
  const skuMap = new Map<string, number>();
  for (const o of earning)
    for (const l of o.lines)
      skuMap.set(l.product.name, (skuMap.get(l.product.name) ?? 0) + l.lineTotal);
  const skuMix = [...skuMap.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const skuTotal = skuMix.reduce((s, x) => s + x.value, 0) || 1;

  const points = covered.map(({ outlet }) => ({
    id: outlet.id,
    lat: outlet.lat,
    lng: outlet.lng,
    label: outlet.name,
    sublabel: outlet.area,
    color: freshness(outlet.lastVisitAt).stale ? PIN.stale : PIN.active,
  }));

  return (
    <div className="flex min-h-dvh flex-col">
      <ConsoleTopbar
        title="Rep"
        subtitle="Performance · activity · sales"
        initials="BH"
        name="Bayu Hartono"
        role="Commercial Director"
      />

      <div className="px-6 py-5">
        <Link href="/console/reps" className="mb-4 inline-flex items-center gap-1 text-[12px] text-muted hover:text-text">
          <ChevronLeft className="h-4 w-4" /> Reps
        </Link>

        {/* header */}
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-[16px] font-semibold">
            {rep.initials}
          </div>
          <div>
            <h1 className="serif text-3xl tracking-tight">{rep.name}</h1>
            <p className="mt-1 text-[12px] text-muted">Sales Rep · {rep.area}</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Kpi label="Revenue · lifetime" value={`IDR ${compactIDR(lifetime)}`} />
          <Kpi label="Orders" value={String(earning.length)} />
          <Kpi label="Outlets covered" value={String(covered.length)} />
          <Kpi label="Avg order" value={`IDR ${compactIDR(avg)}`} />
          <Kpi label="Visits · 7d" value={week ? String(week.visits) : "—"} foot={`${visitCount} logged`} />
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-3">
            <Card>
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-medium">Sales trend · monthly revenue</p>
                <Delta pct={deltaPct} />
              </div>
              <div className="mt-4"><SalesTrend data={series} /></div>
            </Card>

            <Card>
              <p className="text-[13px] font-medium">Top outlets</p>
              <div className="mt-3 space-y-1">
                {covered.slice(0, 6).map(({ outlet, rev }) => (
                  <Link
                    key={outlet.id}
                    href={`/console/outlets/${outlet.id}`}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-2/60"
                  >
                    <Store className="h-4 w-4 text-faint" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-medium">{outlet.name}</p>
                      <p className="text-[10px] text-faint">
                        {outlet.area} · {OUTLET_TYPE_LABEL[outlet.type]}
                      </p>
                    </div>
                    <span className="tabular text-[12px] text-gold">{compactIDR(rev)}</span>
                  </Link>
                ))}
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
                        <span className="tabular text-muted">{compactIDR(s.value)} · {pct}%</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
                        <div className="h-full rounded-full bg-ice" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          <div className="space-y-3">
            <Card padded={false}>
              <div className="border-b border-border px-4 py-3">
                <p className="text-[13px] font-medium">Coverage · {covered.length} outlets</p>
              </div>
              <div className="h-[220px] overflow-hidden">
                <MapView points={points} zoom={11} className="z-0" />
              </div>
            </Card>
          </div>
        </div>

        {/* recent sales */}
        <Card className="mt-3">
          <p className="text-[13px] font-medium">Recent sales · what, where, when</p>
          <table className="mt-3 w-full border-collapse">
            <thead>
              <tr className="eyebrow border-b border-border text-left">
                <th className="py-2 pr-3 font-normal">Order #</th>
                <th className="py-2 pr-3 font-normal">Outlet</th>
                <th className="py-2 pr-3 font-normal">Area</th>
                <th className="py-2 pr-3 font-normal">Date</th>
                <th className="py-2 pr-3 font-normal">Items</th>
                <th className="py-2 pr-3 text-right font-normal">Total IDR</th>
                <th className="py-2 pr-3 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 16).map((o) => {
                const meta = STATUS_META[o.status];
                return (
                  <tr key={o.id} className="border-t border-border/60">
                    <td className="tabular py-2 pr-3 text-[12px] font-medium">#{o.code}</td>
                    <td className="py-2 pr-3 text-[12px]">{o.outlet.name}</td>
                    <td className="py-2 pr-3 text-[12px] text-muted">{o.outlet.area}</td>
                    <td className="py-2 pr-3 text-[12px] text-muted">{dateFmt.format(o.createdAt)}</td>
                    <td className="py-2 pr-3 text-[12px] text-muted">
                      {o.lines.reduce((s, l) => s + l.qty, 0)} btl
                    </td>
                    <td className="tabular py-2 pr-3 text-right text-[12px]">{formatIDR(o.total)}</td>
                    <td className="py-2 pr-3">
                      <span className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: meta.color }}>
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

function Card({ children, className = "", padded = true }: { children: React.ReactNode; className?: string; padded?: boolean }) {
  return (
    <div className={`rounded-2xl border border-border bg-surface ${padded ? "p-5" : ""} ${className}`}>
      {children}
    </div>
  );
}

function Kpi({ label, value, foot }: { label: string; value: string; foot?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="eyebrow">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold">{value}</p>
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
      {up ? "+" : ""}{pct}% vs last month
    </span>
  );
}
