import { IconChevronRight } from '../Icons';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

// Navegacion libre hacia atras (y hacia adelante): no hay limite de cuantos
// meses se puede retroceder, para poder consultar cualquier periodo pasado.
export default function SelectorMes({ mes, anio, onCambiar }) {
  function retroceder() {
    if (mes === 1) onCambiar(12, anio - 1);
    else onCambiar(mes - 1, anio);
  }

  function avanzar() {
    if (mes === 12) onCambiar(1, anio + 1);
    else onCambiar(mes + 1, anio);
  }

  return (
    <div className="flex items-center justify-between rounded-[20px] border border-borde-tarjeta bg-white p-4 shadow-sm">
      <button
        type="button"
        onClick={retroceder}
        aria-label="Mes anterior"
        className="rounded-lg p-2 text-texto-secundario hover:bg-crema hover:text-texto"
      >
        <IconChevronRight width={18} height={18} className="rotate-180" />
      </button>

      <span className="text-base font-semibold text-texto">
        {MESES[mes - 1]} {anio}
      </span>

      <button
        type="button"
        onClick={avanzar}
        aria-label="Mes siguiente"
        className="rounded-lg p-2 text-texto-secundario hover:bg-crema hover:text-texto"
      >
        <IconChevronRight width={18} height={18} />
      </button>
    </div>
  );
}
