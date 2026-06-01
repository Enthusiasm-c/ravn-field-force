import { FileBarChart } from "lucide-react";
import { ConsoleComingSoon } from "@/components/console-empty";

export const dynamic = "force-dynamic";

export default function ReportsPage() {
  return (
    <ConsoleComingSoon
      title="Reports"
      subtitle="Scheduled CSV and BI exports"
      icon={FileBarChart}
      note="Coverage, revenue, and rep-performance reports — scheduled to your inbox or pulled live via API. The Export CSV on the dashboard is the first piece."
    />
  );
}
