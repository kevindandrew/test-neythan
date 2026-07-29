import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Mail, Lock, Eye, EyeOff, Truck, ShieldCheck, Clock, Store, Navigation } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';

const ROL_HOME = {
  cliente: '/cliente/panel',
  dueno_negocio: '/dashboard',
  repartidor: '/repartidor/panel',
  admin: '/admin/panel',
};

const initialRegistro = {
  rol: 'cliente',
  ci: '',
  nombre: '',
  apepaterno: '',
  telefono: '',
  correo: '',
  direccion: '',
  contrasena: '',
  nombre_negocio: '',
  zona: '',
};

const inputClass =
  'w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition';

const plainInputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition';

function Field({ icon: Icon, children }) {
  return (
    <div className="relative">
      <Icon size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      {children}
    </div>
  );
}

export default function Login() {
  const [modo, setModo] = useState('login');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [verContrasena, setVerContrasena] = useState(false);
  const [registro, setRegistro] = useState(initialRegistro);
  const [verContrasenaRegistro, setVerContrasenaRegistro] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const [tarifas, setTarifas] = useState([]);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get('/api/tarifas')
      .then(setTarifas)
      .catch(() => setTarifas([]));
  }, []);

  function cambiarModo(nuevoModo) {
    setModo(nuevoModo);
    setError('');
    setMensaje('');
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const data = await api.post('/api/login', { correo, contrasena });
      login({ token: data.token, rol: data.rol, usuario: data.usuario });
      navigate(ROL_HOME[data.rol] || '/');
    } catch (err) {
      setError(err.message || 'No se pudo conectar con el servidor');
    } finally {
      setCargando(false);
    }
  }

  async function handleRegistro(e) {
    e.preventDefault();
    setError('');
    setMensaje('');
    setCargando(true);
    try {
      await api.post('/api/registro', registro);
      setMensaje('Cuenta creada con éxito. Ya podés iniciar sesión.');
      setCorreo(registro.correo);
      setRegistro(initialRegistro);
      setModo('login');
    } catch (err) {
      setError(err.message || 'No se pudo crear la cuenta');
    } finally {
      setCargando(false);
    }
  }

  function updateRegistro(campo, valor) {
    setRegistro((prev) => ({ ...prev, [campo]: valor }));
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Panel de marca - solo desktop */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-linear-to-br from-indigo-700 via-indigo-600 to-slate-900 text-white flex-col justify-between p-12 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="relative flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 backdrop-blur">
            <Package size={22} strokeWidth={2} />
          </div>
          <span className="text-lg font-semibold">Chaski Delivery</span>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold leading-tight mb-4">
            Gestioná tu negocio de reparto de punta a punta.
          </h2>
          <p className="text-indigo-100/80 text-sm leading-relaxed">
            Pedidos, sucursales, repartidores y facturación en un solo lugar, pensado para
            clientes, negocios y repartidores.
          </p>
        </div>

        <div className="relative grid grid-cols-3 gap-4 text-indigo-100/90">
          <div className="flex flex-col gap-2">
            <Truck size={20} />
            <span className="text-xs">Seguimiento de pedidos</span>
          </div>
          <div className="flex flex-col gap-2">
            <ShieldCheck size={20} />
            <span className="text-xs">Acceso por roles</span>
          </div>
          <div className="flex flex-col gap-2">
            <Clock size={20} />
            <span className="text-xs">Estados en tiempo real</span>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="flex flex-1 items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-600">
              <Package size={22} className="text-white" strokeWidth={2} />
            </div>
            <h1 className="text-xl font-semibold text-slate-800">Chaski Delivery</h1>
          </div>

          <div className="hidden lg:block mb-8">
            <h1 className="text-2xl font-semibold text-slate-800">
              {modo === 'login' ? 'Bienvenido de nuevo' : 'Creá tu cuenta'}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {modo === 'login' ? 'Iniciá sesión para continuar' : 'Completá tus datos para empezar'}
            </p>
          </div>
          <p className="text-slate-500 text-sm text-center mb-6 lg:hidden">
            {modo === 'login' ? 'Iniciá sesión para continuar' : 'Creá tu cuenta'}
          </p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2.5">
              {error}
            </div>
          )}
          {mensaje && (
            <div className="mb-4 rounded-lg bg-emerald-50 text-emerald-700 text-sm px-4 py-2.5">
              {mensaje}
            </div>
          )}

          {modo === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Correo electrónico
                </label>
                <Field icon={Mail}>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    className={inputClass}
                    placeholder="tu@correo.com"
                  />
                </Field>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Contraseña
                </label>
                <Field icon={Lock}>
                  <input
                    type={verContrasena ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={contrasena}
                    onChange={(e) => setContrasena(e.target.value)}
                    className={`${inputClass} pr-10`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setVerContrasena((v) => !v)}
                    aria-label={verContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {verContrasena ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </Field>
              </div>
              <button
                type="submit"
                disabled={cargando}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium rounded-lg py-2.5 text-sm transition"
              >
                {cargando ? 'Ingresando...' : 'Ingresar'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegistro} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Rol</label>
                <select
                  value={registro.rol}
                  onChange={(e) => updateRegistro('rol', e.target.value)}
                  className={plainInputClass}
                >
                  <option value="cliente">Cliente</option>
                  <option value="negocio">Dueño de negocio</option>
                  <option value="repartidor">Repartidor</option>
                </select>
              </div>
              {registro.rol === 'negocio' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Nombre del negocio
                  </label>
                  <Field icon={Store}>
                    <input
                      type="text"
                      required
                      value={registro.nombre_negocio}
                      onChange={(e) => updateRegistro('nombre_negocio', e.target.value)}
                      className={inputClass}
                      placeholder="Ej: El Buen Sabor"
                    />
                  </Field>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">CI</label>
                  <input
                    type="number"
                    required
                    value={registro.ci}
                    onChange={(e) => updateRegistro('ci', e.target.value)}
                    className={plainInputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Teléfono</label>
                  <input
                    type="text"
                    value={registro.telefono}
                    onChange={(e) => updateRegistro('telefono', e.target.value)}
                    className={plainInputClass}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre</label>
                  <input
                    type="text"
                    required
                    value={registro.nombre}
                    onChange={(e) => updateRegistro('nombre', e.target.value)}
                    className={plainInputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Apellido</label>
                  <input
                    type="text"
                    value={registro.apepaterno}
                    onChange={(e) => updateRegistro('apepaterno', e.target.value)}
                    className={plainInputClass}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Correo</label>
                <Field icon={Mail}>
                  <input
                    type="email"
                    required
                    value={registro.correo}
                    onChange={(e) => updateRegistro('correo', e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Dirección</label>
                <input
                  type="text"
                  value={registro.direccion}
                  onChange={(e) => updateRegistro('direccion', e.target.value)}
                  placeholder="Dirección tal cual aparece en Google Maps"
                  className={plainInputClass}
                />
              </div>
              {registro.rol === 'cliente' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Zona</label>
                  <Field icon={Navigation}>
                    <select
                      value={registro.zona}
                      onChange={(e) => updateRegistro('zona', e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Seleccioná tu zona</option>
                      {tarifas.map((t) => (
                        <option key={t.id_tarifa} value={t.zona}>
                          {t.zona}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
                <Field icon={Lock}>
                  <input
                    type={verContrasenaRegistro ? 'text' : 'password'}
                    required
                    value={registro.contrasena}
                    onChange={(e) => updateRegistro('contrasena', e.target.value)}
                    className={`${inputClass} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setVerContrasenaRegistro((v) => !v)}
                    aria-label={verContrasenaRegistro ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {verContrasenaRegistro ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </Field>
              </div>
              <button
                type="submit"
                disabled={cargando}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium rounded-lg py-2.5 text-sm transition"
              >
                {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-slate-500 mt-6">
            {modo === 'login' ? (
              <>
                ¿No tenés cuenta?{' '}
                <button
                  onClick={() => cambiarModo('registro')}
                  className="text-indigo-600 font-medium hover:underline"
                >
                  Creá una
                </button>
              </>
            ) : (
              <>
                ¿Ya tenés cuenta?{' '}
                <button
                  onClick={() => cambiarModo('login')}
                  className="text-indigo-600 font-medium hover:underline"
                >
                  Iniciá sesión
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
