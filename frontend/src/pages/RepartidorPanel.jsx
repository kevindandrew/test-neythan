import { useEffect, useState } from 'react';
import { api } from '../api/client';
import EstadoBadge from '../components/EstadoBadge';
import AppShell from '../components/AppShell';
import { LayoutDashboard, Bike, UserRound, ClipboardList } from 'lucide-react';

export const REPARTIDOR_NAV_ITEMS = [
  { to: '/repartidor/panel', label: 'Mi Panel', icon: LayoutDashboard },
  { to: '/repartidor/entregas', label: 'Mis Entregas', icon: ClipboardList },
];

export default function RepartidorPanel() {
  const [repartidor, setRepartidor] = useState(null);
  const [estadoActual, setEstadoActual] = useState('disponible');

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [errorEstado, setErrorEstado] = useState('');
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  useEffect(() => {
    cargarPanelRepartidor();
  }, []);

  async function cargarPanelRepartidor() {
    setCargando(true);
    setError('');
    try {
      const data = await api.get('/api/repartidor/pedidos');
      setRepartidor(data.repartidor);
      setEstadoActual(data.estado_repartidor);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los datos del panel.');
    } finally {
      setCargando(false);
    }
  }

  async function alternarEstado() {
    const nuevoEstado = estadoActual === 'disponible' ? 'ocupado' : 'disponible';
    setErrorEstado('');
    setCambiandoEstado(true);
    try {
      await api.put('/api/repartidor/estado', { estado: nuevoEstado });
      setEstadoActual(nuevoEstado);
    } catch (err) {
      setErrorEstado(err.message || 'No se pudo actualizar el estado.');
    } finally {
      setCambiandoEstado(false);
    }
  }

  return (
    <AppShell roleLabel="Repartidor" navItems={REPARTIDOR_NAV_ITEMS}>
      <div className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mi Estado Actual */}
          <section className="bg-white rounded-2xl shadow-lg p-6 flex flex-col justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-3">
                <Bike size={20} className="text-indigo-600" strokeWidth={2} />
                Mi Estado Actual
              </h2>
              {cargando ? (
                <p className="text-sm text-slate-400">Verificando estado...</p>
              ) : (
                <EstadoBadge estado={estadoActual} />
              )}
            </div>

            {errorEstado && (
              <div className="mt-3 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">
                {errorEstado}
              </div>
            )}

            <button
              onClick={alternarEstado}
              disabled={cargando || cambiandoEstado}
              className={`mt-4 w-full sm:w-auto self-start text-sm font-medium rounded-lg px-4 py-2 transition text-white disabled:opacity-60 ${
                estadoActual === 'disponible'
                  ? 'bg-amber-500 hover:bg-amber-600'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {cambiandoEstado
                ? 'Actualizando...'
                : estadoActual === 'disponible'
                ? 'Marcar como Ocupado'
                : 'Marcar como Disponible'}
            </button>
          </section>

          {/* Mis Datos */}
          <section className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-3">
              <UserRound size={20} className="text-indigo-600" strokeWidth={2} />
              Mis Datos
            </h2>
            {cargando ? (
              <p className="text-sm text-slate-400">Cargando...</p>
            ) : (
              <div className="text-sm text-slate-600 space-y-1">
                <p>
                  <span className="font-medium text-slate-800">Nro. Repartidor:</span>{' '}
                  {repartidor?.nro_repartidor ?? 'N/A'}
                </p>
                <p>
                  <span className="font-medium text-slate-800">Cédula (CI):</span>{' '}
                  {repartidor?.ci_repartidor ?? 'N/A'}
                </p>
                <p>
                  <span className="font-medium text-slate-800">Licencia:</span>{' '}
                  {repartidor?.nro_licencia ?? 'N/A'}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
