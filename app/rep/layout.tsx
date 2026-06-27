import { PhoneStage } from "@/components/phone-stage";

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
      <div className="relative flex min-h-dvh justify-center lg:items-center">
        <PhoneStage>{children}</PhoneStage>
      </div>
    </div>
  );
}
