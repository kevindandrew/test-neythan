import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Building2, Package, ShoppingCart, Plus, Minus, X, ArrowLeft } from 'lucide-react';
import { api } from '../api/client';
import AppShell from '../components/AppShell';
import { CLIENTE_NAV_ITEMS } from './ClientePanel';

export default function ClienteHacerPedido() {
  const navigate = useNavigate();

  const [negocios, setNegocios] = useState([]);
  const [negocioSeleccionado, setNegocioSeleccionado] = useState(null);
  const [sucursales, setSucursales] = useState([]);
  const [productos, setProductos] = useState([]);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState(null);

  const [cargandoNegocios, setCargandoNegocios] = useState(true);
  const [cargandoSucursales, setCargandoSucursales] = useState(false);
  const [cargandoProductos, setCargandoProductos] = useState(false);

  const [error, setError] = useState('');
  const [errorProductos, setErrorProductos] = useState('');

  useEffect(() => {
    cargarNegocios();
  }, []);

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

  async function verSucursalesDeNegocio(idNegocio, nombreNegocio) {
    setError('');
    setNegocioSeleccionado({ id: idNegocio, nombre: nombreNegocio });
    setSucursalSeleccionada(null);
    setProductos([]);
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

  function cambiarNegocio() {
    setNegocioSeleccionado(null);
    setSucursales([]);
    setSucursalSeleccionada(null);
    setProductos([]);
  }

  async function verProductos(idSucursal, nombreSucursal) {
    setErrorProductos('');
    setSucursalSeleccionada({ id: idSucursal, nombre: nombreSucursal });
    setCargandoProductos(true);
    try {
      const data = await api.get(`/api/sucursal/${idSucursal}/productos`);
      setProductos(data.map((p) => ({ ...p, cantidad: 1, enCarrito: false })));
    } catch (err) {
      setErrorProductos(err.message || 'No se pudieron cargar los productos de la sucursal.');
      setProductos([]);
    } finally {
      setCargandoProductos(false);
    }
  }

  function agregarAlCarrito(idProducto) {
    setErrorProductos('');
    setProductos((prev) =>
      prev.map((p) => (p.id_producto === idProducto ? { ...p, enCarrito: true, cantidad: 1 } : p))
    );
  }

  function quitarDelCarrito(idProducto) {
    setProductos((prev) =>
      prev.map((p) => (p.id_producto === idProducto ? { ...p, enCarrito: false, cantidad: 1 } : p))
    );
  }

  function incrementarCantidad(idProducto) {
    setProductos((prev) =>
      prev.map((p) =>
        p.id_producto === idProducto ? { ...p, cantidad: Math.min(p.cantidad + 1, p.stock) } : p
      )
    );
  }

  function decrementarCantidad(idProducto) {
    setProductos((prev) =>
      prev.map((p) =>
        p.id_producto === idProducto ? { ...p, cantidad: Math.max(1, p.cantidad - 1) } : p
      )
    );
  }

  const itemsCarrito = productos.filter((p) => p.enCarrito);
  const totalCarrito = itemsCarrito.reduce((acc, p) => acc + parseFloat(p.precio) * p.cantidad, 0);

  function armarPedido() {
    setErrorProductos('');

    if (itemsCarrito.length === 0) {
      setErrorProductos('Agregá al menos un producto a tu pedido.');
      return;
    }

    const detalles = itemsCarrito.map((p) => ({
      id_producto: p.id_producto,
      cantidad: p.cantidad,
      precio: parseFloat(p.precio),
    }));

    const pedidoTemporal = {
      id_sucursal: sucursalSeleccionada.id,
      total: totalCarrito,
      detalles,
    };

    localStorage.setItem('pedido_temporal', JSON.stringify(pedidoTemporal));
    navigate('/cliente/repartidores');
  }

  return (
    <AppShell roleLabel="Cliente" navItems={CLIENTE_NAV_ITEMS}>
      <div className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">{error}</div>
        )}

        {/* Negocios */}
        <section className="bg-white rounded-2xl shadow-lg p-6">
          <h5 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-3">
            <Building2 size={18} className="text-indigo-600" />
            Negocios
          </h5>

          {cargandoNegocios ? (
            <p className="text-sm text-slate-400">Cargando negocios...</p>
          ) : negocios.length === 0 ? (
            <p className="text-sm text-slate-400">No hay negocios disponibles.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {negocios.map((n) => {
                const sinSucursales = n.cantidad_sucursales === 0;
                return (
                  <button
                    key={n.id_negocio}
                    onClick={() => !sinSucursales && verSucursalesDeNegocio(n.id_negocio, n.nombre_negocio)}
                    disabled={sinSucursales}
                    className={`text-left rounded-xl border p-4 transition disabled:opacity-50 disabled:cursor-not-allowed ${
                      negocioSeleccionado?.id === n.id_negocio
                        ? 'border-indigo-400 bg-indigo-50'
                        : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-medium text-slate-800">{n.nombre_negocio}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {sinSucursales
                        ? 'Sin sucursales todavía'
                        : `${n.cantidad_sucursales} sucursal${n.cantidad_sucursales === 1 ? '' : 'es'}`}
                    </p>
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
                onClick={cambiarNegocio}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition"
              >
                <ArrowLeft size={14} />
                Cambiar negocio
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
                    onClick={() => verProductos(s.id_sucursal, s.nombre_sucursal)}
                    className={`text-sm rounded-lg px-3 py-1.5 border transition ${
                      sucursalSeleccionada?.id === s.id_sucursal
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

        {/* Productos de la Sucursal Seleccionada */}
        {sucursalSeleccionada && (
          <section className="bg-white rounded-2xl shadow-lg p-6">
            <h5 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-4">
              <Package size={18} className="text-indigo-600" />
              Productos de {sucursalSeleccionada.nombre}
            </h5>

            {errorProductos && (
              <div className="mb-3 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">
                {errorProductos}
              </div>
            )}

            {cargandoProductos ? (
              <p className="text-sm text-slate-400">Cargando productos...</p>
            ) : productos.length === 0 ? (
              <p className="text-sm text-slate-400">No hay productos en esta sucursal.</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lista de productos */}
                <div className="lg:col-span-2 space-y-2">
                  {productos.map((p) => (
                    <div
                      key={p.id_producto}
                      className={`flex items-center justify-between gap-3 rounded-xl border p-4 transition ${
                        p.enCarrito ? 'border-indigo-300 bg-indigo-50/60' : 'border-slate-200'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 truncate">{p.nombre_producto}</p>
                        <p className="text-sm text-slate-500">
                          Bs. {p.precio} · Stock: {p.stock}
                        </p>
                      </div>

                      {p.enCarrito ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center border border-slate-300 rounded-lg bg-white">
                            <button
                              onClick={() => decrementarCantidad(p.id_producto)}
                              disabled={p.cantidad <= 1}
                              aria-label="Restar cantidad"
                              className="p-2 text-slate-500 hover:text-indigo-600 disabled:opacity-40 disabled:hover:text-slate-500"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-8 text-center text-sm font-medium text-slate-800">
                              {p.cantidad}
                            </span>
                            <button
                              onClick={() => incrementarCantidad(p.id_producto)}
                              disabled={p.cantidad >= p.stock}
                              aria-label="Sumar cantidad"
                              className="p-2 text-slate-500 hover:text-indigo-600 disabled:opacity-40 disabled:hover:text-slate-500"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <button
                            onClick={() => quitarDelCarrito(p.id_producto)}
                            aria-label="Quitar del pedido"
                            className="p-2 text-slate-400 hover:text-red-600 transition"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => agregarAlCarrito(p.id_producto)}
                          className="shrink-0 inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg px-3 py-1.5 transition"
                        >
                          <Plus size={14} />
                          Agregar
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Resumen del pedido */}
                <div className="lg:col-span-1">
                  <div className="lg:sticky lg:top-6 bg-slate-50 border border-slate-200 rounded-xl p-5">
                    <h6 className="flex items-center gap-2 font-semibold text-slate-800 mb-3">
                      <ShoppingCart size={16} className="text-indigo-600" />
                      Tu pedido
                    </h6>

                    {itemsCarrito.length === 0 ? (
                      <p className="text-sm text-slate-400">Todavía no agregaste productos.</p>
                    ) : (
                      <div className="space-y-2 mb-4">
                        {itemsCarrito.map((p) => (
                          <div key={p.id_producto} className="flex justify-between gap-2 text-sm text-slate-600">
                            <span className="truncate">
                              {p.nombre_producto} × {p.cantidad}
                            </span>
                            <span className="font-medium text-slate-800 shrink-0">
                              Bs. {(parseFloat(p.precio) * p.cantidad).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between items-center border-t border-slate-200 pt-3 mb-4">
                      <span className="text-sm font-medium text-slate-700">Total</span>
                      <span className="text-lg font-semibold text-indigo-600">
                        Bs. {totalCarrito.toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={armarPedido}
                      disabled={itemsCarrito.length === 0}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg py-2 transition"
                    >
                      Continuar con el pedido
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </AppShell>
  );
}
