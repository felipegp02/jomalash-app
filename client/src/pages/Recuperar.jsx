import { useState } from 'react';
import { api } from '../api/client';

// RF-02: pide el correo y dispara el envio del enlace de recuperacion. La
// respuesta del backend es siempre el mismo mensaje generico (exista o no el
// correo), asi que este componente no necesita distinguir los casos.
export default function Recuperar({ onVolver }) {
  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      const data = await api.post('/auth/recuperar', { email });
      setMensaje(data.mensaje);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
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
          <div>
            <h2 className="text-lg font-bold text-texto">Recuperar contraseña</h2>
            <p className="mt-1 text-sm text-texto-secundario">
              Ingresa tu correo y te enviamos un enlace para definir una nueva contraseña.
            </p>
          </div>

          {mensaje ? (
            <p className="text-sm text-texto">{mensaje}</p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-medium text-texto-secundario">
                  Correo
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                  className="rounded-xl border border-borde-tarjeta bg-white px-4 py-3 text-texto outline-none focus:border-dorado focus:ring-2 focus:ring-dorado/20"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={enviando}
                className="rounded-xl bg-dorado py-3 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {enviando ? 'Enviando...' : 'Enviar enlace'}
              </button>
            </form>
          )}

          <button
            type="button"
            onClick={onVolver}
            className="text-sm font-medium text-texto-secundario underline underline-offset-2 hover:text-texto"
          >
            Volver a ingresar
          </button>
        </div>
      </div>
    </div>
  );
}
