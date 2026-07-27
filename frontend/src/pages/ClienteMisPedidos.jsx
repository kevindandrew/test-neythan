import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ShoppingCart } from 'lucide-react';
import { api } from '../api/client';
import AppShell from '../components/AppShell';
import EstadoBadge from '../components/EstadoBadge';
import { CLIENTE_NAV_ITEMS } from './ClientePanel';

export default function ClienteMisPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [cargandoPedidos, setCargandoPedidos] = useState(true);
  const [pedidoEnCurso, setPedidoEnCurso] = useState(null);

  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    cargarMisPedidos();
  }, []);

  async function cargarMisPedidos() {
    setCargandoPedidos(true);
    try {
      const data = await api.get('/api/cliente/pedidos');
      setPedidos(data);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar tus pedidos.');
    } finally {
      setCargandoPedidos(false);
    }
  }

  async function marcarEntregado(idPedido) {
    setError('');
    setMensaje('');
    setPedidoEnCurso(idPedido);
    try {
      await api.put('/api/pedido/estado', { id_pedido: idPedido, estado: 'Entregado' });
      setMensaje('¡Pedido marcado como entregado y factura generada con éxito!');
      await cargarMisPedidos();
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el estado del pedido.');
    } finally {
      setPedidoEnCurso(null);
    }
  }

  return (
    <AppShell roleLabel="Cliente" navItems={CLIENTE_NAV_ITEMS}>
      <div className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">{error}</div>
        )}
        {mensaje && (
          <div className="rounded-lg bg-emerald-50 text-emerald-700 text-sm px-4 py-2">
            {mensaje}
          </div>
        )}

        <section className="bg-white rounded-2xl shadow-lg p-6">
          <h5 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-3">
            <ShoppingBag size={18} className="text-indigo-600" />
            Mis Pedidos y Estados
          </h5>

          {cargandoPedidos ? (
            <p className="text-sm text-slate-400">Cargando tus pedidos...</p>
          ) : pedidos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-400 mb-4">Aún no has realizado ningún pedido.</p>
              <Link
                to="/cliente/hacer-pedido"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg px-4 py-2 transition"
              >
                <ShoppingCart size={16} />
                Hacer mi primer pedido
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {pedidos.map((p) => {
                const finalizado = p.estado === 'Entregado' || p.estado === 'Terminado';
                return (
                  <div
                    key={p.id_pedido}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div>
                      <h6 className="font-medium text-slate-800 mb-1">Pedido #{p.id_pedido}</h6>
                      <p className="text-xs text-slate-500 mb-1">
                        Total: <span className="font-semibold">Bs. {p.total}</span>
                      </p>
                      <EstadoBadge estado={p.estado} />
                    </div>
                    <div>
                      {finalizado ? (
                        <a
                          href={`/factura/${p.id_pedido}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm border border-indigo-600 text-indigo-600 rounded-lg px-3 py-1.5 hover:bg-indigo-50 transition"
                        >
                          Ver / Descargar Factura
                        </a>
                      ) : (
                        <button
                          onClick={() => marcarEntregado(p.id_pedido)}
                          disabled={pedidoEnCurso === p.id_pedido}
                          className="text-sm border border-emerald-600 text-emerald-600 rounded-lg px-3 py-1.5 hover:bg-emerald-50 disabled:opacity-60 transition"
                        >
                          {pedidoEnCurso === p.id_pedido
                            ? 'Actualizando...'
                            : 'Marcar como Entregado / Terminado'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
