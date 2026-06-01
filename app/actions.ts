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
