"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Circle, Tooltip, useMap } from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

export type MapPoint = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  sublabel?: string;
  color: string;
  radius?: number;
};

type Accuracy = { lat: number; lng: number; radiusM: number; color: string };

function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 15);
      return;
    }
    const bounds: LatLngBoundsExpression = points.map((p) => [p.lat, p.lng]);
    map.fitBounds(bounds, { padding: [36, 36] });
  }, [map, points]);
  return null;
}

/** Leaflet renders grey tiles when its container is sized after init
    (grid/flex settling). Recompute size on mount and on container resize. */
function KeepSized() {
  const map = useMap();
  useEffect(() => {
    const fix = () => map.invalidateSize();
    const t = setTimeout(fix, 120);
    const el = map.getContainer();
    const ro = new ResizeObserver(fix);
    ro.observe(el);
    return () => {
      clearTimeout(t);
      ro.disconnect();
    };
  }, [map]);
  return null;
}

export function LeafletMap({
  points,
  accuracy,
  zoom,
  className,
}: {
  points: MapPoint[];
  accuracy?: Accuracy;
  zoom?: number;
  className?: string;
}) {
  const center: [number, number] = points[0]
    ? [points[0].lat, points[0].lng]
    : [-8.65, 115.14];

  return (
    <MapContainer
      center={center}
      zoom={zoom ?? 12}
      scrollWheelZoom={false}
      zoomControl={false}
      attributionControl={false}
      className={className}
      style={{ height: "100%", width: "100%", background: "var(--surface-2)" }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        // © OpenStreetMap contributors © CARTO
      />
      {accuracy && (
        <Circle
          center={[accuracy.lat, accuracy.lng]}
          radius={accuracy.radiusM}
          pathOptions={{
            color: accuracy.color,
            fillColor: accuracy.color,
            fillOpacity: 0.12,
            weight: 1,
          }}
        />
      )}
      {points.map((p) => (
        <CircleMarker
          key={p.id}
          center={[p.lat, p.lng]}
          radius={p.radius ?? 7}
          pathOptions={{
            color: "#ffffff",
            weight: 2,
            fillColor: p.color,
            fillOpacity: 1,
          }}
        >
          <Tooltip direction="top" offset={[0, -6]}>
            <span style={{ fontWeight: 600 }}>{p.label}</span>
            {p.sublabel ? ` · ${p.sublabel}` : ""}
          </Tooltip>
        </CircleMarker>
      ))}
      {!accuracy && <FitBounds points={points} />}
      <KeepSized />
    </MapContainer>
  );
}
