"use client";

import { useState } from "react";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "history", label: "History" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/** Subsections of the outlet record — Overview (who/where/status) and History. */
export function OutletTabs({
  overview,
  history,
}: {
  overview: React.ReactNode;
  history: React.ReactNode;
}) {
  const [tab, setTab] = useState<TabKey>("overview");
  return (
    <>
      <div className="mt-6 flex gap-1 border-b border-border">
        {TABS.map((t) => {
          const on = t.key === tab;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative px-4 py-2.5 text-[13px] transition-colors ${
                on ? "text-text" : "text-muted hover:text-text"
              }`}
            >
              {t.label}
              {on && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-ice" />
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-4">
        <div className={tab === "overview" ? "" : "hidden"}>{overview}</div>
        <div className={tab === "history" ? "" : "hidden"}>{history}</div>
      </div>
    </>
  );
}
