import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, useMap, Marker } from 'react-leaflet';
import { LatLngBounds, divIcon } from 'leaflet';

export type RoutePoint = {
  lat: number;
  lng: number;
  label: string;
  subtitle?: string;
  status?: 'done' | 'current' | 'upcoming';
};

const statusColor: Record<NonNullable<RoutePoint['status']>, string> = {
  done: '#006a6a',
  current: '#001e40',
  upcoming: '#94a3b8',
};

const FitBounds = ({ points }: { points: RoutePoint[] }) => {
  const map = useMap();

  React.useEffect(() => {
    if (points.length === 0) return;
    const bounds = new LatLngBounds(points.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [30, 30] });
  }, [map, points]);

  return null;
};

/** Linearly interpolate between two numbers */
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Smoothly animate a marker along a polyline made of RoutePoints */
const MovingShipment = ({ points, currentStep }: { points: RoutePoint[]; currentStep?: number }) => {
  const totalSegments = points.length - 1;
  // progress goes from 0.0 → totalSegments
  const [progress, setProgress] = React.useState(currentStep !== undefined ? Math.max(0, currentStep - 1) : 0);

  // Target progress logic
  const targetProgress = currentStep !== undefined
    ? Math.min(Math.max(0, currentStep - 1), totalSegments)
    : (() => {
        const currentIdx = points.findIndex((p) => p.status === 'current');
        return currentIdx > 0 ? currentIdx - 1 + 0.5 : 0;
      })();

  React.useEffect(() => {
    if (totalSegments <= 0) return;

    let p = progress;
    // Animate smoothly to the target progress
    const STEP = 0.015; // smooth increment
    const INTERVAL_MS = 30;

    const id = setInterval(() => {
      const diff = targetProgress - p;
      if (Math.abs(diff) < STEP) {
        setProgress(targetProgress);
        clearInterval(id);
        return;
      }
      p += Math.sign(diff) * STEP;
      setProgress(p);
    }, INTERVAL_MS);

    return () => clearInterval(id);
  }, [targetProgress, totalSegments]); // Removed `progress` from dependencies

  if (totalSegments <= 0) return null;

  const segIndex = Math.min(Math.floor(progress), totalSegments - 1);
  const t = Math.max(0, Math.min(1, progress - segIndex));
  const from = points[segIndex];
  const to = points[segIndex + 1];

  const lat = lerp(from.lat, to.lat, t);
  const lng = lerp(from.lng, to.lng, t);

  const icon = divIcon({
    className: '',
    html: `<div style="
      width:22px; height:22px;
      background:#f97316;
      border:3px solid #fff;
      border-radius:50%;
      box-shadow:0 0 0 4px rgba(249,115,22,0.35), 0 2px 8px rgba(0,0,0,0.25);
      animation: pulse-ring 1.4s ease-out infinite;
    "></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

  return <Marker position={[lat, lng]} icon={icon} zIndexOffset={100} />;
};

export const LiveRouteMap = ({
  points,
  currentStep,
  className = '',
  zoom = 7,
}: {
  points: RoutePoint[];
  currentStep?: number;
  className?: string;
  zoom?: number;
}) => {
  const center: [number, number] = points.length
    ? [points[0].lat, points[0].lng]
    : [13.3409, 74.7421];

  return (
    <div className={`rounded-3xl overflow-hidden border border-outline-variant/20 shadow-[0_20px_60px_-30px_rgba(0,30,64,0.35)] ${className}`}>
      <MapContainer center={center} zoom={zoom} className="h-[320px] w-full" scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Route polyline */}
        {points.length > 1 && (
          <Polyline
            positions={points.map((p) => [p.lat, p.lng] as [number, number])}
            pathOptions={{ color: '#006a6a', weight: 4, dashArray: '8 8' }}
          />
        )}

        {/* Static waypoint markers */}
        {points.map((point) => (
          <CircleMarker
            key={`${point.label}-${point.lat}-${point.lng}`}
            center={[point.lat, point.lng]}
            radius={point.status === 'current' ? 11 : 8}
            pathOptions={{
              color: '#ffffff',
              weight: 2,
              fillColor: statusColor[point.status ?? 'done'],
              fillOpacity: 1,
            }}
          >
            <Popup>
              <div className="font-inter">
                <p className="font-bold text-primary">{point.label}</p>
                {point.subtitle && <p className="text-xs text-slate-500 mt-1">{point.subtitle}</p>}
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* Animated moving marker */}
        <MovingShipment points={points} currentStep={currentStep} />

        <FitBounds points={points} />
      </MapContainer>
    </div>
  );
};
