import { prisma } from "@/lib/db";
import { ConsoleTopbar } from "@/components/console-topbar";
import { compactIDR } from "@/lib/utils";
import { LEADERBOARD } from "@/lib/demo";

export const dynamic = "force-dynamic";

export default async function RepsPage() {
  const [reps, ordersByRep] = await Promise.all([
    prisma.rep.findMany(),
    prisma.order.groupBy({ by: ["repId"], _count: true, _sum: { total: true } }),
  ]);

  const liveOf = (id: string) => ordersByRep.find((o) => o.repId === id);
  const weekOf = (name: string) => LEADERBOARD.find((l) => l.name === name);

  // sort by this-week revenue (leaderboard), reps without a board entry last
  const sorted = [...reps].sort(
    (a, b) => (weekOf(b.name)?.revenue ?? 0) - (weekOf(a.name)?.revenue ?? 0)
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <ConsoleTopbar
        title="Reps"
        subtitle="Field team · Bali · week 16 · 12–18 Apr"
        initials="BH"
        name="Bayu Hartono"
        role="Commercial Director"
      />

      <div className="px-6 py-5">
        <div className="grid gap-3 lg:grid-cols-2">
          {sorted.map((r) => {
            const week = weekOf(r.name);
            const live = liveOf(r.id);
            return (
              <div
                key={r.id}
                className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-[13px] font-semibold">
                  {r.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium">{r.name}</p>
                  <p className="text-[11px] text-faint">{r.area}</p>
                </div>
                <div className="flex items-center gap-5 text-right">
                  <Metric label="Visits 7d" value={week?.visits ?? "—"} />
                  <Metric label="Orders" value={live?._count ?? 0} />
                  <Metric
                    label="Revenue 7d"
                    value={week ? compactIDR(week.revenue) : "—"}
                    accent
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className={`mt-1 text-[14px] tabular ${accent ? "text-gold" : ""}`}>{value}</p>
    </div>
  );
}
