import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { calcularRango } from '../utils/periodo';
import { formatearMoneda } from '../utils/formato';
import FiltrosDashboard from '../components/dashboard/FiltrosDashboard';
import KpiCard from '../components/dashboard/KpiCard';
import CardSkeleton from '../components/dashboard/CardSkeleton';
import ChartBarra from '../components/dashboard/ChartBarra';
import ChartDona from '../components/dashboard/ChartDona';
import ChartLinea from '../components/dashboard/ChartLinea';
import ChartEmpleadas from '../components/dashboard/ChartEmpleadas';
import RankingServicios from '../components/dashboard/RankingServicios';
import DesgloseSedes from '../components/dashboard/DesgloseSedes';
import DesglosePago from '../components/dashboard/DesglosePago';

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function diaHoraFuerte(tiempo) {
  if (!tiempo) return null;
  const diaTop = tiempo.porDiaSemana.reduce(
    (max, d) => (d.servicios > max.servicios ? d : max),
    tiempo.porDiaSemana[0],
  );
  const horaTop = tiempo.porHora.reduce(
    (max, h) => (h.servicios > max.servicios ? h : max),
    tiempo.porHora[0],
  );
  if (diaTop.servicios === 0 && horaTop.servicios === 0) return null;
  return `${diaTop.dia} · ${horaTop.hora}:00`;
}

export default function Dashboard() {
  const { usuario } = useAuth();
  const esAdmin = usuario.rol === 'admin';

  const [sedes, setSedes] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [empleadas, setEmpleadas] = useState([]);

  const [filtros, setFiltros] = useState({
    periodo: 'mes',
    fechaDesde: hoyISO(),
    fechaHasta: hoyISO(),
    sedeId: '',
    servicioId: '',
    usuarioId: '',
    comparar: false,
  });

  const [resumen, setResumen] = useState(null);
  const [tiempo, setTiempo] = useState(null);
  const [categorias, setCategorias] = useState(null);
  const [rankingServicios, setRankingServicios] = useState(null);
  const [tendencia, setTendencia] = useState(null);
  const [vistaTendencia, setVistaTendencia] = useState('mensual');
  const [rankingEmpleadas, setRankingEmpleadas] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Una empleada solo ve su propio desempeno (siempre "modo individual");
  // un admin entra en modo individual cuando elige una empleada puntual.
  const modoIndividual = !esAdmin || filtros.usuarioId !== '';
  const mostrarRankingsEquipo = esAdmin && filtros.usuarioId === '';
  const mostrarDesgloseSedes = esAdmin && filtros.sedeId === '';

  useEffect(() => {
    api.get('/servicios').then((data) => setServicios(data.servicios));
    if (esAdmin) {
      api.get('/sedes').then((data) => setSedes(data.sedes));
      api.get('/usuarios?rol=empleada').then((data) => setEmpleadas(data.usuarios));
    }
  }, [esAdmin]);

  const rango = useMemo(
    () => calcularRango(filtros.periodo, filtros.fechaDesde, filtros.fechaHasta),
    [filtros.periodo, filtros.fechaDesde, filtros.fechaHasta],
  );

  useEffect(() => {
    const base = new URLSearchParams({
      desde: rango.desde.toISOString(),
      hasta: rango.hasta.toISOString(),
    });
    if (filtros.sedeId) base.set('sede_id', filtros.sedeId);
    if (filtros.servicioId) base.set('servicio_id', filtros.servicioId);
    if (filtros.usuarioId) base.set('usuario_id', filtros.usuarioId);

    const paramsResumen = new URLSearchParams(base);
    if (filtros.comparar) paramsResumen.set('comparar', 'true');

    setCargando(true);

    const peticiones = [
      api.get(`/dashboard/resumen?${paramsResumen}`).then(setResumen),
      api.get(`/dashboard/tiempo?${base}`).then(setTiempo),
      api.get(`/dashboard/categorias?${base}`).then((d) => setCategorias(d.categorias)),
      api.get(`/dashboard/servicios?${base}`).then((d) => setRankingServicios(d.ranking)),
    ];

    if (esAdmin) {
      peticiones.push(
        api.get(`/dashboard/empleadas?${base}`).then((d) => setRankingEmpleadas(d.ranking)),
      );
    }

    Promise.all(peticiones).finally(() => setCargando(false));
    // rango es un objeto nuevo en cada render; solo nos interesan sus valores.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rango.desde.getTime(), rango.hasta.getTime(), filtros.sedeId, filtros.servicioId, filtros.usuarioId, filtros.comparar, esAdmin]);

  // La tendencia no depende del selector de periodo (siempre son 6 meses o
  // 30 dias fijos), asi que se pide aparte para no re-disparar todo lo demas
  // cuando solo se cambia entre vista "Por mes" y "Por dia".
  useEffect(() => {
    const paramsTendencia = new URLSearchParams({ granularidad: vistaTendencia });
    if (filtros.sedeId) paramsTendencia.set('sede_id', filtros.sedeId);
    if (filtros.servicioId) paramsTendencia.set('servicio_id', filtros.servicioId);
    if (filtros.usuarioId) paramsTendencia.set('usuario_id', filtros.usuarioId);

    setTendencia(null);
    api.get(`/dashboard/tendencia?${paramsTendencia}`).then((d) => setTendencia(d.puntos));
  }, [vistaTendencia, filtros.sedeId, filtros.servicioId, filtros.usuarioId]);

  const empleadaSeleccionada = esAdmin
    ? empleadas.find((e) => String(e.id) === filtros.usuarioId)
    : null;

  return (
    <div className="flex flex-col gap-5">
      <FiltrosDashboard
        usuario={usuario}
        sedes={sedes}
        servicios={servicios}
        empleadas={empleadas}
        filtros={filtros}
        onChange={setFiltros}
      />

      {empleadaSeleccionada && (
        <p className="text-sm font-medium text-texto-secundario">
          Vista individual — {empleadaSeleccionada.nombre}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {cargando || !resumen ? (
          <>
            <CardSkeleton alto="h-28" />
            <CardSkeleton alto="h-28" />
            <CardSkeleton alto="h-28" />
            <CardSkeleton alto="h-28" />
            <CardSkeleton alto="h-28" />
          </>
        ) : (
          <>
            <KpiCard
              etiqueta="Servicios del periodo"
              valor={resumen.servicios}
              actual={filtros.comparar ? resumen.servicios : null}
              anterior={filtros.comparar ? resumen.comparacion?.servicios : null}
            />

            {modoIndividual ? (
              <KpiCard
                etiqueta="Comision total"
                valor={formatearMoneda(resumen.comisionTotal)}
                actual={filtros.comparar ? resumen.comisionTotal : null}
                anterior={filtros.comparar ? resumen.comparacion?.comisionTotal : null}
              />
            ) : (
              <KpiCard
                etiqueta="Venta bruta"
                valor={formatearMoneda(resumen.ventaBruta)}
                actual={filtros.comparar ? resumen.ventaBruta : null}
                anterior={filtros.comparar ? resumen.comparacion?.ventaBruta : null}
              />
            )}

            <KpiCard
              etiqueta="Ticket medio"
              valor={formatearMoneda(resumen.ticketMedio)}
              actual={filtros.comparar ? resumen.ticketMedio : null}
              anterior={filtros.comparar ? resumen.comparacion?.ticketMedio : null}
            />

            <KpiCard
              etiqueta="Ganancia neta"
              valor={formatearMoneda(resumen.gananciaNeta)}
              actual={filtros.comparar ? resumen.gananciaNeta : null}
              anterior={filtros.comparar ? resumen.comparacion?.gananciaNeta : null}
            >
              <div className="mt-1 flex flex-col gap-0.5 text-xs text-texto-secundario">
                <p>Venta bruta: {formatearMoneda(resumen.ventaBruta)}</p>
                <p>− Comisiones: {formatearMoneda(resumen.comisionTotal)}</p>
                <p>− Insumos: {formatearMoneda(resumen.costoInsumos)}</p>
              </div>
            </KpiCard>

            {modoIndividual ? (
              <KpiCard etiqueta="Dia y hora mas fuerte" valor={diaHoraFuerte(tiempo) || 'Sin datos'} />
            ) : (
              <KpiCard
                etiqueta="Avance de meta (mes)"
                valor={resumen.avanceMeta.metaVenta ? `${resumen.avanceMeta.porcentaje}%` : 'Sin meta'}
              >
                {resumen.avanceMeta.metaVenta ? (
                  <>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-crema">
                      <div
                        className="h-full rounded-full bg-dorado"
                        style={{ width: `${Math.min(100, Math.max(0, resumen.avanceMeta.porcentaje))}%` }}
                      />
                    </div>
                    <p className="text-xs text-texto-secundario">
                      {formatearMoneda(resumen.avanceMeta.ventaActual)} de{' '}
                      {formatearMoneda(resumen.avanceMeta.metaVenta)}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-texto-secundario">Define una meta mensual para esta sede.</p>
                )}
              </KpiCard>
            )}
          </>
        )}
      </div>

      {mostrarDesgloseSedes && (
        <div className="rounded-[20px] border border-borde-tarjeta bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-texto">Castilla vs. Marsella</h3>
          {cargando || !resumen ? (
            <CardSkeleton alto="h-24" />
          ) : (
            <DesgloseSedes porSede={resumen.porSede} sedes={sedes} />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-[20px] border border-borde-tarjeta bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-texto">Servicios por dia de la semana</h3>
          {cargando || !tiempo ? (
            <CardSkeleton alto="h-48" />
          ) : (
            <ChartBarra
              etiquetas={tiempo.porDiaSemana.map((d) => d.dia)}
              datos={tiempo.porDiaSemana.map((d) => d.servicios)}
              etiquetaSerie="Servicios"
            />
          )}
        </div>

        <div className="rounded-[20px] border border-borde-tarjeta bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-texto">Servicios por hora del dia</h3>
          {cargando || !tiempo ? (
            <CardSkeleton alto="h-48" />
          ) : (
            <ChartBarra
              etiquetas={tiempo.porHora.map((h) => `${h.hora}:00`)}
              datos={tiempo.porHora.map((h) => h.servicios)}
              etiquetaSerie="Servicios"
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-[20px] border border-borde-tarjeta bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-texto">Servicios por categoria</h3>
          {cargando || !categorias ? <CardSkeleton alto="h-48" /> : <ChartDona categorias={categorias} />}
        </div>

        <div className="rounded-[20px] border border-borde-tarjeta bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-texto">Ranking de servicios</h3>
          {cargando || !rankingServicios ? (
            <CardSkeleton alto="h-48" />
          ) : (
            <RankingServicios ranking={rankingServicios} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-[20px] border border-borde-tarjeta bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-texto">
              Tendencia de venta {vistaTendencia === 'mensual' ? '(ultimos 6 meses)' : '(ultimos 30 dias)'}
            </h3>
            <div className="flex shrink-0 gap-1 rounded-lg border border-borde-tarjeta bg-crema p-0.5">
              {[
                { valor: 'mensual', etiqueta: 'Por mes' },
                { valor: 'diario', etiqueta: 'Por dia' },
              ].map((op) => (
                <button
                  key={op.valor}
                  type="button"
                  onClick={() => setVistaTendencia(op.valor)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    vistaTendencia === op.valor
                      ? 'bg-white text-texto shadow-sm'
                      : 'text-texto-secundario hover:text-texto'
                  }`}
                >
                  {op.etiqueta}
                </button>
              ))}
            </div>
          </div>
          {!tendencia ? (
            <CardSkeleton alto="h-48" />
          ) : (
            <ChartLinea
              etiquetas={tendencia.map((p) => p.etiqueta)}
              datos={tendencia.map((p) => p.venta)}
            />
          )}
        </div>

        <div className="rounded-[20px] border border-borde-tarjeta bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-texto">Venta por metodo de pago</h3>
          {cargando || !resumen ? (
            <CardSkeleton alto="h-48" />
          ) : (
            <DesglosePago porMetodoPago={resumen.porMetodoPago} />
          )}
        </div>
      </div>

      {mostrarRankingsEquipo && (
        <>
          <div className="rounded-[20px] border border-borde-tarjeta bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-texto">Ranking de empleadas — comision</h3>
            {cargando || !rankingEmpleadas ? (
              <CardSkeleton alto="h-40" />
            ) : (
              <ChartEmpleadas ranking={rankingEmpleadas} valor="comision" esMoneda />
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-[20px] border border-borde-tarjeta bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-texto">Servicios por empleada</h3>
              {cargando || !rankingEmpleadas ? (
                <CardSkeleton alto="h-40" />
              ) : (
                <ChartEmpleadas ranking={rankingEmpleadas} valor="servicios" esMoneda={false} />
              )}
            </div>

            <div className="rounded-[20px] border border-borde-tarjeta bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-texto">Venta por empleada</h3>
              {cargando || !rankingEmpleadas ? (
                <CardSkeleton alto="h-40" />
              ) : (
                <ChartEmpleadas ranking={rankingEmpleadas} valor="venta" esMoneda />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
