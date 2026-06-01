import { cn } from "@/lib/utils";

/** iOS-ish device frame — 390×844, the canvas the rep screens are designed for. */
export function PhoneFrame({
  children,
  statusTime = "14:32",
  className,
}: {
  children: React.ReactNode;
  statusTime?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative h-[844px] w-[390px] shrink-0 overflow-hidden rounded-[44px] border border-border-strong bg-bg shadow-[0_30px_90px_-28px_rgba(20,30,55,0.30)]",
        className
      )}
      style={{ outline: "8px solid #1a1d23", outlineOffset: "-1px" }}
    >
      {/* status bar */}
      <div className="absolute inset-x-0 top-0 z-30 flex h-11 items-center justify-between px-7 pt-1 text-[13px] font-semibold text-text">
        <span className="tabular">{statusTime}</span>
        <div className="pointer-events-none absolute left-1/2 top-2 h-6 w-28 -translate-x-1/2 rounded-full bg-black" />
        <div className="flex items-center gap-1.5">
          <span className="text-[10px]">5G</span>
          <span className="inline-block h-2.5 w-5 rounded-[3px] border border-text/60">
            <span className="block h-full w-3/4 rounded-[2px] bg-text" />
          </span>
        </div>
      </div>
      <div className="h-full overflow-y-auto pt-11">{children}</div>
      {/* home indicator */}
      <div className="pointer-events-none absolute inset-x-0 bottom-2 z-30 flex justify-center">
        <div className="h-1 w-32 rounded-full bg-text/40" />
      </div>
    </div>
  );
}
