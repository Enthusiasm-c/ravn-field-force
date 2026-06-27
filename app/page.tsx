import Link from "next/link";
import { Smartphone, ClipboardList, ArrowRight } from "lucide-react";

const ROLES = [
  {
    href: "/rep/outlets",
    title: "Sales Rep",
    sub: "Mobile · field",
    icon: Smartphone,
  },
  {
    href: "/console/dashboard",
    title: "Sales Manager",
    sub: "Web · console",
    icon: ClipboardList,
  },
];

export default function Home() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-6">
      {/* ambient glow */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full opacity-[0.12] blur-[120px]"
        style={{ background: "radial-gradient(closest-side, var(--ice), transparent)" }}
      />

      <div className="relative w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border-strong bg-surface">
            <span className="serif text-2xl leading-none text-ice">R</span>
          </div>
          <p className="mt-4 text-sm font-semibold tracking-[0.25em]">RAVN</p>
          <p className="eyebrow mt-1">Field Force · choose a role</p>
        </div>

        <div className="space-y-3">
          {ROLES.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="group flex items-center gap-4 rounded-2xl border border-border bg-surface/70 p-5 transition-all hover:border-border-strong hover:bg-surface"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ice/10 text-ice">
                <r.icon className="h-5 w-5" strokeWidth={1.6} />
              </div>
              <div className="flex-1">
                <p className="text-[16px] font-semibold">{r.title}</p>
                <p className="text-[12px] text-muted">{r.sub}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-faint transition-colors group-hover:text-ice" />
            </Link>
          ))}
        </div>

        <p className="mt-8 text-center text-[11px] text-faint">
          PAN × Lentera Lab · interactive demo
        </p>
      </div>
    </main>
  );
}
