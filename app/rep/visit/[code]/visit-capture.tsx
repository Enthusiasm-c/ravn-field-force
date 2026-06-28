"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  X,
  MapPin,
  Camera,
  Plus,
  Minus,
  User,
  ArrowRight,
  Search,
  Check,
  Lock,
} from "lucide-react";
import { PhoneFrame } from "@/components/phone-frame";
import { VISIT_OBJECTIVES, photoSrc } from "@/lib/demo";
import { formatIDR } from "@/lib/utils";

type Photo = { label: string; taken: boolean };
type Item = {
  id: string;
  name: string;
  sku: string;
  category: string;
  listPrice: number;
  lastPrice: number | null;
  allowed: boolean;
};
type Line = {
  id: string;
  name: string;
  sku: string;
  price: number;
  listPrice: number;
  isRemembered: boolean;
  qty: number;
};

export function VisitCapture(props: {
  code: string;
  outletName: string;
  outletArea: string;
  checkIn: string;
  gpsDriftM: number;
  photos: Photo[];
  notes: string;
  objective: string;
  pic: string;
  backHref: string;
  catalog: Item[];
  repCategories: string[];
  orderCode: string;
}) {
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>(props.photos);
  const [objective, setObjective] = useState(props.objective);
  const [pic, setPic] = useState(props.pic);
  const [remarks, setRemarks] = useState(props.notes);
  const [lines, setLines] = useState<Line[]>([]);
  const [orderOpen, setOrderOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sent, setSent] = useState(false);
  const [sentCode, setSentCode] = useState("");
  const taken = photos.filter((p) => p.taken).length;

  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const units = lines.reduce((s, l) => s + l.qty, 0);
  const hasOrder = units > 0;

  const added = new Set(lines.map((l) => l.id));
  const q = query.trim().toLowerCase();
  const results = q
    ? props.catalog
        .filter(
          (i) =>
            !added.has(i.id) &&
            (i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q))
        )
        .slice(0, 6)
    : [];

  const addLine = (i: Item) => {
    if (!i.allowed) return; // outside the rep's assigned lines
    setLines((prev) =>
      prev.some((l) => l.id === i.id)
        ? prev
        : [
            ...prev,
            {
              id: i.id,
              name: i.name,
              sku: i.sku,
              price: i.lastPrice ?? i.listPrice,
              listPrice: i.listPrice,
              isRemembered: i.lastPrice != null,
              qty: 1,
            },
          ]
    );
    setQuery("");
  };
  const removeLine = (id: string) =>
    setLines((prev) => prev.filter((l) => l.id !== id));
  const setQty = (id: string, delta: number) =>
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, qty: Math.max(1, l.qty + delta) } : l))
    );

  const finish = () => {
    setSentCode(`ORD-${4423 + ((units * 3 + lines.length + props.code.length) % 77)}`);
    setSent(true);
  };

  // ── Confirmation — stays inside the phone, no role hop ──
  if (sent) {
    return (
      <PhoneFrame>
        <div className="flex min-h-[100dvh] lg:min-h-[800px] flex-col items-center justify-center px-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ok/15 text-ok">
            <Check className="h-8 w-8" strokeWidth={2.2} />
          </div>
          <h1 className="serif mt-5 text-2xl">
            {hasOrder ? "Order sent" : "Visit logged"}
          </h1>
          {hasOrder ? (
            <p className="mt-2 text-[13px] text-muted">
              {sentCode} · {units} btl · IDR {formatIDR(total)} — sent to the office
            </p>
          ) : (
            <p className="mt-2 text-[13px] text-muted">
              Saved to today&rsquo;s route — no order this visit
            </p>
          )}
          <p className="mt-1 text-[12px] text-faint">{props.outletName}</p>
          <button
            onClick={() => router.push("/rep/outlets")}
            className="mt-8 rounded-xl bg-ice px-6 py-3 text-[14px] font-semibold text-white"
          >
            Back to route
          </button>
        </div>
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame>
      <div className="flex min-h-[100dvh] lg:min-h-[800px] flex-col">
        {/* header */}
        <header className="flex items-center justify-between px-4 pb-3 pt-3">
          <Link
            href={props.backHref}
            className="flex items-center gap-1 text-[13px] text-muted"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Link>
          <span className="eyebrow">{props.code}</span>
          <Link href="/rep/outlets" className="text-muted">
            <X className="h-5 w-5" />
          </Link>
        </header>

        <div className="flex-1 space-y-4 px-4 pb-4">
          {/* outlet + check-in */}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{props.outletName}</h1>
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-ok/25 bg-ok/5 px-3 py-2.5">
              <span className="live-dot" />
              <div className="flex-1">
                <p className="text-[13px] font-medium text-ok">
                  Checked in · GPS confirmed
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
                  <MapPin className="h-3 w-3" />
                  {props.checkIn} · ±{props.gpsDriftM}m · {props.outletArea}
                </p>
              </div>
            </div>
          </div>

          {/* objective */}
          <Section title="Objective" value={objective ? "Set" : "Pick one"}>
            <div className="flex flex-wrap gap-1.5">
              {VISIT_OBJECTIVES.map((o) => {
                const on = o === objective;
                return (
                  <button
                    key={o}
                    onClick={() => setObjective(o)}
                    className={`rounded-full border px-3 py-1.5 text-[12px] transition-colors ${
                      on
                        ? "border-ice/40 bg-ice/10 font-medium text-ice"
                        : "border-border bg-surface text-muted"
                    }`}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* person in charge */}
          <Section title="Person in Charge" value="PIC">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface/70 px-3.5 py-2.5">
              <User className="h-4 w-4 text-faint" />
              <input
                value={pic}
                onChange={(e) => setPic(e.target.value)}
                placeholder="Who did you meet?"
                className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-faint"
              />
            </div>
          </Section>

          {/* photos */}
          <Section title="Add Photos" value={`${taken} / 5`}>
            <div className="grid grid-cols-4 gap-2">
              {photos.map((p, i) => (
                <button
                  key={p.label}
                  onClick={() =>
                    setPhotos((prev) =>
                      prev.map((x, j) => (j === i ? { ...x, taken: !x.taken } : x))
                    )
                  }
                  className="relative aspect-square overflow-hidden rounded-xl border border-border bg-surface"
                >
                  {p.taken ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photoSrc(p.label)}
                        alt={p.label}
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                      />
                      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-1.5 pb-1 pt-3 text-[9px] font-medium text-white">
                        {p.label}
                      </span>
                    </>
                  ) : (
                    <Camera className="absolute inset-0 m-auto h-4 w-4 text-faint" />
                  )}
                </button>
              ))}
              {photos.length < 5 &&
                Array.from({ length: 5 - photos.length }).map((_, i) => (
                  <div
                    key={i}
                    className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-border-strong"
                  >
                    <Plus className="h-4 w-4 text-faint" />
                  </div>
                ))}
            </div>
          </Section>

          {/* remarks — editable */}
          <Section title="Remarks" value="">
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              placeholder="Notes from the visit…"
              className="w-full resize-none rounded-xl border border-border bg-surface/70 p-3.5 text-[13px] leading-relaxed text-text/90 outline-none placeholder:text-faint"
            />
          </Section>

          {/* order — optional add-on, built by searching the SKU catalog */}
          <Section title="Order" value={hasOrder ? `${units} btl` : "Optional"}>
            {!orderOpen && !hasOrder ? (
              <button
                onClick={() => setOrderOpen(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border-strong py-3 text-[13px] text-muted"
              >
                <Plus className="h-4 w-4" /> Add order to this visit
              </button>
            ) : (
              <div className="space-y-2">
                {/* assigned-lines scope — why some SKUs are locked */}
                <p className="rounded-lg bg-surface-2/50 px-3 py-2 text-[11px] leading-relaxed text-muted">
                  Your lines:{" "}
                  <span className="font-medium text-text">
                    {props.repCategories.join(" · ") || "All"}
                  </span>
                  . Other brands are handled by another rep.
                </p>

                {/* SKU search */}
                <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5">
                  <Search className="h-4 w-4 text-faint" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search SKU or brand…"
                    className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-faint"
                  />
                </div>

                {/* search results — tap to add, price pulled from memory */}
                {q && (
                  <div className="overflow-hidden rounded-xl border border-border bg-surface">
                    {results.length === 0 ? (
                      <p className="px-3 py-2.5 text-[12px] text-faint">
                        No SKU matches &ldquo;{query}&rdquo;
                      </p>
                    ) : (
                      results.map((i) =>
                        i.allowed ? (
                          <button
                            key={i.id}
                            onClick={() => addLine(i)}
                            className="flex w-full items-center justify-between border-b border-border/60 px-3 py-2.5 text-left last:border-0"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="truncate text-[13px] font-medium">{i.name}</p>
                              <p className="eyebrow">{i.sku}</p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="tabular text-[12px]">
                                IDR {formatIDR(i.lastPrice ?? i.listPrice)}
                              </p>
                              <p
                                className={`text-[10px] ${
                                  i.lastPrice != null ? "text-ice" : "text-faint"
                                }`}
                              >
                                {i.lastPrice != null ? "Last agreed" : "List price"}
                              </p>
                            </div>
                          </button>
                        ) : (
                          <div
                            key={i.id}
                            className="flex w-full items-center justify-between border-b border-border/60 px-3 py-2.5 last:border-0 opacity-60"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="truncate text-[13px] font-medium text-muted">
                                {i.name}
                              </p>
                              <p className="eyebrow">
                                {i.sku} · {i.category}
                              </p>
                            </div>
                            <span className="flex shrink-0 items-center gap-1 text-[10px] text-faint">
                              <Lock className="h-3 w-3" /> Not in your line
                            </span>
                          </div>
                        )
                      )
                    )}
                  </div>
                )}

                {/* added lines */}
                {lines.map((l) => (
                  <div
                    key={l.id}
                    className="rounded-xl border border-border bg-surface/70 p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 pr-2">
                        <p className="text-[13px] font-medium">{l.name}</p>
                        <p className="eyebrow mt-0.5">
                          {l.sku} · IDR {formatIDR(l.price)}/btl
                        </p>
                        <span
                          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            l.isRemembered
                              ? "bg-ice/10 text-ice"
                              : "bg-surface-2 text-faint"
                          }`}
                        >
                          {l.isRemembered ? "Last agreed price" : "List price"}
                        </span>
                      </div>
                      <button
                        onClick={() => removeLine(l.id)}
                        className="shrink-0 text-faint"
                        aria-label="Remove"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="tabular text-[13px] font-medium">
                        {formatIDR(l.price * l.qty)}
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setQty(l.id, -1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border-strong text-muted"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="tabular w-12 text-center text-[13px]">
                          {l.qty} btl
                        </span>
                        <button
                          onClick={() => setQty(l.id, +1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border-strong text-muted"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {lines.length === 0 && !q && (
                  <p className="px-1 py-1 text-[12px] text-faint">
                    Search a product above to add it to the order.
                  </p>
                )}
              </div>
            )}
          </Section>
        </div>

        {/* footer — one action, with or without order */}
        <div className="sticky bottom-0 border-t border-border bg-bg/90 px-4 pb-7 pt-3 backdrop-blur">
          {hasOrder && (
            <div className="mb-2.5 flex items-end justify-between">
              <p className="text-[11px] text-muted">
                {units} bottles · {lines.length} SKUs
              </p>
              <p className="serif text-xl">
                <span className="text-[12px] text-muted">IDR </span>
                {formatIDR(total)}
              </p>
            </div>
          )}
          <button
            onClick={finish}
            className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-3.5 text-[15px] font-semibold ${
              hasOrder ? "bg-ice text-white" : "border border-border-strong text-muted"
            }`}
          >
            {hasOrder ? (
              <>
                Send order <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              "Finish visit · no order"
            )}
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}

function Section({
  title,
  value,
  children,
}: {
  title: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[13px] font-medium">{title}</p>
        {value && <span className="eyebrow">{value}</span>}
      </div>
      {children}
    </div>
  );
}
