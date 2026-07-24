import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client';
import { formatearMoneda } from '../../utils/formato';
import { IconChevronDown } from '../Icons';
import SinDatos from '../dashboard/SinDatos';

const campoInput =
  'rounded-xl border border-borde-tarjeta bg-white px-3 py-2 text-sm text-texto outline-none focus:border-dorado focus:ring-2 focus:ring-dorado/20';

const ETIQUETA_TIPO = { vale: 'Vale', liquidacion: 'Liquidacion' };
const ETIQUETA_METODO = { efectivo: 'Efectivo', transferencia: 'Transferencia' };

// Historial completo de la empleada (sin limite de fecha): trae todo una
// sola vez al expandir, y el filtro de rango se aplica en el navegador
// sobre esos mismos datos, sin volver a pedirle nada al servidor.
export default function HistorialPagos({ usuarioId, refrescarTrigger }) {
  const [abierto, setAbierto] = useState(false);
  const [pagos, setPagos] = useState(null);
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');

  function cargar() {
    api.get(`/nomina/${usuarioId}/historial`).then((data) => setPagos(data.pagos));
  }

  useEffect(() => {
    if (abierto) cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, refrescarTrigger]);

  const pagosFiltrados = useMemo(() => {
    if (!pagos) return null;
    return pagos.filter((p) => {
      const fecha = p.fecha.slice(0, 10);
      if (filtroDesde && fecha < filtroDesde) return false;
      if (filtroHasta && fecha > filtroHasta) return false;
      return true;
    });
  }, [pagos, filtroDesde, filtroHasta]);

  return (
    <div className="border-t border-borde-tarjeta pt-3">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="flex w-full items-center justify-between text-sm font-medium text-texto-secundario hover:text-texto"
      >
        Historial completo de pagos
        <IconChevronDown width={16} height={16} className={`transition-transform ${abierto ? 'rotate-180' : ''}`} />
      </button>

      {abierto && (
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filtroDesde}
              onChange={(e) => setFiltroDesde(e.target.value)}
              className={`${campoInput} flex-1`}
            />
            <span className="text-sm text-texto-secundario">a</span>
            <input
              type="date"
              value={filtroHasta}
              onChange={(e) => setFiltroHasta(e.target.value)}
              className={`${campoInput} flex-1`}
            />
          </div>

          {!pagosFiltrados ? (
            <p className="py-3 text-center text-sm text-texto-secundario">Cargando...</p>
          ) : pagosFiltrados.length === 0 ? (
            <SinDatos mensaje="Sin pagos en este rango." />
          ) : (
            <div className="divide-y divide-borde-tarjeta rounded-xl border border-borde-tarjeta">
              {pagosFiltrados.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-texto">
                      {ETIQUETA_TIPO[p.tipo]}
                      <span className="ml-2 text-xs font-normal text-texto-secundario">
                        {ETIQUETA_METODO[p.metodo_pago]}
                      </span>
                    </p>
                    <p className="text-xs text-texto-secundario">
                      {new Date(p.fecha).toLocaleDateString('es-CO', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                      {p.periodo_inicio && p.periodo_fin && (
                        <>
                          {' · cubre '}
                          {new Date(p.periodo_inicio).toLocaleDateString('es-CO', {
                            timeZone: 'UTC',
                            day: 'numeric',
                            month: 'short',
                          })}
                          {' - '}
                          {new Date(p.periodo_fin).toLocaleDateString('es-CO', {
                            timeZone: 'UTC',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </>
                      )}
                    </p>
                    {p.nota && <p className="mt-0.5 text-xs text-texto-secundario">{p.nota}</p>}
                  </div>
                  <span className="text-sm font-semibold text-texto">{formatearMoneda(p.monto)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
