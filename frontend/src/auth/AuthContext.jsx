import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

function readStoredAuth() {
  const token = localStorage.getItem('token');
  const rol = localStorage.getItem('rol');
  if (!token || !rol) return null;

  let usuario = null;
  try {
    usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
  } catch {
    usuario = null;
  }

  return { token, rol, usuario };
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth);

  function login({ token, rol, usuario }) {
    localStorage.setItem('token', token);
    localStorage.setItem('rol', rol);
    localStorage.setItem('usuario', JSON.stringify(usuario));
    setAuth({ token, rol, usuario });
  }

  function logout() {
    localStorage.clear();
    setAuth(null);
  }

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
