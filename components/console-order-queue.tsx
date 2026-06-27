"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

type Row = {
  id: string;
  code: string;
  outlet: string;
  rep: string;
  total: string;
  statusLabel: string;
  statusColor: string;
  time: string;
};

export function ConsoleOrderQueue({
  rows,
  tab,
  focusCode,
}: {
  rows: Row[];
  tab: string;
  focusCode?: string;
}) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const filtered = query
    ? rows.filter(
        (r) =>
          r.code.toLowerCase().includes(query) ||
          r.outlet.toLowerCase().includes(query) ||
          r.rep.toLowerCase().includes(query)
      )
    : rows;

  return (
    <>
      {/* search */}
      <div className="px-6 pb-2">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
          <Search className="h-3.5 w-3.5 text-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search order #, outlet, or rep"
            className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-faint"
          />
        </div>
      </div>

      {/* table */}
      <div className="overflow-x-auto px-3 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
        <table className="w-full min-w-[520px] border-collapse lg:min-w-0">
          <thead className="sticky top-0 bg-bg">
            <tr className="eyebrow text-left">
              <th className="px-3 py-2 font-normal">Order #</th>
              <th className="px-3 py-2 font-normal">Outlet</th>
              <th className="px-3 py-2 font-normal">Rep</th>
              <th className="px-3 py-2 text-right font-normal">Total IDR</th>
              <th className="px-3 py-2 font-normal">Status</th>
              <th className="px-3 py-2 text-right font-normal">Time</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr
                key={o.id}
                className={`group cursor-pointer border-t border-border/60 ${
                  o.code === focusCode ? "bg-ice/5" : "hover:bg-surface/60"
                }`}
              >
                <td className="px-3 py-2.5">
                  <Link
                    href={`/console/orders?status=${tab}&focus=${o.code}`}
                    className="tabular block text-[12px] font-medium text-text"
                  >
                    #{o.code}
                  </Link>
                </td>
                <td className="px-3 py-2.5 text-[12px]">{o.outlet}</td>
                <td className="px-3 py-2.5 text-[12px] text-muted">{o.rep}</td>
                <td className="tabular px-3 py-2.5 text-right text-[12px]">{o.total}</td>
                <td className="px-3 py-2.5">
                  <span
                    className="inline-flex items-center gap-1.5 text-[11px]"
                    style={{ color: o.statusColor }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: o.statusColor }}
                    />
                    {o.statusLabel}
                  </span>
                </td>
                <td className="tabular px-3 py-2.5 text-right text-[11px] text-faint">
                  {o.time}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="px-4 py-6 text-center text-[12px] text-faint">
            No order matches &ldquo;{q}&rdquo;.
          </p>
        )}
      </div>
    </>
  );
}
