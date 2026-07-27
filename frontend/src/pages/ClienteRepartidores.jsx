import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, CheckCircle2, ArrowLeft } from 'lucide-react';
import { api } from '../api/client';
import AppShell from '../components/AppShell';
import { CLIENTE_NAV_ITEMS } from './ClientePanel';

export default function ClienteRepartidores() {
  const navigate = useNavigate();
  const [pedidoTemporal, setPedidoTemporal] = useState(undefined);
  const [repartidores, setRepartidores] = useState([]);
  const [cargandoRepartidores, setCargandoRepartidores] = useState(true);
  const [errorRepartidores, setErrorRepartidores] = useState('');
  const [ciSeleccionado, setCiSeleccionado] = useState(null);
  const [errorPedido, setErrorPedido] = useState('');
  const [pedidoConfirmado, setPedidoConfirmado] = useState(null);

  useEffect(() => {
    let datos = null;
    try {
      datos = JSON.parse(localStorage.getItem('pedido_temporal'));
    } catch {
      datos = null;
    }
    setPedidoTemporal(datos || null);

    if (!datos) {
      setCargandoRepartidores(false);
      return;
    }

    (async () => {
      try {
        const data = await api.get('/api/repartidores/disponibles');
        setRepartidores(data || []);
      } catch (err) {
        setErrorRepartidores(err.message || 'No se pudieron cargar los repartidores');
      } finally {
        setCargandoRepartidores(false);
      }
    })();
  }, []);

  async function seleccionarRepartidor(ciRepartidor) {
    setErrorPedido('');
    setCiSeleccionado(ciRepartidor);
    try {
      const payload = { ...pedidoTemporal, ci_repartidor: ciRepartidor };
      const data = await api.post('/api/pedido/crear', payload);
      localStorage.removeItem('pedido_temporal');
      setPedidoConfirmado(data);
    } catch (err) {
      setErrorPedido(err.message || 'Ocurrió un error al procesar el pedido.');
    } finally {
      setCiSeleccionado(null);
    }
  }

  return (
    <AppShell roleLabel="Cliente" navItems={CLIENTE_NAV_ITEMS}>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 className="text-xl font-semibold text-slate-800">
            Confirmar Pedido y Seleccionar Repartidor
          </h1>
          <button
            onClick={() => navigate('/cliente/hacer-pedido')}
            className="flex items-center gap-1.5 text-sm border border-slate-300 rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-100 transition"
          >
            <ArrowLeft size={16} />
            Volver
          </button>
        </div>

        {pedidoConfirmado ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto text-center">
            <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={30} strokeWidth={2} />
            </div>
            <h2 className="text-lg font-semibold text-slate-800 mb-1">¡Pedido creado con éxito!</h2>
            <p className="text-sm text-slate-500 mb-4">
              {pedidoConfirmado.mensaje || 'Tu pedido fue registrado correctamente.'}
            </p>
            <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700 mb-6 space-y-1">
              <p>
                <span className="text-slate-500">ID de pedido:</span>{' '}
                <span className="font-medium">{pedidoConfirmado.id_pedido}</span>
              </p>
              {pedidoConfirmado.total_pagar !== undefined && (
                <p>
                  <span className="text-slate-500">Total a pagar:</span>{' '}
                  <span className="font-medium">Bs. {Number(pedidoConfirmado.total_pagar).toFixed(2)}</span>
                </p>
              )}
              {pedidoConfirmado.direccion && (
                <p>
                  <span className="text-slate-500">Dirección:</span>{' '}
                  <span className="font-medium">{pedidoConfirmado.direccion}</span>
                </p>
              )}
            </div>
            <button
              onClick={() => navigate('/cliente/mis-pedidos')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg py-2 transition"
            >
              Ver mis pedidos
            </button>
          </div>
        ) : pedidoTemporal === undefined ? (
          <p className="text-slate-500 text-sm">Cargando...</p>
        ) : pedidoTemporal === null ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto text-center">
            <p className="text-slate-700 font-medium mb-1">No se encontró un pedido en proceso.</p>
            <p className="text-slate-500 text-sm mb-6">
              Volvé al panel para armar un pedido antes de elegir un repartidor.
            </p>
            <button
              onClick={() => navigate('/cliente/hacer-pedido')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg py-2 transition"
            >
              Volver a Hacer Pedido
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Resumen del pedido */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-indigo-600 text-white px-5 py-3">
                  <h2 className="font-semibold text-sm">Resumen de tu Pedido</h2>
                </div>
                <div className="p-5">
                  <div className="space-y-2 mb-3">
                    {pedidoTemporal.detalles.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm text-slate-600">
                        <span>
                          Prod. ID: {item.id_producto} (Cant: <strong>{item.cantidad}</strong>)
                        </span>
                        <span>Bs. {(item.precio * item.cantidad).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <hr className="border-slate-200" />
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-sm font-medium text-slate-700">Total</span>
                    <span className="text-lg font-semibold text-emerald-600">
                      Bs. {Number(pedidoTemporal.total).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {errorPedido && (
                <div className="mt-4 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">
                  {errorPedido}
                </div>
              )}
            </div>

            {/* Repartidores disponibles */}
            <div className="md:col-span-2">
              <h2 className="flex items-center gap-2 text-base font-semibold text-slate-800 mb-3">
                <Truck size={18} className="text-indigo-600" />
                Repartidores Disponibles
              </h2>

              {cargandoRepartidores ? (
                <p className="text-slate-500 text-sm">Cargando repartidores...</p>
              ) : errorRepartidores ? (
                <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3">
                  {errorRepartidores}
                </div>
              ) : repartidores.length === 0 ? (
                <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3">
                  No hay repartidores disponibles en este momento.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {repartidores.map((rep) => (
                    <div
                      key={rep.ci_repartidor}
                      className="bg-white rounded-2xl shadow-sm p-5 flex flex-col justify-between"
                    >
                      <div className="mb-4">
                        <h3 className="font-semibold text-slate-800">
                          {rep.nombre} {rep.apepaterno}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                          <span className="font-medium text-slate-600">Celular:</span>{' '}
                          {rep.telefono || 'No registrado'}
                        </p>
                      </div>
                      <button
                        onClick={() => seleccionarRepartidor(rep.ci_repartidor)}
                        disabled={ciSeleccionado !== null}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium rounded-lg py-2 text-sm transition"
                      >
                        {ciSeleccionado === rep.ci_repartidor ? 'Confirmando...' : 'Elegir este Repartidor'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
