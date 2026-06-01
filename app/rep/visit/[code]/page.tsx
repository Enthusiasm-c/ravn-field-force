import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { VisitCapture } from "./visit-capture";

export const dynamic = "force-dynamic";

export default async function VisitPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const visit = await prisma.visit.findUnique({
    where: { code },
    include: { outlet: true, rep: true },
  });
  if (!visit) notFound();

  const checkIn = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Makassar",
  }).format(visit.checkInAt);

  return (
    <VisitCapture
      code={visit.code}
      outletName={visit.outlet.name}
      outletArea={visit.outlet.area}
      checkIn={checkIn}
      gpsDriftM={visit.gpsDriftM}
      photos={visit.photos as { label: string; taken: boolean }[]}
      competitors={visit.competitors as { brand: string; present: boolean }[]}
      notes={visit.notes}
    />
  );
}
