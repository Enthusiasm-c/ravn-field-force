import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** IDR with thousand separators, no decimals: 5340000 → "5,340,000" */
export function formatIDR(n: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}

/** Compact money for dashboards: 142_600_000 → "142.6M" */
export function compactIDR(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return String(n);
}

/** 0.3 → "0.3 km", 22 → "22 km" */
export function formatDistance(km: number): string {
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

/** Human freshness from a last-visit date. Returns label + staleness flag. */
export function freshness(last: Date | null): { label: string; stale: boolean } {
  if (!last) return { label: "Not visited", stale: true };
  const days = Math.floor((DEMO_NOW.getTime() - last.getTime()) / 86_400_000);
  if (days <= 0) return { label: "Today", stale: false };
  if (days < 7) return { label: `Last visit · ${days}d`, stale: false };
  if (days < 30) return { label: `Last visit · ${Math.floor(days / 7)}w`, stale: false };
  if (days < 60) return { label: "Last visit · 1mo", stale: days >= 30 };
  return { label: `Not visited · 30d+`, stale: true };
}

/** Demo "now" — the proposal's frozen timestamp so the story always reads the same. */
export const DEMO_NOW = new Date("2026-04-18T14:52:00+08:00");
