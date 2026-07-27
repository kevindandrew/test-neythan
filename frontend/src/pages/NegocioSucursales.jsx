import { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Store,
  Plus,
  X,
  Package,
  ClipboardList,
  Trash2,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import AppShell from '../components/AppShell';
import EstadoBadge from '../components/EstadoBadge';
import SimpleBarChart from '../components/SimpleBarChart';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/dashboard/sucursales', label: 'Sucursales', icon: Store },
];

const initialForm = { nombre: '', direccion: '' };

export default function NegocioSucursales() {
  const { usuario } = useAuth();
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  const [sucursalAEliminar, setSucursalAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState('');

  useEffect(() => {
    cargarSucursales();
  }, []);

  async function cargarSucursales() {
    setCargando(true);
    setError('');
    try {
      const data = await api.get('/api/negocio/detalle-sucursales');
      setDatos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Error al cargar datos.');
    } finally {
      setCargando(false);
    }
  }

  function abrirModal() {
    setForm(initialForm);
    setErrorForm('');
    setModalAbierto(true);
  }

  function cerrarModal() {
    setModalAbierto(false);
    setErrorForm('');
  }

  function actualizarForm(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function handleSubmitNuevaSucursal(e) {
    e.preventDefault();
    setErrorForm('');
    setGuardando(true);
    try {
      await api.post('/api/negocio/sucursal', form);
      setModalAbierto(false);
      setForm(initialForm);
      setMensaje('¡Sucursal registrada con éxito!');
      await cargarSucursales();
    } catch (err) {
      setErrorForm(err.message || 'Error al registrar la sucursal.');
    } finally {
      setGuardando(false);
    }
  }

  function pedirConfirmacionEliminar(sucursal) {
    setErrorEliminar('');
    setSucursalAEliminar(sucursal);
  }

  function cancelarEliminar() {
    setSucursalAEliminar(null);
    setErrorEliminar('');
  }

  const gananciasPorSucursal = useMemo(
    () =>
      datos.map((item) => ({
        label: item.sucursal?.nombre || 'Sucursal',
        value: parseFloat(item.ganancias || 0),
      })),
    [datos]
  );

  async function confirmarEliminar() {
    if (!sucursalAEliminar) return;
    setEliminando(true);
    setErrorEliminar('');
    try {
      await api.del(`/api/negocio/sucursal/${sucursalAEliminar.id_sucursal}`);
      setSucursalAEliminar(null);
      setMensaje('Sucursal eliminada con éxito.');
      await cargarSucursales();
    } catch (err) {
      setErrorEliminar(err.message || 'Error al eliminar la sucursal.');
    } finally {
      setEliminando(false);
    }
  }

  return (
    <AppShell roleLabel={usuario?.nombre_negocio || 'Negocio'} navItems={NAV_ITEMS}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-800">Desglose Detallado por Sucursal</h2>
          <button
            onClick={abrirModal}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg px-4 py-2 transition"
          >
            <Plus size={16} />
            Registrar Nueva Sucursal
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">{error}</div>
        )}
        {mensaje && (
          <div className="rounded-lg bg-emerald-50 text-emerald-700 text-sm px-4 py-2">
            {mensaje}
          </div>
        )}

        {!cargando && gananciasPorSucursal.length > 1 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-4">
              <BarChart3 size={20} strokeWidth={2} className="text-indigo-600" />
              Ganancias por Sucursal
            </h3>
            <SimpleBarChart data={gananciasPorSucursal} valuePrefix="Bs " />
          </div>
        )}

        {cargando ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            Cargando información detallada...
          </div>
        ) : datos.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center space-y-3">
            <p className="text-slate-600">No hay sucursales registradas.</p>
            <button
              onClick={abrirModal}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg px-4 py-2 transition"
            >
              <Plus size={16} />
              Registrar la primera sucursal
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {datos.map((item) => {
              const suc = item.sucursal || {};
              const productos = item.productos || [];
              const pedidos = item.pedidos || [];
              const ganancias = parseFloat(item.ganancias || 0);

              return (
                <section key={suc.id_sucursal} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <div className="bg-indigo-700 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                    <h4 className="text-lg font-semibold">{suc.nombre || 'Sucursal'}</h4>
                    <div className="flex items-center gap-4">
                      <span className="text-amber-300 font-bold">
                        Ganancias: Bs {ganancias.toFixed(2)}
                      </span>
                      <button
                        onClick={() => pedirConfirmacionEliminar(suc)}
                        className="inline-flex items-center gap-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg px-3 py-1.5 transition"
                      >
                        <Trash2 size={14} />
                        Eliminar Sucursal
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    <p className="text-sm text-slate-500 mb-4">
                      <span className="font-medium text-slate-700">Dirección:</span>{' '}
                      {suc.direccion || 'No especificada'}
                    </p>

                    <h5 className="flex items-center gap-2 text-indigo-600 font-semibold mb-2">
                      <Package size={16} />
                      Productos en esta Sucursal
                    </h5>
                    {productos.length === 0 ? (
                      <p className="text-sm text-slate-400 mb-6">No hay productos registrados.</p>
                    ) : (
                      <div className="overflow-x-auto mb-6">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-slate-500 border-b border-slate-200">
                              <th className="py-2 pr-2">Nombre</th>
                              <th className="py-2 pr-2">Descripción</th>
                              <th className="py-2 pr-2">Precio</th>
                              <th className="py-2 pr-2">Stock</th>
                            </tr>
                          </thead>
                          <tbody>
                            {productos.map((p) => (
                              <tr key={p.id_producto} className="border-b border-slate-100">
                                <td className="py-2 pr-2 text-slate-700">{p.nombre || ''}</td>
                                <td className="py-2 pr-2 text-slate-700">{p.descripcion || '-'}</td>
                                <td className="py-2 pr-2 text-slate-700">Bs {p.precio_unitario || 0}</td>
                                <td className="py-2 pr-2 text-slate-700">{p.stock_producto || 0}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <h5 className="flex items-center gap-2 text-emerald-600 font-semibold mb-2">
                      <ClipboardList size={16} />
                      Historial de Pedidos
                    </h5>
                    {pedidos.length === 0 ? (
                      <p className="text-sm text-slate-400">No hay pedidos registrados.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-slate-500 border-b border-slate-200">
                              <th className="py-2 pr-2">ID Pedido</th>
                              <th className="py-2 pr-2">Fecha</th>
                              <th className="py-2 pr-2">Estado</th>
                              <th className="py-2 pr-2">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pedidos.map((pe) => (
                              <tr key={pe.id_pedido} className="border-b border-slate-100">
                                <td className="py-2 pr-2 text-slate-700">#{pe.id_pedido || ''}</td>
                                <td className="py-2 pr-2 text-slate-700">{pe.fecha || 'N/D'}</td>
                                <td className="py-2 pr-2">
                                  <EstadoBadge estado={pe.estado || 'N/D'} />
                                </td>
                                <td className="py-2 pr-2 text-slate-700">Bs {pe.total || 0}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Registrar Nueva Sucursal */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-lg font-semibold text-slate-800">Registrar Nueva Sucursal</h5>
              <button
                onClick={cerrarModal}
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

            <form onSubmit={handleSubmitNuevaSucursal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre de la Sucursal
                </label>
                <input
                  type="text"
                  required
                  value={form.nombre}
                  onChange={(e) => actualizarForm('nombre', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
                <input
                  type="text"
                  required
                  value={form.direccion}
                  onChange={(e) => actualizarForm('direccion', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={guardando}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium rounded-lg py-2 transition"
              >
                {guardando ? 'Guardando...' : 'Guardar Sucursal'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar eliminación */}
      {sucursalAEliminar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6">
            <div className="flex flex-col items-center text-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 mb-3">
                <AlertTriangle size={22} className="text-red-600" />
              </div>
              <h5 className="text-lg font-semibold text-slate-800">Eliminar Sucursal</h5>
            </div>
            <p className="text-sm text-slate-600 mb-4 text-center">
              ¿Estás seguro de eliminar la sucursal "{sucursalAEliminar.nombre}"? Se perderá la
              vinculación de sus productos.
            </p>

            {errorEliminar && (
              <div className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">
                {errorEliminar}
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={cancelarEliminar}
                disabled={eliminando}
                className="text-sm border border-slate-300 text-slate-700 rounded-lg px-4 py-2 hover:bg-slate-100 disabled:opacity-60 transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminar}
                disabled={eliminando}
                className="inline-flex items-center gap-1.5 text-sm bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-lg px-4 py-2 transition"
              >
                <Trash2 size={14} />
                {eliminando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
