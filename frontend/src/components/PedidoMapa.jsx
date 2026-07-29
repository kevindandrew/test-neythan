import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { coordsDesdeDireccion } from '../utils/pseudoCoords';

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
 * pedido en curso. Si se pasan origen y destino, muestra ambos puntos (la
 * sucursal donde se recoge y la dirección del cliente) unidos por una línea
 * recta a modo de ruta orientativa. Ver utils/pseudoCoords.js: las
 * coordenadas son aproximadas, no geocoding real.
 */
export default function PedidoMapa({ direccion, etiqueta, origen, destino }) {
  const tieneDosPuntos = Boolean(origen && destino);

  const posicionUnica = coordsDesdeDireccion(direccion);
  const posicionOrigen = tieneDosPuntos ? coordsDesdeDireccion(origen.direccion) : null;
  const posicionDestino = tieneDosPuntos ? coordsDesdeDireccion(destino.direccion) : null;

  const puntos = tieneDosPuntos ? [posicionOrigen, posicionDestino] : [posicionUnica];
  const centroInicial = puntos[0];

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 h-full min-h-70">
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
            <Marker position={posicionOrigen} icon={iconSucursal}>
              <Popup>{origen.etiqueta || 'Sucursal'}</Popup>
            </Marker>
            <Marker position={posicionDestino}>
              <Popup>{destino.etiqueta || 'Cliente'}</Popup>
            </Marker>
            <Polyline
              positions={[posicionOrigen, posicionDestino]}
              pathOptions={{ color: '#4f46e5', weight: 4, opacity: 0.7, dashArray: '8 6' }}
            />
          </>
        ) : (
          <Marker position={posicionUnica}>
            <Popup>{etiqueta || direccion}</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
