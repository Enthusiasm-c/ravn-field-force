import Link from "next/link";
import { MapPin, ReceiptText, User, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "outlets", label: "Outlets", icon: MapPin, href: "/rep/outlets" },
  { key: "orders", label: "Orders", icon: ReceiptText, href: "/rep/outlets" },
  { key: "me", label: "Me", icon: User, href: "/rep/me" },
];

export function RepNav({
  active,
  newVisitHref = "/rep/check-in",
}: {
  active: "outlets" | "orders" | "me";
  newVisitHref?: string;
}) {
  return (
    <nav className="sticky bottom-0 z-20 border-t border-border bg-bg/90 backdrop-blur">
      <div className="relative flex items-center justify-around px-6 pb-6 pt-3">
        {/* center FAB — start a new visit (nearest outlet) */}
        <Link
          href={newVisitHref}
          aria-label="New visit"
          className="absolute -top-5 left-1/2 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full bg-ice text-white shadow-[0_8px_24px_-6px_var(--ice)] transition-transform active:scale-95"
        >
          <Plus className="h-6 w-6" strokeWidth={2.4} />
        </Link>
        {TABS.map((t, i) => {
          const on = t.key === active;
          return (
            <Link
              key={t.key}
              href={t.href}
              className={cn(
                "flex flex-col items-center gap-1 text-[10px]",
                i === 1 && "invisible", // make room for the FAB
                on ? "text-ice" : "text-faint"
              )}
            >
              <t.icon className="h-5 w-5" strokeWidth={1.8} />
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
