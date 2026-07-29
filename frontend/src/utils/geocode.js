// Geocodificación real y 100% gratuita vía Nominatim (OpenStreetMap), sin
// API key. Convierte una dirección de texto en coordenadas lat/lng reales.
// Se cachea en memoria por dirección para no repetir búsquedas idénticas
// en la misma sesión (Nominatim pide un uso moderado de su servicio público).

const cache = new Map();

export async function geocodearDireccion(direccion) {
  if (!direccion) return null;
  const clave = direccion.trim().toLowerCase();
  if (cache.has(clave)) return cache.get(clave);

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      direccion
    )}&format=json&limit=1&countrycodes=bo`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'es' } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.length === 0) return null;

    const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    cache.set(clave, coords);
    return coords;
  } catch {
    return null;
  }
}
