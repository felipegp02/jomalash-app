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
import ChartEmpleadas from '../components/dashboard/ChartEmpleadas';
import RankingServicios from '../components/dashboard/RankingServicios';
import DesgloseSedes from '../components/dashboard/DesgloseSedes';
import DesglosePago from '../components/dashboard/DesglosePago';
import TarjetaTendencia from '../components/dashboard/TarjetaTendencia';

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

// Cada tarjeta de tendencia (venta, servicios) tiene su propio toggle
// Por mes / Por dia y pide sus datos por separado, sin depender del
// selector de periodo general del dashboard.
function useTendencia(filtros) {
  const [vista, setVista] = useState('mensual');
  const [puntos, setPuntos] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams({ granularidad: vista });
    if (filtros.sedeId) params.set('sede_id', filtros.sedeId);
    if (filtros.servicioId) params.set('servicio_id', filtros.servicioId);
    if (filtros.usuarioId) params.set('usuario_id', filtros.usuarioId);

    setPuntos(null);
    api.get(`/dashboard/tendencia?${params}`).then((d) => setPuntos(d.puntos));
  }, [vista, filtros.sedeId, filtros.servicioId, filtros.usuarioId]);

  return { vista, setVista, puntos };
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
  const veCompleto = usuario.ve_dashboard_completo;

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
  const [rankingEmpleadas, setRankingEmpleadas] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Sin el permiso de dashboard completo, siempre es "modo individual" (solo
  // el propio desempeno); con el permiso, se entra en modo individual solo
  // al elegir una empleada puntual en el filtro.
  const modoIndividual = !veCompleto || filtros.usuarioId !== '';
  const mostrarRankingsEquipo = veCompleto && filtros.usuarioId === '';
  const mostrarDesgloseSedes = veCompleto && filtros.sedeId === '';

  useEffect(() => {
    api.get('/servicios').then((data) => setServicios(data.servicios));
    if (veCompleto) {
      api.get('/sedes').then((data) => setSedes(data.sedes));
      api.get('/usuarios?rol=empleada').then((data) => setEmpleadas(data.usuarios));
    }
  }, [veCompleto]);

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

    if (veCompleto) {
      peticiones.push(
        api.get(`/dashboard/empleadas?${base}`).then((d) => setRankingEmpleadas(d.ranking)),
      );
    }

    Promise.all(peticiones).finally(() => setCargando(false));
    // rango es un objeto nuevo en cada render; solo nos interesan sus valores.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rango.desde.getTime(), rango.hasta.getTime(), filtros.sedeId, filtros.servicioId, filtros.usuarioId, filtros.comparar, veCompleto]);

  const tendenciaVenta = useTendencia(filtros);
  const tendenciaServicios = useTendencia(filtros);

  const empleadaSeleccionada = veCompleto
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
              anterior={filtros.comparar ? resumen.comparación?.servicios : null}
            />

            {modoIndividual ? (
              <KpiCard
                etiqueta="Comision total"
                valor={formatearMoneda(resumen.comisionTotal)}
                actual={filtros.comparar ? resumen.comisionTotal : null}
                anterior={filtros.comparar ? resumen.comparación?.comisionTotal : null}
              />
            ) : (
              <KpiCard
                etiqueta="Venta bruta"
                valor={formatearMoneda(resumen.ventaBruta)}
                actual={filtros.comparar ? resumen.ventaBruta : null}
                anterior={filtros.comparar ? resumen.comparación?.ventaBruta : null}
              />
            )}

            <KpiCard
              etiqueta="Ticket medio"
              valor={formatearMoneda(resumen.ticketMedio)}
              actual={filtros.comparar ? resumen.ticketMedio : null}
              anterior={filtros.comparar ? resumen.comparación?.ticketMedio : null}
            />

            <KpiCard
              etiqueta="Ganancia neta"
              valor={formatearMoneda(resumen.gananciaNeta)}
              actual={filtros.comparar ? resumen.gananciaNeta : null}
              anterior={filtros.comparar ? resumen.comparación?.gananciaNeta : null}
            >
              <div className="mt-1 flex flex-col gap-0.5 text-xs text-texto-secundario">
                <p>Venta bruta: {formatearMoneda(resumen.ventaBruta)}</p>
                <p>− Comisiones: {formatearMoneda(resumen.comisionTotal)}</p>
                <p>− Insumos: {formatearMoneda(resumen.costoInsumos)}</p>
                {resumen.gastoTotal > 0 && <p>− Gastos: {formatearMoneda(resumen.gastoTotal)}</p>}
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

      <TarjetaTendencia
        titulo="Tendencia de venta"
        vista={tendenciaVenta.vista}
        onCambiarVista={tendenciaVenta.setVista}
        puntos={tendenciaVenta.puntos}
        campo="venta"
        formatoValor={formatearMoneda}
      />

      <TarjetaTendencia
        titulo="Tendencia de servicios realizados"
        vista={tendenciaServicios.vista}
        onCambiarVista={tendenciaServicios.setVista}
        puntos={tendenciaServicios.puntos}
        campo="servicios"
        formatoValor={(v) => `${v} ${v === 1 ? 'servicio' : 'servicios'}`}
        enteros
      />

      <div className="rounded-[20px] border border-borde-tarjeta bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-texto">Venta por metodo de pago</h3>
        {cargando || !resumen ? (
          <CardSkeleton alto="h-48" />
        ) : (
          <DesglosePago porMetodoPago={resumen.porMetodoPago} />
        )}
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
