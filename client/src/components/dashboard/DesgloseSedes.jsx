import { formatearMoneda } from '../../utils/formato';
import SinDatos from './SinDatos';

export default function DesgloseSedes({ porSede, sedes }) {
  if (!porSede.length) return <SinDatos />;

  function nombreSede(id) {
    return sedes.find((s) => s.id === id)?.nombre || `Sede ${id}`;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {porSede.map((s) => (
        <div key={s.sede_id} className="rounded-xl border border-borde-tarjeta bg-crema p-4">
          <p className="text-sm font-medium text-texto">{nombreSede(s.sede_id)}</p>
          <p className="mt-1 text-2xl font-bold text-texto">{formatearMoneda(s.ventaBruta)}</p>
          <p className="text-xs text-texto-secundario">
            {s.servicios} {s.servicios === 1 ? 'servicio' : 'servicios'}
          </p>
        </div>
      ))}
    </div>
  );
}
