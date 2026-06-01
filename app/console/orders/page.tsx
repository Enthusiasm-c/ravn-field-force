import Link from "next/link";
import { Search, MapPin, Check, Pencil, X, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { OrderStatus } from "@prisma/client";
import { formatIDR } from "@/lib/utils";
import { STATUS_META, OUTLET_TYPE_LABEL } from "@/lib/demo";
import { confirmOrder, rejectOrder } from "@/app/actions";

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

  const [orders, counts] = await Promise.all([
    prisma.order.findMany({
      where: tab.status ? { status: tab.status } : undefined,
      orderBy: { createdAt: "desc" },
      include: { outlet: true, rep: true },
    }),
    prisma.order.groupBy({ by: ["status"], _count: true }),
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
        <section className="flex min-w-0 flex-[1.5] flex-col border-r border-border">
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
        <aside className="flex w-[420px] shrink-0 flex-col overflow-y-auto">
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

              {/* line items */}
              <p className="eyebrow mt-5">Line items ({focused.lines.length})</p>
              <div className="mt-2 space-y-2">
                {focused.lines.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-surface/60 px-3 py-2"
                  >
                    <div>
                      <p className="text-[12px] font-medium">{l.product.name}</p>
                      <p className="eyebrow mt-0.5">{l.product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="tabular text-[12px]">{formatIDR(l.lineTotal)}</p>
                      <p className="tabular text-[10px] text-faint">× {l.qty} btl</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* total */}
              <div className="mt-3 flex items-end justify-between border-t border-border pt-3">
                <p className="text-[11px] text-muted">
                  {focused.lines.reduce((s, l) => s + l.qty, 0)} btl · delivery Sat 19 Apr
                </p>
                <p className="serif text-xl">
                  <span className="text-[12px] text-muted">IDR </span>
                  {formatIDR(focused.total)}
                </p>
              </div>

              {/* visit context */}
              {visit && (
                <>
                  <p className="eyebrow mt-6">Visit context</p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {photos.map((p, i) => (
                      <div
                        key={p.label}
                        className="flex aspect-[4/3] items-end rounded-lg border border-border p-1.5 text-[9px] text-text/80"
                        style={{
                          background: `linear-gradient(135deg, color-mix(in srgb, var(--ice) ${18 + i * 8}%, var(--surface)), var(--surface-2))`,
                        }}
                      >
                        {p.label}
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 rounded-lg border border-border bg-surface/60 p-3 text-[12px] italic leading-relaxed text-text/85">
                    &ldquo;{visit.notes}&rdquo;
                  </p>
                  <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted">
                    <MapPin className="h-3 w-3" />
                    {focused.outlet.address} · {focused.outlet.distanceKm} km from rep
                  </p>
                </>
              )}

              {/* actions */}
              {focused.status === "NEW" ? (
                <div className="mt-6 flex gap-2">
                  <form action={confirmOrder.bind(null, focused.id)} className="flex-[1.4]">
                    <button className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-ok py-2.5 text-[13px] font-semibold text-bg">
                      <Check className="h-4 w-4" /> Confirm order
                    </button>
                  </form>
                  <button className="flex items-center justify-center gap-1.5 rounded-lg border border-border-strong px-4 text-[13px] text-muted">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <form action={rejectOrder.bind(null, focused.id)}>
                    <button className="flex h-full items-center justify-center gap-1.5 rounded-lg border border-danger/40 px-4 text-[13px] text-danger">
                      <X className="h-3.5 w-3.5" /> Reject
                    </button>
                  </form>
                </div>
              ) : (
                <div className="mt-6 flex items-center gap-2 rounded-lg border border-border bg-surface/60 px-3 py-2.5 text-[12px]">
                  <ArrowRight className="h-3.5 w-3.5 text-muted" />
                  <span style={{ color: STATUS_META[focused.status].color }}>
                    {STATUS_META[focused.status].label}
                  </span>
                  <span className="text-muted">
                    {focused.status === "CONFIRMED" && "· approved for fulfilment"}
                    {focused.status === "IN_DELIVERY" && "· handed to logistics"}
                    {focused.status === "REJECTED" && "· returned to rep"}
                  </span>
                </div>
              )}

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
