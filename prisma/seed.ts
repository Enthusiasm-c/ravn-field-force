import { PrismaClient, OutletType, OrderStatus } from "@prisma/client";

const prisma = new PrismaClient();

// Demo "now" — the proposal's frozen timestamp.
const NOW = new Date("2026-04-18T14:52:00+08:00");
const at = (h: number, m: number) =>
  new Date(`2026-04-18T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00+08:00`);
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86_400_000);

// Stable hash from a string — keeps every generated field (price, contact,
// address) deterministic across reseeds.
function strHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// Each outlet negotiates its own conditions vs list. Deterministic (hashed from
// the outlet name) so reseeds are stable and the price book stays consistent.
const priceFactor = (name: string) => 0.85 + (strHash(name) % 18) / 100; // 0.85 .. 1.02
const negotiated = (name: string, list: number) =>
  Math.round((list * priceFactor(name)) / 5_000) * 5_000;

// ── Fake-but-believable outlet contacts + addresses ──
// Bali F&B decision-makers are a mix of local owners/managers and expat operators.
const CONTACT_NAMES = [
  "Wayan Surya", "Made Antari", "Komang Aditya", "Kadek Prabowo",
  "Putu Andika", "Nyoman Wirya", "Gusti Ngurah", "Dewa Putra",
  "Ketut Sukerta", "Ayu Lestari", "Sari Kusuma", "Dewi Anggraini",
  "Ni Luh Ratna", "Gede Mahendra", "Agus Suparta", "Eka Pratiwi",
  "Mark Davies", "Tom Whitfield", "Luca Romano", "Sophie Martin",
  "Daniel Brooks", "Jolie Tanaka", "Rizki Hartono", "Sinta Maharani",
];
const PHONE_PREFIX = ["811", "812", "813", "821", "822", "823", "851", "852", "878", "896"];
const STREETS: Record<string, string[]> = {
  Canggu: ["Jl. Batu Bolong", "Jl. Pantai Berawa", "Jl. Pererenan", "Jl. Nelayan", "Jl. Munduk Catu", "Jl. Pantai Batu Mejan"],
  Seminyak: ["Jl. Kayu Aya", "Jl. Petitenget", "Jl. Camplung Tanduk", "Jl. Kayu Jati", "Jl. Drupadi", "Jl. Sarinande"],
  "Kuta Selatan": ["Jl. Labuansait", "Jl. Pantai Suluban", "Jl. Melasti", "Jl. Pantai Balangan", "Jl. Pantai Pandawa", "Jl. Goa Lempeh"],
  Ubud: ["Jl. Raya Ubud", "Jl. Monkey Forest", "Jl. Hanoman", "Jl. Dewi Sita", "Jl. Goutama", "Jl. Sweta"],
  Sanur: ["Jl. Danau Tamblingan", "Jl. Pantai Sindhu", "Jl. Cemara", "Jl. Duyung", "Jl. Bypass Ngurah Rai"],
  Amed: ["Jl. Raya Amed", "Jl. I Ketut Natih", "Jl. Pantai Jemeluk"],
};
const venueContact = (name: string) => CONTACT_NAMES[strHash(name + "·pic") % CONTACT_NAMES.length];
const venuePhone = (name: string) => {
  const h = strHash(name + "·tel");
  const a = String(h % 10000).padStart(4, "0");
  const b = String(Math.floor(h / 11) % 10000).padStart(4, "0");
  return `+62 ${PHONE_PREFIX[h % PHONE_PREFIX.length]}-${a}-${b}`;
};
const venueAddress = (name: string, area: string) => {
  const list = STREETS[area] ?? [`Jl. Raya ${area}`];
  const h = strHash(name + "·addr");
  return `${list[h % list.length]} No. ${1 + (h % 180)}, ${area}`;
};

// ── SKU lines (categories) — what a rep can be assigned to sell. The two hero
//    brands are their own lines; everything else rolls up to a spirit category.
const CATEGORY_OF_BRAND: Record<string, string> = {
  Jägermeister: "Jägermeister",
  "José Cuervo": "José Cuervo",
  "Johnnie Walker": "Whisky", "Chivas Regal": "Whisky", "Ballantine's": "Whisky",
  "Jack Daniel's": "Whisky", Jameson: "Whisky", Glenfiddich: "Whisky",
  Macallan: "Whisky", Singleton: "Whisky", "Monkey Shoulder": "Whisky",
  "Famous Grouse": "Whisky", "Dewar's": "Whisky", "Jim Beam": "Whisky",
  Absolut: "Vodka", Smirnoff: "Vodka", "Grey Goose": "Vodka", Belvedere: "Vodka",
  "Ketel One": "Vodka", Stolichnaya: "Vodka", Skyy: "Vodka",
  "Bombay Sapphire": "Gin", Tanqueray: "Gin", "Hendrick's": "Gin", "Gordon's": "Gin",
  Beefeater: "Gin", Roku: "Gin", "Monkey 47": "Gin",
  Bacardi: "Rum", "Captain Morgan": "Rum", "Havana Club": "Rum", Malibu: "Rum", Kraken: "Rum",
  Patrón: "Tequila", "Don Julio": "Tequila", Olmeca: "Tequila", Espolòn: "Tequila", "1800": "Tequila",
  Baileys: "Liqueur", Cointreau: "Liqueur", Aperol: "Liqueur", Campari: "Liqueur",
  Kahlúa: "Liqueur", "Grand Marnier": "Liqueur", Disaronno: "Liqueur", Luxardo: "Liqueur",
  Bols: "Liqueur", Midori: "Liqueur", Chambord: "Liqueur", "St-Germain": "Liqueur",
  Frangelico: "Liqueur", "Pimm's": "Liqueur", Martini: "Liqueur",
  Hennessy: "Cognac", Martell: "Cognac", "Rémy Martin": "Cognac", "Mansion House": "Cognac",
  Bintang: "Beer", Heineken: "Beer", Guinness: "Beer", Corona: "Beer", "Stella Artois": "Beer",
  "San Miguel": "Beer", Anker: "Beer", Prost: "Beer", Stark: "Beer", Asahi: "Beer",
  "Hatten Wines": "Wine", Sababay: "Wine", Plaga: "Wine", "Two Islands": "Wine",
  "Jacob's Creek": "Wine", "Wolf Blass": "Wine", Hardys: "Wine",
};
const categoryOf = (brand: string) => CATEGORY_OF_BRAND[brand] ?? "Other";

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
    data: {
      name: "Putu Wirawan", initials: "PW", area: "Canggu · Seminyak",
      areas: ["Canggu", "Seminyak"],
      categories: ["Jägermeister", "José Cuervo", "Whisky", "Liqueur", "Tequila"],
    },
  });
  const ari = await prisma.rep.create({
    data: {
      name: "Ari Maulana", initials: "AM", area: "Seminyak · Canggu",
      areas: ["Seminyak", "Canggu"],
      categories: ["Jägermeister", "Vodka", "Tequila", "Beer"],
    },
  });
  const budi = await prisma.rep.create({
    data: {
      name: "Budi Pratama", initials: "BP", area: "Seminyak",
      areas: ["Seminyak"],
      categories: ["Whisky", "Gin", "Rum"],
    },
  });
  const niluh = await prisma.rep.create({
    data: {
      name: "Ni Luh Sari", initials: "NS", area: "Ubud · Kuta Selatan",
      areas: ["Ubud", "Kuta Selatan"],
      categories: ["José Cuervo", "Wine", "Liqueur"],
    },
  });
  const wayan = await prisma.rep.create({
    data: {
      name: "Wayan Adi", initials: "WA", area: "Sanur · Amed",
      areas: ["Sanur", "Amed"],
      categories: ["Jägermeister", "Beer", "Cognac"],
    },
  });

  // ── Product / SKU catalog ─────────────────────────────
  const P = async (brand: string, name: string, sku: string, price: number) =>
    prisma.product.create({
      data: { brand, name, sku, pricePerUnit: price, category: categoryOf(brand) },
    });

  const jag700 = await P("Jägermeister", "Jägermeister 700ml", "JAG-700", 200_000);
  const jag1000 = await P("Jägermeister", "Jägermeister 1L", "JAG-1000", 280_000);
  const jagCold = await P("Jägermeister", "Jägermeister Cold Brew 700ml", "JAG-CB7", 230_000);
  const cueEsp = await P("José Cuervo", "José Cuervo Especial", "CUE-ESP", 210_000);
  const cueTrad = await P("José Cuervo", "José Cuervo Tradicional", "CUE-TRD", 295_000);

  const catalog = { jag700, jag1000, jagCold, cueEsp, cueTrad };

  // ── Wider catalog — ~100 plausible Bali-distributor SKUs ──
  // The demo story runs on the 5 hero SKUs above. These add real catalog depth
  // (the rep's "hundreds of SKUs" reality) and are pickable in the PO builder.
  // Prices are wholesale-band IDR, consistent with the hero SKUs.
  type Cat = [brand: string, name: string, sku: string, price: number, unit?: string];
  const CATALOG: Cat[] = [
    // ── Whisky ──
    ["Johnnie Walker", "Johnnie Walker Red Label 700ml", "JWR-700", 420_000],
    ["Johnnie Walker", "Johnnie Walker Black Label 700ml", "JWB-700", 720_000],
    ["Johnnie Walker", "Johnnie Walker Double Black 700ml", "JWDB-700", 850_000],
    ["Johnnie Walker", "Johnnie Walker Gold Label Reserve 700ml", "JWG-700", 1_250_000],
    ["Johnnie Walker", "Johnnie Walker Blue Label 700ml", "JWBL-700", 3_800_000],
    ["Chivas Regal", "Chivas Regal 12 Year 700ml", "CHV-12", 650_000],
    ["Chivas Regal", "Chivas Regal 18 Year 700ml", "CHV-18", 1_450_000],
    ["Ballantine's", "Ballantine's Finest 700ml", "BAL-FIN", 380_000],
    ["Jack Daniel's", "Jack Daniel's Old No.7 700ml", "JD-N7", 560_000],
    ["Jack Daniel's", "Jack Daniel's Tennessee Honey 700ml", "JD-HNY", 590_000],
    ["Jack Daniel's", "Jack Daniel's Tennessee Apple 700ml", "JD-APL", 590_000],
    ["Jameson", "Jameson Irish Whiskey 700ml", "JAM-700", 520_000],
    ["Glenfiddich", "Glenfiddich 12 Year 700ml", "GLF-12", 880_000],
    ["Glenfiddich", "Glenfiddich 15 Year 700ml", "GLF-15", 1_300_000],
    ["Macallan", "The Macallan 12 Double Cask 700ml", "MAC-12", 1_900_000],
    ["Singleton", "The Singleton 12 Year 700ml", "SGT-12", 780_000],
    ["Monkey Shoulder", "Monkey Shoulder Blended Malt 700ml", "MKS-700", 720_000],
    ["Famous Grouse", "The Famous Grouse 700ml", "FMG-700", 360_000],
    ["Dewar's", "Dewar's White Label 700ml", "DWR-WL", 360_000],
    ["Jim Beam", "Jim Beam White 700ml", "JB-WHT", 420_000],
    // ── Vodka ──
    ["Absolut", "Absolut Blue 700ml", "ABS-BLU", 380_000],
    ["Absolut", "Absolut Citron 700ml", "ABS-CIT", 400_000],
    ["Absolut", "Absolut Vanilia 700ml", "ABS-VAN", 400_000],
    ["Absolut", "Absolut Mandrin 700ml", "ABS-MAN", 400_000],
    ["Smirnoff", "Smirnoff Red No.21 700ml", "SMI-RED", 280_000],
    ["Smirnoff", "Smirnoff Black 700ml", "SMI-BLK", 340_000],
    ["Smirnoff", "Smirnoff Ice 275ml", "SMI-ICE", 45_000],
    ["Grey Goose", "Grey Goose 700ml", "GG-700", 950_000],
    ["Belvedere", "Belvedere 700ml", "BLV-700", 920_000],
    ["Ketel One", "Ketel One 700ml", "KTL-700", 620_000],
    ["Stolichnaya", "Stolichnaya Premium 700ml", "STO-700", 360_000],
    ["Skyy", "Skyy Vodka 700ml", "SKY-700", 320_000],
    // ── Gin ──
    ["Bombay Sapphire", "Bombay Sapphire 700ml", "BOM-SAP", 480_000],
    ["Tanqueray", "Tanqueray London Dry 700ml", "TAN-LD", 460_000],
    ["Tanqueray", "Tanqueray No. Ten 700ml", "TAN-10", 720_000],
    ["Hendrick's", "Hendrick's Gin 700ml", "HEN-GIN", 780_000],
    ["Gordon's", "Gordon's London Dry 700ml", "GOR-700", 320_000],
    ["Beefeater", "Beefeater London Dry 700ml", "BEF-700", 380_000],
    ["Roku", "Roku Japanese Craft Gin 700ml", "ROK-700", 560_000],
    ["Monkey 47", "Monkey 47 Schwarzwald Dry 500ml", "MK47-500", 980_000],
    // ── Rum ──
    ["Bacardi", "Bacardi Carta Blanca 700ml", "BAC-BLA", 300_000],
    ["Bacardi", "Bacardi Carta Oro 700ml", "BAC-ORO", 320_000],
    ["Bacardi", "Bacardi Carta Negra 700ml", "BAC-BLK", 330_000],
    ["Captain Morgan", "Captain Morgan Spiced Gold 700ml", "CPM-SPG", 340_000],
    ["Captain Morgan", "Captain Morgan Dark 700ml", "CPM-DRK", 340_000],
    ["Havana Club", "Havana Club Añejo 3 700ml", "HAV-3", 360_000],
    ["Havana Club", "Havana Club Añejo 7 700ml", "HAV-7", 520_000],
    ["Malibu", "Malibu Coconut 700ml", "MAL-700", 300_000],
    ["Kraken", "The Kraken Black Spiced 700ml", "KRK-700", 480_000],
    // ── Tequila / Agave ──
    ["Patrón", "Patrón Silver 700ml", "PAT-SIL", 1_650_000],
    ["Patrón", "Patrón Reposado 700ml", "PAT-REP", 1_850_000],
    ["Don Julio", "Don Julio Blanco 700ml", "DJ-BLA", 1_550_000],
    ["Don Julio", "Don Julio Reposado 700ml", "DJ-REP", 1_750_000],
    ["Don Julio", "Don Julio 1942 700ml", "DJ-1942", 4_200_000],
    ["Olmeca", "Olmeca Blanco 700ml", "OLM-BLA", 420_000],
    ["Olmeca", "Olmeca Altos Reposado 700ml", "OLM-ALT", 560_000],
    ["Espolòn", "Espolòn Blanco 700ml", "ESP-BLA", 580_000],
    ["1800", "1800 Reposado 700ml", "T1800-REP", 720_000],
    // ── Liqueurs / Aperitif ──
    ["Baileys", "Baileys Irish Cream 700ml", "BAI-700", 380_000],
    ["Cointreau", "Cointreau 700ml", "COI-700", 520_000],
    ["Aperol", "Aperol Aperitivo 700ml", "APE-700", 380_000],
    ["Campari", "Campari 700ml", "CAM-700", 420_000],
    ["Kahlúa", "Kahlúa Coffee Liqueur 700ml", "KAH-700", 380_000],
    ["Grand Marnier", "Grand Marnier Cordon Rouge 700ml", "GRM-700", 620_000],
    ["Disaronno", "Disaronno Amaretto 700ml", "DIS-700", 420_000],
    ["Luxardo", "Luxardo Sambuca 700ml", "SAM-LUX", 360_000],
    ["Bols", "Bols Triple Sec 700ml", "BOL-TSC", 180_000],
    ["Midori", "Midori Melon Liqueur 700ml", "MID-700", 380_000],
    ["Chambord", "Chambord Black Raspberry 500ml", "CHA-500", 560_000],
    ["St-Germain", "St-Germain Elderflower 700ml", "STG-700", 620_000],
    ["Frangelico", "Frangelico Hazelnut 700ml", "FRA-700", 440_000],
    ["Pimm's", "Pimm's No.1 700ml", "PIM-700", 380_000],
    ["Martini", "Martini Rosso Vermouth 1L", "MTN-ROS", 220_000],
    ["Martini", "Martini Bianco Vermouth 1L", "MTN-BIA", 220_000],
    // ── Cognac / Brandy ──
    ["Hennessy", "Hennessy VS 700ml", "HNS-VS", 980_000],
    ["Hennessy", "Hennessy VSOP 700ml", "HNS-VSOP", 1_650_000],
    ["Hennessy", "Hennessy XO 700ml", "HNS-XO", 4_500_000],
    ["Martell", "Martell VSOP 700ml", "MAR-VSOP", 1_450_000],
    ["Rémy Martin", "Rémy Martin VSOP 700ml", "REM-VSOP", 1_380_000],
    ["Mansion House", "Mansion House Brandy 700ml", "MAN-HSE", 240_000],
    // ── Beer ──
    ["Bintang", "Bintang Pilsener 620ml", "BIN-620", 48_000],
    ["Bintang", "Bintang Pilsener 330ml", "BIN-330", 28_000, "can"],
    ["Bintang", "Bintang Crystal 620ml", "BIN-CRY", 52_000],
    ["Heineken", "Heineken 330ml", "HEI-330", 42_000, "can"],
    ["Guinness", "Guinness Foreign Extra 320ml", "GUI-320", 55_000],
    ["Corona", "Corona Extra 330ml", "COR-330", 65_000],
    ["Stella Artois", "Stella Artois 330ml", "STE-330", 58_000],
    ["San Miguel", "San Miguel Pale Pilsen 330ml", "SAN-330", 40_000, "can"],
    ["Anker", "Anker Bir 620ml", "ANK-620", 45_000],
    ["Prost", "Prost Pilsner 620ml", "PRO-620", 42_000],
    ["Stark", "Stark Premium 500ml", "STK-500", 50_000],
    ["Asahi", "Asahi Super Dry 330ml", "ASA-330", 55_000, "can"],
    // ── Wine (Bali local + imported) ──
    ["Hatten Wines", "Hatten Aga White 750ml", "HAT-AGA", 185_000],
    ["Hatten Wines", "Hatten Tunjung Sparkling 750ml", "HAT-TUN", 210_000],
    ["Hatten Wines", "Hatten Jepun Rosé 750ml", "HAT-JEP", 195_000],
    ["Sababay", "Sababay White Velvet 750ml", "SAB-WV", 175_000],
    ["Sababay", "Sababay Moscato d'Bali 750ml", "SAB-MOS", 180_000],
    ["Plaga", "Plaga Red Wine 750ml", "PLG-RED", 165_000],
    ["Two Islands", "Two Islands Sauvignon Blanc 750ml", "2IS-SB", 220_000],
    ["Jacob's Creek", "Jacob's Creek Shiraz 750ml", "JCK-SHZ", 280_000],
    ["Wolf Blass", "Wolf Blass Yellow Label Cabernet 750ml", "WB-YL", 320_000],
    ["Hardys", "Hardys Stamp Chardonnay 750ml", "HRD-CHD", 260_000],
  ];
  await prisma.product.createMany({
    data: CATALOG.map(([brand, name, sku, pricePerUnit, unit]) => ({
      brand,
      name,
      sku,
      pricePerUnit,
      category: categoryOf(brand),
      ...(unit ? { unit } : {}),
    })),
  });

  // Look up any product by SKU — lets the desk orders below pull from the full
  // 107-SKU book (not just the 5 hero SKUs) so every order reads differently.
  const productRows = await prisma.product.findMany({
    select: { id: true, sku: true, pricePerUnit: true },
  });
  const bySku = new Map(productRows.map((p) => [p.sku, p]));
  const sku = (s: string) => {
    const p = bySku.get(s);
    if (!p) throw new Error(`seed: unknown SKU ${s}`);
    return p;
  };

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

  // ── Enrich every outlet with a believable decision-maker + phone, and a
  //    real street address (coverage venues were seeded "Area, Bali"). Keeps any
  //    hand-set contact (Old Man's → Javier); replaces masked/placeholder ones.
  const bareOutlets = await prisma.outlet.findMany();
  await Promise.all(
    bareOutlets.map((o) =>
      prisma.outlet.update({
        where: { id: o.id },
        data: {
          contactName: o.contactName ?? venueContact(o.name),
          contactPhone:
            o.contactPhone && !o.contactPhone.includes("X")
              ? o.contactPhone
              : venuePhone(o.name),
          address: o.address.endsWith(", Bali") ? venueAddress(o.name, o.area) : o.address,
        },
      })
    )
  );

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
      objective: "Regular Visit",
      pic: "Javier",
    },
  });

  // ── Orders ────────────────────────────────────────────
  type Line = { product: { id: string; pricePerUnit: number }; qty: number };
  const makeOrder = async (d: {
    code: string;
    outletId: string;
    outletName: string;
    repId: string;
    visitId?: string;
    status: OrderStatus;
    createdAt: Date;
    deliveryDate: Date;
    lines: Line[];
    warehouseNote?: string;
  }) => {
    // Each line is priced at this outlet's negotiated condition, snapshotted.
    const priced = d.lines.map((l) => ({
      product: l.product,
      qty: l.qty,
      unitPrice: negotiated(d.outletName, l.product.pricePerUnit),
    }));
    const total = priced.reduce((s, l) => s + l.unitPrice * l.qty, 0);
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
          create: priced.map((l) => ({
            productId: l.product.id,
            qty: l.qty,
            unitPrice: l.unitPrice,
            lineTotal: l.unitPrice * l.qty,
          })),
        },
      },
    });
  };

  const tomorrowAM = new Date("2026-04-19T09:00:00+08:00");
  const todayPM = new Date("2026-04-18T17:00:00+08:00"); // same-day express slot

  // Desk order — a "today" order on the manager queue, each tied to its own
  // visit (distinct objective / PIC / notes / photos) and pulling a realistic,
  // outlet-appropriate basket from the full catalog, so no two read alike.
  const makeDeskOrder = async (d: {
    code: string;
    visitCode: string;
    outlet: { id: string; name: string };
    rep: { id: string };
    status: OrderStatus;
    createdAt: Date;
    checkInAt: Date;
    deliveryDate: Date;
    warehouseNote?: string;
    lines: { sku: string; qty: number }[];
    objective: string;
    pic: string;
    notes: string;
    photoLabels: string[];
    competitors: { brand: string; present: boolean }[];
    gpsDriftM?: number;
  }) => {
    const visit = await prisma.visit.create({
      data: {
        code: d.visitCode,
        outletId: d.outlet.id,
        repId: d.rep.id,
        checkInAt: d.checkInAt,
        gpsDriftM: d.gpsDriftM ?? 8,
        gpsConfirmed: true,
        photos: d.photoLabels.map((label) => ({ label, taken: true })),
        competitors: d.competitors,
        notes: d.notes,
        objective: d.objective,
        pic: d.pic,
      },
    });
    return makeOrder({
      code: d.code,
      outletId: d.outlet.id,
      outletName: d.outlet.name,
      repId: d.rep.id,
      visitId: visit.id,
      status: d.status,
      createdAt: d.createdAt,
      deliveryDate: d.deliveryDate,
      warehouseNote: d.warehouseNote,
      lines: d.lines.map((l) => ({ product: sku(l.sku), qty: l.qty })),
    });
  };

  // Hero order — tied to the hero visit, stays NEW so the confirm flow is live.
  await makeOrder({
    code: "ORD-4421",
    outletId: oldMans.id,
    outletName: oldMans.name,
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

  // La Laguna — sunset beach bar building a signature cocktail list.
  await makeDeskOrder({
    code: "ORD-4420",
    visitCode: "VST-8841",
    outlet: laLaguna,
    rep: denis,
    status: OrderStatus.NEW,
    createdAt: at(14, 32),
    checkInAt: at(14, 12),
    deliveryDate: tomorrowAM,
    warehouseNote: "Deliver before 4pm — bar opens at sunset.",
    lines: [
      { sku: "JAG-700", qty: 8 },
      { sku: "TAN-LD", qty: 4 },
      { sku: "BAC-BLA", qty: 6 },
      { sku: "BIN-620", qty: 24 },
    ],
    objective: "Suggest Program & Promo",
    pic: "Komang",
    notes:
      "Building a signature sunset cocktail list — added gin and white rum. Wants a Jäger shot-bucket promo for Friday live music.",
    photoLabels: ["Bar", "Drinks", "Menu"],
    competitors: [
      { brand: "Bombay Sapphire", present: true },
      { brand: "Jägermeister", present: true },
    ],
  });

  // Ulekan — Indonesian fine-dining, negotiating a house-pour listing.
  await makeDeskOrder({
    code: "ORD-4419",
    visitCode: "VST-8840",
    outlet: ulekan,
    rep: niluh,
    status: OrderStatus.NEW,
    createdAt: at(14, 5),
    checkInAt: at(13, 48),
    deliveryDate: tomorrowAM,
    lines: [
      { sku: "CUE-ESP", qty: 6 },
      { sku: "APE-700", qty: 4 },
      { sku: "HAT-TUN", qty: 6 },
      { sku: "2IS-SB", qty: 6 },
    ],
    objective: "Listing & House Pouring Deal",
    pic: "Dewa",
    notes:
      "Negotiating a house-pour listing — added local Hatten sparkling and a sauvignon for the tasting menu. Aperol spritz selling well at lunch.",
    photoLabels: ["Menu", "Shelf"],
    competitors: [
      { brand: "Campari", present: true },
      { brand: "José Cuervo", present: true },
    ],
  });

  // Finns — high-volume beach club prepping a Saturday DJ event.
  await makeDeskOrder({
    code: "ORD-4418",
    visitCode: "VST-8839",
    outlet: finns,
    rep: ari,
    status: OrderStatus.CONFIRMED,
    createdAt: at(13, 54),
    checkInAt: at(13, 30),
    deliveryDate: tomorrowAM,
    warehouseNote: "Pallet delivery — service entrance, contact ops at 8am.",
    lines: [
      { sku: "GG-700", qty: 12 },
      { sku: "PAT-SIL", qty: 6 },
      { sku: "COR-330", qty: 48 },
      { sku: "HAT-JEP", qty: 12 },
      { sku: "JAG-700", qty: 8 },
    ],
    objective: "Event & Activation",
    pic: "Putu",
    notes:
      "Prepping Saturday DJ event — bulk shots plus premium spirits for VIP cabanas. Confirmed an ice-cold Jäger tap activation at the main bar.",
    photoLabels: ["Bar", "Promo", "Drinks"],
    competitors: [
      { brand: "Grey Goose", present: true },
      { brand: "Jägermeister", present: true },
    ],
    gpsDriftM: 12,
  });

  // Potato Head — iconic beach club, restock after the weekend.
  await makeDeskOrder({
    code: "ORD-4417",
    visitCode: "VST-8838",
    outlet: potatoHead,
    rep: ari,
    status: OrderStatus.IN_DELIVERY,
    createdAt: at(13, 22),
    checkInAt: at(13, 2),
    deliveryDate: todayPM,
    warehouseNote: "Express — already on the truck.",
    lines: [
      { sku: "JAG-CB7", qty: 12 },
      { sku: "CUE-TRD", qty: 6 },
      { sku: "HEN-GIN", qty: 6 },
      { sku: "HEI-330", qty: 48 },
    ],
    objective: "Check Stock & Visibility",
    pic: "Made",
    notes:
      "Restock after the weekend rush — Cold Brew moving fast at the day bar. Added Hendrick's for the botanical list. Strong Jäger visibility on backbar.",
    photoLabels: ["Shelf", "Bar", "Menu"],
    competitors: [
      { brand: "Tanqueray", present: true },
      { brand: "Jägermeister", present: true },
    ],
  });

  // Sari Made — small local bar, routine restock.
  await makeDeskOrder({
    code: "ORD-4415",
    visitCode: "VST-8837",
    outlet: sariMade,
    rep: budi,
    status: OrderStatus.CONFIRMED,
    createdAt: at(12, 48),
    checkInAt: at(12, 30),
    deliveryDate: tomorrowAM,
    lines: [
      { sku: "JAG-700", qty: 6 },
      { sku: "SMI-RED", qty: 6 },
      { sku: "BIN-620", qty: 24 },
    ],
    objective: "Regular Visit",
    pic: "Kadek",
    notes:
      "Routine restock for the local crowd — house vodka and beer steady. Reminded them about the upcoming Jäger POS materials.",
    photoLabels: ["Shelf", "Drinks"],
    competitors: [
      { brand: "Smirnoff", present: true },
      { brand: "Jägermeister", present: true },
    ],
  });

  // La Plancha — colourful beanbag beach bar, sunset tasting.
  await makeDeskOrder({
    code: "ORD-4412",
    visitCode: "VST-8836",
    outlet: laPlancha,
    rep: ari,
    status: OrderStatus.IN_DELIVERY,
    createdAt: at(11, 30),
    checkInAt: at(11, 8),
    deliveryDate: todayPM,
    warehouseNote: "Delivery in progress — driver Wayan.",
    lines: [
      { sku: "MAL-700", qty: 8 },
      { sku: "COR-330", qty: 48 },
      { sku: "JAG-700", qty: 6 },
    ],
    objective: "Tasting & Sampling",
    pic: "Agus",
    notes:
      "Ran a sunset tasting — coconut rum and Jäger cocktails landed well with the beanbag crowd. Big beer pull expected for the weekend.",
    photoLabels: ["Bar", "Promo"],
    competitors: [
      { brand: "Bacardi", present: true },
      { brand: "Jägermeister", present: true },
    ],
  });

  // Ulekan again — earlier, confirmed order: a premium top-shelf push.
  await makeDeskOrder({
    code: "ORD-4409",
    visitCode: "VST-8835",
    outlet: ulekan,
    rep: niluh,
    status: OrderStatus.CONFIRMED,
    createdAt: at(10, 14),
    checkInAt: at(9, 55),
    deliveryDate: tomorrowAM,
    lines: [
      { sku: "CUE-ESP", qty: 9 },
      { sku: "DJ-BLA", qty: 3 },
      { sku: "COI-700", qty: 3 },
      { sku: "PLG-RED", qty: 6 },
    ],
    objective: "Follow Up",
    pic: "Dewa",
    notes:
      "Follow-up on the premium margarita program — upsold Don Julio and Cointreau for the top-shelf list, plus a red for the new dinner pairing.",
    photoLabels: ["Menu", "Promo"],
    competitors: [
      { brand: "Don Julio", present: false },
      { brand: "José Cuervo", present: true },
    ],
  });

  // Luigi's (Ubud) — Italian restaurant, order held on credit.
  await makeDeskOrder({
    code: "ORD-4405",
    visitCode: "VST-8834",
    outlet: luigis,
    rep: niluh,
    status: OrderStatus.REJECTED,
    createdAt: at(9, 40),
    checkInAt: at(9, 20),
    deliveryDate: tomorrowAM,
    warehouseNote: "On hold — credit check, returned to rep.",
    lines: [
      { sku: "CUE-ESP", qty: 3 },
      { sku: "CAM-700", qty: 3 },
      { sku: "JCK-SHZ", qty: 6 },
    ],
    objective: "Suggest Program & Promo",
    pic: "Gede",
    notes:
      "Pitched a negroni & amaro program for the bar. Order put on hold — outstanding balance to clear before the next delivery.",
    photoLabels: ["Shelf", "Menu"],
    competitors: [
      { brand: "Campari", present: true },
      { brand: "José Cuervo", present: true },
    ],
  });

  // ── Historical orders + visits (6 months) — the data behind the trends ──
  const repForArea = (area: string) =>
    area === "Canggu" ? denis : area === "Seminyak" ? ari : area === "Ubud" ? niluh : wayan;

  // PAN's visit taxonomy + plausible Balinese PIC names for history variety.
  const OBJECTIVES = [
    "Regular Visit",
    "Suggest Program & Promo",
    "Check Stock & Visibility",
    "Follow Up",
    "Listing & House Pouring Deal",
    "Tasting & Sampling",
  ];
  const PIC_NAMES = ["Wayan", "Made", "Komang", "Putu", "Kadek", "Agus", "Dewa", "Gede"];

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

  // Diverse per-outlet purchase profile drawn from the full book, weighted by
  // venue type — so "top purchases" read differently per outlet instead of every
  // venue showing Jägermeister on top. Focus brands still appear, just not as the
  // lead line. The hero (Old Man's) keeps its Jäger/Cuervo story intact.
  const CAT: Record<string, string[]> = {
    whisky: ["JWR-700", "JWB-700", "JD-N7", "JAM-700", "CHV-12", "BAL-FIN", "GLF-12", "MKS-700", "DWR-WL", "JB-WHT"],
    vodka: ["ABS-BLU", "SMI-RED", "GG-700", "KTL-700", "STO-700", "SKY-700", "ABS-CIT"],
    gin: ["BOM-SAP", "TAN-LD", "HEN-GIN", "GOR-700", "BEF-700", "ROK-700"],
    rum: ["BAC-BLA", "BAC-ORO", "CPM-SPG", "HAV-3", "HAV-7", "MAL-700", "KRK-700"],
    tequila: ["CUE-ESP", "CUE-TRD", "DJ-BLA", "OLM-BLA", "OLM-ALT", "ESP-BLA", "T1800-REP"],
    liqueur: ["BAI-700", "COI-700", "APE-700", "CAM-700", "KAH-700", "DIS-700", "MID-700", "STG-700", "PIM-700"],
    beer: ["BIN-620", "HEI-330", "COR-330", "STE-330", "SAN-330", "GUI-320", "ANK-620"],
    wine: ["HAT-AGA", "HAT-TUN", "HAT-JEP", "SAB-WV", "PLG-RED", "2IS-SB", "JCK-SHZ", "WB-YL", "HRD-CHD"],
    cognac: ["HNS-VS", "MAR-VSOP", "REM-VSOP", "MAN-HSE"],
  };
  const TYPE_CATS: Record<OutletType, string[]> = {
    BEACH_CLUB: ["vodka", "tequila", "beer", "wine", "gin", "liqueur"],
    CLUB: ["vodka", "tequila", "whisky", "liqueur", "rum", "beer"],
    BAR: ["gin", "rum", "whisky", "beer", "vodka", "liqueur"],
    RESTAURANT: ["wine", "tequila", "liqueur", "cognac", "gin", "whisky"],
  };
  const pickCat = (name: string, cat: string) =>
    CAT[cat][strHash(name + "·" + cat) % CAT[cat].length];
  const buildBasket = (o: { name: string; type: OutletType; brands: string[] }) => {
    const cats = TYPE_CATS[o.type];
    const rot = strHash(o.name + "·rot") % cats.length;
    const skus: string[] = [];
    for (let k = 0; k < 4; k++) {
      const s = pickCat(o.name, cats[(rot + k) % cats.length]);
      if (!skus.includes(s)) skus.push(s);
    }
    // Focus brands present, but seated mid-basket — never the lead line.
    if (o.brands.includes("José Cuervo")) {
      const cs = strHash(o.name) % 2 === 0 ? "CUE-ESP" : "CUE-TRD";
      if (!skus.includes(cs)) skus.splice(1, 0, cs);
    }
    if (o.brands.includes("Jägermeister")) {
      const js = ["JAG-700", "JAG-1000", "JAG-CB7"][strHash(o.name + "·jag") % 3];
      if (!skus.includes(js)) skus.splice(Math.min(2, skus.length), 0, js);
    }
    return skus.map((s) => sku(s));
  };

  // Build all history operations, then run them in bounded chunks (fast + safe
  // on a pooled connection).
  const thunks: (() => Promise<unknown>)[] = [];
  // Price memory — last agreed unit price per outlet×SKU, built from history.
  const priceBook = new Map<
    string,
    { outletId: string; productId: string; unitPrice: number }
  >();
  let histVisits = 0;
  let histOrders = 0;
  for (let idx = 0; idx < allOutlets.length; idx++) {
    const o = allOutlets[idx];
    const rep = repForArea(o.area);
    const factors = trends[trendKeys[idx % 4]];
    const base = baseUnitsFor(o.type);
    // Hero keeps the Jäger/Cuervo story; everyone else gets a diverse basket.
    const basket =
      o.id === oldMans.id
        ? [jag700, jag1000, cueEsp, jagCold, cueTrad]
        : buildBasket(o);
    if (basket.length === 0) continue;
    const off = Math.max(1, Math.floor(basket.length / 2));

    for (let m = 0; m < months.length; m++) {
      const date = months[m];
      const units = Math.max(2, Math.round(base * factors[m]));
      // Rotate the lead line through the basket each month so volume spreads
      // across SKUs — no single product dominates the outlet's history.
      const a = basket[m % basket.length];
      const b = basket[(m + off) % basket.length];
      const lines =
        basket.length >= 2
          ? [
              { product: a, qty: Math.max(1, Math.ceil(units * 0.6)) },
              { product: b, qty: Math.max(1, Math.floor(units * 0.4)) },
            ]
          : [{ product: a, qty: units }];

      for (const l of lines) {
        priceBook.set(`${o.id}:${l.product.id}`, {
          outletId: o.id,
          productId: l.product.id,
          unitPrice: negotiated(o.name, l.product.pricePerUnit),
        });
      }

      thunks.push(() =>
        makeOrder({
          code: `ORD-3${idx}-${m}`,
          outletId: o.id,
          outletName: o.name,
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
            objective: OBJECTIVES[(idx + m) % OBJECTIVES.length],
            pic: o.contactName ?? PIC_NAMES[(idx + m) % PIC_NAMES.length],
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

  // Price memory — one row per outlet×SKU ever ordered (last agreed price).
  await prisma.outletPrice.createMany({ data: [...priceBook.values()] });

  console.log("Seeded:", {
    reps: 5,
    products: 5 + CATALOG.length,
    outlets: allOutlets.length,
    visits: 9 + histVisits, // hero + 8 desk visits + history
    ordersToday: 9,
    historicalOrders: histOrders,
    priceBookRows: priceBook.size,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
