"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

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
