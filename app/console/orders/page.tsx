import Link from "next/link";
import { Search } from "lucide-react";
import { prisma } from "@/lib/db";
import { OrderStatus } from "@prisma/client";
import { formatIDR, DEMO_DAY_START } from "@/lib/utils";
import { STATUS_META, OUTLET_TYPE_LABEL } from "@/lib/demo";
import { OrderPanel } from "./order-panel";

export const dynamic = "force-dynamic";

const TABS: { key: string; label: string; status?: OrderStatus }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New", status: "NEW" },
  { key: "confirmed", label: "Confirmed", status: "CONFIRMED" },
  { key: "delivery", label: "In delivery", status: "IN_DELIVERY" },
  { key: "rejected", label: "Rejected", status: "REJECTED" },
];

function hhmm(d: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Makassar",
  }).format(d);
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const tab = TABS.find((t) => t.key === sp.status) ?? TABS[0];

  const today = { createdAt: { gte: DEMO_DAY_START } };
  const [orders, counts] = await Promise.all([
    prisma.order.findMany({
      where: { ...today, ...(tab.status ? { status: tab.status } : {}) },
      orderBy: { createdAt: "desc" },
      include: { outlet: true, rep: true },
    }),
    prisma.order.groupBy({ by: ["status"], _count: true, where: today }),
  ]);

  const countOf = (s: OrderStatus) =>
    counts.find((c) => c.status === s)?._count ?? 0;
  const total = counts.reduce((a, c) => a + c._count, 0);

  const focusCode = sp.focus ?? orders[0]?.code;
  const focused = focusCode
    ? await prisma.order.findUnique({
        where: { code: focusCode },
        include: {
          outlet: true,
          rep: true,
          visit: true,
          lines: { include: { product: true } },
        },
      })
    : null;

  const visit = focused?.visit;
  const photos = (visit?.photos as { label: string; taken: boolean }[] | undefined) ?? [];

  return (
    <div className="flex min-h-dvh flex-col">
      {/* top bar */}
      <header className="flex items-center justify-between border-b border-border px-6 py-3.5">
        <div>
          <h1 className="text-[15px] font-semibold">Orders queue</h1>
          <p className="text-[11px] text-faint">Today · 18 April 2026 · 14:52 WITA</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[11px] text-muted">
            <span className="live-dot" /> Live
          </span>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-[11px] font-semibold">
              SW
            </div>
            <div className="text-right">
              <p className="text-[12px] font-medium">Siti Wulandari</p>
              <p className="text-[10px] text-faint">Sales Manager · Bali</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* queue */}
        <section className="flex min-w-0 flex-1 flex-col border-r border-border">
          {/* tabs */}
          <div className="flex items-center gap-2 px-6 pb-3 pt-4">
            {TABS.map((t) => {
              const c = t.status ? countOf(t.status) : total;
              const on = t.key === tab.key;
              return (
                <Link
                  key={t.key}
                  href={`/console/orders?status=${t.key}${focusCode ? `&focus=${focusCode}` : ""}`}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] ${
                    on
                      ? "border-ice/40 bg-ice/10 text-ice"
                      : "border-border bg-surface text-muted hover:text-text"
                  }`}
                >
                  {t.label}
                  <span className="tabular text-[11px] opacity-80">{c}</span>
                </Link>
              );
            })}
          </div>

          {/* search */}
          <div className="px-6 pb-2">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
              <Search className="h-3.5 w-3.5 text-faint" />
              <span className="text-[12px] text-faint">Search order #, outlet, or rep</span>
            </div>
          </div>

          {/* table */}
          <div className="min-h-0 flex-1 overflow-y-auto px-3">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-bg">
                <tr className="eyebrow text-left">
                  <th className="px-3 py-2 font-normal">Order #</th>
                  <th className="px-3 py-2 font-normal">Outlet</th>
                  <th className="px-3 py-2 font-normal">Rep</th>
                  <th className="px-3 py-2 text-right font-normal">Total IDR</th>
                  <th className="px-3 py-2 font-normal">Status</th>
                  <th className="px-3 py-2 text-right font-normal">Time</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const meta = STATUS_META[o.status];
                  const on = o.code === focusCode;
                  return (
                    <tr
                      key={o.id}
                      className={`group cursor-pointer border-t border-border/60 ${
                        on ? "bg-ice/5" : "hover:bg-surface/60"
                      }`}
                    >
                      <td className="px-3 py-2.5">
                        <Link
                          href={`/console/orders?status=${tab.key}&focus=${o.code}`}
                          className="tabular block text-[12px] font-medium text-text"
                        >
                          #{o.code}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 text-[12px]">{o.outlet.name}</td>
                      <td className="px-3 py-2.5 text-[12px] text-muted">{o.rep.initials}</td>
                      <td className="tabular px-3 py-2.5 text-right text-[12px]">
                        {formatIDR(o.total)}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className="inline-flex items-center gap-1.5 text-[11px]"
                          style={{ color: meta.color }}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ background: meta.color }}
                          />
                          {meta.label}
                        </span>
                      </td>
                      <td className="tabular px-3 py-2.5 text-right text-[11px] text-faint">
                        {hhmm(o.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* footer stats */}
          <div className="flex items-center gap-6 border-t border-border px-6 py-3 text-[11px]">
            <span className="text-muted">
              Today <span className="text-text">{total} orders</span>
            </span>
            <span className="text-muted">
              Median confirm <span className="text-text">4m 18s</span>
            </span>
            <span className="ml-auto text-faint">RAVN · v0.7 · PAN prod</span>
          </div>
        </section>

        {/* detail panel */}
        <aside className="flex w-[540px] shrink-0 flex-col overflow-y-auto">
          {focused ? (
            <div className="flex flex-1 flex-col p-5">
              <div className="flex items-center justify-between">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px]"
                  style={{
                    color: STATUS_META[focused.status].color,
                    background: `color-mix(in srgb, ${STATUS_META[focused.status].color} 12%, transparent)`,
                  }}
                >
                  #{focused.code} · {STATUS_META[focused.status].label}
                </span>
                <span className="text-[11px] text-faint">
                  Received {hhmm(focused.createdAt)}
                </span>
              </div>

              <h2 className="serif mt-4 text-2xl tracking-tight">{focused.outlet.name}</h2>
              <p className="mt-1 text-[12px] text-muted">
                {focused.outlet.area} · {OUTLET_TYPE_LABEL[focused.outlet.type]}
                {focused.visit && (
                  <>
                    {" "}· Submitted by {focused.rep.name} from visit #{focused.visit.code}
                  </>
                )}
              </p>

              <OrderPanel
                orderId={focused.id}
                status={focused.status}
                deliveryLabel="Sat 19 Apr"
                initialLines={focused.lines.map((l) => ({
                  id: l.id,
                  name: l.product.name,
                  sku: l.product.sku,
                  price: l.product.pricePerUnit,
                  qty: l.qty,
                }))}
                visit={
                  visit
                    ? {
                        photos,
                        notes: visit.notes,
                        address: focused.outlet.address,
                        distanceKm: focused.outlet.distanceKm,
                      }
                    : null
                }
              />

              <p className="mt-auto pt-5 text-[10px] text-faint">
                04 / 05 · Order queue · synced live
              </p>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center text-[12px] text-faint">
              Select an order
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
