import { useEffect, useState } from 'react';
import { Package, PackagePlus, Plus, Pencil, Trash2, X, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';
import AppShell from '../components/AppShell';
import { SkeletonTableRows } from '../components/Skeleton';
import { ADMIN_NAV_ITEMS } from './AdminDashboard';

const FORM_INICIAL = {
  nombre: '',
  descripcion: '',
  precio_unitario: '',
  stock_producto: '',
  id_sucursal: '',
};

const FORM_EDITAR_INICIAL = {
  nombre: '',
  descripcion: '',
  precio_unitario: '',
  stock_producto: '',
};

export default function AdminProductos() {
  const [sucursales, setSucursales] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const [modalProductoAbierto, setModalProductoAbierto] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  const [productoEditando, setProductoEditando] = useState(null);
  const [formEditar, setFormEditar] = useState(FORM_EDITAR_INICIAL);
  const [guardandoEditar, setGuardandoEditar] = useState(false);
  const [errorEditar, setErrorEditar] = useState('');

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
      const [sucursalesData, productosData] = await Promise.all([
        api.get('/api/admin/sucursales'),
        api.get('/api/admin/productos'),
      ]);
      setSucursales(sucursalesData || []);
      setProductos(productosData || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los productos.');
    } finally {
      setCargando(false);
    }
  }

  function updateForm(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function updateFormEditar(campo, valor) {
    setFormEditar((prev) => ({ ...prev, [campo]: valor }));
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
      await api.post('/api/admin/producto', {
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

  function abrirEditar(producto) {
    setFormEditar({
      nombre: producto.nombre || '',
      descripcion: producto.descripcion || '',
      precio_unitario: producto.precio_unitario ?? '',
      stock_producto: producto.stock_producto ?? '',
    });
    setErrorEditar('');
    setProductoEditando(producto);
  }

  function cerrarEditar() {
    setProductoEditando(null);
    setErrorEditar('');
  }

  async function handleSubmitEditar(e) {
    e.preventDefault();
    setErrorEditar('');
    setGuardandoEditar(true);
    try {
      await api.put(`/api/admin/producto/${productoEditando.id_producto}`, {
        nombre: formEditar.nombre,
        descripcion: formEditar.descripcion,
        precio_unitario: formEditar.precio_unitario,
        stock_producto: formEditar.stock_producto,
      });
      setProductoEditando(null);
      setMensaje('Producto actualizado con éxito.');
      await cargarDatos();
    } catch (err) {
      setErrorEditar(err.message || 'No se pudo actualizar el producto');
    } finally {
      setGuardandoEditar(false);
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
      await api.del(`/api/admin/producto/${productoAEliminar.id_producto}`);
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
    <AppShell roleLabel="Super Administrador" navItems={ADMIN_NAV_ITEMS}>
      <div className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2 dark:bg-red-950/40 dark:text-red-300">{error}</div>
        )}
        {mensaje && (
          <div className="rounded-lg bg-emerald-50 text-emerald-700 text-sm px-4 py-2 dark:bg-emerald-950/40 dark:text-emerald-300">
            {mensaje}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-6 dark:bg-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
              <Package size={20} strokeWidth={2} className="text-red-600" />
              Todos los Productos Registrados
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
                  <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <th className="py-2 pr-4 font-medium">ID</th>
                    <th className="py-2 pr-4 font-medium">Nombre</th>
                    <th className="py-2 pr-4 font-medium">Descripción</th>
                    <th className="py-2 pr-4 font-medium">Precio</th>
                    <th className="py-2 pr-4 font-medium">Stock</th>
                    <th className="py-2 pr-4 font-medium">Sucursal</th>
                    <th className="py-2 pr-4 font-medium">Negocio</th>
                    <th className="py-2 pr-4 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <SkeletonTableRows rows={4} columns={8} />
                </tbody>
              </table>
            </div>
          ) : productos.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No hay productos registrados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <th className="py-2 pr-4 font-medium">ID</th>
                    <th className="py-2 pr-4 font-medium">Nombre</th>
                    <th className="py-2 pr-4 font-medium">Descripción</th>
                    <th className="py-2 pr-4 font-medium">Precio</th>
                    <th className="py-2 pr-4 font-medium">Stock</th>
                    <th className="py-2 pr-4 font-medium">Sucursal</th>
                    <th className="py-2 pr-4 font-medium">Negocio</th>
                    <th className="py-2 pr-4 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((p) => (
                    <tr key={p.id_producto} className="border-b border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800">
                      <td className="py-2 pr-4">{p.id_producto}</td>
                      <td className="py-2 pr-4">{p.nombre}</td>
                      <td className="py-2 pr-4">{p.descripcion || '-'}</td>
                      <td className="py-2 pr-4">Bs {p.precio_unitario}</td>
                      <td className="py-2 pr-4">{p.stock_producto}</td>
                      <td className="py-2 pr-4">{p.sucursal_nombre}</td>
                      <td className="py-2 pr-4">{p.nombre_negocio}</td>
                      <td className="py-2 pr-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => abrirEditar(p)}
                            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 text-xs font-medium rounded-lg px-3 py-1.5 transition"
                          >
                            <Pencil size={14} strokeWidth={2} />
                            Editar
                          </button>
                          <button
                            onClick={() => pedirConfirmacionEliminar(p)}
                            className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg px-3 py-1.5 transition"
                          >
                            <Trash2 size={14} strokeWidth={2} />
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Editar Producto */}
      {productoEditando && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-6 dark:bg-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
                <Pencil size={20} strokeWidth={2} className="text-red-600" />
                Editar Producto (ID {productoEditando.id_producto})
              </h3>
              <button
                onClick={cerrarEditar}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            {errorEditar && (
              <div className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2 dark:bg-red-950/40 dark:text-red-300">
                {errorEditar}
              </div>
            )}

            <form onSubmit={handleSubmitEditar} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-200">
                  Nombre del producto
                </label>
                <input
                  type="text"
                  required
                  value={formEditar.nombre}
                  onChange={(e) => updateFormEditar('nombre', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-200">Descripción</label>
                <input
                  type="text"
                  value={formEditar.descripcion}
                  onChange={(e) => updateFormEditar('descripcion', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-200">Precio (Bs)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formEditar.precio_unitario}
                  onChange={(e) => updateFormEditar('precio_unitario', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-200">Stock</label>
                <input
                  type="number"
                  required
                  value={formEditar.stock_producto}
                  onChange={(e) => updateFormEditar('stock_producto', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
                />
              </div>
              <div className="sm:col-span-2 flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={cerrarEditar}
                  disabled={guardandoEditar}
                  className="text-sm font-medium text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100 px-3 py-2 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoEditar}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-medium rounded-lg px-4 py-2 text-sm transition"
                >
                  {guardandoEditar ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {productoAEliminar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 dark:bg-slate-800 w-full max-w-sm">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40">
              <AlertTriangle size={22} strokeWidth={2} className="text-red-600" />
            </div>
            <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Eliminar producto</h4>
            <p className="text-sm text-slate-600 mb-4 dark:text-slate-300">
              ¿Seguro que querés eliminar «{productoAEliminar.nombre}»? Esta acción no se puede deshacer.
            </p>
            {errorEliminar && (
              <div className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2 dark:bg-red-950/40 dark:text-red-300">{errorEliminar}</div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelarEliminar}
                disabled={eliminando}
                className="text-sm font-medium text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100 px-3 py-2 rounded-lg transition"
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
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-6 dark:bg-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
                <PackagePlus size={20} strokeWidth={2} className="text-red-600" />
                Agregar Nuevo Producto
              </h3>
              <button
                onClick={cerrarModalProducto}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            {errorForm && (
              <div className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2 dark:bg-red-950/40 dark:text-red-300">
                {errorForm}
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-200">
                  Nombre del producto
                </label>
                <input
                  type="text"
                  required
                  value={form.nombre}
                  onChange={(e) => updateForm('nombre', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-200">Descripción</label>
                <input
                  type="text"
                  value={form.descripcion}
                  onChange={(e) => updateForm('descripcion', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-200">Precio (Bs)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={form.precio_unitario}
                  onChange={(e) => updateForm('precio_unitario', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-200">Stock</label>
                <input
                  type="number"
                  required
                  value={form.stock_producto}
                  onChange={(e) => updateForm('stock_producto', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-200">Sucursal</label>
                <select
                  required
                  value={form.id_sucursal}
                  onChange={(e) => updateForm('id_sucursal', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
                >
                  <option value="">Selecciona Sucursal</option>
                  {sucursales.map((s) => (
                    <option key={s.id_sucursal} value={s.id_sucursal}>
                      {s.nombre} — {s.nombre_negocio}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2 flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={cerrarModalProducto}
                  disabled={guardando}
                  className="text-sm font-medium text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100 px-3 py-2 rounded-lg transition"
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
