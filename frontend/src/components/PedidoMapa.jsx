import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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

/**
 * Mapa (OpenStreetMap vía Leaflet, 100% gratuito, sin API key) que ubica
 * un pedido según su dirección de entrega. Ver utils/pseudoCoords.js para
 * la aclaración de que la ubicación es aproximada, no geocoding real.
 */
export default function PedidoMapa({ direccion, etiqueta }) {
  const posicion = coordsDesdeDireccion(direccion);

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 h-full min-h-[280px]">
      <MapContainer center={posicion} zoom={14} scrollWheelZoom={false} style={{ height: '100%', width: '100%', minHeight: 280 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={posicion}>
          <Popup>{etiqueta || direccion}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
