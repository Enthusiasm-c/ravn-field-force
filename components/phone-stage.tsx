"use client";

import { useState, useEffect } from "react";

const W = 390;
const H = 844;

/** Desktop (≥lg): scales the fixed 390×844 phone mockup to fit the viewport.
 *  Mobile (<lg): no mockup — the screen renders full-bleed at real device size,
 *  so the nav bar sits on the real bottom edge instead of a scaled-down frame. */
export function PhoneStage({ children }: { children: React.ReactNode }) {
  // null = mobile / not-yet-measured → render full-bleed (also the SSR default).
  const [scale, setScale] = useState<number | null>(null);

  useEffect(() => {
    const compute = () => {
      if (!window.matchMedia("(min-width: 1024px)").matches) {
        setScale(null);
        return;
      }
      const s = Math.min((window.innerHeight - 40) / H, (window.innerWidth - 40) / W, 1.7);
      setScale(Math.max(0.4, s));
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  // Mobile: full-bleed, no scaling, no device chrome.
  if (scale === null) return <div className="w-full">{children}</div>;

  // Desktop: the scaled 390×844 device mockup.
  return (
    <div className="shrink-0" style={{ width: W * scale, height: H * scale }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
        {children}
      </div>
    </div>
  );
}
