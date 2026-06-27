"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const SURFACES = [
  { href: "/rep/outlets", label: "Rep", sub: "Mobile" },
  { href: "/console/dashboard", label: "Manager", sub: "Overview" },
];

/** Floating demo control — jump between the viewpoints. */
export function SurfaceSwitcher({
  placement = "center",
}: {
  placement?: "center" | "corner";
}) {
  const path = usePathname();
  const pos =
    placement === "corner"
      ? "bottom-4 right-4"
      : "bottom-4 right-4 lg:left-1/2 lg:right-auto lg:-translate-x-1/2";
  return (
    <div className={`fixed z-50 ${pos}`}>
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
            (s.href.startsWith("/console") && path.startsWith("/console")) ||
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
