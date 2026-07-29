import { useEffect, useState } from 'react';
import { Bike, Save } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import AppShell from '../components/AppShell';
import { Skeleton } from '../components/Skeleton';
import { REPARTIDOR_NAV_ITEMS } from './RepartidorPanel';

const FORM_INICIAL = { tipo: '', placa: '', modelo: '', color: '' };

export default function RepartidorVehiculo() {
  const { usuario } = useAuth();
  const [vehiculo, setVehiculo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    cargarVehiculo();
  }, []);

  async function cargarVehiculo() {
    setCargando(true);
    setError('');
    try {
      const data = await api.get('/api/repartidor/vehiculo');
      setVehiculo(data);
      if (data) {
        setForm({
          tipo: data.tipo || '',
          placa: data.placa || '',
          modelo: data.modelo || '',
          color: data.color || '',
        });
      } else {
        setEditando(true);
      }
    } catch (err) {
      setError(err.message || 'No se pudo cargar tu vehículo.');
    } finally {
      setCargando(false);
    }
  }

  function updateForm(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function guardar(e) {
    e.preventDefault();
    setError('');
    setMensaje('');
    setGuardando(true);
    try {
      await api.post('/api/repartidor/vehiculo', form);
      setMensaje('Vehículo guardado con éxito.');
      setEditando(false);
      await cargarVehiculo();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el vehículo.');
    } finally {
      setGuardando(false);
    }
  }

  const fotoUrl = `https://picsum.photos/seed/vehiculo-${usuario?.ci || 'x'}/500/300`;

  return (
    <AppShell roleLabel="Repartidor" navItems={REPARTIDOR_NAV_ITEMS}>
      <div className="space-y-6 max-w-xl">
        {error && (
          <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">{error}</div>
        )}
        {mensaje && (
          <div className="rounded-lg bg-emerald-50 text-emerald-700 text-sm px-4 py-2">
            {mensaje}
          </div>
        )}

        <section className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <img src={fotoUrl} alt="Vehículo" className="w-full h-48 object-cover" loading="lazy" />
          <div className="p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-4">
              <Bike size={20} className="text-red-600" strokeWidth={2} />
              Mi Vehículo
            </h2>

            {cargando ? (
              <div className="space-y-2.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-9 w-32 rounded-lg mt-2" />
              </div>
            ) : editando ? (
              <form onSubmit={guardar} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                  <select
                    required
                    value={form.tipo}
                    onChange={(e) => updateForm('tipo', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Seleccioná un tipo</option>
                    <option value="Motocicleta">Motocicleta</option>
                    <option value="Bicicleta">Bicicleta</option>
                    <option value="Automóvil">Automóvil</option>
                    <option value="A pie">A pie</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Placa</label>
                  <input
                    type="text"
                    required
                    value={form.placa}
                    onChange={(e) => updateForm('placa', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Modelo</label>
                  <input
                    type="text"
                    value={form.modelo}
                    onChange={(e) => updateForm('modelo', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                  <input
                    type="text"
                    value={form.color}
                    onChange={(e) => updateForm('color', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div className="sm:col-span-2 flex justify-end gap-3">
                  {vehiculo && (
                    <button
                      type="button"
                      onClick={() => setEditando(false)}
                      className="text-sm font-medium text-slate-600 hover:text-slate-800 px-3 py-2 rounded-lg transition"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={guardando}
                    className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 text-sm transition"
                  >
                    <Save size={16} />
                    {guardando ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="text-sm text-slate-600 space-y-1 mb-4">
                  <p>
                    <span className="font-medium text-slate-800">Tipo:</span> {vehiculo.tipo}
                  </p>
                  <p>
                    <span className="font-medium text-slate-800">Placa:</span> {vehiculo.placa}
                  </p>
                  <p>
                    <span className="font-medium text-slate-800">Modelo:</span>{' '}
                    {vehiculo.modelo || 'No especificado'}
                  </p>
                  <p>
                    <span className="font-medium text-slate-800">Color:</span>{' '}
                    {vehiculo.color || 'No especificado'}
                  </p>
                </div>
                <button
                  onClick={() => setEditando(true)}
                  className="text-sm border border-red-600 text-red-600 hover:bg-red-50 rounded-lg px-4 py-2 transition"
                >
                  Editar datos
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
