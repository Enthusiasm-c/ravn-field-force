import Link from "next/link";
import { prisma } from "@/lib/db";
import { ConsoleOrderQueue } from "@/components/console-order-queue";
import { OrderStatus } from "@prisma/client";
import { formatIDR, DEMO_DAY_START } from "@/lib/utils";
import { STATUS_META, OUTLET_TYPE_LABEL } from "@/lib/demo";
import { OrderPanel } from "./order-panel";

export const revalidate = 300;

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

  const rows = orders.map((o) => ({
    id: o.id,
    code: o.code,
    outlet: o.outlet.name,
    rep: o.rep.initials,
    total: formatIDR(o.total),
    statusLabel: STATUS_META[o.status].label,
    statusColor: STATUS_META[o.status].color,
    time: hhmm(o.createdAt),
  }));

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

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* queue */}
        <section className="flex min-w-0 flex-1 flex-col border-border lg:border-r">
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

          {/* search + table (client-filtered) */}
          <ConsoleOrderQueue rows={rows} tab={tab.key} focusCode={focusCode} />
        </section>

        {/* detail panel */}
        <aside className="flex w-full shrink-0 flex-col overflow-y-auto border-t border-border lg:w-[540px] lg:border-t-0">
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
                  price: l.unitPrice,
                  qty: l.qty,
                }))}
                visit={
                  visit
                    ? {
                        photos,
                        notes: visit.notes,
                        address: focused.outlet.address,
                      }
                    : null
                }
              />

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
