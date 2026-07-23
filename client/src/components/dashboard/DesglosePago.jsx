import { formatearMoneda } from '../../utils/formato';
import SinDatos from './SinDatos';

const ETIQUETAS = { efectivo: 'Efectivo', transferencia: 'Transferencia', tarjeta: 'Tarjeta' };

export default function DesglosePago({ porMetodoPago }) {
  const total = porMetodoPago.reduce((suma, m) => suma + m.venta, 0);
  if (!total) return <SinDatos />;

  return (
    <ul className="flex flex-col gap-3">
      {porMetodoPago.map((m) => {
        const porcentaje = total ? Math.round((m.venta / total) * 100) : 0;
        return (
          <li key={m.metodo_pago}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-texto">{ETIQUETAS[m.metodo_pago] || m.metodo_pago}</span>
              <span className="font-medium text-texto">
                {formatearMoneda(m.venta)} · {porcentaje}%
              </span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-crema">
              <div className="h-full rounded-full bg-dorado" style={{ width: `${porcentaje}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
