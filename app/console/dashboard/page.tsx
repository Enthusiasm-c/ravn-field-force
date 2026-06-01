import { ChevronDown, Download, MapPin } from "lucide-react";
import { prisma } from "@/lib/db";
import { compactIDR, formatIDR, DEMO_NOW, freshness } from "@/lib/utils";
import { HEADLINE, LEADERBOARD, DEMO_DATE_LABEL, PIN } from "@/lib/demo";
import { MapView } from "@/components/map/map-view";

export const dynamic = "force-dynamic";

function ago(d: Date) {
  const min = Math.round((DEMO_NOW.getTime() - d.getTime()) / 60000);
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  return `${h}h ${min % 60}m ago`;
}
function hhmm(d: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Makassar",
  }).format(d);
}

export default async function DashboardPage() {
  const [counts, recent, outlets] = await Promise.all([
    prisma.order.groupBy({ by: ["status"], _count: true }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { outlet: true, rep: true },
    }),
    prisma.outlet.findMany(),
  ]);
  const countOf = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  const pending = countOf("NEW") + countOf("IN_DELIVERY");
  const newCount = countOf("NEW");
  const delivering = countOf("IN_DELIVERY");

  const points = outlets.map((o) => {
    const f = freshness(o.lastVisitAt);
    const days = o.lastVisitAt
      ? (DEMO_NOW.getTime() - o.lastVisitAt.getTime()) / 86_400_000
      : Infinity;
    const color = f.stale ? PIN.stale : days < 4 ? PIN.active : PIN.week;
    return {
      id: o.id,
      lat: o.lat,
      lng: o.lng,
      label: o.name,
      sublabel: o.area,
      color,
    };
  });

  const filters = ["This week", "All Bali", "All reps (12)", "All SKUs"];

  return (
    <div className="flex min-h-dvh flex-col">
      {/* top bar */}
      <header className="flex items-center justify-between border-b border-border px-7 py-3.5">
        <div className="flex items-center gap-2 text-[11px] text-muted">
          <span className="live-dot" /> Live field operation
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-[11px] font-semibold">
            BH
          </div>
          <div className="text-right">
            <p className="text-[12px] font-medium">Bayu Hartono</p>
            <p className="text-[10px] text-faint">Commercial Director</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-7 py-6">
        {/* greeting + filters */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="serif text-3xl tracking-tight">Good afternoon, Pak Bayu.</h1>
            <p className="mt-1.5 text-[12px] text-faint">{DEMO_DATE_LABEL}</p>
          </div>
          <div className="flex items-center gap-2">
            {filters.map((f) => (
              <button
                key={f}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-[11px] text-muted"
              >
                {f} <ChevronDown className="h-3 w-3" />
              </button>
            ))}
            <button className="flex items-center gap-1.5 rounded-lg border border-ice/40 bg-ice/10 px-3 py-1.5 text-[11px] text-ice">
              <Download className="h-3 w-3" /> Export CSV
            </button>
          </div>
        </div>

        {/* KPI cards */}
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi label="Visits today" value={String(HEADLINE.visitsToday)}>
            <Delta up>↑ {HEADLINE.visitsToday - HEADLINE.visitsYesterday} vs yesterday · {HEADLINE.visitsYesterday}</Delta>
          </Kpi>
          <Kpi label="Orders pending" value={String(pending)}>
            <span className="text-[11px] text-muted">
              {newCount} new · {delivering} awaiting delivery
            </span>
          </Kpi>
          <Kpi label="Revenue today" value={`IDR ${compactIDR(HEADLINE.revenueToday)}`}>
            <Delta up>↑ 12% vs 7-day avg · {compactIDR(HEADLINE.revenue7dAvg)}</Delta>
          </Kpi>
          <Kpi label="Active outlets" value={String(HEADLINE.activeOutlets)}>
            <span className="text-[11px] text-glow">{HEADLINE.staleOutlets} not visited 30d+</span>
          </Kpi>
        </div>

        {/* map + leaderboard */}
        <div className="mt-3 grid gap-3 lg:grid-cols-[1.6fr_1fr]">
          {/* coverage map */}
          <div className="rounded-2xl border border-border bg-surface/40 p-5">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium">Bali · Field Activity</p>
              <div className="flex items-center gap-3 text-[10px] text-muted">
                <Legend color="var(--ice)" label="Visited today" />
                <Legend color="var(--ok)" label="This week" />
                <Legend color="var(--glow)" label="Stale · 30d+" />
              </div>
            </div>
            <div className="relative mt-4 h-[260px] overflow-hidden rounded-xl border border-border">
              <MapView points={points} zoom={11} className="z-0" />
              <span className="pointer-events-none absolute bottom-2 right-3 z-[400] rounded bg-surface/80 px-1.5 py-0.5 text-[10px] text-faint backdrop-blur">
                {outlets.length} outlets · live coverage
              </span>
            </div>
          </div>

          {/* leaderboard */}
          <div className="rounded-2xl border border-border bg-surface/40 p-5">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium">Top reps · this week</p>
              <span className="eyebrow">W16 · 12–18 Apr</span>
            </div>
            <div className="mt-3 space-y-1">
              {LEADERBOARD.map((r) => (
                <div
                  key={r.rank}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface/60"
                >
                  <span className="tabular w-5 text-[12px] text-faint">
                    {String(r.rank).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium">{r.name}</p>
                    <p className="text-[10px] text-faint">
                      {r.visits} visits · {r.orders} orders · {r.area}
                    </p>
                  </div>
                  <span className="tabular text-[12px] text-gold">
                    {compactIDR(r.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* recent activity */}
        <div className="mt-3 rounded-2xl border border-border bg-surface/40 p-5">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium">Recent activity</p>
            <span className="text-[11px] text-ice">View all →</span>
          </div>
          <div className="mt-3 grid gap-2 lg:grid-cols-4">
            {recent.map((o) => (
              <div key={o.id} className="rounded-lg border border-border bg-surface/60 p-3">
                <p className="eyebrow">
                  {o.status === "NEW" ? "PO" : o.status === "CONFIRMED" ? "Confirm" : "Order"}{" "}
                  {hhmm(o.createdAt)} · {ago(o.createdAt)}
                </p>
                <p className="mt-1.5 text-[12px] font-medium">
                  {o.outlet.name} · <span className="tabular">{formatIDR(o.total)}</span>
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-[10px] text-faint">
                  <MapPin className="h-2.5 w-2.5" />
                  {o.rep.name.split(" ")[0]} · {o.outlet.area}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-4 text-[10px] text-faint">05 / 05 · Director dashboard · RAVN v0.7</p>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface/40 p-4">
      <p className="eyebrow">{label}</p>
      <p className="serif mt-2 text-3xl tracking-tight">{value}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Delta({ children, up }: { children: React.ReactNode; up?: boolean }) {
  return (
    <span className={`flex items-center gap-1 text-[11px] ${up ? "text-ok" : "text-danger"}`}>
      {children}
    </span>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
