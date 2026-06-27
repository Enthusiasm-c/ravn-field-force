"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";

type Row = {
  id: string;
  name: string;
  area: string;
  type: string;
  brands: string[];
  freshLabel: string;
  stale: boolean;
  due: boolean;
};

type Filter = "all" | "due" | "stale";

export function RepOutletList({
  rows,
  counts,
}: {
  rows: Row[];
  counts: { all: number; due: number; stale: number };
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const query = q.trim().toLowerCase();

  const filtered = rows.filter((r) => {
    if (filter === "due" && !r.due) return false;
    if (filter === "stale" && !r.stale) return false;
    if (!query) return true;
    return (
      r.name.toLowerCase().includes(query) ||
      r.area.toLowerCase().includes(query) ||
      r.type.toLowerCase().includes(query) ||
      r.brands.some((b) => b.toLowerCase().includes(query))
    );
  });

  return (
    <>
      <div className="px-5">
        {/* chips */}
        <div className="mt-4 flex gap-2">
          <Chip label="All" value={counts.all} on={filter === "all"} onClick={() => setFilter("all")} />
          <Chip label="Due today" value={counts.due} on={filter === "due"} onClick={() => setFilter("due")} />
          <Chip label="Not visited 30d+" value={counts.stale} glow on={filter === "stale"} onClick={() => setFilter("stale")} />
        </div>

        {/* search + filters */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5">
            <Search className="h-4 w-4 text-faint" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search outlet, area, or brand"
              className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-faint"
            />
          </div>
          <button className="flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2.5 text-[12px] text-muted">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </button>
        </div>
      </div>

      {/* list */}
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-4 pt-3">
        {filtered.map((o) => (
          <Link
            key={o.id}
            href={`/rep/outlet/${o.id}`}
            className={`block rounded-2xl border bg-surface/70 p-3.5 transition-colors hover:bg-surface ${
              o.stale ? "alpenglow border-glow/30" : "border-border"
            }`}
          >
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold">{o.name}</p>
              <p className="mt-0.5 text-[12px] text-muted">
                {o.area} · {o.type}
              </p>
            </div>
            <div className="mt-2.5 flex items-center justify-between">
              <span className={`text-[11px] ${o.stale ? "text-glow" : "text-faint"}`}>
                {o.freshLabel}
              </span>
              <div className="flex gap-1">
                {o.brands.map((b) => (
                  <span
                    key={b}
                    className="rounded-full border border-border-strong px-2 py-0.5 text-[9px] text-muted"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="px-1 pt-6 text-center text-[12px] text-faint">
            No outlet matches your filter.
          </p>
        )}
      </div>
    </>
  );
}

function Chip({
  label,
  value,
  on,
  glow,
  onClick,
}: {
  label: string;
  value: number;
  on: boolean;
  glow?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] transition-colors ${
        on
          ? glow
            ? "border-glow/40 bg-glow/10 text-glow"
            : "border-ice/40 bg-ice/10 text-ice"
          : "border-border bg-surface text-muted"
      }`}
    >
      <span>{label}</span>
      <span className="tabular font-semibold">{value}</span>
    </button>
  );
}
