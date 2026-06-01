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

/** Save edited line quantities, re-snapshot line totals and the order total. */
export async function updateOrderLines(
  orderId: string,
  lines: { id: string; qty: number }[]
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { lines: { include: { product: true } } },
  });
  if (!order) return;

  let total = 0;
  for (const line of order.lines) {
    const next = lines.find((l) => l.id === line.id);
    const qty = Math.max(1, next?.qty ?? line.qty);
    const lineTotal = line.product.pricePerUnit * qty;
    total += lineTotal;
    await prisma.orderLine.update({
      where: { id: line.id },
      data: { qty, lineTotal },
    });
  }

  await prisma.order.update({ where: { id: orderId }, data: { total } });
  revalidatePath("/console/orders");
  revalidatePath("/console/dashboard");
}
