import { useState } from 'react';
import { api } from '../api/client';
import { IconX } from './Icons';

const campoInput =
  'rounded-xl border border-borde-tarjeta bg-white px-3 py-2 text-sm text-texto outline-none focus:border-dorado focus:ring-2 focus:ring-dorado/20';

export default function ModalMiCuenta({ usuario, onCerrar }) {
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [confirmarNueva, setConfirmarNueva] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  async function handleGuardar(e) {
    e.preventDefault();
    setError('');
    setExito(false);

    if (passwordNueva.length < 8) {
      setError('La nueva contrasena debe tener al menos 8 caracteres');
      return;
    }
    if (passwordNueva !== confirmarNueva) {
      setError('Las contrasenas nuevas no coinciden');
      return;
    }

    setGuardando(true);
    try {
      await api.put('/auth/password', { passwordActual, passwordNueva });
      setExito(true);
      setPasswordActual('');
      setPasswordNueva('');
      setConfirmarNueva('');
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onCerrar}>
      <div
        className="w-full max-w-sm rounded-[20px] bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-texto">Mi cuenta</h2>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg p-1 text-texto-secundario hover:bg-crema hover:text-texto"
          >
            <IconX width={18} height={18} />
          </button>
        </div>

        <div className="mt-3 border-t border-borde-tarjeta pt-3">
          <p className="text-sm font-medium text-texto">{usuario.nombre}</p>
          <p className="text-xs text-texto-secundario">{usuario.email_recuperacion || usuario.sede}</p>
        </div>

        <form onSubmit={handleGuardar} className="mt-4 flex flex-col gap-3 border-t border-borde-tarjeta pt-4">
          <h3 className="text-sm font-semibold text-texto">Cambiar contrasena</h3>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-texto-secundario">Contrasena actual</label>
            <input
              type="password"
              value={passwordActual}
              onChange={(e) => setPasswordActual(e.target.value)}
              className={campoInput}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-texto-secundario">Nueva contrasena</label>
            <input
              type="password"
              value={passwordNueva}
              onChange={(e) => setPasswordNueva(e.target.value)}
              placeholder="Minimo 8 caracteres"
              className={campoInput}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-texto-secundario">Confirmar nueva contrasena</label>
            <input
              type="password"
              value={confirmarNueva}
              onChange={(e) => setConfirmarNueva(e.target.value)}
              className={campoInput}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {exito && !error && <p className="text-sm text-verde">Contrasena actualizada correctamente.</p>}

          <button
            type="submit"
            disabled={guardando}
            className="self-start rounded-lg bg-dorado px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {guardando ? 'Guardando...' : 'Actualizar contrasena'}
          </button>
        </form>
      </div>
    </div>
  );
}
