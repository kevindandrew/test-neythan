import { useEffect, useState } from 'react';
import { Package, Plus, Minus, X } from 'lucide-react';
import { api } from '../api/client';
import { useCart } from '../cart/CartContext';

/**
 * Modal de productos de una sucursal. Agregar un producto lo manda directo
 * al carrito global (fixed, visible en toda la sección Cliente), que puede
 * contener productos de distintas sucursales y negocios a la vez.
 */
export default function SelectorProductos({ sucursalId, sucursalNombre, nombreNegocio, onCerrar }) {
  const cart = useCart();
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    async function cargar() {
      setCargando(true);
      setError('');
      try {
        const data = await api.get(`/api/sucursal/${sucursalId}/productos`);
        if (activo) setProductos(data);
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

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-6 max-h-[85vh] flex flex-col">
        <div className="flex items-start justify-between mb-4">
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
          <div className="mb-3 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">{error}</div>
        )}

        <div className="overflow-y-auto -mx-1 px-1 space-y-2">
          {cargando ? (
            <p className="text-sm text-slate-400">Cargando productos...</p>
          ) : productos.length === 0 ? (
            <p className="text-sm text-slate-400">No hay productos en esta sucursal.</p>
          ) : (
            productos.map((p) => {
              const enCarrito = cantidadEnCarrito(p.id_producto);
              return (
                <div
                  key={p.id_producto}
                  className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 transition ${
                    enCarrito > 0 ? 'border-indigo-300 bg-indigo-50/60' : 'border-slate-200'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 truncate">{p.nombre_producto}</p>
                    <p className="text-sm text-slate-500">
                      Bs. {p.precio} · Stock: {p.stock}
                    </p>
                  </div>

                  {enCarrito > 0 ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center border border-slate-300 rounded-lg bg-white">
                        <button
                          onClick={() => cart.decrementar(p.id_producto)}
                          disabled={enCarrito <= 1}
                          aria-label="Restar cantidad"
                          className="p-2 text-slate-500 hover:text-indigo-600 disabled:opacity-40 disabled:hover:text-slate-500"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-sm font-medium text-slate-800">
                          {enCarrito}
                        </span>
                        <button
                          onClick={() => cart.incrementar(p.id_producto)}
                          disabled={enCarrito >= p.stock}
                          aria-label="Sumar cantidad"
                          className="p-2 text-slate-500 hover:text-indigo-600 disabled:opacity-40 disabled:hover:text-slate-500"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        onClick={() => cart.quitarProducto(p.id_producto)}
                        aria-label="Quitar del carrito"
                        className="p-2 text-slate-400 hover:text-red-600 transition"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => agregar(p)}
                      className="shrink-0 inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg px-3 py-1.5 transition"
                    >
                      <Plus size={14} />
                      Agregar
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        <button
          onClick={onCerrar}
          className="mt-4 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg py-2.5 text-sm transition"
        >
          Listo
        </button>
      </div>
    </div>
  );
}