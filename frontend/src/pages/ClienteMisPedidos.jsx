import { useEffect, useState } from 'react';
import {
  Hourglass,
  PackageCheck,
  ShoppingCart,
  KeyRound,
  X,
  MapPin,
  Navigation,
  Calendar,
  FileDown,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import AppShell from '../components/AppShell';
import EstadoBadge from '../components/EstadoBadge';
import { Skeleton, SkeletonCardGrid } from '../components/Skeleton';
import { CLIENTE_NAV_ITEMS } from './ClientePanel';

function TarjetaPedido({ pedido, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:border-red-300 hover:shadow-md transition p-4"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h6 className="font-medium text-slate-800 dark:text-slate-100">Pedido #{pedido.id_pedido}</h6>
        <EstadoBadge estado={pedido.estado} />
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Total: <span className="font-semibold">Bs. {pedido.total}</span>
      </p>
      {pedido.estado === 'En Camino' && pedido.token && (
        <p className="flex items-center gap-1.5 text-xs text-red-600 mt-2">
          <KeyRound size={13} />
          Código de entrega disponible
        </p>
      )}
    </button>
  );
}

function ModalDetallePedido({ idPedido, finalizado, onCerrar }) {
  const [detalle, setDetalle] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    async function cargar() {
      setCargando(true);
      setError('');
      try {
        const data = await api.get(`/api/cliente/pedido/${idPedido}`);
        if (activo) setDetalle(data);
      } catch (err) {
        if (activo) setError(err.message || 'No se pudo cargar el detalle del pedido.');
      } finally {
        if (activo) setCargando(false);
      }
    }
    cargar();
    return () => {
      activo = false;
    };
  }, [idPedido]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Pedido #{idPedido}</h3>
          <button onClick={onCerrar} aria-label="Cerrar" className="text-slate-400 dark:text-slate-500 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm px-4 py-2">{error}</div>
        )}

        {cargando ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : detalle ? (
          <div className="overflow-y-auto -mx-1 px-1 space-y-4">
            <div className="flex items-center justify-between">
              <EstadoBadge estado={detalle.estado} />
              <span className="text-lg font-semibold text-red-600">
                Bs. {Number(detalle.total).toFixed(2)}
              </span>
            </div>

            <div className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
              <p className="flex items-center gap-2">
                <Calendar size={14} className="text-slate-400 dark:text-slate-500" />
                {new Date(detalle.fecha).toLocaleString('es-BO', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              {detalle.direccion && (
                <p className="flex items-center gap-2">
                  <MapPin size={14} className="text-slate-400 dark:text-slate-500" />
                  {detalle.direccion}
                </p>
              )}
              {detalle.zona && (
                <p className="flex items-center gap-2">
                  <Navigation size={14} className="text-slate-400 dark:text-slate-500" />
                  Zona {detalle.zona}
                </p>
              )}
            </div>

            {detalle.estado === 'En Camino' && detalle.token && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-3 py-2">
                <KeyRound size={16} className="text-red-600 shrink-0" />
                <p className="text-sm text-red-800 dark:text-red-300">
                  Tu código de entrega es{' '}
                  <span className="font-bold tracking-widest">{detalle.token}</span>. Dáselo al
                  repartidor cuando llegue tu pedido.
                </p>
              </div>
            )}

            <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Productos</p>
              <div className="space-y-1">
                {(detalle.productos || []).map((prod, idx) => (
                  <div key={idx} className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                    <span className="truncate">
                      {prod.nombre} × {prod.cantidad}
                    </span>
                    <span className="shrink-0">
                      Bs. {(parseFloat(prod.precio_unitario) * prod.cantidad).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {finalizado && (
              <a
                href={`/factura/${detalle.id_pedido}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 border border-red-600 text-red-600 rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-red-50 transition"
              >
                <FileDown size={16} />
                Descargar Factura
              </a>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function ClienteMisPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [cargandoPedidos, setCargandoPedidos] = useState(true);
  const [error, setError] = useState('');
  const [pedidoAbierto, setPedidoAbierto] = useState(null); // { id, finalizado }

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
          <div className="rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm px-4 py-2">{error}</div>
        )}

        {cargandoPedidos ? (
          <>
            <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
              <h5 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">
                <Hourglass size={18} className="text-red-600" />
                En Curso
              </h5>
              <SkeletonCardGrid count={3} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" />
            </section>

            <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
              <h5 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">
                <PackageCheck size={18} className="text-red-600" />
                Recibidos
              </h5>
              <SkeletonCardGrid count={3} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" />
            </section>
          </>
        ) : pedidos.length === 0 ? (
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 text-center py-8">
            <p className="text-sm text-slate-400 dark:text-slate-500 mb-4">Aún no has realizado ningún pedido.</p>
            <Link
              to="/cliente/panel"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg px-4 py-2 transition"
            >
              <ShoppingCart size={16} />
              Hacer mi primer pedido
            </Link>
          </section>
        ) : (
          <>
            <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
              <h5 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">
                <Hourglass size={18} className="text-red-600" />
                En Curso
              </h5>
              {pedidosEnCurso.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500">No tenés pedidos en curso.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {pedidosEnCurso.map((p) => (
                    <TarjetaPedido
                      key={p.id_pedido}
                      pedido={p}
                      onClick={() => setPedidoAbierto({ id: p.id_pedido, finalizado: false })}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
              <h5 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">
                <PackageCheck size={18} className="text-red-600" />
                Recibidos
              </h5>
              {pedidosRecibidos.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500">Todavía no recibiste ningún pedido.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {pedidosRecibidos.map((p) => (
                    <TarjetaPedido
                      key={p.id_pedido}
                      pedido={p}
                      onClick={() => setPedidoAbierto({ id: p.id_pedido, finalizado: true })}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {pedidoAbierto && (
        <ModalDetallePedido
          idPedido={pedidoAbierto.id}
          finalizado={pedidoAbierto.finalizado}
          onCerrar={() => setPedidoAbierto(null)}
        />
      )}
    </AppShell>
  );
}
