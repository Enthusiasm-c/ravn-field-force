"use client";

import { useState } from "react";
import { Pencil, Trash2, UserPlus, MapPin, Tag } from "lucide-react";

type Rep = {
  id: string;
  name: string;
  area: string;
  initials: string;
  email: string;
  areas: string[];
  categories: string[];
};

export function RepAccessList({ reps }: { reps: Rep[] }) {
  // Access state per rep — a mockup toggle (not persisted in this prototype).
  const [active, setActive] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(reps.map((r) => [r.id, true]))
  );
  const toggle = (id: string) =>
    setActive((prev) => ({ ...prev, [id]: !prev[id] }));

  const activeCount = Object.values(active).filter(Boolean).length;

  return (
    <div className="max-w-3xl">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[12px] text-muted">
          {reps.length} reps · {activeCount} with access
        </p>
        <button className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-[12px] text-muted">
          <UserPlus className="h-3.5 w-3.5" /> Add rep
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        {reps.map((r) => {
          const on = active[r.id];
          return (
            <div
              key={r.id}
              className="flex items-center gap-4 border-b border-border/60 px-4 py-3 last:border-0"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[12px] font-semibold">
                {r.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium">{r.name}</p>
                <p className="truncate text-[11px] text-faint">{r.email}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1 text-[10px]">
                  <MapPin className="h-3 w-3 shrink-0 text-faint" />
                  {r.areas.map((a) => (
                    <span
                      key={a}
                      className="rounded-full bg-surface-2 px-2 py-0.5 text-muted"
                    >
                      {a}
                    </span>
                  ))}
                  <Tag className="ml-1 h-3 w-3 shrink-0 text-faint" />
                  {r.categories.map((c) => (
                    <span
                      key={c}
                      className="rounded-full bg-ice/10 px-2 py-0.5 text-ice"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* access toggle */}
              <span
                className={`hidden text-[11px] sm:block ${
                  on ? "text-ok" : "text-faint"
                }`}
              >
                {on ? "Active" : "No access"}
              </span>
              <button
                onClick={() => toggle(r.id)}
                aria-label={on ? "Revoke access" : "Grant access"}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  on ? "bg-ok" : "bg-surface-2"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                    on ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  aria-label="Edit"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted hover:text-text"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  aria-label="Remove"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-faint hover:text-danger"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
