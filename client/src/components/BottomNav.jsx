import { useState } from 'react';
import { PESTANAS } from './navegacion';
import { IconMas, IconPuntos } from './Icons';
import PanelMas from './PanelMas';

const ORDEN_BARRA_MOVIL = ['dashboard', 'historial', 'insumos'];

// Patron inspirado en Nequi: pocas pestanas fijas + un boton central
// flotante para la accion mas usada (Registrar) + "Mas" para el resto, en
// vez de amontonar 7 iconos parejos en una sola fila.
export default function BottomNav({ usuario, paginaActual, onNavegar, onAbrirMiCuenta, onLogout }) {
  const [masAbierto, setMasAbierto] = useState(false);

  const registrar = PESTANAS.find((p) => p.id === 'registrar');
  const fijas = ORDEN_BARRA_MOVIL.map((id) => PESTANAS.find((p) => p.id === id)).filter(
    (p) => !p.visible || p.visible(usuario),
  );
  const opcionesEnMas = PESTANAS.filter(
    (p) => !p.enBarraMovil && p.id !== 'registrar' && (!p.visible || p.visible(usuario)),
  );
  const masActiva = opcionesEnMas.some((p) => p.id === paginaActual);

  const mitad = Math.ceil(fijas.length / 2);
  const izquierda = fijas.slice(0, mitad);
  const derecha = fijas.slice(mitad);

  function TabButton({ p }) {
    const activa = p.id === paginaActual;
    return (
      <button
        type="button"
        onClick={() => onNavegar(p.id)}
        className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
          activa ? 'text-dorado' : 'text-texto-secundario'
        }`}
      >
        <p.Icono width={22} height={22} />
        {p.etiqueta}
      </button>
    );
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 w-full border-t border-borde-tarjeta bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="relative flex items-stretch">
          {izquierda.map((p) => (
            <TabButton key={p.id} p={p} />
          ))}

          {/* Espacio reservado bajo el boton flotante de Registrar */}
          <div className="w-16 shrink-0" />

          {derecha.map((p) => (
            <TabButton key={p.id} p={p} />
          ))}

          <button
            type="button"
            onClick={() => setMasAbierto(true)}
            className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
              masActiva ? 'text-dorado' : 'text-texto-secundario'
            }`}
          >
            <IconPuntos width={22} height={22} />
            Más
          </button>

          <button
            type="button"
            onClick={() => onNavegar(registrar.id)}
            aria-label={registrar.etiqueta}
            className="absolute left-1/2 top-0 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-dorado text-white shadow-lg ring-4 ring-white transition-transform active:scale-95"
          >
            <IconMas width={28} height={28} />
          </button>
        </div>
      </nav>

      {masAbierto && (
        <PanelMas
          usuario={usuario}
          onNavegar={onNavegar}
          onAbrirMiCuenta={onAbrirMiCuenta}
          onLogout={onLogout}
          onCerrar={() => setMasAbierto(false)}
        />
      )}
    </>
  );
}
