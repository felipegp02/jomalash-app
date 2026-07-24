import { PESTANAS } from './navegacion';

export default function Sidebar({ usuario, paginaActual, onNavegar }) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-borde-sidebar bg-sidebar md:flex">
      <div className="flex items-center gap-2 px-6 py-6">
        <span className="h-2 w-2 shrink-0 rounded-full bg-dorado" />
        <span className="text-lg font-bold text-texto">Jomalash</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {PESTANAS.filter((p) => !p.visible || p.visible(usuario)).map((p) => {
          const activa = p.id === paginaActual;

          if (p.destacado) {
            return (
              <div key={p.id}>
                <button
                  type="button"
                  disabled={!p.disponible}
                  onClick={() => onNavegar(p.id)}
                  className={`flex w-full items-center gap-3 rounded-full bg-dorado px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 disabled:cursor-not-allowed ${
                    activa ? 'ring-2 ring-dorado ring-offset-2 ring-offset-sidebar' : ''
                  }`}
                >
                  <p.Icono width={22} height={22} />
                  {p.etiqueta}
                </button>
                {p.separadorDespues && <div className="my-2 border-t border-borde-sidebar" />}
              </div>
            );
          }

          return (
            <div key={p.id}>
              {p.separador && <div className="my-2 border-t border-borde-sidebar" />}
              <button
                type="button"
                disabled={!p.disponible}
                onClick={() => onNavegar(p.id)}
                title={!p.disponible ? 'Disponible en una proxima fase' : undefined}
                className={`flex w-full items-center gap-3 rounded-r-lg border-l-[3px] px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed ${
                  activa
                    ? 'border-dorado bg-dorado-fondo text-texto'
                    : 'border-transparent text-texto-secundario hover:text-texto'
                }`}
              >
                <p.Icono width={18} height={18} />
                {p.etiqueta}
              </button>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
