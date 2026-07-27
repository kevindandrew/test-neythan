import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import RequireRole from './components/RequireRole';
import Login from './pages/Login';
import ClientePanel from './pages/ClientePanel';
import ClienteHacerPedido from './pages/ClienteHacerPedido';
import ClienteMisPedidos from './pages/ClienteMisPedidos';
import ClienteRepartidores from './pages/ClienteRepartidores';
import NegocioDashboard from './pages/NegocioDashboard';
import NegocioSucursales from './pages/NegocioSucursales';
import RepartidorPanel from './pages/RepartidorPanel';
import RepartidorEntregas from './pages/RepartidorEntregas';
import Factura from './pages/Factura';

export default function App() {
  return (
    <AuthProvider>
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
            path="/cliente/hacer-pedido"
            element={
              <RequireRole role="cliente">
                <ClienteHacerPedido />
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
            path="/cliente/repartidores"
            element={
              <RequireRole role="cliente">
                <ClienteRepartidores />
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
            path="/repartidor/panel"
            element={
              <RequireRole role="repartidor">
                <RepartidorPanel />
              </RequireRole>
            }
          />
          <Route
            path="/repartidor/entregas"
            element={
              <RequireRole role="repartidor">
                <RepartidorEntregas />
              </RequireRole>
            }
          />

          <Route path="/factura/:idPedido" element={<Factura />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
