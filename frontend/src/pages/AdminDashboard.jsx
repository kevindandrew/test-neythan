import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  UserRound,
  Bike,
  Store,
  Package,
  ShoppingBag,
  Wallet,
} from 'lucide-react';
import { api } from '../api/client';
import AppShell from '../components/AppShell';
import StatTile from '../components/StatTile';
import { SkeletonStatTile } from '../components/Skeleton';

export const ADMIN_NAV_ITEMS = [
  { to: '/admin/panel', label: 'Inicio', icon: LayoutDashboard },
  { to: '/admin/personas', label: 'Personas', icon: Users },
  { to: '/admin/clientes', label: 'Clientes', icon: UserRound },
  { to: '/admin/repartidores', label: 'Repartidores', icon: Bike },
  { to: '/admin/negocios', label: 'Negocios', icon: Store },
  { to: '/admin/productos', label: 'Productos', icon: Package },
];

export default function AdminDashboard() {
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarResumen();
  }, []);

  async function cargarResumen() {
    setCargando(true);
    setError('');
    try {
      const data = await api.get('/api/admin/dashboard');
      setResumen(data);
    } catch (err) {
      setError(err.message || 'No se pudo cargar el panel de administración');
    } finally {
      setCargando(false);
    }
  }

  const ventasTotales = Number(resumen?.ventas_totales) || 0;

  return (
    <AppShell roleLabel="Super Administrador" navItems={ADMIN_NAV_ITEMS}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Panel de Administración</h1>

        {error && (
          <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2 dark:bg-red-950/40 dark:text-red-300">{error}</div>
        )}

        <div className="bg-red-600 text-white rounded-2xl shadow-lg p-6">
          <h2 className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-red-100">
            <Wallet size={16} strokeWidth={2} />
            Ventas Totales de la Plataforma
          </h2>
          <p className="text-5xl font-bold mt-2">Bs {ventasTotales.toFixed(2)}</p>
        </div>

        {cargando ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <SkeletonStatTile />
            <SkeletonStatTile />
            <SkeletonStatTile />
            <SkeletonStatTile />
            <SkeletonStatTile />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatTile icon={UserRound} label="Clientes" value={resumen?.total_clientes ?? 0} />
            <StatTile icon={Store} label="Negocios" value={resumen?.total_negocios ?? 0} />
            <StatTile icon={Bike} label="Repartidores" value={resumen?.total_repartidores ?? 0} />
            <StatTile icon={Package} label="Productos" value={resumen?.total_productos ?? 0} />
            <StatTile icon={ShoppingBag} label="Pedidos totales" value={resumen?.total_pedidos ?? 0} />
          </div>
        )}
      </div>
    </AppShell>
  );
}
