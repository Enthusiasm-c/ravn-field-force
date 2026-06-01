import { SurfaceSwitcher } from "@/components/surface-switcher";

export default function RepLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh">
      {/* stage */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, color-mix(in srgb, var(--ice) 14%, transparent), transparent)",
        }}
      />
      <div className="relative flex min-h-dvh items-start justify-center px-4 py-10 lg:items-center lg:py-16">
        {children}
      </div>
      <SurfaceSwitcher />
    </div>
  );
}
