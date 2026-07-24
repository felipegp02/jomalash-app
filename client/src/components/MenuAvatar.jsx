import { useEffect, useRef, useState } from 'react';
import Avatar from './Avatar';

export default function MenuAvatar({ usuario, onLogout, onAbrirMiCuenta, compacto = false }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickFuera(e) {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
    }
    document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setAbierto((v) => !v)} className="flex items-center gap-2">
        <Avatar nombre={usuario.nombre} />
        {!compacto && <span className="text-sm font-medium text-texto">{usuario.nombre}</span>}
      </button>

      {abierto && (
        <div className="absolute right-0 top-full z-20 mt-2 w-44 rounded-xl border border-borde-tarjeta bg-white p-1 shadow-md">
          <button
            type="button"
            onClick={() => {
              setAbierto(false);
              onAbrirMiCuenta();
            }}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm text-texto hover:bg-crema"
          >
            Mi cuenta
          </button>
          <button
            type="button"
            onClick={() => {
              setAbierto(false);
              onLogout();
            }}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm text-texto hover:bg-crema"
          >
            Cerrar sesion
          </button>
        </div>
      )}
    </div>
  );
}
