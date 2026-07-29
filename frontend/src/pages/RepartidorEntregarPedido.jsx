import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PackageSearch, MapPin, Store, CheckCircle2, X, ShoppingBag, Calendar } from 'lucide-react';
import { api } from '../api/client';
import AppShell from '../components/AppShell';
import { Skeleton } from '../components/Skeleton';
import { REPARTIDOR_NAV_ITEMS } from './RepartidorPanel';

function ModalDetallePedido({ pedido, aceptando, error, onAceptar, onCerrar }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Pedido #{pedido.id_pedido}</h3>
          <button onClick={onCerrar} aria-label="Cerrar" className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm px-4 py-2">{error}</div>
        )}

        <div className="overflow-y-auto -mx-1 px-1 space-y-3">
          <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <Store size={14} className="text-slate-400 dark:text-slate-500" />
            {pedido.nombre_negocio} · {pedido.sucursal_nombre}
          </p>
          <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <MapPin size={14} className="text-slate-400 dark:text-slate-500" />
            {pedido.cliente_direccion || 'No registrada'}
          </p>
          <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <Calendar size={14} className="text-slate-400 dark:text-slate-500" />
            {new Date(pedido.fecha).toLocaleString('es-BO', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
            <p className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              <ShoppingBag size={14} className="text-slate-400 dark:text-slate-500" />
              Productos
            </p>
            <div className="space-y-1">
              {(pedido.productos || []).map((prod, idx) => (
                <div key={idx} className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                  <span>
                    {prod.nombre} × {prod.cantidad}
                  </span>
                  <span>Bs. {(parseFloat(prod.precio_unitario) * prod.cantidad).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Total</span>
              <span className="text-lg font-semibold text-red-600">
                Bs. {parseFloat(pedido.total).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onAceptar}
          disabled={aceptando}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg py-2.5 transition"
        >
          <CheckCircle2 size={16} />
          {aceptando ? 'Aceptando...' : 'Aceptar Pedido'}
        </button>
      </div>
    </div>
  );
}

export default function RepartidorEntregarPedido() {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [errorModal, setErrorModal] = useState('');
  const [aceptando, setAceptando] = useState(false);

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

  function abrirDetalle(pedido) {
    setErrorModal('');
    setPedidoSeleccionado(pedido);
  }

  function cerrarDetalle() {
    setPedidoSeleccionado(null);
    setErrorModal('');
  }

  async function aceptarPedido() {
    if (!pedidoSeleccionado) return;
    setErrorModal('');
    setAceptando(true);
    try {
      await api.post(`/api/repartidor/pedido/${pedidoSeleccionado.id_pedido}/aceptar`, {});
      navigate('/repartidor/panel');
    } catch (err) {
      setErrorModal(err.message || 'No se pudo aceptar el pedido.');
      setAceptando(false);
      cargarDisponibles();
    }
  }

  return (
    <AppShell roleLabel="Repartidor" navItems={REPARTIDOR_NAV_ITEMS}>
      <div className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm px-4 py-2">{error}</div>
        )}

        <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
            <PackageSearch size={20} className="text-red-600" strokeWidth={2} />
            Pedidos Disponibles
          </h2>

          {cargando ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              ))}
            </div>
          ) : pedidos.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">
              No hay pedidos disponibles para aceptar en este momento.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pedidos.map((p) => (
                <button
                  key={p.id_pedido}
                  onClick={() => abrirDetalle(p)}
                  className="text-left rounded-xl border border-slate-200 dark:border-slate-700 hover:border-red-300 hover:shadow-md transition p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100">Pedido #{p.id_pedido}</h3>
                    <span className="text-sm font-semibold text-red-600">
                      Bs. {parseFloat(p.total).toFixed(2)}
                    </span>
                  </div>
                  <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 mb-1">
                    <Store size={14} className="text-slate-400 dark:text-slate-500" />
                    {p.nombre_negocio} · {p.sucursal_nombre}
                  </p>
                  <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <MapPin size={14} className="text-slate-400 dark:text-slate-500" />
                    {p.cliente_direccion || 'No registrada'}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {pedidoSeleccionado && (
        <ModalDetallePedido
          pedido={pedidoSeleccionado}
          aceptando={aceptando}
          error={errorModal}
          onAceptar={aceptarPedido}
          onCerrar={cerrarDetalle}
        />
      )}
    </AppShell>
  );
}
