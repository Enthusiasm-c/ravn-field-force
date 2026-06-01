import { PrismaClient, OutletType, OrderStatus } from "@prisma/client";

const prisma = new PrismaClient();

// Demo "now" — the proposal's frozen timestamp.
const NOW = new Date("2026-04-18T14:52:00+08:00");
const at = (h: number, m: number) =>
  new Date(`2026-04-18T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00+08:00`);
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86_400_000);

async function main() {
  // Wipe (idempotent reseed)
  await prisma.orderLine.deleteMany();
  await prisma.order.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.outlet.deleteMany();
  await prisma.product.deleteMany();
  await prisma.rep.deleteMany();

  // ── Reps ──────────────────────────────────────────────
  const denis = await prisma.rep.create({
    data: { name: "Denis Rahmawan", initials: "DR", area: "Canggu · Seminyak" },
  });
  const ari = await prisma.rep.create({
    data: { name: "Ari Maulana", initials: "AM", area: "Seminyak" },
  });
  const budi = await prisma.rep.create({
    data: { name: "Budi Pratama", initials: "BP", area: "Seminyak" },
  });
  const niluh = await prisma.rep.create({
    data: { name: "Ni Luh Sari", initials: "NS", area: "Ubud" },
  });
  const wayan = await prisma.rep.create({
    data: { name: "Wayan Adi", initials: "WA", area: "Sanur" },
  });

  // ── Product / SKU catalog ─────────────────────────────
  const P = async (brand: string, name: string, sku: string, price: number) =>
    prisma.product.create({ data: { brand, name, sku, pricePerUnit: price } });

  const jag700 = await P("Jägermeister", "Jägermeister 700ml", "JAG-700", 200_000);
  const jag1000 = await P("Jägermeister", "Jägermeister 1L", "JAG-1000", 280_000);
  const jagCold = await P("Jägermeister", "Jägermeister Cold Brew 700ml", "JAG-CB7", 230_000);
  const cueEsp = await P("José Cuervo", "José Cuervo Especial", "CUE-ESP", 210_000);
  const cueTrad = await P("José Cuervo", "José Cuervo Tradicional", "CUE-TRD", 295_000);

  const catalog = { jag700, jag1000, jagCold, cueEsp, cueTrad };

  // ── Outlets (route of the day + dashboard coverage) ──
  const O = async (d: {
    name: string;
    area: string;
    type: OutletType;
    address: string;
    lat: number;
    lng: number;
    km: number;
    contactName?: string;
    contactPhone?: string;
    brands: string[];
    priority?: boolean;
    lastVisit: Date | null;
  }) =>
    prisma.outlet.create({
      data: {
        name: d.name,
        area: d.area,
        type: d.type,
        address: d.address,
        lat: d.lat,
        lng: d.lng,
        distanceKm: d.km,
        contactName: d.contactName,
        contactPhone: d.contactPhone,
        brands: d.brands,
        priority: d.priority ?? false,
        lastVisitAt: d.lastVisit,
      },
    });

  const oldMans = await O({
    name: "Old Man's",
    area: "Canggu",
    type: OutletType.BEACH_CLUB,
    address: "Jl. Batu Bolong No. 103, Canggu",
    lat: -8.6561,
    lng: 115.137,
    km: 0.3,
    contactName: "Javier",
    contactPhone: "+62 8XX XXX XXXX",
    brands: ["Jägermeister", "José Cuervo"],
    priority: true,
    lastVisit: daysAgo(3),
  });
  const finns = await O({
    name: "Finns Beach Club",
    area: "Canggu",
    type: OutletType.BEACH_CLUB,
    address: "Jl. Pantai Berawa, Canggu",
    lat: -8.6724,
    lng: 115.1389,
    km: 0.8,
    brands: ["Jägermeister"],
    lastVisit: null,
  });
  const laLaguna = await O({
    name: "La Laguna",
    area: "Canggu",
    type: OutletType.BAR,
    address: "Jl. Pantai Kayu Putih, Canggu",
    lat: -8.6691,
    lng: 115.1352,
    km: 1.2,
    brands: ["Jägermeister", "José Cuervo"],
    lastVisit: daysAgo(7),
  });
  const luigisHot = await O({
    name: "Luigi's Hot Pizza",
    area: "Canggu",
    type: OutletType.RESTAURANT,
    address: "Jl. Pantai Batu Bolong, Canggu",
    lat: -8.6553,
    lng: 115.1301,
    km: 1.5,
    brands: ["José Cuervo"],
    lastVisit: daysAgo(2),
  });
  const sariMade = await O({
    name: "Sari Made",
    area: "Seminyak",
    type: OutletType.BAR,
    address: "Jl. Kayu Aya, Seminyak",
    lat: -8.6831,
    lng: 115.1567,
    km: 4.2,
    brands: ["Jägermeister"],
    lastVisit: daysAgo(14),
  });
  const potatoHead = await O({
    name: "Potato Head",
    area: "Seminyak",
    type: OutletType.BEACH_CLUB,
    address: "Jl. Petitenget No. 51B, Seminyak",
    lat: -8.6802,
    lng: 115.1518,
    km: 5.1,
    brands: ["Jägermeister", "José Cuervo"],
    priority: true,
    lastVisit: daysAgo(34),
  });
  const luigis = await O({
    name: "Luigi's",
    area: "Ubud",
    type: OutletType.RESTAURANT,
    address: "Jl. Raya Ubud, Ubud",
    lat: -8.5069,
    lng: 115.2625,
    km: 22,
    brands: ["José Cuervo"],
    lastVisit: daysAgo(31),
  });
  const laPlancha = await O({
    name: "La Plancha",
    area: "Seminyak",
    type: OutletType.BAR,
    address: "Jl. Mesari Beach, Seminyak",
    lat: -8.6925,
    lng: 115.1602,
    km: 6.0,
    brands: ["Jägermeister"],
    lastVisit: daysAgo(5),
  });
  const ulekan = await O({
    name: "Ulekan",
    area: "Canggu",
    type: OutletType.RESTAURANT,
    address: "Jl. Pantai Berawa, Canggu",
    lat: -8.6657,
    lng: 115.1378,
    km: 2.1,
    brands: ["José Cuervo"],
    lastVisit: daysAgo(4),
  });

  // ── Hero visit: VST-8842 at Old Man's ─────────────────
  const heroVisit = await prisma.visit.create({
    data: {
      code: "VST-8842",
      outletId: oldMans.id,
      repId: denis.id,
      checkInAt: at(14, 32),
      gpsDriftM: 8,
      gpsConfirmed: true,
      photos: [
        { label: "Shelf", taken: true },
        { label: "Menu", taken: true },
        { label: "Promo", taken: true },
      ],
      competitors: [
        { brand: "Jägermeister", present: true },
        { brand: "Johnnie Walker", present: true },
        { brand: "Captain Morgan", present: false },
      ],
      notes:
        "Manager mentioned new happy hour promo starting next week — wants to push Jäger shots. Asked about Smirnoff Ice case deal for the weekend rush.",
    },
  });

  // ── Orders ────────────────────────────────────────────
  type Line = { product: { id: string; pricePerUnit: number }; qty: number };
  const makeOrder = async (d: {
    code: string;
    outletId: string;
    repId: string;
    visitId?: string;
    status: OrderStatus;
    createdAt: Date;
    deliveryDate: Date;
    lines: Line[];
    warehouseNote?: string;
  }) => {
    const total = d.lines.reduce((s, l) => s + l.product.pricePerUnit * l.qty, 0);
    return prisma.order.create({
      data: {
        code: d.code,
        outletId: d.outletId,
        repId: d.repId,
        visitId: d.visitId,
        status: d.status,
        total,
        createdAt: d.createdAt,
        deliveryDate: d.deliveryDate,
        warehouseNote: d.warehouseNote,
        lines: {
          create: d.lines.map((l) => ({
            productId: l.product.id,
            qty: l.qty,
            lineTotal: l.product.pricePerUnit * l.qty,
          })),
        },
      },
    });
  };

  const tomorrowAM = new Date("2026-04-19T09:00:00+08:00");

  // Hero order — tied to the hero visit, stays NEW so the confirm flow is live.
  await makeOrder({
    code: "ORD-4421",
    outletId: oldMans.id,
    repId: denis.id,
    visitId: heroVisit.id,
    status: OrderStatus.NEW,
    createdAt: at(14, 48),
    deliveryDate: tomorrowAM,
    lines: [
      { product: jag700, qty: 12 },
      { product: jag1000, qty: 6 },
      { product: cueEsp, qty: 6 },
    ],
  });

  await makeOrder({
    code: "ORD-4420",
    outletId: laLaguna.id,
    repId: denis.id,
    status: OrderStatus.NEW,
    createdAt: at(14, 32),
    deliveryDate: tomorrowAM,
    lines: [
      { product: jag1000, qty: 6 },
      { product: jag700, qty: 6 },
    ],
  });

  await makeOrder({
    code: "ORD-4419",
    outletId: ulekan.id,
    repId: niluh.id,
    status: OrderStatus.NEW,
    createdAt: at(14, 5),
    deliveryDate: tomorrowAM,
    lines: [
      { product: cueEsp, qty: 6 },
      { product: cueTrad, qty: 3 },
    ],
  });

  await makeOrder({
    code: "ORD-4418",
    outletId: finns.id,
    repId: ari.id,
    status: OrderStatus.CONFIRMED,
    createdAt: at(13, 54),
    deliveryDate: tomorrowAM,
    lines: [
      { product: jag700, qty: 20 },
      { product: jag1000, qty: 10 },
      { product: cueEsp, qty: 10 },
    ],
  });

  await makeOrder({
    code: "ORD-4417",
    outletId: potatoHead.id,
    repId: ari.id,
    status: OrderStatus.IN_DELIVERY,
    createdAt: at(13, 22),
    deliveryDate: tomorrowAM,
    lines: [
      { product: jag700, qty: 15 },
      { product: cueTrad, qty: 6 },
      { product: jagCold, qty: 6 },
    ],
  });

  await makeOrder({
    code: "ORD-4415",
    outletId: sariMade.id,
    repId: budi.id,
    status: OrderStatus.CONFIRMED,
    createdAt: at(12, 48),
    deliveryDate: tomorrowAM,
    lines: [
      { product: jag700, qty: 6 },
      { product: jag1000, qty: 1 },
    ],
  });

  await makeOrder({
    code: "ORD-4412",
    outletId: laPlancha.id,
    repId: ari.id,
    status: OrderStatus.IN_DELIVERY,
    createdAt: at(11, 30),
    deliveryDate: tomorrowAM,
    lines: [
      { product: jag700, qty: 24 },
      { product: jag1000, qty: 10 },
      { product: cueEsp, qty: 10 },
    ],
  });

  await makeOrder({
    code: "ORD-4409",
    outletId: ulekan.id,
    repId: niluh.id,
    status: OrderStatus.CONFIRMED,
    createdAt: at(10, 14),
    deliveryDate: tomorrowAM,
    lines: [
      { product: cueEsp, qty: 9 },
      { product: cueTrad, qty: 3 },
    ],
  });

  await makeOrder({
    code: "ORD-4405",
    outletId: luigis.id,
    repId: niluh.id,
    status: OrderStatus.REJECTED,
    createdAt: at(9, 40),
    deliveryDate: tomorrowAM,
    lines: [{ product: cueEsp, qty: 3 }],
  });

  console.log("Seeded:", {
    reps: 5,
    products: 5,
    outlets: 10,
    visits: 1,
    orders: 10,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
