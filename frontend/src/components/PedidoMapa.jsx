import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { coordsDesdeDireccion } from '../utils/pseudoCoords';
import { geocodearDireccion } from '../utils/geocode';
import { obtenerRuta, formatearDistancia, formatearDuracion } from '../utils/osrm';
import { Skeleton } from './Skeleton';

// Vite no resuelve los íconos por defecto de Leaflet automáticamente;
// hay que apuntarlos a mano una sola vez.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const iconSucursal = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  className: 'marker-sucursal',
});

function AjustarVista({ puntos }) {
  const map = useMap();
  useEffect(() => {
    if (puntos.length > 1) {
      map.fitBounds(L.latLngBounds(puntos), { padding: [40, 40] });
    } else if (puntos.length === 1) {
      map.setView(puntos[0], 14);
    }
  }, [map, puntos]);
  return null;
}

/**
 * Mapa (OpenStreetMap vía Leaflet, 100% gratuito, sin API key) que ubica un
 * pedido en curso. Geocodifica las direcciones reales con Nominatim y traza
 * la ruta real siguiendo calles con OSRM (según el perfil de transporte
 * indicado). Si el geocoding o el ruteo fallan (sin internet, dirección no
 * encontrada, etc.), degrada con gracia: coordenadas aproximadas
 * (ver utils/pseudoCoords.js) y una línea recta entre los dos puntos.
 */
export default function PedidoMapa({ direccion, etiqueta, origen, destino, perfil = 'driving' }) {
  const tieneDosPuntos = Boolean(origen && destino);

  const [cargando, setCargando] = useState(true);
  const [posicionOrigen, setPosicionOrigen] = useState(null);
  const [posicionDestino, setPosicionDestino] = useState(null);
  const [posicionUnica, setPosicionUnica] = useState(null);
  const [ruta, setRuta] = useState(null);

  useEffect(() => {
    let activo = true;

    async function resolver() {
      setCargando(true);
      setRuta(null);

      if (tieneDosPuntos) {
        const tieneCoordsOrigen = origen.lat != null && origen.lng != null;
        const tieneCoordsDestino = destino.lat != null && destino.lng != null;

        const [geoOrigen, geoDestino] = await Promise.all([
          tieneCoordsOrigen ? null : geocodearDireccion(origen.direccion),
          tieneCoordsDestino ? null : geocodearDireccion(destino.direccion),
        ]);
        const posOrigen = tieneCoordsOrigen
          ? { lat: origen.lat, lng: origen.lng }
          : geoOrigen || coordsToObj(coordsDesdeDireccion(origen.direccion));
        const posDestino = tieneCoordsDestino
          ? { lat: destino.lat, lng: destino.lng }
          : geoDestino || coordsToObj(coordsDesdeDireccion(destino.direccion));
        if (!activo) return;
        setPosicionOrigen(posOrigen);
        setPosicionDestino(posDestino);

        const rutaReal = await obtenerRuta(posOrigen, posDestino, perfil);
        if (!activo) return;
        setRuta(rutaReal);
      } else {
        const geo = await geocodearDireccion(direccion);
        const pos = geo || coordsToObj(coordsDesdeDireccion(direccion));
        if (!activo) return;
        setPosicionUnica(pos);
      }

      if (activo) setCargando(false);
    }

    resolver();
    return () => {
      activo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    direccion,
    origen?.direccion,
    origen?.lat,
    origen?.lng,
    destino?.direccion,
    destino?.lat,
    destino?.lng,
    perfil,
  ]);

  if (cargando) {
    return <Skeleton className="w-full h-full min-h-70 rounded-xl" />;
  }

  const puntos = tieneDosPuntos
    ? [objToArr(posicionOrigen), objToArr(posicionDestino)]
    : [objToArr(posicionUnica)];
  const centroInicial = puntos[0];
  const lineaRuta = ruta?.geometria || puntos;

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-full min-h-70 flex flex-col">
      <div className="flex-1 min-h-0">
        <MapContainer
          center={centroInicial}
          zoom={14}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%', minHeight: 280 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <AjustarVista puntos={puntos} />

          {tieneDosPuntos ? (
            <>
              <Marker position={objToArr(posicionOrigen)} icon={iconSucursal}>
                <Popup>{origen.etiqueta || 'Sucursal'}</Popup>
              </Marker>
              <Marker position={objToArr(posicionDestino)}>
                <Popup>{destino.etiqueta || 'Cliente'}</Popup>
              </Marker>
              <Polyline
                positions={lineaRuta}
                pathOptions={
                  ruta
                    ? { color: '#dc2626', weight: 4, opacity: 0.8 }
                    : { color: '#dc2626', weight: 4, opacity: 0.6, dashArray: '8 6' }
                }
              />
            </>
          ) : (
            <Marker position={objToArr(posicionUnica)}>
              <Popup>{etiqueta || direccion}</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {tieneDosPuntos && ruta && (
        <div className="flex items-center justify-center gap-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300">
          <span>📍 {formatearDistancia(ruta.distanciaMetros)}</span>
          <span>⏱ {formatearDuracion(ruta.duracionSegundos)}</span>
        </div>
      )}
    </div>
  );
}

function coordsToObj([lat, lng]) {
  return { lat, lng };
}

function objToArr(pos) {
  return [pos.lat, pos.lng];
}
