import { useEffect, useMemo, useState } from 'react';
import { FileText, Printer, ArrowLeft, Calendar } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import AppShell from '../components/AppShell';
import { Skeleton } from '../components/Skeleton';
import { NEGOCIO_NAV_ITEMS } from './NegocioDashboard';

function claveMes(fechaISO) {
  const fecha = new Date(fechaISO);
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
}

function nombreMes(clave) {
  const [anio, mes] = clave.split('-').map(Number);
  const fecha = new Date(anio, mes - 1, 1);
  const texto = fecha.toLocaleDateString('es-BO', { month: 'long', year: 'numeric' });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export default function NegocioReportes() {
  const { usuario } = useAuth();
  const [facturas, setFacturas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mesSeleccionado, setMesSeleccionado] = useState(null);

  useEffect(() => {
    cargarReportes();
  }, []);

  async function cargarReportes() {
    setCargando(true);
    setError('');
    try {
      const data = await api.get('/api/negocio/reportes');
      setFacturas(data);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los reportes.');
    } finally {
      setCargando(false);
    }
  }

  const meses = useMemo(() => {
    const grupos = new Map();
    facturas.forEach((f) => {
      const clave = claveMes(f.fecha_emision);
      if (!grupos.has(clave)) grupos.set(clave, []);
      grupos.get(clave).push(f);
    });
    return Array.from(grupos, ([clave, items]) => ({
      clave,
      nombre: nombreMes(clave),
      cantidad: items.length,
      total: items.reduce((acc, f) => acc + parseFloat(f.total || 0), 0),
      facturas: items,
    })).sort((a, b) => (a.clave < b.clave ? 1 : -1));
  }, [facturas]);

  const mesActivo = meses.find((m) => m.clave === mesSeleccionado);

  if (mesActivo) {
    return (
      <AppShell roleLabel={usuario?.nombre_negocio || 'Negocio'} navItems={NEGOCIO_NAV_ITEMS}>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
            <button
              onClick={() => setMesSeleccionado(null)}
              className="flex items-center gap-1.5 text-sm border border-slate-300 rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-100 transition"
            >
              <ArrowLeft size={16} />
              Volver a Reportes
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg px-4 py-2 transition"
            >
              <Printer size={16} />
              Descargar PDF
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-slate-800">
                {usuario?.nombre_negocio || 'Negocio'}
              </h2>
              <p className="text-sm text-slate-500">Reporte de ventas — {mesActivo.nombre}</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-4 font-medium">ID Factura</th>
                    <th className="py-2 pr-4 font-medium">Fecha</th>
                    <th className="py-2 pr-4 font-medium">Sucursal</th>
                    <th className="py-2 pr-4 font-medium">NIT</th>
                    <th className="py-2 pr-4 font-medium">Tipo Pago</th>
                    <th className="py-2 pr-4 font-medium text-right">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {mesActivo.facturas.map((f) => (
                    <tr key={f.id_factura} className="border-b border-slate-100">
                      <td className="py-2 pr-4">{f.id_factura}</td>
                      <td className="py-2 pr-4">
                        {new Date(f.fecha_emision).toLocaleDateString('es-BO')}
                      </td>
                      <td className="py-2 pr-4">{f.sucursal_nombre}</td>
                      <td className="py-2 pr-4">{f.nit}</td>
                      <td className="py-2 pr-4">{f.tipo_pago}</td>
                      <td className="py-2 pr-4 text-right">Bs {parseFloat(f.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-semibold text-slate-800">
                    <td colSpan={5} className="py-3 pr-4 text-right">
                      Total del mes ({mesActivo.cantidad} facturas)
                    </td>
                    <td className="py-3 pr-4 text-right text-red-600">
                      Bs {mesActivo.total.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell roleLabel={usuario?.nombre_negocio || 'Negocio'} navItems={NEGOCIO_NAV_ITEMS}>
      <div className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">{error}</div>
        )}

        <section className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-4">
            <FileText size={20} strokeWidth={2} className="text-red-600" />
            Reportes de Ventas
          </h2>

          {cargando ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          ) : meses.length === 0 ? (
            <p className="text-sm text-slate-500">Todavía no hay facturas para generar reportes.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {meses.map((m) => (
                <div key={m.clave} className="rounded-xl border border-slate-200 p-4">
                  <p className="flex items-center gap-2 font-semibold text-slate-800 mb-1">
                    <Calendar size={16} className="text-red-600" />
                    {m.nombre}
                  </p>
                  <p className="text-sm text-slate-500 mb-1">{m.cantidad} facturas</p>
                  <p className="text-lg font-semibold text-red-600 mb-3">
                    Bs {m.total.toFixed(2)}
                  </p>
                  <button
                    onClick={() => setMesSeleccionado(m.clave)}
                    className="w-full text-sm border border-red-600 text-red-600 hover:bg-red-50 rounded-lg px-4 py-2 transition"
                  >
                    Ver Reporte
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
