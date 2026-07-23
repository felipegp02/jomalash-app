import { useState } from 'react';
import SeccionServicios from '../components/gestion/SeccionServicios';
import SeccionEmpleadas from '../components/gestion/SeccionEmpleadas';

const SUBPESTANAS = [
  { id: 'servicios', etiqueta: 'Servicios' },
  { id: 'empleadas', etiqueta: 'Empleadas' },
];

export default function Gestion() {
  const [seccion, setSeccion] = useState('servicios');

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <div className="flex gap-1 rounded-xl border border-borde-tarjeta bg-white p-1 shadow-sm">
        {SUBPESTANAS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSeccion(p.id)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              seccion === p.id ? 'bg-dorado-fondo text-texto' : 'text-texto-secundario hover:text-texto'
            }`}
          >
            {p.etiqueta}
          </button>
        ))}
      </div>

      {seccion === 'servicios' && <SeccionServicios />}
      {seccion === 'empleadas' && <SeccionEmpleadas />}
    </div>
  );
}
