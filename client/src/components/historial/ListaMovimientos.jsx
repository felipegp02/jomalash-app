import { useState } from 'react';
import { IconCheck, IconX, IconChevronRight } from '../Icons';
import { formatearHora, formatearMoneda, etiquetaDia } from '../../utils/formato';
import { api } from '../../api/client';
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

// Las lineas de un mismo Cobro (2+ servicios o pago dividido) ya llegan
// consecutivas (mismo orden que /ventas, por fecha) porque se crean juntas.
// Se arma un item "cobro" que las agrupa visualmente en vez de mostrar cada
// una suelta con su propio metodo de pago (que ya no tienen: el pago vive
// en el cobro, ver server/prisma/schema.prisma).
function agruparPorCobro(ventas) {
  const items = [];
  const indicePorCobro = new Map();

  for (const venta of ventas) {
    if (!venta.cobro_id) {
      items.push({ tipo: 'suelta', venta });
      continue;
    }
    if (indicePorCobro.has(venta.cobro_id)) {
      items[indicePorCobro.get(venta.cobro_id)].ventas.push(venta);
    } else {
      indicePorCobro.set(venta.cobro_id, items.length);
      items.push({ tipo: 'cobro', cobro: venta.cobro, ventas: [venta] });
    }
  }

  return items;
}

function desglosePago(cobro) {
  const partes = [];
  if (cobro.pago_efectivo > 0) partes.push(`Efectivo ${formatearMoneda(cobro.pago_efectivo)}`);
  if (cobro.pago_transferencia > 0) partes.push(`Transferencia ${formatearMoneda(cobro.pago_transferencia)}`);
  if (cobro.pago_tarjeta > 0) partes.push(`Tarjeta ${formatearMoneda(cobro.pago_tarjeta)}`);
  return partes.join(' + ');
}

function FilaMovimiento({ venta, esAdmin, ocultarMetodoPago, bloquearAnulacion, expandido, onToggle, onCambio }) {
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
            {!ocultarMetodoPago && (
              <span className="rounded-full bg-crema px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-texto-secundario">
                {ETIQUETAS_METODO[venta.metodo_pago] || venta.metodo_pago}
              </span>
            )}
            {venta.propina > 0 && (
              <span className="rounded-full bg-dorado-fondo px-1.5 py-0.5 text-[10px] font-medium text-dorado">
                + propina {ETIQUETAS_METODO[venta.propina_metodo_pago] || venta.propina_metodo_pago}
              </span>
            )}
            {venta.anulada && (
              <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-rojo">
                Anulada
              </span>
            )}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <div className="flex items-center gap-1">
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
          {venta.propina > 0 && (
            <span className="text-xs font-medium text-dorado">+{formatearMoneda(venta.propina)} propina</span>
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
              ocultarMetodoPago={ocultarMetodoPago}
              bloquearAnulacion={bloquearAnulacion}
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

// Anula TODAS las lineas del cobro de una vez (PUT /cobros/:id/anular): un
// cobro de 2+ servicios ya no admite anular una sola linea, para no dejar
// ambiguedad sobre como quedo repartido el pago entre metodos.
function AnularCobro({ cobroId, onCancelar, onAnulado }) {
  const [motivo, setMotivo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirmar() {
    if (!motivo.trim()) {
      setError('El motivo de anulacion es requerido');
      return;
    }
    setError('');
    setGuardando(true);
    try {
      await api.put(`/cobros/${cobroId}/anular`, { motivo });
      onAnulado();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 border-t border-borde-tarjeta px-4 py-3">
      <p className="text-sm font-medium text-texto">Anular este cobro completo</p>
      <textarea
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        placeholder="Motivo de la anulacion"
        rows={2}
        className="rounded-xl border border-borde-tarjeta bg-white px-3 py-2 text-sm text-texto outline-none focus:border-dorado focus:ring-2 focus:ring-dorado/20"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleConfirmar}
          disabled={guardando}
          className="rounded-lg bg-rojo px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {guardando ? 'Anulando...' : 'Confirmar anulación del cobro'}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="rounded-lg border border-borde-tarjeta px-4 py-2 text-sm font-medium text-texto-secundario hover:text-texto"
        >
          Volver
        </button>
      </div>
    </div>
  );
}

function GrupoCobro({ cobro, ventas, esAdmin, expandidoId, onToggle, onCambio }) {
  const [anulandoCobro, setAnulandoCobro] = useState(false);

  // La restriccion de "no anular linea por linea" solo aplica a un cobro con
  // 2+ servicios: un cobro de 1 sola linea (pago dividido de un solo
  // servicio) no tiene ambiguedad, se sigue anulando individual como siempre.
  const esMultiServicio = ventas.length >= 2;
  const hayLineaActiva = ventas.some((v) => !v.anulada);
  const puedeAnularCobro = esAdmin && esMultiServicio && hayLineaActiva;

  return (
    <div className="rounded-[20px] border border-borde-tarjeta bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 pt-3 text-xs text-texto-secundario">
        <span>{ventas.length} servicios en un mismo cobro</span>
        <span className="font-medium">{desglosePago(cobro)}</span>
      </div>

      {puedeAnularCobro && !anulandoCobro && (
        <div className="px-4 pt-2">
          <button
            type="button"
            onClick={() => setAnulandoCobro(true)}
            className="text-xs font-medium text-rojo hover:underline"
          >
            Anular cobro completo
          </button>
        </div>
      )}

      {anulandoCobro && (
        <AnularCobro
          cobroId={cobro.id}
          onCancelar={() => setAnulandoCobro(false)}
          onAnulado={() => {
            setAnulandoCobro(false);
            onCambio();
          }}
        />
      )}

      <div className="mt-2 divide-y divide-borde-tarjeta">
        {ventas.map((venta) => (
          <FilaMovimiento
            key={venta.id}
            venta={venta}
            esAdmin={esAdmin}
            ocultarMetodoPago
            bloquearAnulacion={esMultiServicio}
            expandido={expandidoId === venta.id}
            onToggle={onToggle}
            onCambio={onCambio}
          />
        ))}
      </div>
    </div>
  );
}

export default function ListaMovimientos({ ventas, esAdmin, onCambio }) {
  const [expandidoId, setExpandidoId] = useState(null);

  if (!ventas.length) {
    return <SinDatos mensaje="No hay ventas registradas con estos filtros." />;
  }

  const grupos = agruparPorDia(ventas);
  const onToggle = (id) => setExpandidoId(id === expandidoId ? null : id);

  return (
    <div className="flex flex-col gap-5">
      {grupos.map((grupo) => {
        const items = agruparPorCobro(grupo.ventas);
        return (
          <div key={grupo.etiqueta}>
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-texto-secundario">
              {grupo.etiqueta}
            </p>
            <div className="flex flex-col gap-3">
              {items.map((item) =>
                item.tipo === 'cobro' ? (
                  <GrupoCobro
                    key={`cobro-${item.cobro.id}`}
                    cobro={item.cobro}
                    ventas={item.ventas}
                    esAdmin={esAdmin}
                    expandidoId={expandidoId}
                    onToggle={onToggle}
                    onCambio={onCambio}
                  />
                ) : (
                  <div key={item.venta.id} className="divide-y divide-borde-tarjeta rounded-[20px] border border-borde-tarjeta bg-white shadow-sm">
                    <FilaMovimiento
                      venta={item.venta}
                      esAdmin={esAdmin}
                      expandido={expandidoId === item.venta.id}
                      onToggle={onToggle}
                      onCambio={onCambio}
                    />
                  </div>
                ),
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
