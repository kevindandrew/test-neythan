import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, Plus, Minus, X, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';

/**
 * Muestra los productos de una sucursal con un carrito para armar un pedido.
 * Se reutiliza desde "Para Ti", "Locales" y "Favoritos" en el panel de cliente.
 * El pedido se crea sin repartidor asignado: cualquier repartidor disponible
 * lo puede aceptar después desde "Entregar Pedido".
 */
export default function SelectorProductos({ sucursalId, sucursalNombre, onCerrar }) {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [pedidoConfirmado, setPedidoConfirmado] = useState(null);

  useEffect(() => {
    let activo = true;
    async function cargar() {
      setCargando(true);
      setError('');
      try {
        const data = await api.get(`/api/sucursal/${sucursalId}/productos`);
        if (activo) setProductos(data.map((p) => ({ ...p, cantidad: 1, enCarrito: false })));
      } catch (err) {
        if (activo) setError(err.message || 'No se pudieron cargar los productos de la sucursal.');
      } finally {
        if (activo) setCargando(false);
      }
    }
    cargar();
    return () => {
      activo = false;
    };
  }, [sucursalId]);

  function agregarAlCarrito(idProducto) {
    setError('');
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

  async function armarPedido() {
    setError('');
    if (itemsCarrito.length === 0) {
      setError('Agregá al menos un producto a tu pedido.');
      return;
    }

    const detalles = itemsCarrito.map((p) => ({
      id_producto: p.id_producto,
      cantidad: p.cantidad,
      precio: parseFloat(p.precio),
    }));

    setConfirmando(true);
    try {
      const data = await api.post('/api/pedido/crear', {
        id_sucursal: sucursalId,
        total: totalCarrito,
        detalles,
      });
      setPedidoConfirmado(data);
    } catch (err) {
      setError(err.message || 'Ocurrió un error al crear el pedido.');
    } finally {
      setConfirmando(false);
    }
  }

  if (pedidoConfirmado) {
    return (
      <section className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto text-center">
        <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <CheckCircle2 size={30} strokeWidth={2} />
        </div>
        <h2 className="text-lg font-semibold text-slate-800 mb-1">¡Pedido creado con éxito!</h2>
        <p className="text-sm text-slate-500 mb-4">
          Ya está disponible para que un repartidor lo acepte.
        </p>
        <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700 mb-6 space-y-1">
          <p>
            <span className="text-slate-500">ID de pedido:</span>{' '}
            <span className="font-medium">{pedidoConfirmado.id_pedido}</span>
          </p>
          <p>
            <span className="text-slate-500">Total a pagar:</span>{' '}
            <span className="font-medium">Bs. {Number(pedidoConfirmado.total_pagar).toFixed(2)}</span>
          </p>
          {pedidoConfirmado.direccion && (
            <p>
              <span className="text-slate-500">Dirección:</span>{' '}
              <span className="font-medium">{pedidoConfirmado.direccion}</span>
            </p>
          )}
        </div>
        <Link
          to="/cliente/mis-pedidos"
          className="inline-block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg py-2 transition"
        >
          Ver mis pedidos
        </Link>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h5 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
          <Package size={18} className="text-indigo-600" />
          Productos de {sucursalNombre}
        </h5>
        {onCerrar && (
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {error && (
        <div className="mb-3 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">{error}</div>
      )}

      {cargando ? (
        <p className="text-sm text-slate-400">Cargando productos...</p>
      ) : productos.length === 0 ? (
        <p className="text-sm text-slate-400">No hay productos en esta sucursal.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                disabled={itemsCarrito.length === 0 || confirmando}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg py-2 transition"
              >
                {confirmando ? 'Confirmando...' : 'Continuar con el pedido'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
