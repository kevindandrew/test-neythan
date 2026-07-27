import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  Wallet,
  PackagePlus,
  Package,
  Receipt,
  Trash2,
  ArrowRight,
  AlertTriangle,
  BarChart3,
  Calculator,
  Plus,
  X,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import AppShell from '../components/AppShell';
import StatTile from '../components/StatTile';
import SimpleBarChart from '../components/SimpleBarChart';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/dashboard/sucursales', label: 'Sucursales', icon: Store },
];

const FORM_INICIAL = {
  nombre: '',
  descripcion: '',
  precio_unitario: '',
  stock_producto: '',
  id_sucursal: '',
};

export default function NegocioDashboard() {
  const { usuario } = useAuth();
  const [sucursales, setSucursales] = useState([]);
  const [productos, setProductos] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [gananciasTotales, setGananciasTotales] = useState(0);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [modalProductoAbierto, setModalProductoAbierto] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');
  const [mensaje, setMensaje] = useState('');

  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState('');

  useEffect(() => {
    cargarDashboard();
  }, []);

  async function cargarDashboard() {
    setCargando(true);
    setError('');
    try {
      const data = await api.get('/api/negocio/dashboard');
      setSucursales(data.sucursales || []);
      setProductos(data.productos || []);
      setFacturas(data.facturas || []);
      setGananciasTotales(Number(data.ganancias_totales) || 0);
    } catch (err) {
      setError(err.message || 'No se pudo cargar el panel del negocio');
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

  const facturasPorDia = useMemo(() => {
    const grupos = new Map();
    facturas.forEach((f) => {
      const fecha = f.fecha_emision ? new Date(f.fecha_emision) : null;
      const clave = fecha
        ? fecha.toLocaleDateString('es-BO', { day: '2-digit', month: 'short' })
        : 'N/D';
      grupos.set(clave, (grupos.get(clave) || 0) + Number(f.total || 0));
    });
    return Array.from(grupos, ([label, value]) => ({ label, value }));
  }, [facturas]);

  const promedioPorFactura = facturas.length ? gananciasTotales / facturas.length : 0;

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
      await cargarDashboard();
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
      await cargarDashboard();
    } catch (err) {
      setErrorEliminar(err.message || 'No se pudo eliminar el producto');
    } finally {
      setEliminando(false);
    }
  }

  return (
    <AppShell roleLabel={usuario?.nombre_negocio || 'Negocio'} navItems={NAV_ITEMS}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-slate-800">{usuario?.nombre_negocio}</h1>

        {error && (
          <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">{error}</div>
        )}
        {mensaje && (
          <div className="rounded-lg bg-emerald-50 text-emerald-700 text-sm px-4 py-2">
            {mensaje}
          </div>
        )}

        {/* Ganancias totales */}
        <div className="bg-emerald-600 text-white rounded-2xl shadow-lg p-6">
          <h2 className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-emerald-100">
            <Wallet size={16} strokeWidth={2} />
            Ganancias Totales Acumuladas
          </h2>
          <p className="text-5xl font-bold mt-2">Bs {gananciasTotales.toFixed(2)}</p>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatTile icon={Package} label="Productos registrados" value={productos.length} />
          <StatTile icon={Receipt} label="Facturas emitidas" value={facturas.length} />
          <StatTile
            icon={Calculator}
            label="Promedio por factura"
            value={`Bs ${promedioPorFactura.toFixed(2)}`}
          />
        </div>

        {/* Facturas por día */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-4">
            <BarChart3 size={20} strokeWidth={2} className="text-indigo-600" />
            Facturación por Día
          </h3>
          {cargando ? (
            <p className="text-sm text-slate-500">Cargando...</p>
          ) : facturasPorDia.length === 0 ? (
            <p className="text-sm text-slate-500">Todavía no hay facturas para graficar.</p>
          ) : (
            <SimpleBarChart data={facturasPorDia} valuePrefix="Bs " />
          )}
        </div>

        {/* Productos */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
              <Package size={20} strokeWidth={2} className="text-indigo-600" />
              Mis Productos Registrados
            </h3>
            <div className="flex items-center gap-2">
              <Link
                to="/dashboard/sucursales"
                className="inline-flex items-center gap-2 text-sm border border-slate-300 text-slate-600 hover:bg-slate-100 font-medium rounded-lg px-4 py-2 transition"
              >
                Ver Detalle por Sucursal
                <ArrowRight size={16} strokeWidth={2} />
              </Link>
              <button
                onClick={abrirModalProducto}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg px-4 py-2 transition"
              >
                <Plus size={16} strokeWidth={2} />
                Agregar Producto
              </button>
            </div>
          </div>

          {cargando ? (
            <p className="text-sm text-slate-500">Cargando productos...</p>
          ) : productos.length === 0 ? (
            <p className="text-sm text-slate-500">No hay productos registrados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
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
                    <tr key={p.id_producto} className="border-b border-slate-100 hover:bg-slate-50">
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

        {/* Facturas */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-4">
            <Receipt size={20} strokeWidth={2} className="text-indigo-600" />
            Facturas Registradas
          </h3>

          {cargando ? (
            <p className="text-sm text-slate-500">Cargando facturas...</p>
          ) : facturas.length === 0 ? (
            <p className="text-sm text-slate-500">No hay facturas registradas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-4 font-medium">ID Factura</th>
                    <th className="py-2 pr-4 font-medium">NIT</th>
                    <th className="py-2 pr-4 font-medium">Nro Autorización</th>
                    <th className="py-2 pr-4 font-medium">Tipo Pago</th>
                    <th className="py-2 pr-4 font-medium">Monto</th>
                    <th className="py-2 pr-4 font-medium">Fecha Emisión</th>
                  </tr>
                </thead>
                <tbody>
                  {facturas.map((f) => (
                    <tr key={f.id_factura} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 pr-4">{f.id_factura}</td>
                      <td className="py-2 pr-4">{f.nit}</td>
                      <td className="py-2 pr-4">{f.nro_autorizacion}</td>
                      <td className="py-2 pr-4">{f.tipo_pago}</td>
                      <td className="py-2 pr-4">Bs {f.total}</td>
                      <td className="py-2 pr-4">{f.fecha_emision}</td>
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
          <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle size={22} strokeWidth={2} className="text-red-600" />
            </div>
            <h4 className="text-lg font-semibold text-slate-800 mb-2">Eliminar producto</h4>
            <p className="text-sm text-slate-600 mb-4">
              ¿Seguro que querés eliminar «{productoAEliminar.nombre}»? Esta acción no se puede deshacer.
            </p>
            {errorEliminar && (
              <div className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">{errorEliminar}</div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelarEliminar}
                disabled={eliminando}
                className="text-sm font-medium text-slate-600 hover:text-slate-800 px-3 py-2 rounded-lg transition"
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
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                <PackagePlus size={20} strokeWidth={2} className="text-indigo-600" />
                Agregar Nuevo Producto
              </h3>
              <button
                onClick={cerrarModalProducto}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            {errorForm && (
              <div className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">
                {errorForm}
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre del producto
                </label>
                <input
                  type="text"
                  required
                  value={form.nombre}
                  onChange={(e) => updateForm('nombre', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                <input
                  type="text"
                  value={form.descripcion}
                  onChange={(e) => updateForm('descripcion', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Precio (Bs)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={form.precio_unitario}
                  onChange={(e) => updateForm('precio_unitario', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Stock</label>
                <input
                  type="number"
                  required
                  value={form.stock_producto}
                  onChange={(e) => updateForm('stock_producto', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Sucursal</label>
                <select
                  required
                  value={form.id_sucursal}
                  onChange={(e) => updateForm('id_sucursal', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  className="text-sm font-medium text-slate-600 hover:text-slate-800 px-3 py-2 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium rounded-lg px-4 py-2 text-sm transition"
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
