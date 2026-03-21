import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";

const issIcon = L.divIcon({
  className: "cosmo-iss-marker",
  html: `<span style="font-size:1.5rem;filter:drop-shadow(0 0 6px #a78bfa)" aria-hidden="true">🛰️</span>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
}

type Props = {
  latitude: number;
  longitude: number;
  label?: string;
};

export function IssMap({ latitude, longitude, label }: Props) {
  return (
    <div
      className="h-56 w-full overflow-hidden rounded-xl border border-white/10 shadow-glow md:h-64"
      role="img"
      aria-label={label || `Map showing ISS near latitude ${latitude.toFixed(1)}, longitude ${longitude.toFixed(1)}`}
    >
      <MapContainer
        center={[latitude, longitude]}
        zoom={3}
        className="h-full w-full"
        scrollWheelZoom={false}
        worldCopyJump
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <Recenter lat={latitude} lng={longitude} />
        <Marker position={[latitude, longitude]} icon={issIcon} />
      </MapContainer>
    </div>
  );
}
