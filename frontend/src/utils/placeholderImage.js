// Imágenes de stock gratuitas (picsum.photos, sin API key) usadas como placeholder
// hasta que el negocio suba fotos reales de sus locales/productos.
export function imagenNegocio(idNegocio) {
  return `https://picsum.photos/seed/negocio-${idNegocio}/400/240`;
}

export function imagenProducto(idProducto) {
  return `https://picsum.photos/seed/producto-${idProducto}/300/200`;
}
