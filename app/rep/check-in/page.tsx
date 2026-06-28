import Link from "next/link";
import { X } from "lucide-react";
import { prisma, getActiveRep } from "@/lib/db";
import { PhoneFrame } from "@/components/phone-frame";
import { RepCheckInList } from "@/components/rep-checkin-list";
import { freshness } from "@/lib/utils";
import { OUTLET_TYPE_LABEL } from "@/lib/demo";

export const revalidate = 300;

export default async function CheckInPage() {
  const [rep, allOutlets] = await Promise.all([
    getActiveRep(),
    prisma.outlet.findMany({
      orderBy: { distanceKm: "asc" }, // nearest outlet first — you check in where you are
      include: {
        visits: { orderBy: { checkInAt: "desc" }, take: 1, select: { code: true } },
      },
    }),
  ]);
  const territory = rep?.areas ?? [];
  const outlets = territory.length
    ? allOutlets.filter((o) => territory.includes(o.area))
    : allOutlets;

  const rows = outlets.map((o) => {
    const fr = freshness(o.lastVisitAt);
    return {
      id: o.id,
      name: o.name,
      area: o.area,
      type: OUTLET_TYPE_LABEL[o.type],
      brands: o.brands,
      freshLabel: fr.label,
      stale: fr.stale,
      distanceKm: o.distanceKm,
      href: `/rep/visit/${o.visits[0]?.code ?? "VST-8842"}`,
    };
  });

  return (
    <PhoneFrame>
      <div className="flex min-h-[100dvh] lg:min-h-[800px] flex-col">
        <header className="flex items-center justify-between px-4 pb-1 pt-3">
          <span className="eyebrow">New visit</span>
          <Link href="/rep/outlets" className="text-muted">
            <X className="h-5 w-5" />
          </Link>
        </header>

        <div className="px-4 pt-1">
          <h1 className="text-2xl font-semibold tracking-tight">Select outlet</h1>
          <p className="mt-1 text-[12px] text-muted">
            Nearest first · {territory.join(" · ") || "All Bali"}
          </p>
        </div>

        <RepCheckInList rows={rows} />
      </div>
    </PhoneFrame>
  );
}
