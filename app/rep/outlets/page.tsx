import Link from "next/link";
import { prisma, getActiveRep } from "@/lib/db";
import { PhoneFrame } from "@/components/phone-frame";
import { RepNav } from "@/components/rep-nav";
import { RepOutletList } from "@/components/rep-outlet-list";
import { freshness, DEMO_NOW } from "@/lib/utils";
import { OUTLET_TYPE_LABEL } from "@/lib/demo";

export const revalidate = 300;

export default async function OutletsPage() {
  // Scope the route to the rep's assigned territory — outlets outside their
  // districts simply don't appear (handled by another rep).
  const [rep, allOutlets] = await Promise.all([
    getActiveRep(),
    prisma.outlet.findMany(),
  ]);
  const territory = rep?.areas ?? [];
  const outlets = territory.length
    ? allOutlets.filter((o) => territory.includes(o.area))
    : allOutlets;

  // Without distance, order by what actually matters on a route: the accounts
  // that need attention first — overdue, then due, then priority.
  const rows = outlets
    .map((o) => {
      const f = freshness(o.lastVisitAt);
      const due =
        !o.lastVisitAt ||
        (DEMO_NOW.getTime() - o.lastVisitAt.getTime()) / 86_400_000 >= 7;
      return {
        id: o.id,
        name: o.name,
        area: o.area,
        type: OUTLET_TYPE_LABEL[o.type],
        brands: o.brands,
        freshLabel: f.label,
        stale: f.stale,
        due,
        priority: o.priority,
      };
    })
    .sort((a, b) => {
      const rank = (r: { stale: boolean; due: boolean; priority: boolean }) =>
        (r.stale ? 0 : r.due ? 1 : 2) - (r.priority ? 0.4 : 0);
      return rank(a) - rank(b) || a.name.localeCompare(b.name);
    });
  const counts = {
    all: rows.length,
    due: rows.filter((r) => r.due).length,
    stale: rows.filter((r) => r.stale).length,
  };

  return (
    <PhoneFrame>
      <div className="flex h-[100dvh] lg:h-[800px] flex-col">
        {/* header */}
        <header className="px-5 pb-1 pt-4">
          {/* top bar — brand home ↔ signed-in rep */}
          <div className="flex items-center justify-between">
            <Link
              href="/"
              aria-label="Home"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-strong bg-surface"
            >
              <span className="serif text-base leading-none text-ice">R</span>
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="text-right leading-tight">
                <p className="text-[12px] font-medium">{rep?.name ?? "Putu Wirawan"}</p>
                <p className="text-[10px] text-faint">Route DPS-04</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ice/10 text-[12px] font-semibold text-ice">
                {rep?.initials ?? "PW"}
              </div>
            </div>
          </div>
          {/* title */}
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="eyebrow">Territory · {territory.join(" · ") || "All Bali"}</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight">Outlets</h1>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-faint">Today · 18 Apr</p>
              <p className="text-[11px] text-ice">Target 8 visits</p>
            </div>
          </div>
        </header>

        <RepOutletList rows={rows} counts={counts} />

        <RepNav active="outlets" />
      </div>
    </PhoneFrame>
  );
}
