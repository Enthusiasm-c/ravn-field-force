import { ConsoleSidebar } from "@/components/console-sidebar";

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <ConsoleSidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
