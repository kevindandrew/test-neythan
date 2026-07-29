import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  X,
  Plus,
  Minus,
  Trash2,
  Store,
  MapPin,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { useCart } from '../cart/CartContext';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';

export default function CarritoFlotante() {
  const auth = useAuth();
  const cart = useCart();
  const [abierto, setAbierto] = useState(false);
  const [vista, setVista] = useState('carrito'); // 'carrito' | 'checkout' | 'confirmado'
  const [direccion, setDireccion] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState('');
  const [pedidosCreados, setPedidosCreados] = useState([]);

  if (!auth || auth.rol !== 'cliente' || !cart) return null;

  function abrir() {
    setError('');
    setVista('carrito');
    setDireccion(auth.usuario?.direccion || '');
    setAbierto(true);
  }

  function cerrar() {
    setAbierto(false);
  }

  async function confirmarCompra() {
    setError('');
    setConfirmando(true);
    const creados = [];
    try {
      for (const grupo of cart.grupos) {
        const totalGrupo = grupo.items.reduce(
          (acc, i) => acc + parseFloat(i.precio) * i.cantidad,
          0
        );
        const detalles = grupo.items.map((i) => ({
          id_producto: i.id_producto,
          cantidad: i.cantidad,
        }));
        const data = await api.post('/api/pedido/crear', {
          id_sucursal: grupo.id_sucursal,
          total: totalGrupo,
          direccion,
          detalles,
        });
        creados.push({
          ...data,
          sucursal_nombre: grupo.sucursal_nombre,
          nombre_negocio: grupo.nombre_negocio,
        });
      }
      setPedidosCreados(creados);
      cart.vaciarCarrito();
      setVista('confirmado');
    } catch (err) {
      setError(err.message || 'Ocurrió un error al confirmar la compra.');
    } finally {
      setConfirmando(false);
    }
  }

  if (!abierto && cart.cantidadTotal === 0) return null;

  return (
    <>
      {cart.cantidadTotal > 0 && !abierto && (
        <button
          onClick={abrir}
          aria-label="Abrir carrito"
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl px-5 py-3.5 transition"
        >
          <span className="relative shrink-0">
            <ShoppingCart size={20} />
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-indigo-600 text-[11px] font-bold">
              {cart.cantidadTotal}
            </span>
          </span>
          <span className="text-sm font-semibold">Bs. {cart.totalCarrito.toFixed(2)}</span>
        </button>
      )}

      {abierto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-6 max-h-[85vh] flex flex-col">
            {vista === 'confirmado' ? (
              <div className="text-center py-4">
                <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 size={30} strokeWidth={2} />
                </div>
                <h2 className="text-lg font-semibold text-slate-800 mb-1">
                  ¡Compra confirmada!
                </h2>
                <p className="text-sm text-slate-500 mb-4">
                  {pedidosCreados.length === 1
                    ? 'Tu pedido ya está disponible para que un repartidor lo acepte.'
                    : `Se generaron ${pedidosCreados.length} pedidos (uno por cada tienda), ya disponibles para que un repartidor los acepte.`}
                </p>
                <div className="space-y-2 mb-6 text-left">
                  {pedidosCreados.map((p) => (
                    <div
                      key={p.id_pedido}
                      className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700"
                    >
                      <p className="font-medium">
                        {p.nombre_negocio} · {p.sucursal_nombre}
                      </p>
                      <p className="text-slate-500">
                        Pedido #{p.id_pedido} · Bs. {Number(p.total_pagar).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
                <Link
                  to="/cliente/mis-pedidos"
                  onClick={cerrar}
                  className="inline-block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg py-2 transition"
                >
                  Ver mis pedidos
                </Link>
              </div>
            ) : vista === 'checkout' ? (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => setVista('carrito')}
                    aria-label="Volver al carrito"
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <h3 className="text-lg font-semibold text-slate-800">Confirmar compra</h3>
                </div>

                {error && (
                  <div className="mb-3 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">
                    {error}
                  </div>
                )}

                <div className="overflow-y-auto -mx-1 px-1 space-y-4">
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                      <MapPin size={14} />
                      Dirección de entrega
                    </label>
                    <input
                      type="text"
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      placeholder="Ej: Av. Siempre Viva 123"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-3">
                    {cart.grupos.map((grupo) => {
                      const subtotal = grupo.items.reduce(
                        (acc, i) => acc + parseFloat(i.precio) * i.cantidad,
                        0
                      );
                      return (
                        <div
                          key={grupo.id_sucursal}
                          className="rounded-xl border border-slate-200 p-4"
                        >
                          <p className="flex items-center gap-1.5 font-medium text-slate-800 text-sm mb-2">
                            <Store size={14} className="text-indigo-600" />
                            {grupo.nombre_negocio} · {grupo.sucursal_nombre}
                          </p>
                          <div className="space-y-1 mb-2">
                            {grupo.items.map((i) => (
                              <div
                                key={i.id_producto}
                                className="flex justify-between text-sm text-slate-600"
                              >
                                <span className="truncate">
                                  {i.nombre_producto} × {i.cantidad}
                                </span>
                                <span className="shrink-0">
                                  Bs. {(parseFloat(i.precio) * i.cantidad).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between text-sm font-medium text-slate-700 border-t border-slate-100 pt-2">
                            <span>Subtotal + envío</span>
                            <span>Bs. {(subtotal + 10).toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-slate-700">
                      Total ({cart.grupos.length} {cart.grupos.length === 1 ? 'tienda' : 'tiendas'})
                    </span>
                    <span className="text-lg font-semibold text-indigo-600">
                      Bs. {(cart.totalCarrito + cart.grupos.length * 10).toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={confirmarCompra}
                    disabled={confirmando || !direccion.trim()}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg py-2.5 transition"
                  >
                    {confirmando ? 'Confirmando...' : 'Confirmar compra'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                    <ShoppingCart size={20} className="text-indigo-600" />
                    Tu carrito
                  </h3>
                  <button
                    onClick={cerrar}
                    aria-label="Cerrar"
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X size={20} />
                  </button>
                </div>

                {cart.grupos.length === 0 ? (
                  <p className="text-sm text-slate-400 py-6 text-center">
                    Todavía no agregaste productos. Elegí algo desde "Para Ti" o "Locales".
                  </p>
                ) : (
                  <div className="overflow-y-auto -mx-1 px-1 space-y-4">
                    {cart.grupos.map((grupo) => (
                      <div key={grupo.id_sucursal} className="rounded-xl border border-slate-200 p-4">
                        <p className="flex items-center gap-1.5 font-medium text-slate-800 text-sm mb-3">
                          <Store size={14} className="text-indigo-600" />
                          {grupo.nombre_negocio} · {grupo.sucursal_nombre}
                        </p>
                        <div className="space-y-2">
                          {grupo.items.map((i) => (
                            <div key={i.id_producto} className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm text-slate-700 truncate">{i.nombre_producto}</p>
                                <p className="text-xs text-slate-400">Bs. {i.precio} c/u</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="flex items-center border border-slate-300 rounded-lg bg-white">
                                  <button
                                    onClick={() => cart.decrementar(i.id_producto)}
                                    disabled={i.cantidad <= 1}
                                    aria-label="Restar cantidad"
                                    className="p-1.5 text-slate-500 hover:text-indigo-600 disabled:opacity-40"
                                  >
                                    <Minus size={13} />
                                  </button>
                                  <span className="w-6 text-center text-xs font-medium text-slate-800">
                                    {i.cantidad}
                                  </span>
                                  <button
                                    onClick={() => cart.incrementar(i.id_producto)}
                                    disabled={i.cantidad >= i.stock}
                                    aria-label="Sumar cantidad"
                                    className="p-1.5 text-slate-500 hover:text-indigo-600 disabled:opacity-40"
                                  >
                                    <Plus size={13} />
                                  </button>
                                </div>
                                <button
                                  onClick={() => cart.quitarProducto(i.id_producto)}
                                  aria-label="Quitar del carrito"
                                  className="p-1.5 text-slate-400 hover:text-red-600 transition"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-slate-700">Subtotal</span>
                    <span className="text-lg font-semibold text-indigo-600">
                      Bs. {cart.totalCarrito.toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={() => setVista('checkout')}
                    disabled={cart.grupos.length === 0}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg py-2.5 transition"
                  >
                    Comprar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}