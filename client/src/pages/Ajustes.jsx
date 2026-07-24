import { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import SeccionServicios from '../components/gestion/SeccionServicios';
import SeccionEmpleadas from '../components/gestion/SeccionEmpleadas';
import SeccionSedes from '../components/gestion/SeccionSedes';

const SUBPESTANAS = [
  { id: 'servicios', etiqueta: 'Servicios', visible: (u) => u.gestiona_catalogo },
  { id: 'empleadas', etiqueta: 'Empleadas', visible: (u) => u.gestiona_empleadas },
  // Sedes no tiene permiso propio: es infraestructura del negocio, queda
  // reservada a rol admin (no delegable desde Ajustes -> Empleadas).
  { id: 'sedes', etiqueta: 'Sedes', visible: (u) => u.rol === 'admin' },
];

export default function Ajustes() {
  const { usuario } = useAuth();
  const subpestanas = useMemo(() => SUBPESTANAS.filter((p) => p.visible(usuario)), [usuario]);
  const [seccion, setSeccion] = useState(subpestanas[0]?.id);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <div className="flex gap-1 rounded-xl border border-borde-tarjeta bg-white p-1 shadow-sm">
        {subpestanas.map((p) => (
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
      {seccion === 'sedes' && <SeccionSedes />}
    </div>
  );
}
