import { useState } from 'react';
import SeccionCierre from '../components/caja/SeccionCierre';
import SeccionMetas from '../components/caja/SeccionMetas';
import SeccionReportes from '../components/caja/SeccionReportes';

const SUBPESTANAS = [
  { id: 'cierre', etiqueta: 'Cierre de caja' },
  { id: 'metas', etiqueta: 'Metas' },
  { id: 'reportes', etiqueta: 'Reportes' },
];

export default function Caja({ sedes, sedeSeleccionada }) {
  const [seccion, setSeccion] = useState('cierre');

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

      {seccion === 'cierre' && <SeccionCierre sedes={sedes} sedeSeleccionada={sedeSeleccionada} />}
      {seccion === 'metas' && <SeccionMetas sedes={sedes} sedeSeleccionada={sedeSeleccionada} />}
      {seccion === 'reportes' && <SeccionReportes sedes={sedes} sedeSeleccionada={sedeSeleccionada} />}
    </div>
  );
}
