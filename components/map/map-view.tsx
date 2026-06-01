"use client";

import dynamic from "next/dynamic";
import type { MapPoint } from "./leaflet-map";

const LeafletMap = dynamic(
  () => import("./leaflet-map").then((m) => m.LeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full animate-pulse bg-surface-2" />
    ),
  }
);

export function MapView(props: {
  points: MapPoint[];
  accuracy?: { lat: number; lng: number; radiusM: number; color: string };
  zoom?: number;
  center?: [number, number];
  className?: string;
}) {
  return <LeafletMap {...props} />;
}

export type { MapPoint };
