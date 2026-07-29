import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Home, Heart, ShoppingBag, Search, Sparkles, Building2, Store, X } from 'lucide-react';
import { api } from '../api/client';
import AppShell from '../components/AppShell';
import SelectorProductos from '../components/SelectorProductos';
import { imagenNegocio, imagenProducto } from '../utils/placeholderImage';

export const CLIENTE_NAV_ITEMS = [
  { to: '/cliente/panel', label: 'Inicio', icon: Home },
  { to: '/cliente/mis-pedidos', label: 'Mis Pedidos', icon: ShoppingBag },
  { to: '/cliente/favoritos', label: 'Favoritos', icon: Heart },
];

export default function ClientePanel() {
  const [searchParams] = useSearchParams();

  const [productosFeed, setProductosFeed] = useState([]);
  const [cargandoFeed, setCargandoFeed] = useState(true);

  const [negocios, setNegocios] = useState([]);
  const [cargandoNegocios, setCargandoNegocios] = useState(true);
  const [negocioSeleccionado, setNegocioSeleccionado] = useState(null);
  const [sucursales, setSucursales] = useState([]);
  const [cargandoSucursales, setCargandoSucursales] = useState(false);

  const [sucursalActiva, setSucursalActiva] = useState(null);

  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState(null);
  const [buscando, setBuscando] = useState(false);

  const [favoritoIds, setFavoritoIds] = useState(new Set());

  const [error, setError] = useState('');

  useEffect(() => {
    cargarFeed();
    cargarNegocios();
    cargarFavoritoIds();
  }, []);

  useEffect(() => {
    const idSucursal = searchParams.get('sucursal');
    const nombreSucursal = searchParams.get('nombre');
    const nombreNegocio = searchParams.get('negocio');
    if (idSucursal && nombreSucursal) {
      setSucursalActiva({ id: Number(idSucursal), nombre: nombreSucursal, nombreNegocio: nombreNegocio || undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResultados(null);
      return;
    }
    const idTimeout = setTimeout(() => buscar(query), 350);
    return () => clearTimeout(idTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function cargarFeed() {
    setCargandoFeed(true);
    try {
      const data = await api.get('/api/productos');
      setProductosFeed(data);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los productos.');
    } finally {
      setCargandoFeed(false);
    }
  }

  async function cargarNegocios() {
    setCargandoNegocios(true);
    try {
      const data = await api.get('/api/negocios');
      setNegocios(data);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los negocios.');
    } finally {
      setCargandoNegocios(false);
    }
  }

  async function cargarFavoritoIds() {
    try {
      const data = await api.get('/api/cliente/favoritos');
      setFavoritoIds(new Set(data.map((p) => p.id_producto)));
    } catch {
      // silencioso: no bloquea el resto del inicio si esto falla
    }
  }

  async function toggleFavorito(e, idProducto) {
    e.stopPropagation();
    const esFavorito = favoritoIds.has(idProducto);
    setFavoritoIds((prev) => {
      const next = new Set(prev);
      esFavorito ? next.delete(idProducto) : next.add(idProducto);
      return next;
    });
    try {
      if (esFavorito) {
        await api.del(`/api/cliente/favoritos/${idProducto}`);
      } else {
        await api.post('/api/cliente/favoritos', { id_producto: idProducto });
      }
    } catch (err) {
      // revertir si falló
      setFavoritoIds((prev) => {
        const next = new Set(prev);
        esFavorito ? next.add(idProducto) : next.delete(idProducto);
        return next;
      });
      setError(err.message || 'No se pudo actualizar favoritos.');
    }
  }

  async function buscar(texto) {
    setBuscando(true);
    try {
      const data = await api.get(`/api/buscar?q=${encodeURIComponent(texto)}`);
      setResultados(data);
    } catch (err) {
      setError(err.message || 'No se pudo completar la búsqueda.');
    } finally {
      setBuscando(false);
    }
  }

  async function verSucursalesDeNegocio(idNegocio, nombreNegocio) {
    setError('');
    setNegocioSeleccionado({ id: idNegocio, nombre: nombreNegocio });
    setSucursalActiva(null);
    setCargandoSucursales(true);
    try {
      const data = await api.get(`/api/negocio/${idNegocio}/sucursales`);
      setSucursales(data.sucursales || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las sucursales de este negocio.');
      setSucursales([]);
    } finally {
      setCargandoSucursales(false);
    }
  }

  function seleccionarProductoDelFeed(producto) {
    setNegocioSeleccionado(null);
    setSucursales([]);
    setSucursalActiva({
      id: producto.id_sucursal,
      nombre: producto.sucursal_nombre,
      nombreNegocio: producto.nombre_negocio,
    });
  }

  function limpiarBusqueda() {
    setQuery('');
    setResultados(null);
  }

  const hayResultados = resultados && (resultados.productos.length > 0 || resultados.negocios.length > 0);

  return (
    <AppShell roleLabel="Cliente" navItems={CLIENTE_NAV_ITEMS}>
      <div className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">{error}</div>
        )}

        {/* Buscador */}
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar productos o negocios..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-11 pr-10 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
          {query && (
            <button
              onClick={limpiarBusqueda}
              aria-label="Limpiar búsqueda"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>
          )}

          {query && (
            <div className="absolute z-10 mt-2 w-full bg-white rounded-xl shadow-lg border border-slate-200 max-h-96 overflow-y-auto">
              {buscando ? (
                <p className="text-sm text-slate-400 p-4">Buscando...</p>
              ) : !hayResultados ? (
                <p className="text-sm text-slate-400 p-4">No encontramos nada con "{query}".</p>
              ) : (
                <div className="p-2">
                  {resultados.negocios.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide px-2 py-1">
                        Negocios
                      </p>
                      {resultados.negocios.map((n) => (
                        <button
                          key={n.id_negocio}
                          onClick={() => {
                            verSucursalesDeNegocio(n.id_negocio, n.nombre_negocio);
                            limpiarBusqueda();
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Building2 size={16} className="text-indigo-600 shrink-0" />
                          <span className="text-sm text-slate-700">{n.nombre_negocio}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {resultados.productos.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide px-2 py-1">
                        Productos
                      </p>
                      {resultados.productos.map((p) => (
                        <button
                          key={p.id_producto}
                          onClick={() => {
                            seleccionarProductoDelFeed(p);
                            limpiarBusqueda();
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between gap-2"
                        >
                          <span className="text-sm text-slate-700 truncate">
                            {p.nombre_producto}{' '}
                            <span className="text-slate-400">· {p.nombre_negocio}</span>
                          </span>
                          <span className="text-xs font-medium text-slate-600 shrink-0">
                            Bs. {p.precio}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Para Ti */}
        <section className="bg-white rounded-2xl shadow-lg p-6">
          <h5 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-4">
            <Sparkles size={18} className="text-indigo-600" />
            Para Ti
          </h5>

          {cargandoFeed ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
                  <div className="w-full h-36 bg-slate-100" />
                  <div className="p-3.5 space-y-2">
                    <div className="h-3.5 bg-slate-100 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : productosFeed.length === 0 ? (
            <p className="text-sm text-slate-400">Todavía no hay productos disponibles.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {productosFeed.map((p) => (
                <button
                  key={p.id_producto}
                  onClick={() => seleccionarProductoDelFeed(p)}
                  className="group text-left rounded-2xl border border-slate-200 bg-white overflow-hidden transition hover:border-indigo-300 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <div className="relative">
                    <img
                      src={imagenProducto(p.id_producto)}
                      alt={p.nombre_producto}
                      className="w-full h-36 object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-linear-to-t from-black/40 to-transparent" />
                    <span
                      role="button"
                      onClick={(e) => toggleFavorito(e, p.id_producto)}
                      aria-label="Marcar como favorito"
                      className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm hover:bg-white hover:scale-105 transition"
                    >
                      <Heart
                        size={15}
                        className={favoritoIds.has(p.id_producto) ? 'text-red-500' : 'text-slate-400'}
                        fill={favoritoIds.has(p.id_producto) ? 'currentColor' : 'none'}
                      />
                    </span>
                    <span className="absolute bottom-2 left-2.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-indigo-600 shadow-sm">
                      Bs. {p.precio}
                    </span>
                  </div>
                  <div className="p-3.5">
                    <p className="font-semibold text-slate-800 text-sm truncate">{p.nombre_producto}</p>
                    <p className="flex items-center gap-1 text-xs text-slate-400 mt-1 truncate">
                      <Store size={12} className="shrink-0" />
                      <span className="truncate">{p.nombre_negocio}</span>
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Locales */}
        <section className="bg-white rounded-2xl shadow-lg p-6">
          <h5 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-4">
            <Building2 size={18} className="text-indigo-600" />
            Locales
          </h5>

          {cargandoNegocios ? (
            <p className="text-sm text-slate-400">Cargando negocios...</p>
          ) : negocios.length === 0 ? (
            <p className="text-sm text-slate-400">No hay negocios disponibles.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {negocios.map((n) => {
                const sinSucursales = n.cantidad_sucursales === 0;
                const activo = negocioSeleccionado?.id === n.id_negocio;
                return (
                  <button
                    key={n.id_negocio}
                    onClick={() => !sinSucursales && verSucursalesDeNegocio(n.id_negocio, n.nombre_negocio)}
                    disabled={sinSucursales}
                    className={`text-left rounded-xl border overflow-hidden transition disabled:opacity-50 disabled:cursor-not-allowed ${
                      activo ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'
                    }`}
                  >
                    <img
                      src={imagenNegocio(n.id_negocio)}
                      alt={n.nombre_negocio}
                      className="w-full h-32 object-cover"
                      loading="lazy"
                    />
                    <div className="p-4">
                      <p className="font-semibold text-slate-800">{n.nombre_negocio}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {sinSucursales
                          ? 'Sin sucursales todavía'
                          : `${n.cantidad_sucursales} sucursal${n.cantidad_sucursales === 1 ? '' : 'es'}`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Sucursales del negocio seleccionado */}
        {negocioSeleccionado && (
          <section className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h5 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                <Store size={18} className="text-indigo-600" />
                Sucursales de {negocioSeleccionado.nombre}
              </h5>
              <button
                onClick={() => {
                  setNegocioSeleccionado(null);
                  setSucursales([]);
                }}
                className="text-sm text-slate-500 hover:text-indigo-600 transition"
              >
                Cerrar
              </button>
            </div>

            {cargandoSucursales ? (
              <p className="text-sm text-slate-400">Cargando sucursales...</p>
            ) : sucursales.length === 0 ? (
              <p className="text-sm text-slate-400">Este negocio no tiene sucursales disponibles.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {sucursales.map((s) => (
                  <button
                    key={s.id_sucursal}
                    onClick={() =>
                      setSucursalActiva({
                        id: s.id_sucursal,
                        nombre: s.nombre_sucursal,
                        nombreNegocio: negocioSeleccionado.nombre,
                      })
                    }
                    className={`text-sm rounded-lg px-3 py-1.5 border transition ${
                      sucursalActiva?.id === s.id_sucursal
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-indigo-600 text-indigo-600 hover:bg-indigo-50'
                    }`}
                  >
                    {s.nombre_sucursal} ({s.direccion})
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Selector de productos + carrito */}
        {sucursalActiva && (
          <SelectorProductos
            sucursalId={sucursalActiva.id}
            sucursalNombre={sucursalActiva.nombre}
            nombreNegocio={sucursalActiva.nombreNegocio}
            onCerrar={() => setSucursalActiva(null)}
          />
        )}
      </div>
    </AppShell>
  );
}
