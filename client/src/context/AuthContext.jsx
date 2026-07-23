import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // La cookie de sesion es httpOnly (no legible desde JS), asi que al
    // cargar la app se pregunta al backend quien esta logueado.
    api
      .get('/auth/me')
      .then((data) => setUsuario(data.usuario))
      .catch(() => setUsuario(null))
      .finally(() => setCargando(false));
  }, []);

  async function login(email, password) {
    const data = await api.post('/auth/login', { email, password });
    setUsuario(data.usuario);
  }

  async function logout() {
    await api.post('/auth/logout');
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
