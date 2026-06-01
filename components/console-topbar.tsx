export function ConsoleTopbar({
  title,
  subtitle,
  initials,
  name,
  role,
}: {
  title: string;
  subtitle: string;
  initials: string;
  name: string;
  role: string;
}) {
  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-3.5">
      <div>
        <h1 className="text-[15px] font-semibold">{title}</h1>
        <p className="text-[11px] text-faint">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 text-[11px] text-muted">
          <span className="live-dot" /> Live
        </span>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-[11px] font-semibold">
            {initials}
          </div>
          <div className="text-right">
            <p className="text-[12px] font-medium">{name}</p>
            <p className="text-[10px] text-faint">{role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
