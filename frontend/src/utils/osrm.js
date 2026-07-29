// Ruteo real y 100% gratuito vía OSRM (Open Source Routing Machine), sin API
// key, usando el servidor de demostración público. Devuelve la geometría de
// la ruta siguiendo calles reales (no una línea recta), más distancia y
// duración estimadas según el modo de transporte.

export async function obtenerRuta(origen, destino, perfil = 'driving') {
  if (!origen || !destino) return null;

  const coordsOrigen = `${origen.lng},${origen.lat}`;
  const coordsDestino = `${destino.lng},${destino.lat}`;
  const url = `https://router.project-osrm.org/route/v1/${perfil}/${coordsOrigen};${coordsDestino}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.length) return null;

    const ruta = data.routes[0];
    return {
      // OSRM devuelve [lng, lat]; Leaflet usa [lat, lng].
      geometria: ruta.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      distanciaMetros: ruta.distance,
      duracionSegundos: ruta.duration,
    };
  } catch {
    return null;
  }
}

export function formatearDuracion(segundos) {
  if (segundos == null || Number.isNaN(segundos)) return 'N/D';
  const minutos = Math.round(segundos / 60);
  return minutos < 1 ? '< 1 min' : `${minutos} min`;
}

export function formatearDistancia(metros) {
  if (metros == null || Number.isNaN(metros)) return 'N/D';
  return `${(metros / 1000).toFixed(1)} km`;
}

/** Deriva el perfil de ruteo OSRM a partir del tipo de vehículo registrado. */
export function perfilDesdeVehiculo(tipoVehiculo) {
  const t = (tipoVehiculo || '').toLowerCase();
  if (t.includes('bici')) return 'bike';
  if (t.includes('pie') || t.includes('camin')) return 'foot';
  return 'driving'; // moto, auto, camioneta, etc.
}
