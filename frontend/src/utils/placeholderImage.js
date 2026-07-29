// Placeholders visuales generados 100% en el cliente (SVG como data URI), sin
// depender de ningún servicio externo ni de internet: un fondo con degradé y
// un emoji acorde al tipo de producto/negocio, hasta que se suban fotos reales.

const CATEGORIAS_PRODUCTO = [
  { match: /hamburgu/i, emoji: '🍔', c1: '#fb923c', c2: '#c2410c' },
  { match: /pizza/i, emoji: '🍕', c1: '#f87171', c2: '#b91c1c' },
  { match: /calzone/i, emoji: '🥐', c1: '#fb923c', c2: '#c2410c' },
  { match: /sushi|maki|nigiri|california/i, emoji: '🍣', c1: '#38bdf8', c2: '#0369a1' },
  { match: /ramen|sopa/i, emoji: '🍜', c1: '#fbbf24', c2: '#b45309' },
  { match: /gyoza|empanad|dumpling/i, emoji: '🥟', c1: '#a3e635', c2: '#4d7c0f' },
  { match: /refresco|gaseosa|bebida|cola|jugo/i, emoji: '🥤', c1: '#38bdf8', c2: '#0284c7' },
  { match: /t[ée] |t[ée]$|helad[oa]/i, emoji: '🥤', c1: '#4ade80', c2: '#15803d' },
  { match: /pollo/i, emoji: '🍗', c1: '#fbbf24', c2: '#b45309' },
  { match: /carne|res\b|bife|churrasco/i, emoji: '🥩', c1: '#f87171', c2: '#991b1b' },
  { match: /papas?\b|fritas/i, emoji: '🍟', c1: '#fde047', c2: '#ca8a04' },
  { match: /ensalada/i, emoji: '🥗', c1: '#4ade80', c2: '#15803d' },
  { match: /torta|postre|dulce|dessert/i, emoji: '🍰', c1: '#f9a8d4', c2: '#db2777' },
  { match: /pan\b|sandwich|sándwich/i, emoji: '🥪', c1: '#fbbf24', c2: '#b45309' },
];
const DEFAULT_PRODUCTO = { emoji: '🍽️', c1: '#f87171', c2: '#b91c1c' };

const CATEGORIAS_NEGOCIO = [
  { match: /pizza/i, emoji: '🍕', c1: '#f87171', c2: '#b91c1c' },
  { match: /sushi|japon/i, emoji: '🍣', c1: '#38bdf8', c2: '#0369a1' },
  { match: /burger|hamburgu|sabor/i, emoji: '🍔', c1: '#fb923c', c2: '#c2410c' },
  { match: /pollo/i, emoji: '🍗', c1: '#fbbf24', c2: '#b45309' },
  { match: /caf[ée]|cafeter/i, emoji: '☕', c1: '#a8785c', c2: '#5c3a21' },
  { match: /postre|pasteler|dulce/i, emoji: '🍰', c1: '#f9a8d4', c2: '#db2777' },
];
const DEFAULT_NEGOCIO = { emoji: '🏪', c1: '#fb7185', c2: '#9f1239' };

function svgDataUri({ emoji, c1, c2 }, ancho, alto) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c2}"/>
      </linearGradient>
    </defs>
    <rect width="${ancho}" height="${alto}" fill="url(#g)"/>
    <text x="50%" y="52%" font-size="${Math.round(alto * 0.48)}" text-anchor="middle" dominant-baseline="central">${emoji}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function imagenNegocio(idNegocio, nombre = '') {
  const categoria = CATEGORIAS_NEGOCIO.find((c) => c.match.test(nombre)) || DEFAULT_NEGOCIO;
  return svgDataUri(categoria, 400, 240);
}

export function imagenProducto(idProducto, nombre = '') {
  const categoria = CATEGORIAS_PRODUCTO.find((c) => c.match.test(nombre)) || DEFAULT_PRODUCTO;
  return svgDataUri(categoria, 300, 200);
}
