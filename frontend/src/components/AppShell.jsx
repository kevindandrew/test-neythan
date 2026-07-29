import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, MapPin } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import CarritoFlotante from './CarritoFlotante';

function iniciales(nombre) {
  if (!nombre) return '?';
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export default function AppShell({ roleLabel, navItems, children }) {
  const [abierto, setAbierto] = useState(false);
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg overflow-hidden shrink-0">
          <img src="/logo.png" alt="Chaski Delivery" className="h-full w-full object-cover" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-none">Chaski Delivery</p>
          <p className="text-xs text-slate-400 mt-1">{roleLabel}</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            onClick={() => setAbierto(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-[#A60321] text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-white">
            {iniciales(usuario?.nombre)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {usuario?.nombre || 'Usuario'}
            </p>
            <p className="truncate text-xs text-slate-400">{usuario?.correo}</p>
          </div>
        </div>
        {usuario?.direccion && (
          <div className="flex items-start gap-2 mb-3 text-xs text-slate-400">
            <MapPin size={13} className="mt-0.5 shrink-0" />
            <span className="truncate">{usuario.direccion}</span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
        >
          <LogOut size={16} strokeWidth={2} />
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar - desktop */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-64 lg:flex-col bg-slate-900 print:hidden">
        {sidebarContent}
      </aside>

      {/* Sidebar - mobile drawer */}
      {abierto && (
        <div className="fixed inset-0 z-40 lg:hidden print:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setAbierto(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-slate-900 shadow-xl">
            <button
              onClick={() => setAbierto(false)}
              aria-label="Cerrar menú"
              className="absolute right-3 top-4 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Top bar - mobile only */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden print:hidden">
        <button
          onClick={() => setAbierto(true)}
          aria-label="Abrir menú"
          className="text-slate-600 hover:text-slate-900"
        >
          <Menu size={22} />
        </button>
        <span className="text-sm font-semibold text-slate-800">Chaski Delivery</span>
      </header>

      {/* Content */}
      <main className="lg:pl-64 print:pl-0">
        <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8 print:p-0 print:max-w-none">{children}</div>
      </main>

      <CarritoFlotante />
    </div>
  );
}
