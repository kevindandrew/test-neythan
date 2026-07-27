import { useEffect, useState } from 'react';
import { Home, ShoppingCart, ShoppingBag, User } from 'lucide-react';
import { api } from '../api/client';
import AppShell from '../components/AppShell';

export const CLIENTE_NAV_ITEMS = [
  { to: '/cliente/panel', label: 'Inicio', icon: Home },
  { to: '/cliente/hacer-pedido', label: 'Hacer Pedido', icon: ShoppingCart },
  { to: '/cliente/mis-pedidos', label: 'Mis Pedidos', icon: ShoppingBag },
];

export default function ClientePanel() {
  const [perfil, setPerfil] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarPerfil();
  }, []);

  async function cargarPerfil() {
    try {
      const data = await api.get('/api/cliente/perfil');
      setPerfil(data);
    } catch (err) {
      setError(err.message || 'No se pudo cargar tu perfil.');
    }
  }

  return (
    <AppShell roleLabel="Cliente" navItems={CLIENTE_NAV_ITEMS}>
      <div className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">{error}</div>
        )}

        <section className="bg-white rounded-2xl shadow-lg p-6">
          <h4 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-3">
            <User size={18} className="text-indigo-600" />
            Mis Datos
          </h4>
          {perfil ? (
            <div className="text-sm text-slate-600 space-y-1">
              <p>
                <span className="font-medium text-slate-800">Nombre:</span>{' '}
                {perfil.nombre} {perfil.apellido}
              </p>
              <p>
                <span className="font-medium text-slate-800">Celular:</span> {perfil.telefono}
              </p>
              <p>
                <span className="font-medium text-slate-800">Correo:</span> {perfil.correo}
              </p>
              <p>
                <span className="font-medium text-slate-800">Dirección:</span> {perfil.direccion}
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Cargando...</p>
          )}
        </section>
      </div>
    </AppShell>
  );
}
