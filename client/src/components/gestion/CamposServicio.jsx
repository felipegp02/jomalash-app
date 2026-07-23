const campoLabel = 'text-sm font-medium text-texto-secundario';
const campoInput =
  'rounded-xl border border-borde-tarjeta bg-white px-3 py-2 text-sm text-texto outline-none focus:border-dorado focus:ring-2 focus:ring-dorado/20';

export default function CamposServicio({ valores, onChange }) {
  function set(campo, valor) {
    onChange({ ...valores, [campo]: valor });
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2 flex flex-col gap-1">
        <label className={campoLabel}>Nombre</label>
        <input value={valores.nombre} onChange={(e) => set('nombre', e.target.value)} className={campoInput} />
      </div>

      <div className="flex flex-col gap-1">
        <label className={campoLabel}>Categoria</label>
        <input
          value={valores.categoria}
          onChange={(e) => set('categoria', e.target.value)}
          className={campoInput}
          placeholder="Uñas, Pestañas y cejas, Estética..."
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className={campoLabel}>Precio</label>
        <input
          type="number"
          min="0"
          value={valores.precio}
          onChange={(e) => set('precio', e.target.value)}
          className={campoInput}
        />
      </div>
    </div>
  );
}
