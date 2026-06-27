import { prisma } from "@/lib/db";
import { ConsoleTopbar } from "@/components/console-topbar";
import { RepAccessList } from "@/components/rep-access-list";

export const revalidate = 300;

export default async function RepsPage() {
  const reps = await prisma.rep.findMany({ orderBy: { name: "asc" } });

  const rows = reps.map((r) => ({
    id: r.id,
    name: r.name,
    area: r.area,
    initials: r.initials,
    email: `${r.name.split(" ")[0].toLowerCase()}@pan-bali.com`,
  }));

  return (
    <div className="flex min-h-dvh flex-col">
      <ConsoleTopbar
        title="Reps"
        subtitle="Field team · access & permissions"
        initials="SW"
        name="Siti Wulandari"
        role="Sales Manager · Bali"
      />

      <div className="px-6 py-5">
        <RepAccessList reps={rows} />
      </div>
    </div>
  );
}
