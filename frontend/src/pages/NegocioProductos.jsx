import { useEffect, useState } from 'react';
import { Package, PackagePlus, Plus, Trash2, X, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';
import AppShell from '../components/AppShell';
import { SkeletonTableRows } from '../components/Skeleton';
import { NEGOCIO_NAV_ITEMS } from './NegocioDashboard';

const FORM_INICIAL = {
  nombre: '',
  descripcion: '',
  precio_unitario: '',
  stock_producto: '',
  id_sucursal: '',
};

export default function NegocioProductos() {
  const [sucursales, setSucursales] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const [modalProductoAbierto, setModalProductoAbierto] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setCargando(true);
    setError('');
    try {
      const data = await api.get('/api/negocio/dashboard');
      setSucursales(data.sucursales || []);
      setProductos(data.productos || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los productos.');
    } finally {
      setCargando(false);
    }
  }

  function updateForm(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function abrirModalProducto() {
    setForm(FORM_INICIAL);
    setErrorForm('');
    setModalProductoAbierto(true);
  }

  function cerrarModalProducto() {
    setModalProductoAbierto(false);
    setErrorForm('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorForm('');
    setGuardando(true);
    try {
      await api.post('/api/negocio/producto', {
        nombre: form.nombre,
        descripcion: form.descripcion,
        precio_unitario: form.precio_unitario,
        stock_producto: form.stock_producto,
        id_sucursal: form.id_sucursal,
      });
      setModalProductoAbierto(false);
      setForm(FORM_INICIAL);
      setMensaje('Producto agregado con éxito.');
      await cargarDatos();
    } catch (err) {
      setErrorForm(err.message || 'No se pudo agregar el producto');
    } finally {
      setGuardando(false);
    }
  }

  function pedirConfirmacionEliminar(producto) {
    setErrorEliminar('');
    setProductoAEliminar(producto);
  }

  function cancelarEliminar() {
    setProductoAEliminar(null);
    setErrorEliminar('');
  }

  async function confirmarEliminar() {
    if (!productoAEliminar) return;
    setEliminando(true);
    setErrorEliminar('');
    try {
      await api.del(`/api/negocio/producto/${productoAEliminar.id_producto}`);
      setProductoAEliminar(null);
      setMensaje('Producto eliminado con éxito.');
      await cargarDatos();
    } catch (err) {
      setErrorEliminar(err.message || 'No se pudo eliminar el producto');
    } finally {
      setEliminando(false);
    }
  }

  return (
    <AppShell roleLabel="Negocio" navItems={NEGOCIO_NAV_ITEMS}>
      <div className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm px-4 py-2">{error}</div>
        )}
        {mensaje && (
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-sm px-4 py-2">
            {mensaje}
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
              <Package size={20} strokeWidth={2} className="text-red-600" />
              Mis Productos Registrados
            </h3>
            <button
              onClick={abrirModalProducto}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg px-4 py-2 transition"
            >
              <Plus size={16} strokeWidth={2} />
              Agregar Producto
            </button>
          </div>

          {cargando ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                    <th className="py-2 pr-4 font-medium">ID</th>
                    <th className="py-2 pr-4 font-medium">Nombre</th>
                    <th className="py-2 pr-4 font-medium">Descripción</th>
                    <th className="py-2 pr-4 font-medium">Precio</th>
                    <th className="py-2 pr-4 font-medium">Stock</th>
                    <th className="py-2 pr-4 font-medium">Sucursal</th>
                    <th className="py-2 pr-4 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <SkeletonTableRows rows={4} columns={7} />
                </tbody>
              </table>
            </div>
          ) : productos.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No hay productos registrados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                    <th className="py-2 pr-4 font-medium">ID</th>
                    <th className="py-2 pr-4 font-medium">Nombre</th>
                    <th className="py-2 pr-4 font-medium">Descripción</th>
                    <th className="py-2 pr-4 font-medium">Precio</th>
                    <th className="py-2 pr-4 font-medium">Stock</th>
                    <th className="py-2 pr-4 font-medium">Sucursal</th>
                    <th className="py-2 pr-4 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((p) => (
                    <tr key={p.id_producto} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700">
                      <td className="py-2 pr-4">{p.id_producto}</td>
                      <td className="py-2 pr-4">{p.nombre}</td>
                      <td className="py-2 pr-4">{p.descripcion || '-'}</td>
                      <td className="py-2 pr-4">Bs {p.precio_unitario}</td>
                      <td className="py-2 pr-4">{p.stock_producto}</td>
                      <td className="py-2 pr-4">{p.sucursal_nombre}</td>
                      <td className="py-2 pr-4">
                        <button
                          onClick={() => pedirConfirmacionEliminar(p)}
                          className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg px-3 py-1.5 transition"
                        >
                          <Trash2 size={14} strokeWidth={2} />
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmación de eliminación */}
      {productoAEliminar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 w-full max-w-sm">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40">
              <AlertTriangle size={22} strokeWidth={2} className="text-red-600" />
            </div>
            <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Eliminar producto</h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              ¿Seguro que querés eliminar «{productoAEliminar.nombre}»? Esta acción no se puede deshacer.
            </p>
            {errorEliminar && (
              <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm px-4 py-2">{errorEliminar}</div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelarEliminar}
                disabled={eliminando}
                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 px-3 py-2 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminar}
                disabled={eliminando}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg px-4 py-2 transition"
              >
                {eliminando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Agregar Nuevo Producto */}
      {modalProductoAbierto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
                <PackagePlus size={20} strokeWidth={2} className="text-red-600" />
                Agregar Nuevo Producto
              </h3>
              <button
                onClick={cerrarModalProducto}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            {errorForm && (
              <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm px-4 py-2">
                {errorForm}
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  Nombre del producto
                </label>
                <input
                  type="text"
                  required
                  value={form.nombre}
                  onChange={(e) => updateForm('nombre', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Descripción</label>
                <input
                  type="text"
                  value={form.descripcion}
                  onChange={(e) => updateForm('descripcion', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Precio (Bs)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={form.precio_unitario}
                  onChange={(e) => updateForm('precio_unitario', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Stock</label>
                <input
                  type="number"
                  required
                  value={form.stock_producto}
                  onChange={(e) => updateForm('stock_producto', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Sucursal</label>
                <select
                  required
                  value={form.id_sucursal}
                  onChange={(e) => updateForm('id_sucursal', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="">Selecciona Sucursal</option>
                  {sucursales.map((s) => (
                    <option key={s.id_sucursal} value={s.id_sucursal}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2 flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={cerrarModalProducto}
                  disabled={guardando}
                  className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 px-3 py-2 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-medium rounded-lg px-4 py-2 text-sm transition"
                >
                  {guardando ? 'Guardando...' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
