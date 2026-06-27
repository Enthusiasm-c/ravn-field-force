import { prisma } from "@/lib/db";
import { ConsoleTopbar } from "@/components/console-topbar";
import { ConsoleOutletList } from "@/components/console-outlet-list";
import { freshness } from "@/lib/utils";
import { OUTLET_TYPE_LABEL } from "@/lib/demo";

export const dynamic = "force-dynamic";

export default async function OutletsConsolePage() {
  const outlets = await prisma.outlet.findMany({
    orderBy: [{ area: "asc" }, { distanceKm: "asc" }],
  });
  const stale = outlets.filter((o) => freshness(o.lastVisitAt).stale).length;
  const contracted = outlets.filter((o) => o.priority).length;

  const rows = outlets.map((o) => {
    const f = freshness(o.lastVisitAt);
    return {
      id: o.id,
      name: o.name,
      area: o.area,
      type: OUTLET_TYPE_LABEL[o.type],
      brands: o.brands,
      priority: o.priority,
      contact: o.contactName ?? "—",
      freshLabel: f.label,
      stale: f.stale,
    };
  });

  return (
    <div className="flex min-h-dvh flex-col">
      <ConsoleTopbar
        title="Outlet master"
        subtitle="Bali territory · validated by the office"
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

        <ConsoleOutletList rows={rows} />
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
