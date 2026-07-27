import { useEffect, useState } from 'react';
import { PESTANAS } from './navegacion';
import { IconPersona, IconSalir, IconX } from './Icons';

// Hoja deslizable desde abajo con lo que no entra en la barra fija: las
// pestanas restantes según permiso (Caja/Nomina/Ajustes) mas las acciones de
// cuenta (Mi cuenta / Cerrar sesión), que no son "paginas" de PESTANAS.
export default function PanelMas({ usuario, onNavegar, onAbrirMiCuenta, onLogout, onCerrar }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const opciones = PESTANAS.filter(
    (p) => !p.enBarraMovil && p.id !== 'registrar' && (!p.visible || p.visible(usuario)),
  );

  function irA(id) {
    onNavegar(id);
    onCerrar();
  }

  return (
    <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onCerrar} />

      <div
        className={`absolute bottom-0 left-0 w-full rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)] shadow-lg transition-transform duration-200 ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 pt-4">
          <span className="text-sm font-semibold text-texto">Más</span>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg p-1 text-texto-secundario hover:text-texto"
          >
            <IconX width={18} height={18} />
          </button>
        </div>

        <div className="flex flex-col gap-1 p-3 pt-2">
          {opciones.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => irA(p.id)}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-texto hover:bg-crema"
            >
              <p.Icono width={20} height={20} />
              {p.etiqueta}
            </button>
          ))}

          {opciones.length > 0 && <div className="my-1 border-t border-borde-tarjeta" />}

          <button
            type="button"
            onClick={() => {
              onCerrar();
              onAbrirMiCuenta();
            }}
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-texto hover:bg-crema"
          >
            <IconPersona width={20} height={20} />
            Mi cuenta
          </button>

          <button
            type="button"
            onClick={() => {
              onCerrar();
              onLogout();
            }}
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-rojo hover:bg-crema"
          >
            <IconSalir width={20} height={20} />
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
