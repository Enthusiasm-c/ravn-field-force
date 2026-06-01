"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const SURFACES = [
  { href: "/rep/outlets", label: "Rep", sub: "Mobile" },
  { href: "/console/orders", label: "Manager", sub: "Order desk" },
  { href: "/console/dashboard", label: "Director", sub: "Dashboard" },
];

/** Floating demo control — jump between the three viewpoints. */
export function SurfaceSwitcher() {
  const path = usePathname();
  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
      <div className="glass flex items-center gap-1 rounded-full border border-border-strong p-1 shadow-2xl">
        <Link
          href="/"
          className="px-3 py-1.5 text-[11px] font-medium tracking-wide text-muted hover:text-text"
        >
          RAVN
        </Link>
        <span className="h-4 w-px bg-border-strong" />
        {SURFACES.map((s) => {
          const active =
            (s.href.startsWith("/rep") && path.startsWith("/rep")) ||
            path === s.href;
          return (
            <Link
              key={s.href}
              href={s.href}
              className={cn(
                "rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors",
                active
                  ? "bg-ice/15 text-ice"
                  : "text-muted hover:text-text"
              )}
            >
              {s.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
