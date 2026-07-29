import { useEffect, useState } from 'react';
import { Package, Plus, Minus, X } from 'lucide-react';
import { api } from '../api/client';
import { useCart } from '../cart/CartContext';
import { imagenProducto } from '../utils/placeholderImage';

/**
 * Modal de producto: a la izquierda la imagen grande del producto enfocado
 * con su botón de agregar al carrito, a la derecha el resto de productos de
 * la misma sucursal (clickeables, cambian el foco sin cerrar el modal).
 */
export default function SelectorProductos({
  sucursalId,
  sucursalNombre,
  nombreNegocio,
  productoInicialId,
  onCerrar,
}) {
  const cart = useCart();
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [focoId, setFocoId] = useState(productoInicialId ?? null);

  useEffect(() => {
    let activo = true;
    async function cargar() {
      setCargando(true);
      setError('');
      try {
        const data = await api.get(`/api/sucursal/${sucursalId}/productos`);
        if (activo) {
          setProductos(data);
          setFocoId((actual) => actual ?? data[0]?.id_producto ?? null);
        }
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

  function cantidadEnCarrito(idProducto) {
    const item = cart.items.find((i) => i.id_producto === idProducto);
    return item ? item.cantidad : 0;
  }

  function agregar(producto) {
    cart.agregarProducto({
      id_producto: producto.id_producto,
      nombre_producto: producto.nombre_producto,
      precio: producto.precio,
      stock: producto.stock,
      id_sucursal: sucursalId,
      sucursal_nombre: sucursalNombre,
      nombre_negocio: nombreNegocio,
    });
  }

  const productoFocal = productos.find((p) => p.id_producto === focoId) || null;
  const enCarritoFocal = productoFocal ? cantidadEnCarrito(productoFocal.id_producto) : 0;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg overflow-hidden max-h-[85vh] flex flex-col">
        <div className="flex items-start justify-between px-6 pt-6">
          <div className="min-w-0">
            <h5 className="flex items-center gap-2 text-lg font-semibold text-slate-800 truncate">
              <Package size={18} className="text-indigo-600 shrink-0" />
              {sucursalNombre}
            </h5>
            {nombreNegocio && <p className="text-xs text-slate-400 mt-0.5 truncate">{nombreNegocio}</p>}
          </div>
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="text-slate-400 hover:text-slate-600 shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-3 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">
            {error}
          </div>
        )}

        {cargando ? (
          <p className="text-sm text-slate-400 px-6 py-8">Cargando productos...</p>
        ) : productos.length === 0 ? (
          <p className="text-sm text-slate-400 px-6 py-8">No hay productos en esta sucursal.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 overflow-hidden mt-4 flex-1 min-h-0">
            {/* Columna izquierda: producto enfocado */}
            <div className="p-6 flex flex-col overflow-y-auto">
              {productoFocal && (
                <>
                  <img
                    src={imagenProducto(productoFocal.id_producto)}
                    alt={productoFocal.nombre_producto}
                    className="w-full h-48 object-cover rounded-xl mb-4"
                    loading="lazy"
                  />
                  <h3 className="text-lg font-semibold text-slate-800">
                    {productoFocal.nombre_producto}
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Bs. {productoFocal.precio} · Stock: {productoFocal.stock}
                  </p>

                  <div className="mt-auto">
                    {enCarritoFocal > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-slate-300 rounded-lg bg-white">
                          <button
                            onClick={() => cart.decrementar(productoFocal.id_producto)}
                            disabled={enCarritoFocal <= 1}
                            aria-label="Restar cantidad"
                            className="p-2.5 text-slate-500 hover:text-indigo-600 disabled:opacity-40"
                          >
                            <Minus size={15} />
                          </button>
                          <span className="w-10 text-center text-sm font-medium text-slate-800">
                            {enCarritoFocal}
                          </span>
                          <button
                            onClick={() => cart.incrementar(productoFocal.id_producto)}
                            disabled={enCarritoFocal >= productoFocal.stock}
                            aria-label="Sumar cantidad"
                            className="p-2.5 text-slate-500 hover:text-indigo-600 disabled:opacity-40"
                          >
                            <Plus size={15} />
                          </button>
                        </div>
                        <button
                          onClick={() => cart.quitarProducto(productoFocal.id_producto)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg px-3 py-2.5 transition"
                        >
                          Quitar del carrito
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => agregar(productoFocal)}
                        className="w-full inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg px-4 py-2.5 transition"
                      >
                        <Plus size={16} />
                        Añadir al carrito
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Columna derecha: resto de productos de la sucursal */}
            <div className="border-t sm:border-t-0 sm:border-l border-slate-100 p-4 overflow-y-auto space-y-2">
              {productos.map((p) => {
                const enfocado = p.id_producto === focoId;
                const enCarrito = cantidadEnCarrito(p.id_producto);
                return (
                  <button
                    key={p.id_producto}
                    onClick={() => setFocoId(p.id_producto)}
                    className={`w-full flex items-center gap-3 rounded-xl border p-2.5 text-left transition ${
                      enfocado
                        ? 'border-indigo-400 ring-2 ring-indigo-100 bg-indigo-50/40'
                        : 'border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <img
                      src={imagenProducto(p.id_producto)}
                      alt={p.nombre_producto}
                      className="h-14 w-14 rounded-lg object-cover shrink-0"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {p.nombre_producto}
                      </p>
                      <p className="text-xs text-slate-500">Bs. {p.precio}</p>
                    </div>
                    {enCarrito > 0 && (
                      <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-semibold">
                        {enCarrito}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
