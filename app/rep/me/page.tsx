import Link from "next/link";
import { Bell, Globe, HelpCircle, LogOut, ChevronRight } from "lucide-react";
import { PhoneFrame } from "@/components/phone-frame";
import { RepNav } from "@/components/rep-nav";

export const revalidate = 300;

export default function RepMePage() {
  return (
    <PhoneFrame>
      <div className="flex h-[100dvh] lg:h-[800px] flex-col">
        <header className="px-5 pb-1 pt-4">
          <Link
            href="/"
            aria-label="Home"
            className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-strong bg-surface"
          >
            <span className="serif text-base leading-none text-ice">R</span>
          </Link>
          <p className="eyebrow">Profile</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Me</h1>
        </header>

        <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto px-4 pb-4 pt-2">
          {/* identity */}
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface/70 p-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ice/10 text-[16px] font-semibold text-ice">
              PW
            </div>
            <div>
              <p className="text-[16px] font-semibold">Putu Wirawan</p>
              <p className="mt-0.5 text-[12px] text-muted">Sales Rep · Route DPS-04</p>
              <p className="text-[11px] text-faint">Canggu · Seminyak</p>
            </div>
          </div>

          {/* today's route progress */}
          <div className="rounded-2xl border border-border bg-surface/70 p-4">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium">Today&rsquo;s route</p>
              <span className="text-[12px] text-ice">3 of 8 visits</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
              <div className="h-full rounded-full bg-ice" style={{ width: "37.5%" }} />
            </div>
            <p className="mt-2 text-[11px] text-faint">5 left · target 8 / day</p>
          </div>

          {/* settings — mockup */}
          <div className="overflow-hidden rounded-2xl border border-border bg-surface/70">
            <SettingRow icon={Bell} label="Notifications" value="On" />
            <SettingRow icon={Globe} label="Language" value="English" />
            <SettingRow icon={HelpCircle} label="Help & support" />
          </div>

          <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-danger/30 py-3 text-[14px] font-medium text-danger">
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>

        <RepNav active="me" />
      </div>
    </PhoneFrame>
  );
}

function SettingRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3 last:border-0">
      <Icon className="h-4 w-4 text-muted" />
      <span className="flex-1 text-[13px]">{label}</span>
      {value && <span className="text-[12px] text-faint">{value}</span>}
      <ChevronRight className="h-4 w-4 text-faint" />
    </div>
  );
}
