import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PoBuilder } from "./po-builder";

export const dynamic = "force-dynamic";

export default async function NewPoPage({
  searchParams,
}: {
  searchParams: Promise<{ visit?: string; outlet?: string }>;
}) {
  const { visit: visitCode, outlet: outletId } = await searchParams;

  // ── Outlet PO (any outlet) — lines prefilled from this outlet's price memory ──
  if (outletId) {
    const outlet = await prisma.outlet.findUnique({
      where: { id: outletId },
      include: {
        prices: { include: { product: true } },
        orders: { orderBy: { createdAt: "desc" }, take: 1, select: { code: true } },
      },
    });
    if (!outlet) notFound();

    const lines = outlet.prices.map((p) => ({
      id: p.id,
      name: p.product.name,
      sku: p.product.sku,
      price: p.unitPrice,
      listPrice: p.product.pricePerUnit,
      isRemembered: true,
      qty: 6,
    }));

    return (
      <PoBuilder
        orderCode={outlet.orders[0]?.code ?? "ORD-4421"}
        visitCode={visitCode ?? "—"}
        outletName={outlet.name}
        outletArea={outlet.area}
        checkIn="14:32"
        initialLines={lines}
      />
    );
  }

  // ── Hero PO — tied to the seeded visit + order ──
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

  // Price memory for this outlet — repeat lines prefill from the last agreed
  // price, so the rep never re-quotes from scratch.
  const book = await prisma.outletPrice.findMany({
    where: { outletId: visit.outletId },
  });
  const remembered = new Map(book.map((p) => [p.productId, p.unitPrice]));

  const lines = visit.order.lines.map((l) => {
    const last = remembered.get(l.productId);
    return {
      id: l.id,
      name: l.product.name,
      sku: l.product.sku,
      price: last ?? l.product.pricePerUnit,
      listPrice: l.product.pricePerUnit,
      isRemembered: last != null,
      qty: l.qty,
    };
  });

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
