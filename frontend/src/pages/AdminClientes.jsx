import { useEffect, useState } from 'react';
import { UserRound, UserPlus, Plus, Pencil, Trash2, X, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';
import AppShell from '../components/AppShell';
import { ADMIN_NAV_ITEMS } from './AdminDashboard';

const FORM_INICIAL = {
  ci: '',
  nombre: '',
  apepaterno: '',
  telefono: '',
  correo: '',
  direccion: '',
  contrasena: '',
};

export default function AdminClientes() {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  const [clienteAEliminar, setClienteAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState('');

  useEffect(() => {
    cargarClientes();
  }, []);

  async function cargarClientes() {
    setCargando(true);
    setError('');
    try {
      const data = await api.get('/api/admin/clientes');
      setClientes(data || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los clientes.');
    } finally {
      setCargando(false);
    }
  }

  function updateForm(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function abrirModalCrear() {
    setForm(FORM_INICIAL);
    setErrorForm('');
    setModalCrearAbierto(true);
  }

  function cerrarModalCrear() {
    setModalCrearAbierto(false);
    setErrorForm('');
  }

  function abrirEditar(cliente) {
    setForm({
      ci: cliente.ci_cliente,
      nombre: cliente.nombre || '',
      apepaterno: cliente.apepaterno || '',
      telefono: cliente.telefono || '',
      correo: cliente.correo || '',
      direccion: cliente.direccion || '',
      contrasena: '',
    });
    setErrorForm('');
    setClienteEditando(cliente);
  }

  function cerrarEditar() {
    setClienteEditando(null);
    setErrorForm('');
  }

  async function handleCrear(e) {
    e.preventDefault();
    setErrorForm('');
    setGuardando(true);
    try {
      await api.post('/api/admin/cliente', {
        ci: form.ci,
        nombre: form.nombre,
        apepaterno: form.apepaterno,
        telefono: form.telefono,
        correo: form.correo,
        direccion: form.direccion,
        contrasena: form.contrasena,
      });
      setModalCrearAbierto(false);
      setForm(FORM_INICIAL);
      setMensaje('Cliente agregado con éxito.');
      await cargarClientes();
    } catch (err) {
      setErrorForm(err.message || 'No se pudo agregar el cliente');
    } finally {
      setGuardando(false);
    }
  }

  async function handleEditar(e) {
    e.preventDefault();
    setErrorForm('');
    setGuardando(true);
    try {
      await api.put(`/api/admin/cliente/${clienteEditando.ci_cliente}`, {
        nombre: form.nombre,
        apepaterno: form.apepaterno,
        telefono: form.telefono,
        correo: form.correo,
        direccion: form.direccion,
        contrasena: form.contrasena,
      });
      setClienteEditando(null);
      setMensaje('Cliente actualizado con éxito.');
      await cargarClientes();
    } catch (err) {
      setErrorForm(err.message || 'No se pudo actualizar el cliente');
    } finally {
      setGuardando(false);
    }
  }

  function pedirConfirmacionEliminar(cliente) {
    setErrorEliminar('');
    setClienteAEliminar(cliente);
  }

  function cancelarEliminar() {
    setClienteAEliminar(null);
    setErrorEliminar('');
  }

  async function confirmarEliminar() {
    if (!clienteAEliminar) return;
    setEliminando(true);
    setErrorEliminar('');
    try {
      await api.del(`/api/admin/cliente/${clienteAEliminar.ci_cliente}`);
      setClienteAEliminar(null);
      setMensaje('Cliente eliminado con éxito.');
      await cargarClientes();
    } catch (err) {
      setErrorEliminar(err.message || 'No se pudo eliminar el cliente');
    } finally {
      setEliminando(false);
    }
  }

  return (
    <AppShell roleLabel="Super Administrador" navItems={ADMIN_NAV_ITEMS}>
      <div className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">{error}</div>
        )}
        {mensaje && (
          <div className="rounded-lg bg-emerald-50 text-emerald-700 text-sm px-4 py-2">
            {mensaje}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
              <UserRound size={20} strokeWidth={2} className="text-indigo-600" />
              Todos los Clientes Registrados
            </h3>
            <button
              onClick={abrirModalCrear}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg px-4 py-2 transition"
            >
              <Plus size={16} strokeWidth={2} />
              Agregar Cliente
            </button>
          </div>

          {cargando ? (
            <p className="text-sm text-slate-500">Cargando clientes...</p>
          ) : clientes.length === 0 ? (
            <p className="text-sm text-slate-500">No hay clientes registrados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-4 font-medium">CI</th>
                    <th className="py-2 pr-4 font-medium">Nombre</th>
                    <th className="py-2 pr-4 font-medium">Correo</th>
                    <th className="py-2 pr-4 font-medium">Teléfono</th>
                    <th className="py-2 pr-4 font-medium">Dirección</th>
                    <th className="py-2 pr-4 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((c) => (
                    <tr key={c.ci_cliente} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 pr-4">{c.ci_cliente}</td>
                      <td className="py-2 pr-4">
                        {c.nombre} {c.apepaterno}
                      </td>
                      <td className="py-2 pr-4">{c.correo}</td>
                      <td className="py-2 pr-4">{c.telefono || '-'}</td>
                      <td className="py-2 pr-4">{c.direccion || '-'}</td>
                      <td className="py-2 pr-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => abrirEditar(c)}
                            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg px-3 py-1.5 transition"
                          >
                            <Pencil size={14} strokeWidth={2} />
                            Editar
                          </button>
                          <button
                            onClick={() => pedirConfirmacionEliminar(c)}
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

      {/* Modal: Agregar Nuevo Cliente */}
      {modalCrearAbierto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                <UserPlus size={20} strokeWidth={2} className="text-indigo-600" />
                Agregar Nuevo Cliente
              </h3>
              <button
                onClick={cerrarModalCrear}
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

            <form onSubmit={handleCrear} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">CI</label>
                <input
                  type="number"
                  required
                  value={form.ci}
                  onChange={(e) => updateForm('ci', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={form.nombre}
                  onChange={(e) => updateForm('nombre', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Apellido</label>
                <input
                  type="text"
                  value={form.apepaterno}
                  onChange={(e) => updateForm('apepaterno', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                <input
                  type="text"
                  value={form.telefono}
                  onChange={(e) => updateForm('telefono', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Correo</label>
                <input
                  type="email"
                  required
                  value={form.correo}
                  onChange={(e) => updateForm('correo', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
                <input
                  type="text"
                  value={form.direccion}
                  onChange={(e) => updateForm('direccion', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
                <input
                  type="password"
                  required
                  value={form.contrasena}
                  onChange={(e) => updateForm('contrasena', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="sm:col-span-2 flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={cerrarModalCrear}
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
                  {guardando ? 'Guardando...' : 'Guardar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Cliente */}
      {clienteEditando && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                <Pencil size={20} strokeWidth={2} className="text-indigo-600" />
                Editar Cliente (CI {clienteEditando.ci_cliente})
              </h3>
              <button
                onClick={cerrarEditar}
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

            <form onSubmit={handleEditar} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={form.nombre}
                  onChange={(e) => updateForm('nombre', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Apellido</label>
                <input
                  type="text"
                  value={form.apepaterno}
                  onChange={(e) => updateForm('apepaterno', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                <input
                  type="text"
                  value={form.telefono}
                  onChange={(e) => updateForm('telefono', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Correo</label>
                <input
                  type="email"
                  required
                  value={form.correo}
                  onChange={(e) => updateForm('correo', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
                <input
                  type="text"
                  value={form.direccion}
                  onChange={(e) => updateForm('direccion', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nueva contraseña (opcional)
                </label>
                <input
                  type="password"
                  placeholder="Dejar en blanco para no cambiar"
                  value={form.contrasena}
                  onChange={(e) => updateForm('contrasena', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="sm:col-span-2 flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={cerrarEditar}
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
                  {guardando ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {clienteAEliminar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle size={22} strokeWidth={2} className="text-red-600" />
            </div>
            <h4 className="text-lg font-semibold text-slate-800 mb-2">Eliminar cliente</h4>
            <p className="text-sm text-slate-600 mb-4">
              ¿Seguro que querés eliminar a «{clienteAEliminar.nombre} {clienteAEliminar.apepaterno}»?
              Esta acción no se puede deshacer.
            </p>
            {errorEliminar && (
              <div className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">
                {errorEliminar}
              </div>
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
    </AppShell>
  );
}
