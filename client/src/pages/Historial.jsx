import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { calcularRango } from '../utils/periodo';
import FiltrosHistorial from '../components/historial/FiltrosHistorial';
import ListaMovimientos from '../components/historial/ListaMovimientos';
import CardSkeleton from '../components/dashboard/CardSkeleton';

function inicioDeMesISO() {
  const hoy = new Date();
  return new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function Historial() {
  const { usuario } = useAuth();
  const esAdmin = usuario.rol === 'admin';

  const [sedes, setSedes] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [empleadas, setEmpleadas] = useState([]);
  const [ventas, setVentas] = useState(null);
  const [cargando, setCargando] = useState(true);

  const [filtros, setFiltros] = useState({
    sedeId: '',
    usuarioId: '',
    servicioId: '',
    fechaDesde: inicioDeMesISO(),
    fechaHasta: hoyISO(),
  });

  useEffect(() => {
    api.get('/servicios').then((data) => setServicios(data.servicios));
    if (esAdmin) {
      api.get('/sedes').then((data) => setSedes(data.sedes));
      api.get('/usuarios?rol=empleada').then((data) => setEmpleadas(data.usuarios));
    }
  }, [esAdmin]);

  const rango = useMemo(
    () => calcularRango('personalizado', filtros.fechaDesde, filtros.fechaHasta),
    [filtros.fechaDesde, filtros.fechaHasta],
  );

  useEffect(() => {
    const params = new URLSearchParams({
      desde: rango.desde.toISOString(),
      hasta: rango.hasta.toISOString(),
    });
    if (filtros.sedeId) params.set('sede_id', filtros.sedeId);
    if (filtros.usuarioId) params.set('usuario_id', filtros.usuarioId);
    if (filtros.servicioId) params.set('servicio_id', filtros.servicioId);

    setCargando(true);
    api
      .get(`/ventas?${params}`)
      .then((data) => setVentas(data.ventas))
      .finally(() => setCargando(false));
    // rango es un objeto nuevo en cada render; solo nos interesan sus valores.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rango.desde.getTime(), rango.hasta.getTime(), filtros.sedeId, filtros.usuarioId, filtros.servicioId]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <FiltrosHistorial
        usuario={usuario}
        sedes={sedes}
        servicios={servicios}
        empleadas={empleadas}
        filtros={filtros}
        onChange={setFiltros}
      />

      {cargando || !ventas ? (
        <div className="flex flex-col gap-3">
          <CardSkeleton alto="h-16" />
          <CardSkeleton alto="h-16" />
          <CardSkeleton alto="h-16" />
        </div>
      ) : (
        <ListaMovimientos ventas={ventas} />
      )}
    </div>
  );
}
