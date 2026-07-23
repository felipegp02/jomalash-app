function Tendencia({ actual, anterior }) {
  if (anterior === null || anterior === undefined) return null;

  if (anterior === 0) {
    if (actual === 0) return null;
    return <span className="text-xs font-medium text-verde">↑ nuevo vs. periodo anterior</span>;
  }

  const cambio = Math.round(((actual - anterior) / anterior) * 100);
  const subio = cambio >= 0;

  return (
    <span className={`text-xs font-medium ${subio ? 'text-verde' : 'text-rojo'}`}>
      {subio ? '↑' : '↓'} {Math.abs(cambio)}% vs. periodo anterior
    </span>
  );
}

export default function KpiCard({ etiqueta, valor, actual, anterior, children }) {
  return (
    <div className="flex flex-col gap-1 rounded-[20px] border border-borde-tarjeta bg-white p-5 shadow-sm">
      <p className="text-sm text-texto-secundario">{etiqueta}</p>
      <p className="text-3xl font-bold text-texto">{valor}</p>
      {children}
      <Tendencia actual={actual} anterior={anterior} />
    </div>
  );
}
