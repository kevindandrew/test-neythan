import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PackageSearch, MapPin, Store, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';
import AppShell from '../components/AppShell';
import { REPARTIDOR_NAV_ITEMS } from './RepartidorPanel';

export default function RepartidorEntregarPedido() {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aceptando, setAceptando] = useState(null);

  useEffect(() => {
    cargarDisponibles();
  }, []);

  async function cargarDisponibles() {
    setCargando(true);
    setError('');
    try {
      const data = await api.get('/api/repartidor/pedidos-disponibles');
      setPedidos(data);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los pedidos disponibles.');
    } finally {
      setCargando(false);
    }
  }

  async function aceptarPedido(idPedido) {
    setError('');
    setAceptando(idPedido);
    try {
      await api.post(`/api/repartidor/pedido/${idPedido}/aceptar`, {});
      navigate('/repartidor/panel');
    } catch (err) {
      setError(err.message || 'No se pudo aceptar el pedido.');
      setAceptando(null);
      cargarDisponibles();
    }
  }

  return (
    <AppShell roleLabel="Repartidor" navItems={REPARTIDOR_NAV_ITEMS}>
      <div className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">{error}</div>
        )}

        <section className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-4">
            <PackageSearch size={20} className="text-indigo-600" strokeWidth={2} />
            Pedidos Disponibles
          </h2>

          {cargando ? (
            <p className="text-sm text-slate-400">Cargando pedidos disponibles...</p>
          ) : pedidos.length === 0 ? (
            <p className="text-sm text-slate-400">
              No hay pedidos disponibles para aceptar en este momento.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pedidos.map((p) => (
                <div key={p.id_pedido} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-800">Pedido #{p.id_pedido}</h3>
                    <span className="text-sm font-semibold text-indigo-600">
                      Bs. {parseFloat(p.total).toFixed(2)}
                    </span>
                  </div>
                  <p className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                    <Store size={14} className="text-slate-400" />
                    {p.nombre_negocio} · {p.sucursal_nombre}
                  </p>
                  <p className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                    <MapPin size={14} className="text-slate-400" />
                    {p.cliente_direccion || 'No registrada'}
                  </p>
                  <button
                    onClick={() => aceptarPedido(p.id_pedido)}
                    disabled={aceptando !== null}
                    className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg py-2 transition"
                  >
                    <CheckCircle2 size={16} />
                    {aceptando === p.id_pedido ? 'Aceptando...' : 'Aceptar Pedido'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
