"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

type Row = {
  id: string;
  name: string;
  area: string;
  type: string;
  brands: string[];
  priority: boolean;
  contact: string;
  freshLabel: string;
  stale: boolean;
};

const COLS =
  "grid min-w-[600px] grid-cols-[1.5fr_0.8fr_0.9fr_1.2fr_1fr_0.9fr] gap-3";

export function ConsoleOutletList({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const filtered = query
    ? rows.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.area.toLowerCase().includes(query) ||
          r.type.toLowerCase().includes(query) ||
          r.contact.toLowerCase().includes(query) ||
          r.brands.some((b) => b.toLowerCase().includes(query))
      )
    : rows;

  return (
    <>
      {/* search */}
      <div className="mb-3 flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
        <Search className="h-3.5 w-3.5 text-faint" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search outlet, area, brand, or contact"
          className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-faint"
        />
      </div>

      {/* list */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <div className={`${COLS} eyebrow border-b border-border px-4 py-2.5`}>
          <span>Outlet</span>
          <span>Area</span>
          <span>Type</span>
          <span>Brands</span>
          <span>Contact</span>
          <span>Last visit</span>
        </div>
        {filtered.map((r) => (
          <Link
            key={r.id}
            href={`/console/outlets/${r.id}`}
            className={`${COLS} items-center border-t border-border/60 px-4 py-3 transition-colors hover:bg-surface-2/50`}
          >
            <span className="flex items-center gap-2">
              <span className="text-[13px] font-medium">{r.name}</span>
              {r.priority && (
                <span className="rounded-full bg-ice/10 px-1.5 py-0.5 text-[9px] text-ice">
                  Priority
                </span>
              )}
            </span>
            <span className="text-[12px] text-muted">{r.area}</span>
            <span className="text-[12px] text-muted">{r.type}</span>
            <span className="flex gap-1">
              {r.brands.map((b) => (
                <span
                  key={b}
                  className="rounded-full border border-border px-1.5 py-0.5 text-[9px] text-muted"
                >
                  {b}
                </span>
              ))}
            </span>
            <span className="text-[12px] text-muted">{r.contact}</span>
            <span className={`text-[11px] ${r.stale ? "text-glow" : "text-muted"}`}>
              {r.freshLabel}
            </span>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="px-4 py-6 text-center text-[12px] text-faint">
            No outlet matches &ldquo;{q}&rdquo;.
          </p>
        )}
      </div>

      <p className="mt-3 text-[11px] text-faint">
        Showing {filtered.length} of {rows.length} outlets · tap a row for sales trend
      </p>
    </>
  );
}
