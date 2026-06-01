import { Search } from "lucide-react";
import { prisma } from "@/lib/db";
import { PhoneFrame } from "@/components/phone-frame";
import { RepNav } from "@/components/rep-nav";
import { formatDistance, freshness, DEMO_NOW } from "@/lib/utils";
import { OUTLET_TYPE_LABEL } from "@/lib/demo";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function OutletsPage() {
  const outlets = await prisma.outlet.findMany({ orderBy: { distanceKm: "asc" } });

  const withFresh = outlets.map((o) => ({ ...o, fresh: freshness(o.lastVisitAt) }));
  const stale = withFresh.filter((o) => o.fresh.stale);
  const due = withFresh.filter((o) => {
    if (!o.lastVisitAt) return true;
    const days = (DEMO_NOW.getTime() - o.lastVisitAt.getTime()) / 86_400_000;
    return days >= 7;
  });

  return (
    <PhoneFrame statusTime="9:41">
      <div className="flex min-h-[calc(844px-44px)] flex-col">
        {/* header */}
        <header className="px-5 pb-3 pt-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="eyebrow">Route DPS-04 · Canggu</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight">Outlets</h1>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-faint">Today · 18 Apr</p>
              <p className="text-[11px] text-ice">Target 8 visits</p>
            </div>
          </div>

          {/* chips */}
          <div className="mt-4 flex gap-2">
            <Chip label="All" value={outlets.length} active />
            <Chip label="Due today" value={due.length} />
            <Chip label="Not visited 30d+" value={stale.length} glow />
          </div>

          {/* search */}
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5">
            <Search className="h-4 w-4 text-faint" />
            <span className="text-[13px] text-faint">Search outlet, area, or brand</span>
          </div>
        </header>

        {/* list */}
        <div className="flex-1 space-y-2 px-4 pb-4">
          {withFresh.map((o) => (
            <Link
              key={o.id}
              href="/rep/visit/VST-8842"
              className={`block rounded-2xl border bg-surface/70 p-3.5 transition-colors hover:bg-surface ${
                o.fresh.stale ? "alpenglow border-glow/30" : "border-border"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold">{o.name}</p>
                  <p className="mt-0.5 text-[12px] text-muted">
                    {o.area} · {OUTLET_TYPE_LABEL[o.type]}
                  </p>
                </div>
                <span className="distance shrink-0 pl-3 text-[15px] font-medium">
                  {formatDistance(o.distanceKm)}
                </span>
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <span
                  className={`text-[11px] ${
                    o.fresh.stale ? "text-glow" : "text-faint"
                  }`}
                >
                  {o.fresh.label}
                </span>
                <div className="flex gap-1">
                  {o.brands.map((b) => (
                    <span
                      key={b}
                      className="rounded-full border border-border-strong px-2 py-0.5 text-[9px] text-muted"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <RepNav active="outlets" />
      </div>
    </PhoneFrame>
  );
}

function Chip({
  label,
  value,
  active,
  glow,
}: {
  label: string;
  value: number;
  active?: boolean;
  glow?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] ${
        active
          ? "border-ice/40 bg-ice/10 text-ice"
          : glow
          ? "border-glow/30 bg-glow/5 text-glow"
          : "border-border bg-surface text-muted"
      }`}
    >
      <span>{label}</span>
      <span className="tabular font-semibold">{value}</span>
    </div>
  );
}
