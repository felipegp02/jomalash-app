import Avatar from './Avatar';
import SedeSelector from './SedeSelector';

export default function Topbar({ usuario, titulo, onLogout, sedes, sedeSeleccionada, onChangeSede }) {
  return (
    <header className="border-b border-borde-tarjeta bg-white px-5 pb-5 pt-5">
      <div className="flex items-center justify-between md:hidden">
        <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-texto-secundario">
          <span className="h-2 w-2 shrink-0 rounded-full bg-dorado" />
          Jomalash · {usuario.sede}
        </span>
        <div className="flex items-center gap-3">
          <Avatar nombre={usuario.nombre} />
          <button
            type="button"
            onClick={onLogout}
            className="text-xs font-medium text-texto-secundario underline underline-offset-2 hover:text-texto"
          >
            Salir
          </button>
        </div>
      </div>

      <div className="hidden items-center justify-between md:flex">
        <SedeSelector
          usuario={usuario}
          sedes={sedes}
          sedeSeleccionada={sedeSeleccionada}
          onChangeSede={onChangeSede}
        />

        <div className="flex items-center gap-3">
          <Avatar nombre={usuario.nombre} />
          <span className="text-sm font-medium text-texto">{usuario.nombre}</span>
          <button
            type="button"
            onClick={onLogout}
            className="text-sm font-medium text-texto-secundario underline underline-offset-2 hover:text-texto"
          >
            Cerrar sesion
          </button>
        </div>
      </div>

      <h1 className="mt-4 text-3xl font-bold text-texto md:mt-5">{titulo}</h1>
      <span className="mt-2 block h-0.5 w-10 rounded-full bg-dorado" />
    </header>
  );
}
