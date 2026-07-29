import { useEffect, useState } from 'react';
import { api } from '../api/client';
import EstadoBadge from '../components/EstadoBadge';
import AppShell from '../components/AppShell';
import StatTile from '../components/StatTile';
import { Skeleton, SkeletonStatTile, SkeletonTableRows } from '../components/Skeleton';
import {
  ClipboardList,
  Eye,
  X,
  PackageCheck,
  Wallet,
  MapPin,
  Phone,
  ShoppingBag,
  UserRound,
} from 'lucide-react';
import { REPARTIDOR_NAV_ITEMS } from './RepartidorPanel';

const ESTADOS_FINALIZADOS = ['entregado', 'terminado'];

export default function RepartidorComisiones() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [pedidoDetalle, setPedidoDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);

  useEffect(() => {
    cargarPedidos();
  }, []);

  async function cargarPedidos() {
    setCargando(true);
    setError('');
    try {
      const data = await api.get('/api/repartidor/pedidos');
      setPedidos(data.pedidos || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar tus comisiones.');
    } finally {
      setCargando(false);
    }
  }

  async function verDetalle(idPedido) {
    setModalAbierto(true);
    setCargandoDetalle(true);
    setErrorDetalle('');
    setPedidoDetalle(null);
    try {
      const data = await api.get(`/api/repartidor/pedido/${idPedido}`);
      setPedidoDetalle(data);
    } catch (err) {
      setErrorDetalle(err.message || 'No se pudo cargar el detalle del pedido.');
    } finally {
      setCargandoDetalle(false);
    }
  }

  function cerrarModal() {
    setModalAbierto(false);
    setPedidoDetalle(null);
    setErrorDetalle('');
  }

  const pedidosEntregados = pedidos.filter((p) =>
    ESTADOS_FINALIZADOS.includes(String(p.estado_pedido).toLowerCase())
  );
  const comisionAcumulada = pedidosEntregados.reduce(
    (acc, p) => acc + parseFloat(p.comision || 0),
    0
  );

  return (
    <AppShell roleLabel="Repartidor" navItems={REPARTIDOR_NAV_ITEMS}>
      <div className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm px-4 py-2">{error}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cargando ? (
            <>
              <SkeletonStatTile />
              <SkeletonStatTile />
            </>
          ) : (
            <>
              <StatTile
                icon={Wallet}
                label="Comisión acumulada"
                value={`Bs ${comisionAcumulada.toFixed(2)}`}
              />
              <StatTile
                icon={PackageCheck}
                label="Pedidos entregados con éxito"
                value={pedidosEntregados.length}
              />
            </>
          )}
        </div>

        <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">
            <ClipboardList size={20} className="text-red-600" strokeWidth={2} />
            Todos mis Pedidos
          </h2>

          {cargando ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2 pr-2">ID Pedido</th>
                    <th className="py-2 pr-2">Fecha</th>
                    <th className="py-2 pr-2">Estado</th>
                    <th className="py-2 pr-2">Total</th>
                    <th className="py-2 pr-2">Comisión</th>
                    <th className="py-2 pr-2">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  <SkeletonTableRows rows={4} columns={6} />
                </tbody>
              </table>
            </div>
          ) : pedidos.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">Todavía no tomaste ningún pedido.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2 pr-2">ID Pedido</th>
                    <th className="py-2 pr-2">Fecha</th>
                    <th className="py-2 pr-2">Estado</th>
                    <th className="py-2 pr-2">Total</th>
                    <th className="py-2 pr-2">Comisión</th>
                    <th className="py-2 pr-2">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map((p) => (
                    <tr key={p.id_pedido} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                      <td className="py-2 pr-2 font-semibold text-slate-800 dark:text-slate-100">#{p.id_pedido}</td>
                      <td className="py-2 pr-2 text-slate-700 dark:text-slate-200">
                        {p.fecha ? new Date(p.fecha).toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-2 pr-2">
                        <EstadoBadge estado={p.estado_pedido} />
                      </td>
                      <td className="py-2 pr-2 text-slate-700 dark:text-slate-200">
                        Bs. {parseFloat(p.total).toFixed(2)}
                      </td>
                      <td className="py-2 pr-2 text-emerald-600 font-medium">
                        {p.comision > 0 ? `Bs. ${parseFloat(p.comision).toFixed(2)}` : '—'}
                      </td>
                      <td className="py-2 pr-2">
                        <button
                          onClick={() => verDetalle(p.id_pedido)}
                          className="inline-flex items-center gap-1.5 text-sm border border-red-600 text-red-600 hover:bg-red-50 rounded-lg px-3 py-1.5 transition"
                        >
                          <Eye size={14} />
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Modal: Detalle del pedido (auditoría) */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
                <ClipboardList size={20} className="text-red-600" />
                Detalle del Pedido {pedidoDetalle ? `#${pedidoDetalle.id_pedido}` : ''}
              </h3>
              <button onClick={cerrarModal} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300" aria-label="Cerrar">
                <X size={20} />
              </button>
            </div>

            {cargandoDetalle ? (
              <div className="space-y-4 py-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ) : errorDetalle ? (
              <div className="rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm px-4 py-2">{errorDetalle}</div>
            ) : pedidoDetalle ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <EstadoBadge estado={pedidoDetalle.estado_pedido} />
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {pedidoDetalle.fecha ? new Date(pedidoDetalle.fecha).toLocaleString() : 'N/A'}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                  <p className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-100 mb-2">
                    <UserRound size={16} className="text-red-600" />
                    {pedidoDetalle.cliente_nombre}
                  </p>
                  <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 mb-1">
                    <Phone size={14} className="text-slate-400 dark:text-slate-500" />
                    {pedidoDetalle.cliente_telefono || 'No registrado'}
                  </p>
                  <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <MapPin size={14} className="text-slate-400 dark:text-slate-500" />
                    {pedidoDetalle.cliente_direccion || 'No registrada'}
                  </p>
                </div>

                <div>
                  <p className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-100 mb-2">
                    <ShoppingBag size={16} className="text-red-600" />
                    Productos
                  </p>
                  <div className="space-y-1.5">
                    {(pedidoDetalle.productos || []).map((prod, idx) => (
                      <div key={idx} className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                        <span>
                          {prod.nombre} × {prod.cantidad}
                          <span className="text-slate-400 dark:text-slate-500"> · {prod.sucursal_nombre}</span>
                        </span>
                        <span className="font-medium text-slate-800 dark:text-slate-100">
                          Bs. {(parseFloat(prod.precio_unitario) * prod.cantidad).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-700 pt-3">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Total del pedido</span>
                  <span className="text-lg font-semibold text-red-600">
                    Bs. {parseFloat(pedidoDetalle.total).toFixed(2)}
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </AppShell>
  );
}
