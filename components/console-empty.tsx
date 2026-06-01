import { ConsoleTopbar } from "@/components/console-topbar";

export function ConsoleComingSoon({
  title,
  subtitle,
  note,
  icon: Icon,
}: {
  title: string;
  subtitle: string;
  note: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <ConsoleTopbar
        title={title}
        subtitle={subtitle}
        initials="SW"
        name="Siti Wulandari"
        role="Sales Manager · Bali"
      />
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="max-w-sm rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-surface-2">
            <Icon className="h-5 w-5 text-muted" strokeWidth={1.5} />
          </div>
          <p className="mt-4 text-[15px] font-semibold">{title}</p>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">{note}</p>
          <span className="mt-4 inline-block rounded-full border border-ice/30 bg-ice/8 px-3 py-1 text-[11px] text-ice">
            Lands in the pilot
          </span>
        </div>
      </div>
    </div>
  );
}
