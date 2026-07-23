import { PESTANAS } from './navegacion';

export default function Sidebar({ usuario, paginaActual }) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-borde-sidebar bg-sidebar md:flex">
      <div className="flex items-center gap-2 px-6 py-6">
        <span className="h-2 w-2 shrink-0 rounded-full bg-dorado" />
        <span className="text-lg font-bold text-texto">Jomalash</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {PESTANAS.filter((p) => !p.soloAdmin || usuario.rol === 'admin').map((p) => {
          const activa = p.id === paginaActual;
          return (
            <button
              key={p.id}
              type="button"
              disabled={!activa}
              title={!activa ? 'Disponible en una proxima fase' : undefined}
              className={`flex items-center gap-3 rounded-r-lg border-l-[3px] px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed ${
                activa
                  ? 'border-dorado bg-dorado-fondo text-texto'
                  : 'border-transparent text-texto-secundario'
              }`}
            >
              <p.Icono width={18} height={18} />
              {p.etiqueta}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
