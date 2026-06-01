"use client";

import { useState, useTransition } from "react";
import { Check, Pencil, X, ArrowRight, Minus, Plus, MapPin } from "lucide-react";
import { formatIDR } from "@/lib/utils";
import { confirmOrder, rejectOrder, updateOrderLines } from "@/app/actions";
import { STATUS_META } from "@/lib/demo";
import type { OrderStatus } from "@prisma/client";

type Line = { id: string; name: string; sku: string; price: number; qty: number };
type Visit = {
  photos: { label: string; taken: boolean }[];
  notes: string;
  address: string;
  distanceKm: number;
};

export function OrderPanel({
  orderId,
  status,
  deliveryLabel,
  initialLines,
  visit,
}: {
  orderId: string;
  status: OrderStatus;
  deliveryLabel: string;
  initialLines: Line[];
  visit: Visit | null;
}) {
  const [editing, setEditing] = useState(false);
  const [lines, setLines] = useState<Line[]>(initialLines);
  const [draft, setDraft] = useState<Line[]>(initialLines);
  const [pending, startTransition] = useTransition();

  const shown = editing ? draft : lines;
  const total = shown.reduce((s, l) => s + l.price * l.qty, 0);
  const units = shown.reduce((s, l) => s + l.qty, 0);

  const setQty = (id: string, delta: number) =>
    setDraft((prev) =>
      prev.map((l) => (l.id === id ? { ...l, qty: Math.max(1, l.qty + delta) } : l))
    );

  const startEdit = () => {
    setDraft(lines);
    setEditing(true);
  };
  const cancel = () => setEditing(false);
  const save = () =>
    startTransition(async () => {
      await updateOrderLines(
        orderId,
        draft.map((l) => ({ id: l.id, qty: l.qty }))
      );
      setLines(draft);
      setEditing(false);
    });

  const run = (fn: (id: string) => Promise<void>) =>
    startTransition(() => fn(orderId));

  return (
    <>
      {/* line items */}
      <div className="mt-5 flex items-center justify-between">
        <p className="eyebrow">Line items ({shown.length})</p>
        {editing && <span className="text-[10px] text-ice">Editing quantities</span>}
      </div>
      <div className="mt-2 space-y-2">
        {shown.map((l) => (
          <div
            key={l.id}
            className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2"
          >
            <div>
              <p className="text-[12px] font-medium">{l.name}</p>
              <p className="eyebrow mt-0.5">{l.sku}</p>
            </div>
            {editing ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQty(l.id, -1)}
                  className="flex h-6 w-6 items-center justify-center rounded-md border border-border-strong text-muted"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="tabular w-12 text-center text-[12px]">{l.qty} btl</span>
                <button
                  onClick={() => setQty(l.id, +1)}
                  className="flex h-6 w-6 items-center justify-center rounded-md border border-border-strong text-muted"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="text-right">
                <p className="tabular text-[12px]">{formatIDR(l.price * l.qty)}</p>
                <p className="tabular text-[10px] text-faint">× {l.qty} btl</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* total */}
      <div className="mt-3 flex items-end justify-between border-t border-border pt-3">
        <p className="text-[11px] text-muted">
          {units} btl · delivery {deliveryLabel}
        </p>
        <p className="serif text-xl">
          <span className="text-[12px] text-muted">IDR </span>
          {formatIDR(total)}
        </p>
      </div>

      {/* visit context */}
      {visit && (
        <>
          <p className="eyebrow mt-6">Visit context</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {visit.photos.map((p, i) => (
              <div
                key={p.label}
                className="flex aspect-[4/3] items-end rounded-lg border border-border p-1.5 text-[9px] text-text/80"
                style={{
                  background: `linear-gradient(135deg, color-mix(in srgb, var(--ice) ${18 + i * 8}%, var(--surface)), var(--surface-2))`,
                }}
              >
                {p.label}
              </div>
            ))}
          </div>
          <p className="mt-3 rounded-lg border border-border bg-surface p-3 text-[12px] italic leading-relaxed text-text/85">
            &ldquo;{visit.notes}&rdquo;
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted">
            <MapPin className="h-3 w-3" />
            {visit.address} · {visit.distanceKm} km from rep
          </p>
        </>
      )}

      {/* actions */}
      {editing ? (
        <div className="mt-6 flex gap-2">
          <button
            onClick={save}
            disabled={pending}
            className="flex flex-[1.4] items-center justify-center gap-1.5 rounded-lg bg-ice py-2.5 text-[13px] font-semibold text-white disabled:opacity-60"
          >
            <Check className="h-4 w-4" /> {pending ? "Saving…" : "Save changes"}
          </button>
          <button
            onClick={cancel}
            disabled={pending}
            className="rounded-lg border border-border-strong px-4 text-[13px] text-muted"
          >
            Cancel
          </button>
        </div>
      ) : status === "NEW" ? (
        <div className="mt-6 flex gap-2">
          <button
            onClick={() => run(confirmOrder)}
            disabled={pending}
            className="flex flex-[1.4] items-center justify-center gap-1.5 rounded-lg bg-ok py-2.5 text-[13px] font-semibold text-white disabled:opacity-60"
          >
            <Check className="h-4 w-4" /> Confirm order
          </button>
          <button
            onClick={startEdit}
            disabled={pending}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-border-strong px-4 text-[13px] text-muted"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <button
            onClick={() => run(rejectOrder)}
            disabled={pending}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-danger/40 px-4 text-[13px] text-danger"
          >
            <X className="h-3.5 w-3.5" /> Reject
          </button>
        </div>
      ) : (
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-[12px]">
          <ArrowRight className="h-3.5 w-3.5 text-muted" />
          <span style={{ color: STATUS_META[status].color }}>
            {STATUS_META[status].label}
          </span>
          <span className="text-muted">
            {status === "CONFIRMED" && "· approved for fulfilment"}
            {status === "IN_DELIVERY" && "· handed to logistics"}
            {status === "REJECTED" && "· returned to rep"}
          </span>
        </div>
      )}
    </>
  );
}
