// Presentation constants for the Director dashboard.
// Order-derived numbers are computed live from the DB (so the confirm flow
// updates them). These are the wider-territory figures the proposal shows
// that a 10-outlet demo seed can't produce on its own.

export const DEMO_DATE_LABEL = "Sat · 18 Apr 2026 · 14:52 WITA";

export const HEADLINE = {
  visitsToday: 42,
  visitsYesterday: 38,
  revenueToday: 142_000_000,
  revenue7dAvg: 127_000_000,
  activeOutlets: 156,
  staleOutlets: 3,
};

export const LEADERBOARD = [
  { rank: 1, name: "Denis Rahmawan", revenue: 18_400_000, visits: 28, orders: 12, area: "Canggu" },
  { rank: 2, name: "Ari Maulana", revenue: 14_200_000, visits: 24, orders: 9, area: "Seminyak" },
  { rank: 3, name: "Budi Pratama", revenue: 10_800_000, visits: 19, orders: 7, area: "Seminyak" },
  { rank: 4, name: "Ni Luh Sari", revenue: 8_100_000, visits: 16, orders: 5, area: "Ubud" },
  { rank: 5, name: "Wayan Adi", revenue: 6_400_000, visits: 13, orders: 4, area: "Sanur" },
];

// Bali field activity by area — for the coverage map.
export const FIELD_AREAS = [
  { area: "CANGGU", pins: 38, activeToday: 14, stale: 1, x: 22, y: 38 },
  { area: "SEMINYAK", pins: 41, activeToday: 12, stale: 1, x: 30, y: 52 },
  { area: "KUTA SELATAN", pins: 27, activeToday: 7, stale: 0, x: 38, y: 78 },
  { area: "SANUR", pins: 19, activeToday: 5, stale: 0, x: 58, y: 60 },
  { area: "UBUD", pins: 22, activeToday: 3, stale: 1, x: 52, y: 28 },
  { area: "AMED", pins: 9, activeToday: 1, stale: 0, x: 86, y: 18 },
];

export const STATUS_META = {
  NEW: { label: "New", color: "var(--ice)" },
  CONFIRMED: { label: "Confirmed", color: "var(--ok)" },
  IN_DELIVERY: { label: "In delivery", color: "var(--gold)" },
  REJECTED: { label: "Rejected", color: "var(--danger)" },
} as const;

export const OUTLET_TYPE_LABEL = {
  BAR: "Bar",
  CLUB: "Club",
  BEACH_CLUB: "Beach Club",
  RESTAURANT: "Restaurant",
} as const;
