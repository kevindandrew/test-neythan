import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { api } from '../api/client';
import AppShell from '../components/AppShell';
import { imagenProducto } from '../utils/placeholderImage';
import { SkeletonCardGrid } from '../components/Skeleton';
import { CLIENTE_NAV_ITEMS } from './ClientePanel';

export default function ClienteFavoritos() {
  const navigate = useNavigate();
  const [favoritos, setFavoritos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [quitando, setQuitando] = useState(null);

  useEffect(() => {
    cargarFavoritos();
  }, []);

  async function cargarFavoritos() {
    setCargando(true);
    setError('');
    try {
      const data = await api.get('/api/cliente/favoritos');
      setFavoritos(data);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar tus favoritos.');
    } finally {
      setCargando(false);
    }
  }

  async function quitarFavorito(idProducto) {
    setQuitando(idProducto);
    try {
      await api.del(`/api/cliente/favoritos/${idProducto}`);
      setFavoritos((prev) => prev.filter((p) => p.id_producto !== idProducto));
    } catch (err) {
      setError(err.message || 'No se pudo quitar el favorito.');
    } finally {
      setQuitando(null);
    }
  }

  function pedirDeNuevo(producto) {
    navigate(
      `/cliente/panel?sucursal=${producto.id_sucursal}&nombre=${encodeURIComponent(producto.sucursal_nombre)}&negocio=${encodeURIComponent(producto.nombre_negocio)}&producto=${producto.id_producto}`
    );
  }

  return (
    <AppShell roleLabel="Cliente" navItems={CLIENTE_NAV_ITEMS}>
      <div className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">{error}</div>
        )}

        <section className="bg-white rounded-2xl shadow-lg p-6">
          <h5 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-4">
            <Heart size={18} className="text-red-600" />
            Mis Favoritos
          </h5>

          {cargando ? (
            <SkeletonCardGrid count={3} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" />
          ) : favoritos.length === 0 ? (
            <p className="text-sm text-slate-400">
              Todavía no marcaste ningún producto como favorito. Podés hacerlo desde "Para Ti" en el Inicio.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoritos.map((p) => (
                <div
                  key={p.id_producto}
                  className="rounded-xl border border-slate-200 overflow-hidden flex flex-col"
                >
                  <img
                    src={imagenProducto(p.id_producto, p.nombre_producto)}
                    alt={p.nombre_producto}
                    className="w-full h-28 object-cover"
                    loading="lazy"
                  />
                  <div className="p-4 flex flex-col flex-1">
                    <p className="font-medium text-slate-800">{p.nombre_producto}</p>
                    <p className="text-xs text-slate-400 mb-1">
                      {p.nombre_negocio} · {p.sucursal_nombre}
                    </p>
                    <p className="text-sm font-semibold text-red-600 mb-3">Bs. {p.precio}</p>
                    <div className="mt-auto flex items-center gap-2">
                      <button
                        onClick={() => pedirDeNuevo(p)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg px-3 py-1.5 transition"
                      >
                        <ShoppingCart size={14} />
                        Pedir
                      </button>
                      <button
                        onClick={() => quitarFavorito(p.id_producto)}
                        disabled={quitando === p.id_producto}
                        aria-label="Quitar de favoritos"
                        className="p-2 text-slate-400 hover:text-red-600 disabled:opacity-50 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
