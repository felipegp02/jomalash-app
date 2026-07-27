import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

// Se muestra en vez de toda la app cuando el usuario tiene una contraseña
// temporal (debe_cambiar_password=true, ej. una cuenta recien creada para el
// despliegue): bloquea el resto de la app hasta que defina su propia
// contraseña. Usa el mismo endpoint que "Mi cuenta" (PUT /auth/password).
export default function CambiarPasswordObligatorio() {
  const { usuario, logout, refrescarUsuario } = useAuth();
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [confirmarNueva, setConfirmarNueva] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (passwordNueva.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (passwordNueva !== confirmarNueva) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }

    setGuardando(true);
    try {
      await api.put('/auth/password', { passwordActual, passwordNueva });
      await refrescarUsuario();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-crema px-5">
      <div className="w-full max-w-[400px]">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="h-2 w-2 shrink-0 rounded-full bg-dorado" />
          <h1 className="text-3xl font-bold text-texto">Jomalash</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-[20px] border border-borde-tarjeta bg-white p-6 shadow-sm"
        >
          <div>
            <h2 className="text-lg font-bold text-texto">Define tu contraseña</h2>
            <p className="mt-1 text-sm text-texto-secundario">
              Hola {usuario.nombre}. Por seguridad, antes de continuar tenes que reemplazar la
              contraseña temporal por una propia.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-texto-secundario">Contraseña temporal</label>
            <input
              type="password"
              value={passwordActual}
              onChange={(e) => setPasswordActual(e.target.value)}
              autoComplete="current-password"
              required
              className="rounded-xl border border-borde-tarjeta bg-white px-4 py-3 text-texto outline-none focus:border-dorado focus:ring-2 focus:ring-dorado/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-texto-secundario">Nueva contraseña</label>
            <input
              type="password"
              value={passwordNueva}
              onChange={(e) => setPasswordNueva(e.target.value)}
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
              value={confirmarNueva}
              onChange={(e) => setConfirmarNueva(e.target.value)}
              autoComplete="new-password"
              required
              className="rounded-xl border border-borde-tarjeta bg-white px-4 py-3 text-texto outline-none focus:border-dorado focus:ring-2 focus:ring-dorado/20"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={guardando}
            className="mt-2 rounded-xl bg-dorado py-3 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {guardando ? 'Guardando...' : 'Guardar y continuar'}
          </button>

          <button
            type="button"
            onClick={logout}
            className="text-sm font-medium text-texto-secundario underline underline-offset-2 hover:text-texto"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
