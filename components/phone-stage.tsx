"use client";

import { useState, useEffect } from "react";

const W = 390;
const H = 844;

/** Scales the fixed 390x844 phone mockup to fill the viewport height on desktop
 *  (and shrink to fit on small screens), preserving the device proportions. */
export function PhoneStage({ children }: { children: React.ReactNode }) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const compute = () => {
      const s = Math.min((window.innerHeight - 40) / H, (window.innerWidth - 40) / W, 1.7);
      setScale(Math.max(0.4, s));
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  return (
    <div className="shrink-0" style={{ width: W * scale, height: H * scale }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
        {children}
      </div>
    </div>
  );
}
