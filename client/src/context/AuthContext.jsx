import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // La cookie de sesión es httpOnly (no legible desde JS), así que al
    // cargar la app se pregunta al backend quien está logueado.
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

  // Tras cambiar la contraseña (ej. el flujo obligatorio de primer login),
  // se vuelve a preguntar quien está logueado para refrescar campos como
  // debe_cambiar_password sin forzar un logout/login completo.
  async function refrescarUsuario() {
    const data = await api.get('/auth/me');
    setUsuario(data.usuario);
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout, refrescarUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
