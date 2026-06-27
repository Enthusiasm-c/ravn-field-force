"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, X, Minus, Plus, ArrowRight, Link2, History } from "lucide-react";
import { PhoneFrame } from "@/components/phone-frame";
import { formatIDR } from "@/lib/utils";

type Line = {
  id: string;
  name: string;
  sku: string;
  price: number;
  listPrice: number;
  isRemembered: boolean;
  qty: number;
};

export function PoBuilder(props: {
  orderCode: string;
  visitCode: string;
  outletName: string;
  outletArea: string;
  checkIn: string;
  initialLines: Line[];
}) {
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>(props.initialLines);
  const [sent, setSent] = useState(false);

  const setQty = (id: string, delta: number) =>
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, qty: Math.max(1, l.qty + delta) } : l))
    );

  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const units = lines.reduce((s, l) => s + l.qty, 0);

  const send = () => {
    setSent(true);
    setTimeout(() => router.push(`/console/orders?focus=${props.orderCode}`), 900);
  };

  return (
    <PhoneFrame statusTime="14:47">
      <div className="flex min-h-[800px] flex-col">
        <header className="flex items-center justify-between px-4 pb-2 pt-3">
          <Link
            href={`/rep/visit/${props.visitCode}`}
            className="flex items-center gap-1 text-[13px] text-muted"
          >
            <ChevronLeft className="h-4 w-4" />
            New Order
          </Link>
          <Link href="/rep/outlets" className="text-muted">
            <X className="h-5 w-5" />
          </Link>
        </header>

        <div className="px-4">
          <h1 className="text-2xl font-semibold tracking-tight">{props.outletName}</h1>
          <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-ice">
            <Link2 className="h-3 w-3" />
            Tied to visit #{props.visitCode} · {props.outletArea} · {props.checkIn}
          </p>
        </div>

        {/* lines */}
        <div className="mt-4 flex-1 space-y-2 px-4">
          {lines.map((l) => (
            <div key={l.id} className="rounded-2xl border border-border bg-surface/70 p-3.5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[14px] font-semibold">{l.name}</p>
                  <p className="eyebrow mt-1">
                    {l.sku} · IDR {formatIDR(l.price)}/btl
                  </p>
                  {l.isRemembered ? (
                    <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-ice/10 px-2 py-0.5 text-[10px] font-medium text-ice">
                      <History className="h-2.5 w-2.5" />
                      Last agreed price
                      {l.listPrice !== l.price && (
                        <span className="text-ice/60">
                          · list {formatIDR(l.listPrice)}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="mt-1.5 inline-block text-[10px] text-faint">
                      List price · first order
                    </span>
                  )}
                </div>
                <span className="tabular text-[14px] font-medium text-text">
                  {formatIDR(l.price * l.qty)}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-end gap-3">
                <button
                  onClick={() => setQty(l.id, -1)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-border-strong text-muted"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="tabular w-14 text-center text-[14px]">{l.qty} btl</span>
                <button
                  onClick={() => setQty(l.id, +1)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-border-strong text-muted"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          <button className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-border-strong py-3 text-[12px] text-muted">
            <Plus className="h-3.5 w-3.5" /> Add product
          </button>
        </div>

        {/* total — Fraunces holds the total, mono holds the parts */}
        <div className="border-t border-border px-4 pt-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="eyebrow">Total</p>
              <p className="mt-1 text-[11px] text-muted">
                {units} bottles · {lines.length} SKUs
              </p>
            </div>
            <p className="serif text-3xl tracking-tight text-text">
              <span className="text-[15px] text-muted">IDR </span>
              {formatIDR(total)}
            </p>
          </div>
          <p className="mt-2 text-[11px] text-muted">Delivery · Tomorrow · Sat 19 Apr</p>
        </div>

        <div className="sticky bottom-0 px-4 pb-7 pt-3">
          <button
            onClick={send}
            disabled={sent}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-ice py-3.5 text-[15px] font-semibold text-white transition-opacity disabled:opacity-70"
          >
            {sent ? "Sent to office ✓" : (
              <>
                Send Order <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}
