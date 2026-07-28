import { useEffect, useState } from 'react';
import { Store, Plus, Pencil, Trash2, X, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';
import AppShell from '../components/AppShell';
import { ADMIN_NAV_ITEMS } from './AdminDashboard';

const FORM_CREAR_INICIAL = {
  ci: '',
  nombre: '',
  apepaterno: '',
  telefono: '',
  correo: '',
  direccion: '',
  nombre_negocio: '',
  correo_negocio: '',
  contrasena: '',
};

const FORM_EDITAR_INICIAL = {
  nombre_negocio: '',
  correo_negocio: '',
  contrasena: '',
};

export default function AdminNegocios() {
  const [negocios, setNegocios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [formCrear, setFormCrear] = useState(FORM_CREAR_INICIAL);
  const [creando, setCreando] = useState(false);
  const [errorCrear, setErrorCrear] = useState('');

  const [negocioEditando, setNegocioEditando] = useState(null);
  const [formEditar, setFormEditar] = useState(FORM_EDITAR_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  const [negocioAEliminar, setNegocioAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState('');

  useEffect(() => {
    cargarNegocios();
  }, []);

  async function cargarNegocios() {
    setCargando(true);
    setError('');
    try {
      const data = await api.get('/api/admin/negocios');
      setNegocios(data || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los negocios.');
    } finally {
      setCargando(false);
    }
  }

  function updateFormCrear(campo, valor) {
    setFormCrear((prev) => ({ ...prev, [campo]: valor }));
  }

  function updateFormEditar(campo, valor) {
    setFormEditar((prev) => ({ ...prev, [campo]: valor }));
  }

  function abrirModalCrear() {
    setFormCrear(FORM_CREAR_INICIAL);
    setErrorCrear('');
    setModalCrearAbierto(true);
  }

  function cerrarModalCrear() {
    setModalCrearAbierto(false);
    setErrorCrear('');
  }

  async function handleSubmitCrear(e) {
    e.preventDefault();
    setErrorCrear('');
    setCreando(true);
    try {
      await api.post('/api/admin/negocio', {
        ci: formCrear.ci,
        nombre: formCrear.nombre,
        apepaterno: formCrear.apepaterno,
        telefono: formCrear.telefono,
        correo: formCrear.correo,
        direccion: formCrear.direccion,
        nombre_negocio: formCrear.nombre_negocio,
        correo_negocio: formCrear.correo_negocio,
        contrasena: formCrear.contrasena,
      });
      setModalCrearAbierto(false);
      setFormCrear(FORM_CREAR_INICIAL);
      setMensaje('Negocio creado con éxito.');
      await cargarNegocios();
    } catch (err) {
      setErrorCrear(err.message || 'No se pudo crear el negocio');
    } finally {
      setCreando(false);
    }
  }

  function abrirEditar(negocio) {
    setFormEditar({
      nombre_negocio: negocio.nombre_negocio || '',
      correo_negocio: negocio.correo_negocio || '',
      contrasena: '',
    });
    setErrorForm('');
    setNegocioEditando(negocio);
  }

  function cerrarEditar() {
    setNegocioEditando(null);
    setErrorForm('');
  }

  async function handleSubmitEditar(e) {
    e.preventDefault();
    setErrorForm('');
    setGuardando(true);
    try {
      const body = {
        nombre_negocio: formEditar.nombre_negocio,
        correo_negocio: formEditar.correo_negocio,
      };
      if (formEditar.contrasena) {
        body.contrasena = formEditar.contrasena;
      }
      await api.put(`/api/admin/negocio/${negocioEditando.id_negocio}`, body);
      setNegocioEditando(null);
      setMensaje('Negocio actualizado con éxito.');
      await cargarNegocios();
    } catch (err) {
      setErrorForm(err.message || 'No se pudo actualizar el negocio');
    } finally {
      setGuardando(false);
    }
  }

  function pedirConfirmacionEliminar(negocio) {
    setErrorEliminar('');
    setNegocioAEliminar(negocio);
  }

  function cancelarEliminar() {
    setNegocioAEliminar(null);
    setErrorEliminar('');
  }

  async function confirmarEliminar() {
    if (!negocioAEliminar) return;
    setEliminando(true);
    setErrorEliminar('');
    try {
      await api.del(`/api/admin/negocio/${negocioAEliminar.id_negocio}`);
      setNegocioAEliminar(null);
      setMensaje('Negocio eliminado con éxito.');
      await cargarNegocios();
    } catch (err) {
      setErrorEliminar(err.message || 'No se pudo eliminar el negocio');
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
              <Store size={20} strokeWidth={2} className="text-indigo-600" />
              Todos los Negocios Registrados
            </h3>
            <button
              onClick={abrirModalCrear}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg px-4 py-2 transition"
            >
              <Plus size={16} strokeWidth={2} />
              Agregar Negocio
            </button>
          </div>

          {cargando ? (
            <p className="text-sm text-slate-500">Cargando negocios...</p>
          ) : negocios.length === 0 ? (
            <p className="text-sm text-slate-500">No hay negocios registrados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-4 font-medium">ID</th>
                    <th className="py-2 pr-4 font-medium">Nombre del Negocio</th>
                    <th className="py-2 pr-4 font-medium">Correo del Negocio</th>
                    <th className="py-2 pr-4 font-medium">Dueño</th>
                    <th className="py-2 pr-4 font-medium">Teléfono Dueño</th>
                    <th className="py-2 pr-4 font-medium">Sucursales</th>
                    <th className="py-2 pr-4 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {negocios.map((n) => (
                    <tr key={n.id_negocio} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 pr-4">{n.id_negocio}</td>
                      <td className="py-2 pr-4">{n.nombre_negocio}</td>
                      <td className="py-2 pr-4">{n.correo_negocio}</td>
                      <td className="py-2 pr-4">
                        {n.nombre_dueno} {n.apepaterno_dueno}
                      </td>
                      <td className="py-2 pr-4">{n.telefono_dueno || '-'}</td>
                      <td className="py-2 pr-4">{n.total_sucursales}</td>
                      <td className="py-2 pr-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => abrirEditar(n)}
                            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg px-3 py-1.5 transition"
                          >
                            <Pencil size={14} strokeWidth={2} />
                            Editar
                          </button>
                          <button
                            onClick={() => pedirConfirmacionEliminar(n)}
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

      {/* Modal: Agregar Nuevo Negocio */}
      {modalCrearAbierto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                <Store size={20} strokeWidth={2} className="text-indigo-600" />
                Agregar Nuevo Negocio
              </h3>
              <button
                onClick={cerrarModalCrear}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            {errorCrear && (
              <div className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">
                {errorCrear}
              </div>
            )}

            <form onSubmit={handleSubmitCrear} className="space-y-5">
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Datos del Dueño
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">CI</label>
                    <input
                      type="text"
                      required
                      value={formCrear.ci}
                      onChange={(e) => updateFormCrear('ci', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                    <input
                      type="text"
                      value={formCrear.telefono}
                      onChange={(e) => updateFormCrear('telefono', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                    <input
                      type="text"
                      required
                      value={formCrear.nombre}
                      onChange={(e) => updateFormCrear('nombre', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Apellido</label>
                    <input
                      type="text"
                      value={formCrear.apepaterno}
                      onChange={(e) => updateFormCrear('apepaterno', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Correo personal
                    </label>
                    <input
                      type="email"
                      required
                      value={formCrear.correo}
                      onChange={(e) => updateFormCrear('correo', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
                    <input
                      type="text"
                      value={formCrear.direccion}
                      onChange={(e) => updateFormCrear('direccion', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-5">
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Datos del Negocio
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Nombre del Negocio
                    </label>
                    <input
                      type="text"
                      required
                      value={formCrear.nombre_negocio}
                      onChange={(e) => updateFormCrear('nombre_negocio', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Correo del Negocio
                    </label>
                    <input
                      type="email"
                      required
                      value={formCrear.correo_negocio}
                      onChange={(e) => updateFormCrear('correo_negocio', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
                    <input
                      type="password"
                      required
                      value={formCrear.contrasena}
                      onChange={(e) => updateFormCrear('contrasena', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={cerrarModalCrear}
                  disabled={creando}
                  className="text-sm font-medium text-slate-600 hover:text-slate-800 px-3 py-2 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creando}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium rounded-lg px-4 py-2 text-sm transition"
                >
                  {creando ? 'Guardando...' : 'Guardar Negocio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Negocio */}
      {negocioEditando && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                <Pencil size={20} strokeWidth={2} className="text-indigo-600" />
                Editar Negocio (ID {negocioEditando.id_negocio})
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

            <form onSubmit={handleSubmitEditar} className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre del Negocio
                </label>
                <input
                  type="text"
                  required
                  value={formEditar.nombre_negocio}
                  onChange={(e) => updateFormEditar('nombre_negocio', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Correo del Negocio
                </label>
                <input
                  type="email"
                  required
                  value={formEditar.correo_negocio}
                  onChange={(e) => updateFormEditar('correo_negocio', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nueva contraseña (opcional)
                </label>
                <input
                  type="password"
                  placeholder="Dejar en blanco para no cambiar"
                  value={formEditar.contrasena}
                  onChange={(e) => updateFormEditar('contrasena', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-3 mt-2">
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
      {negocioAEliminar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle size={22} strokeWidth={2} className="text-red-600" />
            </div>
            <h4 className="text-lg font-semibold text-slate-800 mb-2">Eliminar negocio</h4>
            <p className="text-sm text-slate-600 mb-4">
              ¿Seguro que querés eliminar «{negocioAEliminar.nombre_negocio}»? Esta acción no se
              puede deshacer.
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
