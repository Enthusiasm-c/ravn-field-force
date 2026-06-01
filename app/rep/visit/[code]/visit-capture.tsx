"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  X,
  MapPin,
  Camera,
  Plus,
  Check,
  ArrowRight,
} from "lucide-react";
import { PhoneFrame } from "@/components/phone-frame";

type Photo = { label: string; taken: boolean };
type Comp = { brand: string; present: boolean };

export function VisitCapture(props: {
  code: string;
  outletName: string;
  outletArea: string;
  checkIn: string;
  gpsDriftM: number;
  photos: Photo[];
  competitors: Comp[];
  notes: string;
}) {
  const [photos, setPhotos] = useState<Photo[]>(props.photos);
  const [comps, setComps] = useState<Comp[]>(props.competitors);

  const taken = photos.filter((p) => p.taken).length;
  const audited = comps.length;

  return (
    <PhoneFrame statusTime="14:32">
      <div className="flex min-h-[calc(844px-44px)] flex-col">
        {/* header */}
        <header className="flex items-center justify-between px-4 pb-3 pt-3">
          <Link href="/rep/outlets" className="flex items-center gap-1 text-[13px] text-muted">
            <ChevronLeft className="h-4 w-4" />
            Visit
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
                <p className="text-[13px] font-medium text-ok">Checked in · GPS confirmed</p>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
                  <MapPin className="h-3 w-3" />
                  {props.checkIn} · ±{props.gpsDriftM}m · {props.outletArea}
                </p>
              </div>
            </div>
          </div>

          {/* photos */}
          <Section title="Photos" value={`${taken} / 5`}>
            <div className="grid grid-cols-4 gap-2">
              {photos.map((p, i) => (
                <button
                  key={p.label}
                  onClick={() =>
                    setPhotos((prev) =>
                      prev.map((x, j) => (j === i ? { ...x, taken: !x.taken } : x))
                    )
                  }
                  className="relative aspect-square overflow-hidden rounded-xl border border-border"
                  style={{
                    background: p.taken
                      ? `linear-gradient(135deg, color-mix(in srgb, var(--ice) ${20 + i * 8}%, var(--surface)), var(--surface-2))`
                      : "var(--surface)",
                  }}
                >
                  {p.taken ? (
                    <span className="absolute bottom-1 left-1.5 text-[9px] font-medium text-text/90">
                      {p.label}
                    </span>
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

          {/* competitors */}
          <Section title="Competitor brands" value={`${audited} / 4`}>
            <div className="space-y-1.5">
              {comps.map((c, i) => (
                <button
                  key={c.brand}
                  onClick={() =>
                    setComps((prev) =>
                      prev.map((x, j) => (j === i ? { ...x, present: !x.present } : x))
                    )
                  }
                  className="flex w-full items-center justify-between rounded-xl border border-border bg-surface/70 px-3.5 py-2.5"
                >
                  <span className="text-[14px] font-medium">{c.brand}</span>
                  <span
                    className={`flex items-center gap-1 text-[12px] ${
                      c.present ? "text-ok" : "text-danger"
                    }`}
                  >
                    {c.present ? (
                      <>
                        Present <Check className="h-3.5 w-3.5" />
                      </>
                    ) : (
                      <>
                        Absent <X className="h-3.5 w-3.5" />
                      </>
                    )}
                  </span>
                </button>
              ))}
              <button className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-border-strong py-2.5 text-[12px] text-muted">
                <Plus className="h-3.5 w-3.5" /> Add brand
              </button>
            </div>
          </Section>

          {/* notes */}
          <Section title="Notes" value="Auto-saved · 14:34">
            <div className="rounded-xl border border-border bg-surface/70 p-3.5">
              <p className="text-[13px] leading-relaxed text-text/90">{props.notes}</p>
            </div>
          </Section>
        </div>

        {/* footer actions */}
        <div className="sticky bottom-0 flex gap-2 border-t border-border bg-bg/90 px-4 pb-7 pt-3 backdrop-blur">
          <Link
            href="/rep/outlets"
            className="flex-1 rounded-xl border border-border-strong py-3 text-center text-[14px] font-medium text-muted"
          >
            Close visit
          </Link>
          <Link
            href={`/rep/po/new?visit=${props.code}`}
            className="flex flex-[1.4] items-center justify-center gap-1.5 rounded-xl bg-ice py-3 text-center text-[14px] font-semibold text-white"
          >
            Send PO <ArrowRight className="h-4 w-4" />
          </Link>
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
        <span className="eyebrow">{value}</span>
      </div>
      {children}
    </div>
  );
}
