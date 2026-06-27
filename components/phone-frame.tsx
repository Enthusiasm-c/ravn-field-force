import { cn } from "@/lib/utils";

/** Mobile (<lg): a plain full-screen surface — no device chrome — so it behaves
 *  like a real installed app and the nav bar pins to the real bottom edge.
 *  Desktop (≥lg): the 390×844 iOS-ish device mockup (the canvas reps are designed for). */
export function PhoneFrame({
  children,
  statusTime = "14:52",
  className,
}: {
  children: React.ReactNode;
  statusTime?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex h-[100dvh] w-full flex-col overflow-hidden bg-bg",
        "lg:block lg:h-[844px] lg:w-[390px] lg:shrink-0 lg:rounded-[44px] lg:border lg:border-border-strong lg:shadow-[0_30px_90px_-28px_rgba(20,30,55,0.30)]",
        "lg:[outline:8px_solid_#1a1d23] lg:[outline-offset:-1px]",
        className
      )}
    >
      {/* status bar — desktop mockup only (mobile shows the real OS status bar) */}
      <div className="absolute inset-x-0 top-0 z-30 hidden h-11 items-center justify-between px-7 pt-1 text-[13px] font-semibold text-text lg:flex">
        <span className="tabular">{statusTime}</span>
        <div className="pointer-events-none absolute left-1/2 top-2 h-6 w-28 -translate-x-1/2 rounded-full bg-black" />
        <div className="flex items-center gap-1.5">
          <span className="text-[10px]">5G</span>
          <span className="inline-block h-2.5 w-5 rounded-[3px] border border-text/60">
            <span className="block h-full w-3/4 rounded-[2px] bg-text" />
          </span>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto lg:h-full lg:flex-none lg:pt-11">
        {children}
      </div>
      {/* home indicator — desktop mockup only */}
      <div className="pointer-events-none absolute inset-x-0 bottom-2 z-30 hidden justify-center lg:flex">
        <div className="h-1 w-32 rounded-full bg-text/40" />
      </div>
    </div>
  );
}
