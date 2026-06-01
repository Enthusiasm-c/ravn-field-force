import { compactIDR } from "@/lib/utils";

/** Minimal monthly bar chart — the tendency at a glance. */
export function SalesTrend({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex h-[180px] items-end gap-2">
      {data.map((d, i) => {
        const last = i === data.length - 1;
        const h = Math.max(4, Math.round((d.value / max) * 140));
        return (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
            <span
              className={`tabular text-[10px] ${last ? "text-ice" : "text-faint"}`}
            >
              {compactIDR(d.value)}
            </span>
            <div
              className="w-full rounded-t-md transition-all"
              style={{
                height: h,
                background: last
                  ? "var(--ice)"
                  : "color-mix(in srgb, var(--ice) 28%, var(--surface-2))",
              }}
            />
            <span className="text-[10px] text-muted">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
