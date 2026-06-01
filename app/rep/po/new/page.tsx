import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PoBuilder } from "./po-builder";

export const dynamic = "force-dynamic";

export default async function NewPoPage({
  searchParams,
}: {
  searchParams: Promise<{ visit?: string }>;
}) {
  const { visit: visitCode } = await searchParams;

  const visit = visitCode
    ? await prisma.visit.findUnique({
        where: { code: visitCode },
        include: {
          outlet: true,
          order: { include: { lines: { include: { product: true } } } },
        },
      })
    : null;

  if (!visit || !visit.order) notFound();

  const lines = visit.order.lines.map((l) => ({
    id: l.id,
    name: l.product.name,
    sku: l.product.sku,
    price: l.product.pricePerUnit,
    qty: l.qty,
  }));

  return (
    <PoBuilder
      orderCode={visit.order.code}
      visitCode={visit.code}
      outletName={visit.outlet.name}
      outletArea={visit.outlet.area}
      checkIn="14:32"
      initialLines={lines}
    />
  );
}
