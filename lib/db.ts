import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/** The rep persona driving the (login-less) field role — Putu Wirawan.
 *  Used to scope the rep app to one rep's assigned territory + SKU lines. */
export const getActiveRep = () =>
  prisma.rep.findFirst({ where: { name: "Putu Wirawan" } });
