import MenuAvatar from './MenuAvatar';
import SedeSelector from './SedeSelector';

export default function Topbar({ usuario, titulo, onLogout, sedes, sedeSeleccionada, onChangeSede, onAbrirMiCuenta }) {
  return (
    <header className="border-b border-borde-tarjeta bg-white px-5 pb-5 pt-5">
      <div className="flex items-center justify-between md:hidden">
        <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-texto-secundario">
          <span className="h-2 w-2 shrink-0 rounded-full bg-dorado" />
          <span>Jomalash ·</span>
          <SedeSelector
            usuario={usuario}
            sedes={sedes}
            sedeSeleccionada={sedeSeleccionada}
            onChangeSede={onChangeSede}
            compacto
          />
        </div>
        <MenuAvatar usuario={usuario} onLogout={onLogout} onAbrirMiCuenta={onAbrirMiCuenta} compacto />
      </div>

      <div className="hidden items-center justify-between md:flex">
        <SedeSelector
          usuario={usuario}
          sedes={sedes}
          sedeSeleccionada={sedeSeleccionada}
          onChangeSede={onChangeSede}
        />

        <MenuAvatar usuario={usuario} onLogout={onLogout} onAbrirMiCuenta={onAbrirMiCuenta} />
      </div>

      <h1 className="mt-4 text-3xl font-bold text-texto md:mt-5">{titulo}</h1>
      <span className="mt-2 block h-0.5 w-10 rounded-full bg-dorado" />
    </header>
  );
}
