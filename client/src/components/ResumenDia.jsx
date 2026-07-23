import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { formatearMoneda } from '../utils/formato';

function rangoDeHoy() {
  const desde = new Date();
  desde.setHours(0, 0, 0, 0);
  const hasta = new Date(desde);
  hasta.setDate(hasta.getDate() + 1);
  return { desde: desde.toISOString(), hasta: hasta.toISOString() };
}

export default function ResumenDia({ usuario, sedeSeleccionada, sedes, refreshTrigger }) {
  const [cargando, setCargando] = useState(true);
  const [datos, setDatos] = useState({ servicios: 0, total: 0 });

  const sedeIdEfectivo = usuario.rol === 'admin' ? sedeSeleccionada : usuario.sede_id;

  const nombreSede =
    usuario.rol !== 'admin'
      ? usuario.sede
      : sedeIdEfectivo === null
        ? 'ambas sedes'
        : sedes.find((s) => s.id === sedeIdEfectivo)?.nombre || usuario.sede;

  useEffect(() => {
    const { desde, hasta } = rangoDeHoy();
    const params = new URLSearchParams({ desde, hasta });
    if (sedeIdEfectivo !== null) params.set('sede_id', sedeIdEfectivo);

    setCargando(true);
    api
      .get(`/ventas?${params.toString()}`)
      .then((data) => {
        const validas = data.ventas.filter((v) => !v.anulada);
        setDatos({
          servicios: validas.length,
          total: validas.reduce((suma, v) => suma + v.precio_total, 0),
        });
      })
      .finally(() => setCargando(false));
  }, [sedeIdEfectivo, refreshTrigger]);

  return (
    <div className="flex flex-col gap-1.5 rounded-[20px] border border-borde-tarjeta bg-white p-6 shadow-sm">
      <p className="text-sm text-texto-secundario">Hoy en {nombreSede}</p>

      {cargando ? (
        <div className="mt-1 h-9 w-24 animate-pulse rounded bg-crema" />
      ) : (
        <p className="text-4xl font-bold text-texto">{datos.servicios}</p>
      )}
      <p className="text-xs text-texto-secundario">
        {datos.servicios === 1 ? 'servicio realizado' : 'servicios realizados'}
      </p>

      {cargando ? (
        <div className="mt-3 h-5 w-32 animate-pulse rounded bg-crema" />
      ) : (
        <p className="mt-3 text-sm text-texto-secundario">
          Total vendido: <span className="font-medium text-texto">{formatearMoneda(datos.total)}</span>
        </p>
      )}
    </div>
  );
}
