import { ConsoleSidebar } from "@/components/console-sidebar";
import { SurfaceSwitcher } from "@/components/surface-switcher";

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh">
      <ConsoleSidebar />
      <main className="min-w-0 flex-1">{children}</main>
      <SurfaceSwitcher />
    </div>
  );
}
