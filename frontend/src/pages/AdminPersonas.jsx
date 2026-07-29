import { useEffect, useState } from 'react';
import { Users, Pencil, Trash2, X, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';
import AppShell from '../components/AppShell';
import { SkeletonTableRows } from '../components/Skeleton';
import { ADMIN_NAV_ITEMS } from './AdminDashboard';

const ROL_BADGE = {
  cliente: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  negocio: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  repartidor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  admin: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
  'sin rol': 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
};

const FORM_INICIAL = {
  nombre: '',
  apepaterno: '',
  telefono: '',
  correo: '',
  direccion: '',
};

export default function AdminPersonas() {
  const [personas, setPersonas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const [personaEditando, setPersonaEditando] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  const [personaAEliminar, setPersonaAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState('');

  useEffect(() => {
    cargarPersonas();
  }, []);

  async function cargarPersonas() {
    setCargando(true);
    setError('');
    try {
      const data = await api.get('/api/admin/personas');
      setPersonas(data || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las personas.');
    } finally {
      setCargando(false);
    }
  }

  function updateForm(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function abrirEditar(persona) {
    setForm({
      nombre: persona.nombre || '',
      apepaterno: persona.apepaterno || '',
      telefono: persona.telefono || '',
      correo: persona.correo || '',
      direccion: persona.direccion || '',
    });
    setErrorForm('');
    setPersonaEditando(persona);
  }

  function cerrarEditar() {
    setPersonaEditando(null);
    setErrorForm('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorForm('');
    setGuardando(true);
    try {
      await api.put(`/api/admin/persona/${personaEditando.ci}`, form);
      setPersonaEditando(null);
      setMensaje('Persona actualizada con éxito.');
      await cargarPersonas();
    } catch (err) {
      setErrorForm(err.message || 'No se pudo actualizar la persona');
    } finally {
      setGuardando(false);
    }
  }

  function pedirConfirmacionEliminar(persona) {
    setErrorEliminar('');
    setPersonaAEliminar(persona);
  }

  function cancelarEliminar() {
    setPersonaAEliminar(null);
    setErrorEliminar('');
  }

  async function confirmarEliminar() {
    if (!personaAEliminar) return;
    setEliminando(true);
    setErrorEliminar('');
    try {
      await api.del(`/api/admin/persona/${personaAEliminar.ci}`);
      setPersonaAEliminar(null);
      setMensaje('Persona eliminada con éxito.');
      await cargarPersonas();
    } catch (err) {
      setErrorEliminar(err.message || 'No se pudo eliminar la persona');
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
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
            <Users size={20} strokeWidth={2} className="text-red-600" />
            Todas las Personas Registradas
          </h3>

          {cargando ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <th className="py-2 pr-4 font-medium">CI</th>
                    <th className="py-2 pr-4 font-medium">Nombre</th>
                    <th className="py-2 pr-4 font-medium">Correo</th>
                    <th className="py-2 pr-4 font-medium">Teléfono</th>
                    <th className="py-2 pr-4 font-medium">Dirección</th>
                    <th className="py-2 pr-4 font-medium">Rol</th>
                    <th className="py-2 pr-4 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <SkeletonTableRows rows={4} columns={7} />
                </tbody>
              </table>
            </div>
          ) : personas.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No hay personas registradas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <th className="py-2 pr-4 font-medium">CI</th>
                    <th className="py-2 pr-4 font-medium">Nombre</th>
                    <th className="py-2 pr-4 font-medium">Correo</th>
                    <th className="py-2 pr-4 font-medium">Teléfono</th>
                    <th className="py-2 pr-4 font-medium">Dirección</th>
                    <th className="py-2 pr-4 font-medium">Rol</th>
                    <th className="py-2 pr-4 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {personas.map((p) => (
                    <tr key={p.ci} className="border-b border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800">
                      <td className="py-2 pr-4">{p.ci}</td>
                      <td className="py-2 pr-4">
                        {p.nombre} {p.apepaterno}
                      </td>
                      <td className="py-2 pr-4">{p.correo}</td>
                      <td className="py-2 pr-4">{p.telefono || '-'}</td>
                      <td className="py-2 pr-4">{p.direccion || '-'}</td>
                      <td className="py-2 pr-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            ROL_BADGE[p.rol] || ROL_BADGE['sin rol']
                          }`}
                        >
                          {p.rol}
                        </span>
                      </td>
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

      {/* Modal: Editar Persona */}
      {personaEditando && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-6 dark:bg-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
                <Pencil size={20} strokeWidth={2} className="text-red-600" />
                Editar Persona (CI {personaEditando.ci})
              </h3>
              <button
                onClick={cerrarEditar}
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-200">Nombre</label>
                <input
                  type="text"
                  required
                  value={form.nombre}
                  onChange={(e) => updateForm('nombre', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-200">Apellido</label>
                <input
                  type="text"
                  value={form.apepaterno}
                  onChange={(e) => updateForm('apepaterno', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-200">Correo</label>
                <input
                  type="email"
                  required
                  value={form.correo}
                  onChange={(e) => updateForm('correo', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-200">Teléfono</label>
                <input
                  type="text"
                  value={form.telefono}
                  onChange={(e) => updateForm('telefono', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-200">Dirección</label>
                <input
                  type="text"
                  value={form.direccion}
                  onChange={(e) => updateForm('direccion', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
                />
              </div>
              <div className="sm:col-span-2 flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={cerrarEditar}
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
                  {guardando ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {personaAEliminar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 dark:bg-slate-800 w-full max-w-sm">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40">
              <AlertTriangle size={22} strokeWidth={2} className="text-red-600" />
            </div>
            <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Eliminar persona</h4>
            <p className="text-sm text-slate-600 mb-4 dark:text-slate-300">
              ¿Seguro que querés eliminar a «{personaAEliminar.nombre} {personaAEliminar.apepaterno}»?
              Esta acción no se puede deshacer.
            </p>
            {errorEliminar && (
              <div className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2 dark:bg-red-950/40 dark:text-red-300">
                {errorEliminar}
              </div>
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
    </AppShell>
  );
}
