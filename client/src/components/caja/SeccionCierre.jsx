import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { formatearMoneda } from '../../utils/formato';
import { IconCheck, IconAlerta } from '../Icons';
import CardSkeleton from '../dashboard/CardSkeleton';
import SinDatos from '../dashboard/SinDatos';
import ListaDiasCierre from './ListaDiasCierre';

const ETIQUETAS_CATEGORIA_GASTO = { arriendo: 'Arriendo', servicios: 'Servicios', varios: 'Varios' };
const ETIQUETAS_METODO = { efectivo: 'Efectivo', transferencia: 'Transferencia', tarjeta: 'Tarjeta' };

const campoInput =
  'rounded-xl border border-borde-tarjeta bg-white px-3 py-2 text-sm text-texto outline-none focus:border-dorado focus:ring-2 focus:ring-dorado/20';

function formatearFecha(fechaYMD) {
  return new Date(`${fechaYMD}T00:00:00Z`).toLocaleDateString('es-CO', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function Fila({ etiqueta, valor, destacado }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-texto-secundario">{etiqueta}</span>
      <span className={`text-sm ${destacado ? 'font-semibold text-texto' : 'text-texto'}`}>{valor}</span>
    </div>
  );
}

// RF-22: cierre de caja diario, snapshot fijo que no cambia si se edita una
// venta después. Solo se puede cerrar una vez por sede y por dia.
export default function SeccionCierre({ sedes, sedeSeleccionada }) {
  const [sedeId, setSedeId] = useState(sedeSeleccionada || sedes[0]?.id || '');
  // Vacio = hoy, mismo comportamiento que siempre (ver cargarPreview: sin
  // fecha no se agrega el parametro a la URL, igual que antes de este cambio).
  const [fecha, setFecha] = useState('');
  const [preview, setPreview] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [confirmando, setConfirmando] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [error, setError] = useState('');

  const [historial, setHistorial] = useState(null);

  useEffect(() => {
    if (sedeSeleccionada) setSedeId(sedeSeleccionada);
  }, [sedeSeleccionada]);

  function cargarPreview() {
    if (!sedeId) return;
    setCargando(true);
    setError('');
    const params = new URLSearchParams({ sede_id: sedeId });
    if (fecha) params.set('fecha', fecha);
    api
      .get(`/cierres-caja/preview?${params}`)
      .then(setPreview)
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }

  function cargarHistorial() {
    if (!sedeId) return;
    api.get(`/cierres-caja?sede_id=${sedeId}`).then((data) => setHistorial(data.cierres));
  }

  useEffect(() => {
    cargarPreview();
    cargarHistorial();
    setConfirmando(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sedeId, fecha]);

  async function handleConfirmarCierre() {
    setCerrando(true);
    setError('');
    try {
      const body = { sede_id: Number(sedeId) };
      if (fecha) body.fecha = fecha;
      await api.post('/cierres-caja', body);
      setConfirmando(false);
      cargarPreview();
      cargarHistorial();
    } catch (err) {
      setError(err.message);
    } finally {
      setCerrando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[20px] border border-borde-tarjeta bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-texto">{fecha ? `Cierre del ${formatearFecha(fecha)}` : 'Cierre de hoy'}</h3>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fecha}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setFecha(e.target.value)}
              className={campoInput}
            />
            {sedes.length > 1 && (
              <select value={sedeId} onChange={(e) => setSedeId(Number(e.target.value))} className={campoInput}>
                {sedes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {cargando || !preview ? (
          <div className="mt-4">
            <CardSkeleton alto="h-32" />
          </div>
        ) : (
          <div className="mt-4 border-t border-borde-tarjeta pt-3">
            <Fila etiqueta="Servicios" valor={preview.totalServicios} />
            <Fila etiqueta="Venta bruta" valor={formatearMoneda(preview.totalVenta)} />
            {preview.porMetodoPago
              .filter((m) => m.venta > 0)
              .map((m) => (
                <div key={m.metodo_pago} className="flex items-center justify-between py-1 pl-3">
                  <span className="text-xs text-texto-secundario">{ETIQUETAS_METODO[m.metodo_pago]}</span>
                  <span className="text-xs text-texto-secundario">{formatearMoneda(m.venta)}</span>
                </div>
              ))}
            <Fila etiqueta="Comisiones" valor={formatearMoneda(preview.comisionTotal)} />
            <Fila etiqueta="Costo de insumos" valor={formatearMoneda(preview.costoInsumos)} />
            {preview.gastoTotal > 0 && (
              <>
                <Fila etiqueta="Gastos" valor={formatearMoneda(preview.gastoTotal)} />
                {preview.gastosPorCategoria
                  .filter((g) => g.total > 0)
                  .map((g) => (
                    <div key={g.categoria} className="flex items-center justify-between py-1 pl-3">
                      <span className="text-xs text-texto-secundario">{ETIQUETAS_CATEGORIA_GASTO[g.categoria]}</span>
                      <span className="text-xs text-texto-secundario">{formatearMoneda(g.total)}</span>
                    </div>
                  ))}
              </>
            )}
            <div className="mt-1 border-t border-borde-tarjeta pt-2">
              <Fila etiqueta="Ganancia neta" valor={formatearMoneda(preview.totalNeto)} destacado />
            </div>

            {preview.propinaTotal > 0 && (
              <div className="mt-3 border-t border-dashed border-borde-tarjeta pt-2">
                <p className="mb-1 text-xs text-texto-secundario">
                  Propinas (100% para la empleada, no forman parte de la venta bruta del negocio)
                </p>
                <Fila etiqueta="Total propinas" valor={formatearMoneda(preview.propinaTotal)} />
                {preview.propinaPorMetodoPago
                  .filter((p) => p.propina > 0)
                  .map((p) => (
                    <div key={p.metodo_pago} className="flex items-center justify-between py-1 pl-3">
                      <span className="text-xs text-texto-secundario">{ETIQUETAS_METODO[p.metodo_pago]}</span>
                      <span className="text-xs text-texto-secundario">{formatearMoneda(p.propina)}</span>
                    </div>
                  ))}
              </div>
            )}

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            {preview.yaCerrado ? (
              <div className="mt-4 flex flex-col gap-1 rounded-xl bg-dorado-fondo px-3 py-3 text-sm text-texto">
                <div className="flex items-center gap-2 font-medium">
                  <IconCheck width={16} height={16} />
                  Este dia ya esta cerrado
                </div>
                <p className="text-xs text-texto-secundario">
                  {preview.cierre.total_servicios} servicios · cerrado por {preview.cierre.cerradoPor.nombre}
                </p>
                <p className="text-xs text-texto-secundario">
                  Ganancia neta del cierre: {formatearMoneda(preview.cierre.total_neto)}
                </p>
              </div>
            ) : confirmando ? (
              <div className="mt-4 flex flex-col gap-3 border-t border-borde-tarjeta pt-3">
                <div className="flex items-start gap-2 text-sm text-texto-secundario">
                  <IconAlerta width={16} height={16} className="mt-0.5 shrink-0" />
                  Este cierre queda fijo: si mas tarde editas o anulas una venta de{' '}
                  {fecha ? 'esta fecha' : 'hoy'}, estos totales no cambian.
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleConfirmarCierre}
                    disabled={cerrando}
                    className="rounded-lg bg-dorado px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                  >
                    {cerrando ? 'Cerrando...' : 'Confirmar cierre'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmando(false)}
                    className="rounded-lg border border-borde-tarjeta px-4 py-2 text-sm font-medium text-texto-secundario hover:text-texto"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmando(true)}
                className="mt-4 rounded-lg bg-dorado px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                {fecha ? 'Cerrar caja de este dia' : 'Cerrar caja de hoy'}
              </button>
            )}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-texto">Historial de cierres</h3>
        {!historial ? (
          <CardSkeleton alto="h-24" />
        ) : historial.length === 0 ? (
          <SinDatos mensaje="Todavia no hay cierres registrados para esta sede." />
        ) : (
          <div className="divide-y divide-borde-tarjeta rounded-[20px] border border-borde-tarjeta bg-white shadow-sm">
            {historial.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-texto">
                    {new Date(c.fecha).toLocaleDateString('es-CO', {
                      timeZone: 'UTC',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-texto-secundario">
                    {c.total_servicios} servicios · cerrado por {c.cerradoPor.nombre}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-texto">{formatearMoneda(c.total_neto)}</p>
                  <p className="text-xs text-texto-secundario">neto</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ListaDiasCierre sedeId={sedeId} onSeleccionarFecha={setFecha} />
    </div>
  );
}
