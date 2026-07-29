import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { CartProvider } from './cart/CartContext';
import RequireRole from './components/RequireRole';
import Login from './pages/Login';
import ClientePanel from './pages/ClientePanel';
import ClienteMisPedidos from './pages/ClienteMisPedidos';
import ClienteFavoritos from './pages/ClienteFavoritos';
import NegocioDashboard from './pages/NegocioDashboard';
import NegocioSucursales from './pages/NegocioSucursales';
import NegocioProductos from './pages/NegocioProductos';
import NegocioReportes from './pages/NegocioReportes';
import RepartidorPanel from './pages/RepartidorPanel';
import RepartidorEntregarPedido from './pages/RepartidorEntregarPedido';
import RepartidorVehiculo from './pages/RepartidorVehiculo';
import RepartidorComisiones from './pages/RepartidorComisiones';
import AdminDashboard from './pages/AdminDashboard';
import AdminPersonas from './pages/AdminPersonas';
import AdminClientes from './pages/AdminClientes';
import AdminRepartidores from './pages/AdminRepartidores';
import AdminNegocios from './pages/AdminNegocios';
import AdminProductos from './pages/AdminProductos';
import Factura from './pages/Factura';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />

            <Route
              path="/cliente/panel"
              element={
                <RequireRole role="cliente">
                  <ClientePanel />
                </RequireRole>
              }
            />
            <Route
              path="/cliente/mis-pedidos"
              element={
                <RequireRole role="cliente">
                  <ClienteMisPedidos />
                </RequireRole>
              }
            />
            <Route
              path="/cliente/favoritos"
              element={
                <RequireRole role="cliente">
                  <ClienteFavoritos />
                </RequireRole>
              }
            />

            <Route
              path="/dashboard"
              element={
                <RequireRole role="dueno_negocio">
                  <NegocioDashboard />
                </RequireRole>
              }
            />
            <Route
              path="/dashboard/sucursales"
              element={
                <RequireRole role="dueno_negocio">
                  <NegocioSucursales />
                </RequireRole>
              }
            />
            <Route
              path="/dashboard/productos"
              element={
                <RequireRole role="dueno_negocio">
                  <NegocioProductos />
                </RequireRole>
              }
            />
            <Route
              path="/dashboard/reportes"
              element={
                <RequireRole role="dueno_negocio">
                  <NegocioReportes />
                </RequireRole>
              }
            />

            <Route
              path="/repartidor/panel"
              element={
                <RequireRole role="repartidor">
                  <RepartidorPanel />
                </RequireRole>
              }
            />
            <Route
              path="/repartidor/entregar-pedido"
              element={
                <RequireRole role="repartidor">
                  <RepartidorEntregarPedido />
                </RequireRole>
              }
            />
            <Route
              path="/repartidor/vehiculo"
              element={
                <RequireRole role="repartidor">
                  <RepartidorVehiculo />
                </RequireRole>
              }
            />
            <Route
              path="/repartidor/comisiones"
              element={
                <RequireRole role="repartidor">
                  <RepartidorComisiones />
                </RequireRole>
              }
            />

            <Route
              path="/admin/panel"
              element={
                <RequireRole role="admin">
                  <AdminDashboard />
                </RequireRole>
              }
            />
            <Route
              path="/admin/personas"
              element={
                <RequireRole role="admin">
                  <AdminPersonas />
                </RequireRole>
              }
            />
            <Route
              path="/admin/clientes"
              element={
                <RequireRole role="admin">
                  <AdminClientes />
                </RequireRole>
              }
            />
            <Route
              path="/admin/repartidores"
              element={
                <RequireRole role="admin">
                  <AdminRepartidores />
                </RequireRole>
              }
            />
            <Route
              path="/admin/negocios"
              element={
                <RequireRole role="admin">
                  <AdminNegocios />
                </RequireRole>
              }
            />
            <Route
              path="/admin/productos"
              element={
                <RequireRole role="admin">
                  <AdminProductos />
                </RequireRole>
              }
            />

            <Route path="/factura/:idPedido" element={<Factura />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}