import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { formatearMoneda } from '../../utils/formato';
import CardSkeleton from '../dashboard/CardSkeleton';
import SinDatos from '../dashboard/SinDatos';

const campoLabel = 'text-sm font-medium text-texto-secundario';
const campoInput =
  'rounded-xl border border-borde-tarjeta bg-white px-3 py-2 text-sm text-texto outline-none focus:border-dorado focus:ring-2 focus:ring-dorado/20';

export default function SeccionCompras() {
  const [insumos, setInsumos] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [compras, setCompras] = useState(null);
  const [cargando, setCargando] = useState(true);

  const [insumoId, setInsumoId] = useState('');
  const [sedeId, setSedeId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [costoTotal, setCostoTotal] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  function cargarCompras() {
    setCargando(true);
    api
      .get('/compras')
      .then((data) => setCompras(data.compras))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    api.get('/insumos').then((data) => setInsumos(data.insumos));
    api.get('/sedes').then((data) => setSedes(data.sedes));
    cargarCompras();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!insumoId || !sedeId) {
      setError('Selecciona el insumo y la sede');
      return;
    }

    setEnviando(true);
    try {
      await api.post('/compras', {
        insumo_id: Number(insumoId),
        sede_id: Number(sedeId),
        cantidad: Number(cantidad),
        costo_total: Number(costoTotal),
      });
      setInsumoId('');
      setSedeId('');
      setCantidad('');
      setCostoTotal('');
      cargarCompras();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-[20px] border border-borde-tarjeta bg-white p-5 shadow-sm"
      >
        <h3 className="text-sm font-semibold text-texto">Registrar compra</h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 flex flex-col gap-1">
            <label className={campoLabel}>Insumo</label>
            <select value={insumoId} onChange={(e) => setInsumoId(e.target.value)} className={campoInput}>
              <option value="">Selecciona un insumo</option>
              {insumos.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nombre} ({i.unidad})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className={campoLabel}>Sede</label>
            <select value={sedeId} onChange={(e) => setSedeId(e.target.value)} className={campoInput}>
              <option value="">Selecciona</option>
              {sedes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className={campoLabel}>Cantidad</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className={campoInput}
            />
          </div>

          <div className="col-span-2 flex flex-col gap-1">
            <label className={campoLabel}>Costo total</label>
            <input
              type="number"
              min="0"
              value={costoTotal}
              onChange={(e) => setCostoTotal(e.target.value)}
              placeholder="En pesos, por toda la compra"
              className={campoInput}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="w-fit rounded-lg bg-dorado px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {enviando ? 'Guardando...' : 'Registrar compra'}
        </button>
      </form>

      <div>
        <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-texto-secundario">
          Historial de compras
        </h3>
        {cargando || !compras ? (
          <CardSkeleton alto="h-24" />
        ) : compras.length === 0 ? (
          <SinDatos mensaje="Todavia no hay compras registradas." />
        ) : (
          <div className="divide-y divide-borde-tarjeta rounded-[20px] border border-borde-tarjeta bg-white shadow-sm">
            {compras.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-texto">{c.insumo.nombre}</p>
                  <p className="text-xs text-texto-secundario">
                    {c.cantidad} {c.insumo.unidad} · {c.sede.nombre} ·{' '}
                    {new Date(c.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <p className="shrink-0 pl-3 text-sm font-semibold text-texto">{formatearMoneda(c.costo_total)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
