import { formatearMoneda } from '../../utils/formato';
import SinDatos from './SinDatos';

export default function RankingServicios({ ranking }) {
  if (!ranking.length) return <SinDatos />;

  return (
    <ul className="flex flex-col divide-y divide-borde-tarjeta">
      {ranking.map((s) => (
        <li key={s.servicio_id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-texto">{s.nombre}</p>
            <p className="text-xs text-texto-secundario">
              {s.categoria} · {s.servicios} {s.servicios === 1 ? 'servicio' : 'servicios'}
            </p>
          </div>
          <p className="shrink-0 pl-3 text-sm font-semibold text-texto">{formatearMoneda(s.venta)}</p>
        </li>
      ))}
    </ul>
  );
}
