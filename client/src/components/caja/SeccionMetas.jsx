import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { formatearMoneda } from '../../utils/formato';
import CardSkeleton from '../dashboard/CardSkeleton';
import SinDatos from '../dashboard/SinDatos';

const campoInput =
  'rounded-xl border border-borde-tarjeta bg-white px-3 py-2 text-sm text-texto outline-none focus:border-dorado focus:ring-2 focus:ring-dorado/20';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const ahora = new Date();

// RF: meta mensual de venta manual por sede, usada por el KPI de "avance de
// meta" del Dashboard. PUT /metas define la meta si no existe, o la
// actualiza si ya existe (upsert por sede+mes+anio).
export default function SeccionMetas({ sedes, sedeSeleccionada }) {
  const [sedeId, setSedeId] = useState(sedeSeleccionada || sedes[0]?.id || '');
  const [mes, setMes] = useState(ahora.getMonth() + 1);
  const [anio, setAnio] = useState(ahora.getFullYear());
  const [metaVenta, setMetaVenta] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  const [metas, setMetas] = useState(null);

  useEffect(() => {
    if (sedeSeleccionada) setSedeId(sedeSeleccionada);
  }, [sedeSeleccionada]);

  function cargarMetas() {
    if (!sedeId) return;
    api.get(`/metas?sede_id=${sedeId}`).then((data) => setMetas(data.metas));
  }

  useEffect(cargarMetas, [sedeId]);

  useEffect(() => {
    const actual = metas?.find((m) => m.mes === mes && m.anio === anio);
    setMetaVenta(actual ? String(actual.meta_venta) : '');
  }, [metas, mes, anio]);

  async function handleGuardar(e) {
    e.preventDefault();
    setError('');
    setExito(false);
    const num = Number(metaVenta);
    if (!Number.isFinite(num) || num <= 0) {
      setError('La meta de venta debe ser un número positivo');
      return;
    }

    setGuardando(true);
    try {
      await api.put('/metas', { sede_id: Number(sedeId), mes, anio, meta_venta: num });
      setExito(true);
      cargarMetas();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[20px] border border-borde-tarjeta bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-texto">Definir meta mensual</h3>
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

        <form onSubmit={handleGuardar} className="mt-4 flex flex-col gap-3 border-t border-borde-tarjeta pt-4">
          <div className="flex gap-2">
            <select
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
              className={`${campoInput} flex-1`}
            >
              {MESES.map((nombre, i) => (
                <option key={nombre} value={i + 1}>
                  {nombre}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              className={`${campoInput} w-24`}
            />
          </div>

          <input
            type="number"
            min="1"
            value={metaVenta}
            onChange={(e) => setMetaVenta(e.target.value)}
            placeholder="Meta de venta ($)"
            className={campoInput}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}
          {exito && !error && <p className="text-sm text-texto">Meta guardada.</p>}

          <button
            type="submit"
            disabled={guardando}
            className="self-start rounded-lg bg-dorado px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {guardando ? 'Guardando...' : 'Guardar meta'}
          </button>
        </form>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-texto">Metas definidas</h3>
        {!metas ? (
          <CardSkeleton alto="h-24" />
        ) : metas.length === 0 ? (
          <SinDatos mensaje="Todavia no hay metas definidas para esta sede." />
        ) : (
          <div className="divide-y divide-borde-tarjeta rounded-[20px] border border-borde-tarjeta bg-white shadow-sm">
            {metas.map((m) => (
              <div key={m.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-medium text-texto">
                  {MESES[m.mes - 1]} {m.anio}
                </span>
                <span className="text-sm text-texto">{formatearMoneda(m.meta_venta)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
