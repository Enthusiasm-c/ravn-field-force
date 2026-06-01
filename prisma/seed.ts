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

  // ── 41 more real Bali venues — populate the coverage map ──
  const AREA_CENTROID: Record<string, [number, number]> = {
    Canggu: [-8.6478, 115.1385],
    Seminyak: [-8.6905, 115.1568],
    "Kuta Selatan": [-8.829, 115.085],
    Ubud: [-8.5069, 115.2625],
    Sanur: [-8.688, 115.262],
    Amed: [-8.07, 115.64],
  };
  const AREA_KM: Record<string, number> = {
    Canggu: 2,
    Seminyak: 6,
    "Kuta Selatan": 14,
    Ubud: 22,
    Sanur: 12,
    Amed: 78,
  };
  type Seed = [string, string, OutletType, ("Jägermeister" | "José Cuervo")[]];
  const VENUES: Seed[] = [
    // Canggu
    ["La Brisa", "Canggu", OutletType.BEACH_CLUB, ["Jägermeister", "José Cuervo"]],
    ["The Lawn Canggu", "Canggu", OutletType.BEACH_CLUB, ["Jägermeister"]],
    ["Deus Ex Machina", "Canggu", OutletType.BAR, ["Jägermeister"]],
    ["Pretty Poison", "Canggu", OutletType.BAR, ["José Cuervo"]],
    ["Crate Cafe", "Canggu", OutletType.RESTAURANT, ["José Cuervo"]],
    ["Milk & Madu", "Canggu", OutletType.RESTAURANT, ["Jägermeister"]],
    ["Black Sand Brewery", "Canggu", OutletType.BAR, ["Jägermeister", "José Cuervo"]],
    ["Lacalita", "Canggu", OutletType.BAR, ["José Cuervo"]],
    ["Shelter Cafe", "Canggu", OutletType.RESTAURANT, ["Jägermeister"]],
    // Seminyak
    ["Ku De Ta", "Seminyak", OutletType.BEACH_CLUB, ["Jägermeister", "José Cuervo"]],
    ["Mrs Sippy", "Seminyak", OutletType.CLUB, ["Jägermeister"]],
    ["Motel Mexicola", "Seminyak", OutletType.BAR, ["José Cuervo"]],
    ["Da Maria", "Seminyak", OutletType.RESTAURANT, ["José Cuervo"]],
    ["Sisterfields", "Seminyak", OutletType.RESTAURANT, ["Jägermeister"]],
    ["Revolver Espresso", "Seminyak", OutletType.RESTAURANT, ["José Cuervo"]],
    ["La Favela", "Seminyak", OutletType.CLUB, ["Jägermeister", "José Cuervo"]],
    ["Sarong", "Seminyak", OutletType.RESTAURANT, ["Jägermeister"]],
    ["Bikini Seminyak", "Seminyak", OutletType.BAR, ["José Cuervo"]],
    // Kuta Selatan / Uluwatu
    ["Single Fin", "Kuta Selatan", OutletType.BAR, ["Jägermeister", "José Cuervo"]],
    ["El Kabron", "Kuta Selatan", OutletType.BEACH_CLUB, ["Jägermeister"]],
    ["Sundays Beach Club", "Kuta Selatan", OutletType.BEACH_CLUB, ["José Cuervo"]],
    ["Savaya Bali", "Kuta Selatan", OutletType.CLUB, ["Jägermeister", "José Cuervo"]],
    ["Ulu Cliffhouse", "Kuta Selatan", OutletType.BEACH_CLUB, ["Jägermeister"]],
    ["Karma Beach", "Kuta Selatan", OutletType.BEACH_CLUB, ["José Cuervo"]],
    ["The Cashew Tree", "Kuta Selatan", OutletType.BAR, ["Jägermeister"]],
    // Ubud
    ["Mozaic", "Ubud", OutletType.RESTAURANT, ["José Cuervo"]],
    ["Locavore", "Ubud", OutletType.RESTAURANT, ["Jägermeister"]],
    ["CP Lounge", "Ubud", OutletType.CLUB, ["Jägermeister", "José Cuervo"]],
    ["Night Rooster", "Ubud", OutletType.BAR, ["José Cuervo"]],
    ["No Mas", "Ubud", OutletType.BAR, ["Jägermeister"]],
    ["Hujan Locale", "Ubud", OutletType.RESTAURANT, ["José Cuervo"]],
    ["Bridges Bali", "Ubud", OutletType.RESTAURANT, ["Jägermeister"]],
    // Sanur
    ["Char Bar Sanur", "Sanur", OutletType.BAR, ["Jägermeister"]],
    ["Byrdhouse", "Sanur", OutletType.BAR, ["José Cuervo"]],
    ["Fire Station", "Sanur", OutletType.RESTAURANT, ["Jägermeister", "José Cuervo"]],
    ["Genius Cafe", "Sanur", OutletType.RESTAURANT, ["José Cuervo"]],
    ["Stolen Wine", "Sanur", OutletType.BAR, ["Jägermeister"]],
    // Amed
    ["Warung Enak Amed", "Amed", OutletType.RESTAURANT, ["José Cuervo"]],
    ["Sails Restaurant", "Amed", OutletType.RESTAURANT, ["Jägermeister"]],
  ];
  const lastVisitPattern = [3, 8, 2, 16, 41, 6, 22, null, 11, 34, 5, 19, 48, 4, 13];
  const extraOutlets = [];
  for (let i = 0; i < VENUES.length; i++) {
    const [name, area, type, brands] = VENUES[i];
    const [clat, clng] = AREA_CENTROID[area];
    const ang = (i * 137.5 * Math.PI) / 180; // golden-angle spread
    const rad = 0.004 + (i % 5) * 0.0035;
    const lv = lastVisitPattern[i % lastVisitPattern.length];
    extraOutlets.push(
      await O({
        name,
        area,
        type,
        address: `${area}, Bali`,
        lat: clat + Math.cos(ang) * rad,
        lng: clng + Math.sin(ang) * rad,
        km: AREA_KM[area] + ((i % 4) - 1.5),
        brands,
        priority: i % 6 === 0,
        lastVisit: lv === null ? null : daysAgo(lv),
      })
    );
  }

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

  // ── Historical orders + visits (6 months) — the data behind the trends ──
  const productsByBrand: Record<string, { id: string; pricePerUnit: number }[]> = {
    Jägermeister: [jag700, jag1000, jagCold],
    "José Cuervo": [cueEsp, cueTrad],
  };
  const repForArea = (area: string) =>
    area === "Canggu" ? denis : area === "Seminyak" ? ari : area === "Ubud" ? niluh : wayan;

  const months = [
    new Date("2025-10-12T11:00:00+08:00"),
    new Date("2025-11-12T11:00:00+08:00"),
    new Date("2025-12-12T11:00:00+08:00"),
    new Date("2026-01-12T11:00:00+08:00"),
    new Date("2026-02-12T11:00:00+08:00"),
    new Date("2026-03-12T11:00:00+08:00"),
    new Date("2026-04-09T11:00:00+08:00"),
  ];
  const trends: Record<string, number[]> = {
    grow: [0.55, 0.68, 0.8, 0.9, 1.0, 1.15, 1.28],
    decline: [1.3, 1.18, 1.05, 0.92, 0.8, 0.7, 0.62],
    steady: [0.95, 1.02, 0.98, 1.05, 1.0, 1.03, 1.0],
    volatile: [0.7, 1.25, 0.6, 1.35, 0.85, 1.2, 0.95],
  };
  const trendKeys = ["grow", "decline", "steady", "volatile"];
  const baseUnitsFor = (t: OutletType) =>
    t === "BEACH_CLUB" ? 18 : t === "CLUB" ? 14 : t === "BAR" ? 10 : 7;

  const allOutlets = [
    oldMans, finns, laLaguna, luigisHot, sariMade, potatoHead, luigis, laPlancha, ulekan,
    ...extraOutlets,
  ];

  // Build all history operations, then run them in bounded chunks (fast + safe
  // on a pooled connection).
  const thunks: (() => Promise<unknown>)[] = [];
  let histVisits = 0;
  let histOrders = 0;
  for (let idx = 0; idx < allOutlets.length; idx++) {
    const o = allOutlets[idx];
    const rep = repForArea(o.area);
    const factors = trends[trendKeys[idx % 4]];
    const base = baseUnitsFor(o.type);
    const pool = o.brands.flatMap((b) => productsByBrand[b] ?? []);
    if (pool.length === 0) continue;

    for (let m = 0; m < months.length; m++) {
      const date = months[m];
      const units = Math.max(2, Math.round(base * factors[m]));
      const lines =
        pool.length >= 2
          ? [
              { product: pool[0], qty: Math.max(1, Math.ceil(units * 0.6)) },
              { product: pool[1], qty: Math.max(1, Math.floor(units * 0.4)) },
            ]
          : [{ product: pool[0], qty: units }];

      thunks.push(() =>
        makeOrder({
          code: `ORD-3${idx}-${m}`,
          outletId: o.id,
          repId: rep.id,
          status: OrderStatus.CONFIRMED,
          createdAt: date,
          deliveryDate: new Date(date.getTime() + 86_400_000),
          lines,
        })
      );
      histOrders++;

      thunks.push(() =>
        prisma.visit.create({
          data: {
            code: `VST-9-${idx}-${m}`,
            outletId: o.id,
            repId: rep.id,
            checkInAt: date,
            gpsDriftM: 6 + (m % 3) * 4,
            gpsConfirmed: true,
            photos: [
              { label: "Shelf", taken: true },
              { label: "Menu", taken: m % 2 === 0 },
            ],
            competitors: [
              { brand: "Jägermeister", present: true },
              { brand: "Johnnie Walker", present: m % 2 === 0 },
            ],
            notes:
              m % 2 === 0
                ? "Stock check done. Owner happy with rotation, restocked house pour."
                : "Quick visit — discussed weekend promo and menu placement.",
          },
        })
      );
      histVisits++;
    }
  }

  const CHUNK = 20;
  for (let i = 0; i < thunks.length; i += CHUNK) {
    await Promise.all(thunks.slice(i, i + CHUNK).map((t) => t()));
  }

  console.log("Seeded:", {
    reps: 5,
    products: 5,
    outlets: allOutlets.length,
    visits: 1 + histVisits,
    ordersToday: 10,
    historicalOrders: histOrders,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
