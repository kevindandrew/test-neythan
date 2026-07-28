import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Hourglass, PackageCheck, ShoppingCart, KeyRound } from 'lucide-react';
import { api } from '../api/client';
import AppShell from '../components/AppShell';
import EstadoBadge from '../components/EstadoBadge';
import { CLIENTE_NAV_ITEMS } from './ClientePanel';

function TarjetaPedido({ pedido, finalizado }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h6 className="font-medium text-slate-800 mb-1">Pedido #{pedido.id_pedido}</h6>
          <p className="text-xs text-slate-500 mb-1">
            Total: <span className="font-semibold">Bs. {pedido.total}</span>
          </p>
          <EstadoBadge estado={pedido.estado} />
        </div>
        {finalizado && (
          <a
            href={`/factura/${pedido.id_pedido}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm border border-indigo-600 text-indigo-600 rounded-lg px-3 py-1.5 hover:bg-indigo-50 transition"
          >
            Ver / Descargar Factura
          </a>
        )}
      </div>

      {!finalizado && pedido.estado === 'En Camino' && pedido.token && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-2">
          <KeyRound size={16} className="text-indigo-600 shrink-0" />
          <p className="text-sm text-indigo-800">
            Tu código de entrega es <span className="font-bold tracking-widest">{pedido.token}</span>
            . Dáselo al repartidor cuando llegue tu pedido para confirmar la entrega.
          </p>
        </div>
      )}
    </div>
  );
}

export default function ClienteMisPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [cargandoPedidos, setCargandoPedidos] = useState(true);
  const [error, setError] = useState('');

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

  const finalizados = ['Entregado', 'Terminado'];
  const pedidosEnCurso = pedidos.filter((p) => !finalizados.includes(p.estado));
  const pedidosRecibidos = pedidos.filter((p) => finalizados.includes(p.estado));

  return (
    <AppShell roleLabel="Cliente" navItems={CLIENTE_NAV_ITEMS}>
      <div className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">{error}</div>
        )}

        {cargandoPedidos ? (
          <p className="text-sm text-slate-400">Cargando tus pedidos...</p>
        ) : pedidos.length === 0 ? (
          <section className="bg-white rounded-2xl shadow-lg p-6 text-center py-8">
            <p className="text-sm text-slate-400 mb-4">Aún no has realizado ningún pedido.</p>
            <Link
              to="/cliente/panel"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg px-4 py-2 transition"
            >
              <ShoppingCart size={16} />
              Hacer mi primer pedido
            </Link>
          </section>
        ) : (
          <>
            <section className="bg-white rounded-2xl shadow-lg p-6">
              <h5 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-3">
                <Hourglass size={18} className="text-indigo-600" />
                En Curso
              </h5>
              {pedidosEnCurso.length === 0 ? (
                <p className="text-sm text-slate-400">No tenés pedidos en curso.</p>
              ) : (
                <div className="space-y-3">
                  {pedidosEnCurso.map((p) => (
                    <TarjetaPedido key={p.id_pedido} pedido={p} finalizado={false} />
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white rounded-2xl shadow-lg p-6">
              <h5 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-3">
                <PackageCheck size={18} className="text-indigo-600" />
                Recibidos
              </h5>
              {pedidosRecibidos.length === 0 ? (
                <p className="text-sm text-slate-400">Todavía no recibiste ningún pedido.</p>
              ) : (
                <div className="space-y-3">
                  {pedidosRecibidos.map((p) => (
                    <TarjetaPedido key={p.id_pedido} pedido={p} finalizado />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
