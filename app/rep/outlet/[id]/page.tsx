import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MapPin, Phone, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { PhoneFrame } from "@/components/phone-frame";
import { OutletTabs } from "@/components/outlet-tabs";
import { SalesTrend } from "@/components/sales-trend";
import { formatIDR, compactIDR, freshness, DEMO_NOW } from "@/lib/utils";
import { OUTLET_TYPE_LABEL, STATUS_META } from "@/lib/demo";

export const revalidate = 300;

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

const daysAgo = (d: Date) =>
  Math.floor((DEMO_NOW.getTime() - d.getTime()) / 86_400_000);

export default async function RepOutletCard({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const outlet = await prisma.outlet.findUnique({ where: { id } });
  if (!outlet) notFound();

  const [orders, lastVisit, priceBook] = await Promise.all([
    prisma.order.findMany({
      where: { outletId: id },
      orderBy: { createdAt: "desc" },
      include: { lines: { include: { product: true } } },
    }),
    prisma.visit.findFirst({
      where: { outletId: id },
      orderBy: { checkInAt: "desc" },
      select: { code: true },
    }),
    prisma.outletPrice.findMany({
      where: { outletId: id },
      include: { product: true },
      orderBy: { unitPrice: "desc" },
    }),
  ]);

  const earning = orders.filter((o) => o.status !== "REJECTED");
  const lifetime = earning.reduce((s, o) => s + o.total, 0);
  const f = freshness(outlet.lastVisitAt);
  const lastOrder = orders[0];
  const startVisitHref = `/rep/visit/${lastVisit?.code ?? "VST-8842"}`;

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

  // top purchases
  const skuMap = new Map<string, { value: number; qty: number }>();
  for (const o of earning)
    for (const l of o.lines) {
      const cur = skuMap.get(l.product.name) ?? { value: 0, qty: 0 };
      cur.value += l.lineTotal;
      cur.qty += l.qty;
      skuMap.set(l.product.name, cur);
    }
  const topPurchases = [...skuMap.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.value - a.value);
  const topTotal = topPurchases.reduce((s, x) => s + x.value, 0) || 1;

  // ── Overview ──
  const overview = (
    <div className="space-y-2.5">
      {/* decision maker + basics */}
      <div className="rounded-2xl border border-border bg-surface/70 p-3.5">
        <p className="eyebrow">Decision maker · PIC</p>
        {outlet.contactName ? (
          <div className="mt-1.5 flex items-center justify-between">
            <p className="text-[15px] font-semibold">{outlet.contactName}</p>
            <a
              href={`tel:${(outlet.contactPhone ?? "").replace(/\s/g, "")}`}
              className="flex items-center gap-1.5 text-[12px] text-ice"
            >
              <Phone className="h-3.5 w-3.5" />
              Call
            </a>
          </div>
        ) : (
          <p className="mt-1.5 text-[12px] text-faint">No contact on record</p>
        )}
        <div className="mt-2.5 border-t border-border/60 pt-1">
          <Row label="Type" value={OUTLET_TYPE_LABEL[outlet.type]} />
          <Row label="Brands" value={outlet.brands.join(" · ") || "—"} />
          <Row label="Account" value={outlet.priority ? "Priority" : "Standard"} />
        </div>
      </div>

      {/* recency */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl border border-border bg-surface/70 p-3.5">
          <p className="eyebrow">Last purchase</p>
          {lastOrder ? (
            <>
              <p className="mt-1 text-[16px] font-semibold">
                {daysAgo(lastOrder.createdAt)}d ago
              </p>
              <p className="mt-0.5 text-[11px] text-muted">
                IDR {formatIDR(lastOrder.total)}
              </p>
            </>
          ) : (
            <p className="mt-1 text-[12px] text-faint">No orders</p>
          )}
        </div>
        <div className="rounded-2xl border border-border bg-surface/70 p-3.5">
          <p className="eyebrow">Last visit</p>
          <p
            className={`mt-1 text-[16px] font-semibold ${f.stale ? "text-glow" : ""}`}
          >
            {f.label.replace("Last visit · ", "")}
          </p>
          <p className="mt-0.5 text-[11px] text-muted">
            Lifetime IDR {compactIDR(lifetime)}
          </p>
        </div>
      </div>

      {/* top purchases */}
      <div className="rounded-2xl border border-border bg-surface/70 p-3.5">
        <p className="eyebrow mb-2">Top purchases</p>
        <div className="space-y-2.5">
          {topPurchases.slice(0, 5).map((s, i) => {
            const pct = Math.round((s.value / topTotal) * 100);
            return (
              <div key={s.name}>
                <div className="flex items-center justify-between text-[12px]">
                  <span>
                    <span className="text-faint">#{i + 1}</span> {s.name}
                  </span>
                  <span className="tabular text-muted">
                    {s.qty} btl · {compactIDR(s.value)}
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
          {topPurchases.length === 0 && (
            <p className="text-[12px] text-faint">No purchases yet</p>
          )}
        </div>
      </div>
    </div>
  );

  // ── History — purchases & the prices they paid ──
  const history = (
    <div className="space-y-2.5">
      <div className="rounded-2xl border border-border bg-surface/70 p-3.5">
        <p className="eyebrow mb-3">Monthly revenue</p>
        <SalesTrend data={series} />
      </div>

      {/* agreed prices */}
      <div className="rounded-2xl border border-border bg-surface/70 p-3.5">
        <p className="eyebrow mb-2">Agreed prices · per SKU</p>
        <div className="space-y-1.5">
          {priceBook.map((p) => {
            const delta = p.unitPrice - p.product.pricePerUnit;
            return (
              <div
                key={p.id}
                className="flex items-center justify-between border-b border-border/50 py-1.5 last:border-0"
              >
                <span className="text-[12px]">{p.product.name}</span>
                <span className="text-right">
                  <span className="tabular block text-[12px] text-ice">
                    IDR {formatIDR(p.unitPrice)}
                  </span>
                  {delta !== 0 && (
                    <span
                      className={`text-[10px] ${delta < 0 ? "text-ok" : "text-glow"}`}
                    >
                      {delta < 0 ? "" : "+"}
                      {formatIDR(delta)} vs list
                    </span>
                  )}
                </span>
              </div>
            );
          })}
          {priceBook.length === 0 && (
            <p className="text-[12px] text-faint">No agreed prices yet</p>
          )}
        </div>
      </div>

      {/* order history */}
      <div className="rounded-2xl border border-border bg-surface/70 p-3.5">
        <p className="eyebrow mb-2">Order history</p>
        <div className="space-y-1">
          {orders.slice(0, 12).map((o) => {
            const meta = STATUS_META[o.status];
            return (
              <div
                key={o.id}
                className="flex items-center justify-between border-b border-border/50 py-2 last:border-0"
              >
                <div>
                  <p className="tabular text-[12px] font-medium">#{o.code}</p>
                  <p className="text-[10px] text-faint">
                    {dateFmt.format(o.createdAt)} · {o.lines.length} lines
                  </p>
                </div>
                <div className="text-right">
                  <p className="tabular text-[12px]">IDR {formatIDR(o.total)}</p>
                  <p
                    className="flex items-center justify-end gap-1 text-[10px]"
                    style={{ color: meta.color }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: meta.color }}
                    />
                    {meta.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <PhoneFrame>
      <div className="flex min-h-[800px] flex-col">
        <header className="flex items-center justify-between px-4 pb-1 pt-3">
          <Link
            href="/rep/outlets"
            className="flex items-center gap-1 text-[13px] text-muted"
          >
            <ChevronLeft className="h-4 w-4" />
            Outlets
          </Link>
          <span className="eyebrow">{OUTLET_TYPE_LABEL[outlet.type]}</span>
        </header>

        <div className="px-4 pt-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{outlet.name}</h1>
            {outlet.priority && (
              <span className="rounded-full bg-ice/10 px-2 py-0.5 text-[10px] text-ice">
                Priority
              </span>
            )}
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted">
            <MapPin className="h-3 w-3" />
            {outlet.area} · {outlet.address}
          </p>
        </div>

        <div className="flex-1 px-4 pb-4">
          <OutletTabs overview={overview} history={history} />
        </div>

        <div className="sticky bottom-0 border-t border-border bg-bg/90 px-4 pb-7 pt-3 backdrop-blur">
          <Link
            href={startVisitHref}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-ice py-3.5 text-[15px] font-semibold text-white"
          >
            Start visit <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </PhoneFrame>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 py-1.5 last:border-0">
      <span className="text-[12px] text-muted">{label}</span>
      <span className="text-[12px]">{value}</span>
    </div>
  );
}
