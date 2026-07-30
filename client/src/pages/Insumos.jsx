import { useState } from 'react';
import SeccionStock from '../components/insumos/SeccionStock';
import SeccionRecetas from '../components/insumos/SeccionRecetas';
import SeccionCompras from '../components/insumos/SeccionCompras';

const SUBPESTANAS = [
  { id: 'stock', etiqueta: 'Inventario' },
  { id: 'recetas', etiqueta: 'Insumos por servicio' },
  { id: 'compras', etiqueta: 'Compras' },
];

export default function Insumos() {
  const [seccion, setSeccion] = useState('stock');

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

      {seccion === 'stock' && <SeccionStock />}
      {seccion === 'recetas' && <SeccionRecetas />}
      {seccion === 'compras' && <SeccionCompras />}
    </div>
  );
}
