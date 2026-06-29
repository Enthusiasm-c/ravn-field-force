"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

/** Persist the prices the rep agreed on this visit as the outlet's new price
 *  memory (last agreed wins) — so the next visit auto-fills these. */
export async function saveAgreedPrices(
  outletId: string,
  lines: { productId: string; unitPrice: number }[]
) {
  for (const l of lines) {
    if (!l.unitPrice || l.unitPrice <= 0) continue;
    await prisma.outletPrice.upsert({
      where: { outletId_productId: { outletId, productId: l.productId } },
      create: { outletId, productId: l.productId, unitPrice: l.unitPrice },
      update: { unitPrice: l.unitPrice },
    });
  }
  revalidatePath("/rep/visit/[code]", "page"); // next visit re-reads the memory
  revalidatePath(`/rep/outlet/${outletId}`);
  revalidatePath(`/console/outlets/${outletId}`);
}

export async function confirmOrder(orderId: string) {
  await prisma.order.update({
    where: { id: orderId },
    data: { status: "CONFIRMED" },
  });
  revalidatePath("/console/orders");
  revalidatePath("/console/dashboard");
}

export async function rejectOrder(orderId: string) {
  await prisma.order.update({
    where: { id: orderId },
    data: { status: "REJECTED" },
  });
  revalidatePath("/console/orders");
  revalidatePath("/console/dashboard");
}

export async function moveToDelivery(orderId: string) {
  await prisma.order.update({
    where: { id: orderId },
    data: { status: "IN_DELIVERY" },
  });
  revalidatePath("/console/orders");
  revalidatePath("/console/dashboard");
}

/** Save edited line quantities, re-snapshot line totals and the order total.
 *  Each line keeps its agreed unit price, and that price is written back to the
 *  outlet's price memory (last agreed wins) so the next PO prefills from it. */
export async function updateOrderLines(
  orderId: string,
  lines: { id: string; qty: number }[]
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { lines: true },
  });
  if (!order) return;

  let total = 0;
  for (const line of order.lines) {
    const next = lines.find((l) => l.id === line.id);
    const qty = Math.max(1, next?.qty ?? line.qty);
    const lineTotal = line.unitPrice * qty;
    total += lineTotal;
    await prisma.orderLine.update({
      where: { id: line.id },
      data: { qty, lineTotal },
    });
    await prisma.outletPrice.upsert({
      where: {
        outletId_productId: {
          outletId: order.outletId,
          productId: line.productId,
        },
      },
      create: {
        outletId: order.outletId,
        productId: line.productId,
        unitPrice: line.unitPrice,
      },
      update: { unitPrice: line.unitPrice },
    });
  }

  await prisma.order.update({ where: { id: orderId }, data: { total } });
  revalidatePath("/console/orders");
  revalidatePath("/console/dashboard");
}
