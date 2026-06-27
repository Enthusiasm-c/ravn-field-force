"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ChevronRight } from "lucide-react";

type Row = {
  id: string;
  name: string;
  area: string;
  type: string;
  brands: string[];
  freshLabel: string;
  stale: boolean;
  href: string;
};

export function RepCheckInList({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const filtered = query
    ? rows.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.area.toLowerCase().includes(query) ||
          r.type.toLowerCase().includes(query) ||
          r.brands.some((b) => b.toLowerCase().includes(query))
      )
    : rows;

  return (
    <>
      <div className="px-4">
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5">
          <Search className="h-4 w-4 text-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search outlet, area, or brand"
            className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-faint"
          />
        </div>
      </div>

      <div className="mt-3 flex-1 space-y-1.5 overflow-y-auto px-3 pb-4">
        {filtered.map((o) => (
          <Link
            key={o.id}
            href={o.href}
            className="flex items-center gap-3 rounded-xl border border-border bg-surface/70 px-3.5 py-3 transition-colors hover:bg-surface"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold">{o.name}</p>
              <p className="mt-0.5 text-[11px] text-muted">
                {o.area} · {o.type} ·{" "}
                <span className={o.stale ? "text-glow" : "text-faint"}>{o.freshLabel}</span>
              </p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-faint" />
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="px-1 pt-6 text-center text-[12px] text-faint">
            No outlet matches &ldquo;{q}&rdquo;.
          </p>
        )}
      </div>
    </>
  );
}
