import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { LocateFixed } from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Centro por defecto: Santa Cruz de la Sierra, Bolivia.
const CENTRO_DEFECTO = { lat: -17.7833, lng: -63.1821 };

function ClicksDelMapa({ onPick }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function Recentrar({ posicion }) {
  const map = useMap();
  useEffect(() => {
    if (posicion) {
      map.setView([posicion.lat, posicion.lng], Math.max(map.getZoom(), 16));
    }
  }, [map, posicion?.lat, posicion?.lng]);
  return null;
}

/**
 * Selector de ubicación mediante un pin en el mapa (Leaflet + OpenStreetMap,
 * gratuito y sin API key). El usuario puede tocar el mapa para marcar el
 * punto exacto o usar su ubicación GPS del navegador.
 */
export default function SelectorUbicacion({ value, onChange, alto = 260 }) {
  const [buscandoGps, setBuscandoGps] = useState(false);
  const [errorGps, setErrorGps] = useState('');

  const posicion = value?.lat != null && value?.lng != null ? value : null;
  const centro = posicion || CENTRO_DEFECTO;

  function usarMiUbicacion() {
    if (!navigator.geolocation) {
      setErrorGps('Tu navegador no soporta geolocalización.');
      return;
    }
    setErrorGps('');
    setBuscandoGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setBuscandoGps(false);
      },
      () => {
        setErrorGps('No se pudo obtener tu ubicación. Marcá el punto en el mapa.');
        setBuscandoGps(false);
      }
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {posicion ? 'Punto marcado en el mapa.' : 'Tocá el mapa para marcar la ubicación exacta.'}
        </p>
        <button
          type="button"
          onClick={usarMiUbicacion}
          disabled={buscandoGps}
          className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50"
        >
          <LocateFixed size={14} />
          {buscandoGps ? 'Buscando...' : 'Usar mi ubicación'}
        </button>
      </div>

      {errorGps && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs px-3 py-1.5">
          {errorGps}
        </div>
      )}

      <div
        className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700"
        style={{ height: alto }}
      >
        <MapContainer
          center={[centro.lat, centro.lng]}
          zoom={posicion ? 16 : 13}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClicksDelMapa onPick={onChange} />
          <Recentrar posicion={posicion} />
          {posicion && <Marker position={[posicion.lat, posicion.lng]} />}
        </MapContainer>
      </div>
    </div>
  );
}
