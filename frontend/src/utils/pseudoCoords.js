// No tenemos geocoding real (ni lat/lng guardados), así que generamos una
// ubicación determinística a partir del texto de la dirección: la misma
// dirección siempre cae en el mismo punto, dentro de un radio de ~5km
// alrededor de Santa Cruz de la Sierra. Es un placeholder visual, no una
// ubicación real — lo documentamos así para no aparentar precisión que no existe.
const BASE_LAT = -17.7833;
const BASE_LNG = -63.1821;

export function coordsDesdeDireccion(direccion) {
  const texto = direccion || 'Santa Cruz de la Sierra';
  let hash = 0;
  for (let i = 0; i < texto.length; i++) {
    hash = (hash * 31 + texto.charCodeAt(i)) >>> 0;
  }
  const offsetLat = ((hash % 1000) / 1000 - 0.5) * 0.1;
  const offsetLng = (((hash >> 10) % 1000) / 1000 - 0.5) * 0.1;
  return [BASE_LAT + offsetLat, BASE_LNG + offsetLng];
}
