import { Search } from "lucide-react";
import { prisma } from "@/lib/db";
import { ConsoleTopbar } from "@/components/console-topbar";
import { formatDistance, freshness } from "@/lib/utils";
import { OUTLET_TYPE_LABEL } from "@/lib/demo";

export const dynamic = "force-dynamic";

export default async function OutletsConsolePage() {
  const outlets = await prisma.outlet.findMany({
    orderBy: [{ area: "asc" }, { distanceKm: "asc" }],
  });
  const stale = outlets.filter((o) => freshness(o.lastVisitAt).stale).length;
  const contracted = outlets.filter((o) => o.priority).length;

  return (
    <div className="flex min-h-dvh flex-col">
      <ConsoleTopbar
        title="Outlet master"
        subtitle="Bali territory · 380 outlets · validated by the office"
        initials="SW"
        name="Siti Wulandari"
        role="Sales Manager · Bali"
      />

      <div className="px-6 py-5">
        {/* summary */}
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Outlets" value={outlets.length} />
          <Stat label="Priority" value={contracted} />
          <Stat label="Areas" value={new Set(outlets.map((o) => o.area)).size} />
          <Stat label="Not visited 30d+" value={stale} glow />
        </div>

        {/* search */}
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
          <Search className="h-3.5 w-3.5 text-faint" />
          <span className="text-[12px] text-faint">Search outlet, area, brand, or contact</span>
        </div>

        {/* table */}
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <table className="w-full border-collapse">
            <thead>
              <tr className="eyebrow border-b border-border text-left">
                <th className="px-4 py-2.5 font-normal">Outlet</th>
                <th className="px-4 py-2.5 font-normal">Area</th>
                <th className="px-4 py-2.5 font-normal">Type</th>
                <th className="px-4 py-2.5 font-normal">Brands</th>
                <th className="px-4 py-2.5 font-normal">Contact</th>
                <th className="px-4 py-2.5 font-normal">Last visit</th>
                <th className="px-4 py-2.5 text-right font-normal">Distance</th>
              </tr>
            </thead>
            <tbody>
              {outlets.map((o) => {
                const f = freshness(o.lastVisitAt);
                return (
                  <tr
                    key={o.id}
                    className="border-t border-border/60 hover:bg-surface-2/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium">{o.name}</span>
                        {o.priority && (
                          <span className="rounded-full bg-ice/10 px-1.5 py-0.5 text-[9px] text-ice">
                            Priority
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-muted">{o.area}</td>
                    <td className="px-4 py-3 text-[12px] text-muted">
                      {OUTLET_TYPE_LABEL[o.type]}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {o.brands.map((b) => (
                          <span
                            key={b}
                            className="rounded-full border border-border px-1.5 py-0.5 text-[9px] text-muted"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-muted">
                      {o.contactName ?? "—"}
                    </td>
                    <td
                      className={`px-4 py-3 text-[11px] ${
                        f.stale ? "text-glow" : "text-muted"
                      }`}
                    >
                      {f.label}
                    </td>
                    <td className="distance px-4 py-3 text-right text-[12px]">
                      {formatDistance(o.distanceKm)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] text-faint">
          Showing {outlets.length} of 380 · demo subset
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, glow }: { label: string; value: number; glow?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="eyebrow">{label}</p>
      <p className={`mt-1.5 text-2xl font-semibold ${glow ? "text-glow" : ""}`}>{value}</p>
    </div>
  );
}
