import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, useMap } from 'react-leaflet';
import { LatLngBounds } from 'leaflet';

type RoutePoint = {
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

export const LiveRouteMap = ({
  points,
  className = '',
  zoom = 7,
}: {
  points: RoutePoint[];
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

        {points.length > 1 && (
          <Polyline
            positions={points.map((p) => [p.lat, p.lng] as [number, number])}
            pathOptions={{ color: '#006a6a', weight: 4, dashArray: '8 8' }}
          />
        )}

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

        <FitBounds points={points} />
      </MapContainer>
    </div>
  );
};

export type { RoutePoint };
