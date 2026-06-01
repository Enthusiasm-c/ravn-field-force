"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardList, Store, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/console/dashboard" },
  { label: "Orders", icon: ClipboardList, href: "/console/orders" },
  { label: "Outlets", icon: Store, href: "/console/outlets" },
  { label: "Reps", icon: Users, href: "/console/reps" },
];

export function ConsoleSidebar() {
  const path = usePathname();
  return (
    <aside className="sticky top-0 flex h-dvh w-56 shrink-0 flex-col border-r border-border bg-bg-elevated px-3 py-5">
      <Link href="/" className="mb-8 flex items-center gap-2.5 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-strong bg-surface">
          <span className="serif text-base leading-none text-ice">R</span>
        </div>
        <div>
          <p className="text-[13px] font-semibold tracking-[0.18em]">RAVN</p>
          <p className="text-[10px] text-faint">PAN · Sales Ops</p>
        </div>
      </Link>

      <nav className="space-y-0.5">
        {NAV.map((n) => {
          const on = path === n.href || path.startsWith(n.href + "/");
          return (
            <Link
              key={n.label}
              href={n.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors",
                on
                  ? "bg-ice/10 text-ice"
                  : "text-muted hover:bg-surface hover:text-text"
              )}
            >
              <n.icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
              {n.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center gap-2 px-2 text-[10px] text-faint">
        <span className="live-dot" /> Live · synced 3s ago
      </div>
    </aside>
  );
}
