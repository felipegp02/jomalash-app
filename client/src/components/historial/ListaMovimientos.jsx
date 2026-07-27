import { useState } from 'react';
import { IconCheck, IconX, IconChevronRight } from '../Icons';
import { formatearHora, formatearMoneda, etiquetaDia } from '../../utils/formato';
import SinDatos from '../dashboard/SinDatos';
import PanelEdicionVenta from './PanelEdicionVenta';

const ETIQUETAS_METODO = { efectivo: 'Efectivo', transferencia: 'Transferencia', tarjeta: 'Tarjeta' };

function agruparPorDia(ventas) {
  const grupos = [];
  let actual = null;

  for (const venta of ventas) {
    const etiqueta = etiquetaDia(venta.fecha);
    if (!actual || actual.etiqueta !== etiqueta) {
      actual = { etiqueta, ventas: [] };
      grupos.push(actual);
    }
    actual.ventas.push(venta);
  }

  return grupos;
}

function FilaMovimiento({ venta, esAdmin, expandido, onToggle, onCambio }) {
  // RF-09: solo Admin puede editar/anular, y solo si la venta no está ya
  // anulada. Una venta anulada igual se puede expandir para ver quien la
  // anulo y por que (RNF-11: trazabilidad visible, no solo guardada).
  const puedeExpandir = venta.anulada || esAdmin;

  return (
    <div>
      <button
        type="button"
        onClick={() => puedeExpandir && onToggle(venta.id)}
        disabled={!puedeExpandir}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-crema/70 disabled:cursor-default disabled:hover:bg-transparent"
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            venta.anulada ? 'bg-crema text-texto-secundario' : 'bg-dorado-fondo text-dorado'
          }`}
        >
          {venta.anulada ? <IconX width={18} height={18} /> : <IconCheck width={18} height={18} />}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-texto">{venta.servicio.nombre}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-texto-secundario">
            <span>{venta.usuario.nombre}</span>
            <span>·</span>
            <span>{formatearHora(venta.fecha)}</span>
            <span className="rounded-full bg-crema px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-texto-secundario">
              {ETIQUETAS_METODO[venta.metodo_pago] || venta.metodo_pago}
            </span>
            {venta.anulada && (
              <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-rojo">
                Anulada
              </span>
            )}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <span
            className={`text-sm font-semibold ${
              venta.anulada ? 'text-texto-secundario line-through' : 'text-verde'
            }`}
          >
            {formatearMoneda(venta.precio_total)}
          </span>
          {puedeExpandir && (
            <IconChevronRight
              width={16}
              height={16}
              className={`text-texto-secundario/60 transition-transform ${expandido ? 'rotate-90' : ''}`}
            />
          )}
        </div>
      </button>

      {expandido && (
        <div className="px-4 pb-4">
          {venta.anulada ? (
            <div className="border-t border-borde-tarjeta pt-3 text-xs text-texto-secundario">
              <p>
                Anulada por {venta.editadoPor?.nombre || 'un administrador'} el{' '}
                {venta.fecha_edicion
                  ? new Date(venta.fecha_edicion).toLocaleDateString('es-CO', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : ''}
              </p>
              {venta.motivo_anulacion && <p className="mt-1">Motivo: {venta.motivo_anulacion}</p>}
            </div>
          ) : (
            <PanelEdicionVenta
              venta={venta}
              onCerrar={() => onToggle(null)}
              onGuardado={() => {
                onToggle(null);
                onCambio();
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function ListaMovimientos({ ventas, esAdmin, onCambio }) {
  const [expandidoId, setExpandidoId] = useState(null);

  if (!ventas.length) {
    return <SinDatos mensaje="No hay ventas registradas con estos filtros." />;
  }

  const grupos = agruparPorDia(ventas);

  return (
    <div className="flex flex-col gap-5">
      {grupos.map((grupo) => (
        <div key={grupo.etiqueta}>
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-texto-secundario">
            {grupo.etiqueta}
          </p>
          <div className="divide-y divide-borde-tarjeta rounded-[20px] border border-borde-tarjeta bg-white shadow-sm">
            {grupo.ventas.map((venta) => (
              <FilaMovimiento
                key={venta.id}
                venta={venta}
                esAdmin={esAdmin}
                expandido={expandidoId === venta.id}
                onToggle={(id) => setExpandidoId(id === expandidoId ? null : id)}
                onCambio={onCambio}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
