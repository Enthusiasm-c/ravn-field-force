/** Instant skeleton for console screens — replaces the frozen-page wait
 *  with an immediate placeholder while server data streams in. */
export default function ConsoleLoading() {
  return (
    <div className="flex min-h-dvh flex-col animate-pulse">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <div className="h-2.5 w-24 rounded bg-surface-2" />
          <div className="mt-3 h-6 w-48 rounded-lg bg-surface-2" />
        </div>
        <div className="h-8 w-28 rounded-lg bg-surface-2" />
      </div>
      <div className="grid grid-cols-2 gap-3 px-6 py-5 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface/70 p-4">
            <div className="h-2.5 w-16 rounded bg-surface-2" />
            <div className="mt-4 h-7 w-24 rounded-lg bg-surface-2" />
          </div>
        ))}
      </div>
      <div className="space-y-2 px-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-xl border border-border bg-surface/70 px-4 py-3.5"
          >
            <div className="h-4 w-40 rounded bg-surface-2" />
            <div className="h-4 w-20 rounded bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
