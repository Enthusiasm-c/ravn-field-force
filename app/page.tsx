import Link from "next/link";
import { ArrowUpRight, Smartphone, ClipboardList } from "lucide-react";

const SURFACES = [
  {
    href: "/rep/outlets",
    eyebrow: "Mobile · iOS",
    title: "Sales Rep",
    desc: "The route, in their pocket. Check in, capture the visit, send the order from the barstool.",
    icon: Smartphone,
    screens: "3 screens",
  },
  {
    href: "/console/dashboard",
    eyebrow: "Web · Console",
    title: "Sales Manager",
    desc: "Overview, order desk, and territory — track the field and run the queue.",
    icon: ClipboardList,
    screens: "Overview + desk",
  },
];

export default function Home() {
  return (
    <main className="relative min-h-dvh overflow-hidden">
      {/* ambient glow */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full opacity-[0.12] blur-[120px]"
        style={{ background: "radial-gradient(closest-side, var(--ice), transparent)" }}
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[500px] opacity-[0.08] blur-[120px]"
        style={{ background: "radial-gradient(closest-side, var(--glow), transparent)" }}
      />

      <div className="relative mx-auto flex min-h-dvh max-w-6xl flex-col px-6 py-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-strong bg-surface">
              <span className="serif text-lg leading-none text-ice">R</span>
            </div>
            <span className="text-sm font-semibold tracking-[0.2em]">RAVN</span>
          </div>
          <span className="eyebrow">PAN × Lentera Lab · Field Force · v0.7</span>
        </header>

        <div className="flex flex-1 flex-col justify-center py-16">
          <p className="eyebrow mb-5">Interactive demo</p>
          <h1 className="serif max-w-3xl text-5xl leading-[1.05] tracking-tight md:text-6xl">
            One connected flow,
            <br />
            from visit to shipment.
          </h1>
          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-muted">
            Mobile app for reps in the field. Office web for the team behind them.
            Visits, orders, and data in one place — choose a viewpoint to walk the loop.
          </p>

          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {SURFACES.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="group relative flex flex-col rounded-2xl border border-border bg-surface/60 p-5 transition-all hover:border-border-strong hover:bg-surface"
              >
                <div className="flex items-start justify-between">
                  <s.icon className="h-5 w-5 text-ice" strokeWidth={1.5} />
                  <ArrowUpRight className="h-4 w-4 text-faint transition-colors group-hover:text-text" />
                </div>
                <p className="eyebrow mt-5">{s.eyebrow}</p>
                <h2 className="mt-1.5 text-lg font-semibold">{s.title}</h2>
                <p className="mt-2 flex-1 text-[13px] leading-relaxed text-muted">
                  {s.desc}
                </p>
                <p className="mt-4 text-[11px] text-faint">{s.screens}</p>
              </Link>
            ))}
          </div>
        </div>

        <footer className="flex items-center justify-between text-[11px] text-faint">
          <span>Demo data · Bali territory · 18 Apr 2026</span>
          <span>Lentera Lab · Jakarta</span>
        </footer>
      </div>
    </main>
  );
}
