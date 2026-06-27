import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { VisitCapture } from "./visit-capture";

export const revalidate = 300;

export default async function VisitPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const visit = await prisma.visit.findUnique({
    where: { code },
    include: {
      outlet: true,
      order: { include: { lines: { include: { product: true } } } },
    },
  });
  if (!visit) notFound();

  // Full SKU catalog + this outlet's price memory. The rep searches and adds
  // products; each carries the last agreed price for this outlet if there is one.
  const [book, products] = await Promise.all([
    prisma.outletPrice.findMany({
      where: { outletId: visit.outletId },
      select: { productId: true, unitPrice: true },
    }),
    prisma.product.findMany({
      orderBy: [{ brand: "asc" }, { name: "asc" }],
      select: { id: true, name: true, sku: true, pricePerUnit: true },
    }),
  ]);
  const remembered = new Map(book.map((p) => [p.productId, p.unitPrice]));
  const catalog = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    listPrice: p.pricePerUnit,
    lastPrice: remembered.get(p.id) ?? null,
  }));

  // Where the "send order" lands — a real order for this outlet.
  const fallback = visit.order
    ? null
    : await prisma.order.findFirst({
        where: { outletId: visit.outletId },
        orderBy: { createdAt: "desc" },
        select: { code: true },
      });
  const orderCode = visit.order?.code ?? fallback?.code ?? "ORD-4421";

  // Always read as a just-now check-in (the demo is frozen at 14:52) — so any
  // outlet, not just the hero, shows a fresh visit rather than a months-old one.
  const checkIn = "14:48";

  return (
    <VisitCapture
      code={visit.code}
      outletName={visit.outlet.name}
      outletArea={visit.outlet.area}
      checkIn={checkIn}
      gpsDriftM={visit.gpsDriftM}
      photos={visit.photos as { label: string; taken: boolean }[]}
      notes={visit.notes}
      objective={visit.objective ?? "Regular Visit"}
      pic={visit.pic ?? visit.outlet.contactName ?? ""}
      backHref={`/rep/outlet/${visit.outletId}`}
      catalog={catalog}
      orderCode={orderCode}
    />
  );
}
