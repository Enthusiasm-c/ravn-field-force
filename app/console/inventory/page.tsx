import { Boxes } from "lucide-react";
import { ConsoleComingSoon } from "@/components/console-empty";

export const dynamic = "force-dynamic";

export default function InventoryPage() {
  return (
    <ConsoleComingSoon
      title="Inventory"
      subtitle="Stock levels synced from your ERP"
      icon={Boxes}
      note="Live SKU stock, low-stock alerts, and availability checks at order time — pulled straight from your accounting / ERP system once we wire the integration."
    />
  );
}
