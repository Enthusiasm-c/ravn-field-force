import { PhoneFrame } from "@/components/phone-frame";

/** Instant skeleton shown the moment a rep screen is requested —
 *  the navigation feels immediate instead of freezing on the old page. */
export default function RepLoading() {
  return (
    <PhoneFrame>
      <div className="flex h-[100dvh] lg:h-[800px] flex-col animate-pulse">
        <header className="px-5 pb-2 pt-4">
          <div className="h-2.5 w-20 rounded bg-surface-2" />
          <div className="mt-3 h-7 w-40 rounded-lg bg-surface-2" />
        </header>
        <div className="space-y-3 px-4 pt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-surface/70 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-32 rounded bg-surface-2" />
                <div className="h-4 w-14 rounded bg-surface-2" />
              </div>
              <div className="mt-3 h-2.5 w-24 rounded bg-surface-2" />
            </div>
          ))}
        </div>
      </div>
    </PhoneFrame>
  );
}
