import ChartLinea from './ChartLinea';
import CardSkeleton from './CardSkeleton';

const OPCIONES = [
  { valor: 'mensual', etiqueta: 'Por mes' },
  { valor: 'diario', etiqueta: 'Por dia' },
];

export default function TarjetaTendencia({
  titulo,
  vista,
  onCambiarVista,
  puntos,
  campo,
  formatoValor,
  enteros,
}) {
  return (
    <div className="rounded-[20px] border border-borde-tarjeta bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-texto">
          {titulo} {vista === 'mensual' ? '(ultimos 6 meses)' : '(ultimos 30 dias)'}
        </h3>
        <div className="flex shrink-0 gap-1 rounded-lg border border-borde-tarjeta bg-crema p-0.5">
          {OPCIONES.map((op) => (
            <button
              key={op.valor}
              type="button"
              onClick={() => onCambiarVista(op.valor)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                vista === op.valor ? 'bg-white text-texto shadow-sm' : 'text-texto-secundario hover:text-texto'
              }`}
            >
              {op.etiqueta}
            </button>
          ))}
        </div>
      </div>

      {!puntos ? (
        <CardSkeleton alto="h-48" />
      ) : (
        <ChartLinea
          etiquetas={puntos.map((p) => p.etiqueta)}
          datos={puntos.map((p) => p[campo])}
          formatoValor={formatoValor}
          enteros={enteros}
        />
      )}
    </div>
  );
}
