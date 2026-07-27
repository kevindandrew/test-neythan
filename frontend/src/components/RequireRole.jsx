import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function RequireRole({ role, children }) {
  const auth = useAuth();

  if (!auth?.token) return <Navigate to="/" replace />;
  if (role && auth.rol !== role) return <Navigate to="/" replace />;

  return children;
}
