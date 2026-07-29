import { useState } from 'react';
import { api } from '../api/client';

// RF-02/RNF-04: se muestra en vez de toda la app cuando la URL es
// /restablecer?token=... (ver App.jsx). No depende de sesion: quien llega
// aca viene del enlace del correo, este o no logueado.
export default function Restablecer() {
  const token = new URLSearchParams(window.location.search).get('token');

  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [listo, setListo] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setGuardando(true);
    try {
      await api.post('/auth/restablecer', { token, password });
      setListo(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-crema px-5">
      <div className="w-full max-w-[380px]">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="h-2 w-2 shrink-0 rounded-full bg-dorado" />
          <h1 className="text-3xl font-bold text-texto">Jomalash</h1>
        </div>

        <div className="flex flex-col gap-4 rounded-[20px] border border-borde-tarjeta bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-texto">Restablecer contraseña</h2>

          {!token ? (
            <p className="text-sm text-red-600">
              El enlace no es válido. Volvé a solicitar la recuperación de contraseña.
            </p>
          ) : listo ? (
            <>
              <p className="text-sm text-texto">Tu contraseña se actualizó correctamente.</p>
              <a
                href="/"
                className="rounded-xl bg-dorado py-3 text-center text-base font-semibold text-white transition-opacity hover:opacity-90"
              >
                Ir a ingresar
              </a>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-texto-secundario">Nueva contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Minimo 8 caracteres"
                  required
                  className="rounded-xl border border-borde-tarjeta bg-white px-4 py-3 text-texto outline-none focus:border-dorado focus:ring-2 focus:ring-dorado/20"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-texto-secundario">Confirmar nueva contraseña</label>
                <input
                  type="password"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  autoComplete="new-password"
                  required
                  className="rounded-xl border border-borde-tarjeta bg-white px-4 py-3 text-texto outline-none focus:border-dorado focus:ring-2 focus:ring-dorado/20"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={guardando}
                className="rounded-xl bg-dorado py-3 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {guardando ? 'Guardando...' : 'Guardar nueva contraseña'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
