import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import EstadoBadge from '../components/EstadoBadge';
import AppShell from '../components/AppShell';
import PedidoMapa from '../components/PedidoMapa';
import {
  Home,
  PackageSearch,
  Bike,
  Wallet,
  UserRound,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  KeyRound,
  CheckCircle2,
  Store,
  BadgeCheck,
  Calendar,
} from 'lucide-react';

export const REPARTIDOR_NAV_ITEMS = [
  { to: '/repartidor/panel', label: 'Inicio', icon: Home },
  { to: '/repartidor/entregar-pedido', label: 'Entregar Pedido', icon: PackageSearch },
  { to: '/repartidor/vehiculo', label: 'Mi Vehículo', icon: Bike },
  { to: '/repartidor/comisiones', label: 'Mis Comisiones', icon: Wallet },
];

export default function RepartidorPanel() {
  const { usuario } = useAuth();
  const [pedidoActual, setPedidoActual] = useState(undefined);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [infoRepartidor, setInfoRepartidor] = useState(null);
  const [estadoActual, setEstadoActual] = useState('disponible');
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [errorEstado, setErrorEstado] = useState('');

  const [tokenInput, setTokenInput] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [errorToken, setErrorToken] = useState('');
  const [entregaConfirmada, setEntregaConfirmada] = useState(false);

  useEffect(() => {
    cargarInicio();
  }, []);

  async function cargarInicio() {
    setCargando(true);
    setError('');
    try {
      const data = await api.get('/api/repartidor/pedido-actual');
      setPedidoActual(data.pedido);

      if (!data.pedido) {
        const datosRepartidor = await api.get('/api/repartidor/pedidos');
        setEstadoActual(datosRepartidor.estado_repartidor);
        setInfoRepartidor(datosRepartidor.repartidor);
      }
    } catch (err) {
      setError(err.message || 'No se pudo cargar tu panel.');
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

  async function confirmarEntrega(e) {
    e.preventDefault();
    setErrorToken('');
    setConfirmando(true);
    try {
      await api.post(`/api/repartidor/pedido/${pedidoActual.id_pedido}/confirmar`, {
        token: tokenInput,
      });
      setEntregaConfirmada(true);
      setTimeout(() => {
        setEntregaConfirmada(false);
        setTokenInput('');
        cargarInicio();
      }, 1800);
    } catch (err) {
      setErrorToken(err.message || 'No se pudo confirmar la entrega.');
    } finally {
      setConfirmando(false);
    }
  }

  if (cargando) {
    return (
      <AppShell roleLabel="Repartidor" navItems={REPARTIDOR_NAV_ITEMS}>
        <p className="text-sm text-slate-400">Cargando...</p>
      </AppShell>
    );
  }

  return (
    <AppShell roleLabel="Repartidor" navItems={REPARTIDOR_NAV_ITEMS}>
      <div className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">{error}</div>
        )}

        {pedidoActual ? (
          <div className="space-y-4">
            <h1 className="text-xl font-semibold text-slate-800 tracking-tight">
              Pedido en Curso
            </h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PedidoMapa
                origen={{
                  direccion: pedidoActual.sucursal_direccion,
                  etiqueta: pedidoActual.sucursal_nombre,
                }}
                destino={{
                  direccion: pedidoActual.cliente_direccion,
                  etiqueta: pedidoActual.cliente_nombre,
                }}
              />

            <div className="space-y-4">
              <section className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-slate-800">
                    Pedido #{pedidoActual.id_pedido}
                  </h2>
                  <EstadoBadge estado={pedidoActual.estado_pedido} />
                </div>

                <div className="space-y-1.5 text-sm text-slate-600 mb-4">
                  <p className="flex items-center gap-2">
                    <UserRound size={14} className="text-slate-400" />
                    {pedidoActual.cliente_nombre}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone size={14} className="text-slate-400" />
                    {pedidoActual.cliente_telefono || 'No registrado'}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin size={14} className="text-slate-400" />
                    {pedidoActual.cliente_direccion || 'No registrada'}
                  </p>
                </div>

                <div className="border-t border-slate-200 pt-3">
                  <p className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <ShoppingBag size={14} className="text-slate-400" />
                    Productos
                  </p>
                  <div className="space-y-1">
                    {(pedidoActual.productos || []).map((prod, idx) => (
                      <div key={idx} className="flex justify-between text-sm text-slate-600">
                        <span>{prod.nombre} × {prod.cantidad}</span>
                        <span>Bs. {(parseFloat(prod.precio_unitario) * prod.cantidad).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                    <span className="text-sm font-medium text-slate-700">Total</span>
                    <span className="text-lg font-semibold text-indigo-600">
                      Bs. {parseFloat(pedidoActual.total).toFixed(2)}
                    </span>
                  </div>
                </div>
              </section>

              <section className="bg-white rounded-2xl shadow-lg p-6">
                {entregaConfirmada ? (
                  <div className="text-center py-4">
                    <CheckCircle2 size={32} className="text-emerald-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-800">
                      ¡Entrega confirmada! Factura generada.
                    </p>
                  </div>
                ) : (
                  <>
                    <h3 className="flex items-center gap-2 font-semibold text-slate-800 mb-3">
                      <KeyRound size={16} className="text-indigo-600" />
                      Confirmar entrega
                    </h3>
                    <p className="text-sm text-slate-500 mb-3">
                      Pedile al cliente el código de 5 dígitos e ingresalo acá para confirmar la
                      entrega y generar la factura.
                    </p>
                    {errorToken && (
                      <div className="mb-3 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">
                        {errorToken}
                      </div>
                    )}
                    <form onSubmit={confirmarEntrega} className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={5}
                        value={tokenInput}
                        onChange={(e) => setTokenInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="00000"
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-center text-lg tracking-widest font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="submit"
                        disabled={confirmando || tokenInput.length !== 5}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 text-sm transition"
                      >
                        {confirmando ? 'Confirmando...' : 'Confirmar'}
                      </button>
                    </form>
                  </>
                )}
              </section>
            </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-4">
                <UserRound size={20} className="text-indigo-600" strokeWidth={2} />
                Mi Información
              </h2>
              <div className="space-y-2.5 text-sm text-slate-600">
                <p className="flex items-center gap-2">
                  <UserRound size={14} className="text-slate-400" />
                  {usuario?.nombre || 'Repartidor'}
                </p>
                <p className="flex items-center gap-2">
                  <Mail size={14} className="text-slate-400" />
                  {usuario?.correo}
                </p>
                <p className="flex items-center gap-2">
                  <BadgeCheck size={14} className="text-slate-400" />
                  Licencia: {infoRepartidor?.nro_licencia || 'No registrada'}
                </p>
                {infoRepartidor?.fecha_registro && (
                  <p className="flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400" />
                    Repartidor desde{' '}
                    {new Date(infoRepartidor.fecha_registro).toLocaleDateString('es-BO', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>
            </section>

            <section className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-3">
                <Bike size={20} className="text-indigo-600" strokeWidth={2} />
                Mi Estado Actual
              </h2>
              <EstadoBadge estado={estadoActual} />

              {errorEstado && (
                <div className="mt-3 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">
                  {errorEstado}
                </div>
              )}

              <button
                onClick={alternarEstado}
                disabled={cambiandoEstado}
                className={`mt-4 w-full sm:w-auto text-sm font-medium rounded-lg px-4 py-2 transition text-white disabled:opacity-60 ${
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

              <p className="text-sm text-slate-500 mt-4">
                No tenés ningún pedido en curso. Andá a <strong>Entregar Pedido</strong> para aceptar
                uno disponible.
              </p>
            </section>
          </div>
        )}
      </div>
    </AppShell>
  );
}
