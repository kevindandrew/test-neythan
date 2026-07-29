import { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Store,
  Package,
  FileText,
  Wallet,
  Receipt,
  Calculator,
  BarChart3,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import AppShell from '../components/AppShell';
import StatTile from '../components/StatTile';
import SimpleBarChart from '../components/SimpleBarChart';
import { Skeleton } from '../components/Skeleton';

export const NEGOCIO_NAV_ITEMS = [
  { to: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { to: '/dashboard/sucursales', label: 'Sucursales', icon: Store },
  { to: '/dashboard/productos', label: 'Productos', icon: Package },
  { to: '/dashboard/reportes', label: 'Reportes', icon: FileText },
];

export default function NegocioDashboard() {
  const { usuario } = useAuth();
  const [sucursales, setSucursales] = useState([]);
  const [productos, setProductos] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [gananciasTotales, setGananciasTotales] = useState(0);
  const [ventasMesActual, setVentasMesActual] = useState(0);
  const [crecimiento, setCrecimiento] = useState(0);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarDashboard();
  }, []);

  async function cargarDashboard() {
    setCargando(true);
    setError('');
    try {
      const data = await api.get('/api/negocio/dashboard');
      setSucursales(data.sucursales || []);
      setProductos(data.productos || []);
      setFacturas(data.facturas || []);
      setGananciasTotales(Number(data.ganancias_totales) || 0);
      setVentasMesActual(Number(data.ventas_mes_actual) || 0);
      setCrecimiento(Number(data.crecimiento_porcentual) || 0);
    } catch (err) {
      setError(err.message || 'No se pudo cargar el panel del negocio');
    } finally {
      setCargando(false);
    }
  }

  const facturasPorDia = useMemo(() => {
    const grupos = new Map();
    facturas.forEach((f) => {
      const fecha = f.fecha_emision ? new Date(f.fecha_emision) : null;
      const clave = fecha
        ? fecha.toLocaleDateString('es-BO', { day: '2-digit', month: 'short' })
        : 'N/D';
      grupos.set(clave, (grupos.get(clave) || 0) + Number(f.total || 0));
    });
    return Array.from(grupos, ([label, value]) => ({ label, value }));
  }, [facturas]);

  const promedioPorFactura = facturas.length ? gananciasTotales / facturas.length : 0;
  const crecimientoPositivo = crecimiento >= 0;

  return (
    <AppShell roleLabel={usuario?.nombre_negocio || 'Negocio'} navItems={NEGOCIO_NAV_ITEMS}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-slate-800">{usuario?.nombre_negocio}</h1>

        {error && (
          <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">{error}</div>
        )}

        {/* Ganancias totales */}
        <div className="bg-emerald-600 text-white rounded-2xl shadow-lg p-6">
          <h2 className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-emerald-100">
            <Wallet size={16} strokeWidth={2} />
            Ganancias Totales Acumuladas
          </h2>
          <div className="flex flex-wrap items-end gap-3 mt-2">
            <p className="text-5xl font-bold">Bs {gananciasTotales.toFixed(2)}</p>
            <span
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold mb-1 ${
                crecimientoPositivo ? 'bg-white/20 text-white' : 'bg-black/20 text-white'
              }`}
            >
              {crecimientoPositivo ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {crecimientoPositivo ? '+' : ''}
              {crecimiento}% vs. mes anterior
            </span>
          </div>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatTile
            icon={Wallet}
            label="Ventas este mes"
            value={`Bs ${ventasMesActual.toFixed(2)}`}
          />
          <StatTile icon={Store} label="Sucursales" value={sucursales.length} />
          <StatTile icon={Package} label="Productos registrados" value={productos.length} />
          <StatTile icon={Receipt} label="Facturas emitidas" value={facturas.length} />
          <StatTile
            icon={Calculator}
            label="Promedio por factura"
            value={`Bs ${promedioPorFactura.toFixed(2)}`}
          />
        </div>

        {/* Facturación por día */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-4">
            <BarChart3 size={20} strokeWidth={2} className="text-red-600" />
            Facturación por Día
          </h3>
          {cargando ? (
            <Skeleton className="h-64 w-full rounded-lg" />
          ) : facturasPorDia.length === 0 ? (
            <p className="text-sm text-slate-500">Todavía no hay facturas para graficar.</p>
          ) : (
            <SimpleBarChart data={facturasPorDia} valuePrefix="Bs " />
          )}
        </div>
      </div>
    </AppShell>
  );
}
