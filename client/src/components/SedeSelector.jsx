import { useEffect, useRef, useState } from 'react';
import { IconTienda, IconChevronDown } from './Icons';

export default function SedeSelector({ usuario, sedes, sedeSeleccionada, onChangeSede, compacto = false }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickFuera(e) {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
    }
    document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, []);

  // Una empleada pertenece a una sola sede: se muestra fija, sin selector.
  if (usuario.rol !== 'admin') {
    return (
      <span className={`flex items-center gap-2 font-medium text-texto ${compacto ? 'text-xs' : 'text-sm'}`}>
        {!compacto && <IconTienda width={18} height={18} />}
        {compacto ? usuario.sede : `Sede: ${usuario.sede}`}
      </span>
    );
  }

  const nombreActual =
    sedeSeleccionada === null
      ? 'Consolidado'
      : sedes.find((s) => s.id === sedeSeleccionada)?.nombre || usuario.sede;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className={`flex items-center rounded-lg font-medium text-texto hover:bg-sidebar ${
          compacto ? 'gap-1 px-1 py-0.5 text-xs' : 'gap-2 px-2 py-1.5 text-sm'
        }`}
      >
        {!compacto && <IconTienda width={18} height={18} />}
        {compacto ? nombreActual : `Sede: ${nombreActual}`}
        <IconChevronDown
          width={compacto ? 12 : 14}
          height={compacto ? 12 : 14}
          className={`transition-transform ${abierto ? 'rotate-180' : ''}`}
        />
      </button>

      {abierto && (
        <div className="absolute left-0 top-full z-10 mt-1 w-48 rounded-xl border border-borde-tarjeta bg-white p-1 shadow-md">
          {sedes.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                onChangeSede(s.id);
                setAbierto(false);
              }}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                sedeSeleccionada === s.id
                  ? 'bg-dorado-fondo text-texto'
                  : 'text-texto hover:bg-crema'
              }`}
            >
              {s.nombre}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              onChangeSede(null);
              setAbierto(false);
            }}
            className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
              sedeSeleccionada === null ? 'bg-dorado-fondo text-texto' : 'text-texto hover:bg-crema'
            }`}
          >
            Consolidado (ambas)
          </button>
        </div>
      )}
    </div>
  );
}
