import { useEffect, useState } from 'react';
import { api } from '../api/client';
import SelectorMes from '../components/nomina/SelectorMes';
import TarjetaEmpleada from '../components/nomina/TarjetaEmpleada';
import CardSkeleton from '../components/dashboard/CardSkeleton';
import SinDatos from '../components/dashboard/SinDatos';

const ahora = new Date();

export default function Nomina({ sedeSeleccionada }) {
  const [mes, setMes] = useState(ahora.getMonth() + 1);
  const [anio, setAnio] = useState(ahora.getFullYear());
  const [empleadas, setEmpleadas] = useState(null);
  const [error, setError] = useState('');

  function cargar() {
    const params = new URLSearchParams({ mes, anio });
    if (sedeSeleccionada) params.set('sede_id', sedeSeleccionada);

    setError('');
    api
      .get(`/nomina/resumen?${params}`)
      .then((data) => setEmpleadas(data.empleadas))
      .catch((err) => setError(err.message));
  }

  useEffect(cargar, [mes, anio, sedeSeleccionada]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <SelectorMes
        mes={mes}
        anio={anio}
        onCambiar={(m, a) => {
          setMes(m);
          setAnio(a);
        }}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!empleadas ? (
        <div className="flex flex-col gap-4">
          <CardSkeleton alto="h-48" />
          <CardSkeleton alto="h-48" />
        </div>
      ) : empleadas.length === 0 ? (
        <SinDatos mensaje="No hay empleadas registradas para esta sede." />
      ) : (
        <div className="flex flex-col gap-4">
          {empleadas.map((emp) => (
            <TarjetaEmpleada key={emp.usuario_id} empleada={emp} onPagoRegistrado={cargar} />
          ))}
        </div>
      )}
    </div>
  );
}
