import { useEffect, useRef, useState } from 'react';
import { api } from '../../api/client';
import Toast from '../Toast';
import CardSkeleton from '../dashboard/CardSkeleton';
import SinDatos from '../dashboard/SinDatos';
import { formatearHora, formatearMoneda, etiquetaDia } from '../../utils/formato';

const campoLabel = 'text-sm font-medium text-texto-secundario';
const campoInput =
  'rounded-xl border border-borde-tarjeta bg-white px-4 py-3 text-texto outline-none focus:border-dorado focus:ring-2 focus:ring-dorado/20';
const campoInputChico =
  'rounded-xl border border-borde-tarjeta bg-white px-3 py-2 text-sm text-texto outline-none focus:border-dorado focus:ring-2 focus:ring-dorado/20';

const CATEGORIAS = [
  { valor: 'arriendo', etiqueta: 'Arriendo' },
  { valor: 'servicios', etiqueta: 'Servicios' },
  { valor: 'varios', etiqueta: 'Varios' },
];

function etiquetaCategoria(valor) {
  return CATEGORIAS.find((c) => c.valor === valor)?.etiqueta || valor;
}

function inicioDeMesISO() {
  const hoy = new Date();
  return new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function agruparPorDia(gastos) {
  const grupos = [];
  let actual = null;
  for (const gasto of gastos) {
    const etiqueta = etiquetaDia(gasto.fecha);
    if (!actual || actual.etiqueta !== etiqueta) {
      actual = { etiqueta, gastos: [] };
      grupos.push(actual);
    }
    actual.gastos.push(gasto);
  }
  return grupos;
}

export default function SeccionGastos({ sedes, sedeSeleccionada }) {
  const [sedeId, setSedeId] = useState(sedeSeleccionada || sedes[0]?.id || '');
  const [categoria, setCategoria] = useState('');
  const [monto, setMonto] = useState('');
  const [nota, setNota] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimeout = useRef(null);

  const [filtroSedeId, setFiltroSedeId] = useState('');
  const [fechaDesde, setFechaDesde] = useState(inicioDeMesISO());
  const [fechaHasta, setFechaHasta] = useState(hoyISO());
  const [gastos, setGastos] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (sedeSeleccionada) setSedeId(sedeSeleccionada);
  }, [sedeSeleccionada]);

  useEffect(() => () => clearTimeout(toastTimeout.current), []);

  function cargarGastos() {
    const params = new URLSearchParams({
      desde: new Date(fechaDesde).toISOString(),
      // "hasta" exclusivo: se manda el inicio del dia siguiente para incluir el dia completo.
      hasta: new Date(new Date(fechaHasta).getTime() + 24 * 60 * 60 * 1000).toISOString(),
    });
    if (filtroSedeId) params.set('sede_id', filtroSedeId);

    setCargando(true);
    api
      .get(`/gastos?${params}`)
      .then((data) => setGastos(data.gastos))
      .finally(() => setCargando(false));
  }

  useEffect(cargarGastos, [filtroSedeId, fechaDesde, fechaHasta]);

  function mostrarToast() {
    setToastVisible(true);
    clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToastVisible(false), 3000);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!categoria) {
      setError('Selecciona una categoría');
      return;
    }
    const montoNum = Number(monto);
    if (!Number.isFinite(montoNum) || montoNum <= 0) {
      setError('El monto debe ser un número positivo');
      return;
    }

    setEnviando(true);
    try {
      await api.post('/gastos', {
        categoria,
        monto: montoNum,
        nota: nota || undefined,
        sede_id: Number(sedeId),
      });
      mostrarToast();
      setCategoria('');
      setMonto('');
      setNota('');
      cargarGastos();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  const grupos = gastos ? agruparPorDia(gastos) : [];

  return (
    <div className="flex flex-col gap-5">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-[20px] border border-borde-tarjeta bg-white p-6 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-texto">Registrar gasto</h3>
          {sedes.length > 1 && (
            <select value={sedeId} onChange={(e) => setSedeId(Number(e.target.value))} className={campoInputChico}>
              {sedes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="categoria" className={campoLabel}>
            Categoría
          </label>
          <select
            id="categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className={campoInput}
          >
            <option value="">Selecciona una categoría</option>
            {CATEGORIAS.map((c) => (
              <option key={c.valor} value={c.valor}>
                {c.etiqueta}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="monto" className={campoLabel}>
            Monto
          </label>
          <input
            id="monto"
            type="number"
            min="1"
            step="1"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className={campoInput}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="nota" className={campoLabel}>
            Nota (opcional)
          </label>
          <input
            id="nota"
            type="text"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Ej. Pago arriendo julio"
            className={campoInput}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="mt-2 rounded-xl bg-dorado py-4 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {enviando ? 'Guardando...' : 'Registrar gasto'}
        </button>
      </form>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 rounded-[20px] border border-borde-tarjeta bg-white p-4 shadow-sm md:flex-row md:flex-wrap md:items-center">
          {sedes.length > 1 && (
            <select
              value={filtroSedeId}
              onChange={(e) => setFiltroSedeId(e.target.value)}
              className={campoInputChico}
            >
              <option value="">Todas las sedes</option>
              {sedes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className={campoInputChico}
            />
            <span className="text-sm text-texto-secundario">a</span>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className={campoInputChico}
            />
          </div>
        </div>

        {cargando || !gastos ? (
          <div className="flex flex-col gap-3">
            <CardSkeleton alto="h-16" />
            <CardSkeleton alto="h-16" />
          </div>
        ) : gastos.length === 0 ? (
          <SinDatos mensaje="No hay gastos registrados con estos filtros." />
        ) : (
          <div className="flex flex-col gap-5">
            {grupos.map((grupo) => (
              <div key={grupo.etiqueta}>
                <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-texto-secundario">
                  {grupo.etiqueta}
                </p>
                <div className="divide-y divide-borde-tarjeta rounded-[20px] border border-borde-tarjeta bg-white shadow-sm">
                  {grupo.gastos.map((g) => (
                    <div key={g.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-texto">{etiquetaCategoria(g.categoria)}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-texto-secundario">
                          <span>{g.sede.nombre}</span>
                          <span>·</span>
                          <span>{formatearHora(g.fecha)}</span>
                          <span>·</span>
                          <span>{g.registradoPor.nombre}</span>
                          {g.nota && (
                            <>
                              <span>·</span>
                              <span className="truncate">{g.nota}</span>
                            </>
                          )}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-rojo">
                        -{formatearMoneda(g.monto)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Toast mensaje="Gasto registrado" visible={toastVisible} />
    </div>
  );
}
