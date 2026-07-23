import { PESTANAS } from './navegacion';

export default function BottomNav({ usuario, paginaActual, onNavegar }) {
  return (
    <nav className="fixed bottom-0 left-0 flex w-full border-t border-borde-tarjeta bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      {PESTANAS.filter((p) => !p.soloAdmin || usuario.rol === 'admin').map((p) => {
        const activa = p.id === paginaActual;
        return (
          <button
            key={p.id}
            type="button"
            disabled={!p.disponible}
            onClick={() => onNavegar(p.id)}
            title={!p.disponible ? 'Disponible en una proxima fase' : undefined}
            className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors disabled:cursor-not-allowed ${
              activa ? 'text-dorado' : 'text-texto-secundario'
            }`}
          >
            <p.Icono />
            {p.etiqueta}
          </button>
        );
      })}
    </nav>
  );
}
