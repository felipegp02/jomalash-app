const campoLabel = 'text-sm font-medium text-texto-secundario';
const campoInput =
  'rounded-xl border border-borde-tarjeta bg-white px-3 py-2 text-sm text-texto outline-none focus:border-dorado focus:ring-2 focus:ring-dorado/20';

const TIPOS = [
  { valor: 'consumible', etiqueta: 'Consumible' },
  { valor: 'herramienta', etiqueta: 'Herramienta' },
];

const TIPOS_MEDIDA = [
  { valor: 'ml', etiqueta: 'Mililitros (ml)' },
  { valor: 'gramos', etiqueta: 'Gramos' },
  { valor: 'unidades', etiqueta: 'Unidades' },
];

// Campos compartidos entre el alta y la edicion de un insumo. Un consumible
// necesita tipo_medida y contenido_por_compra (se compra en una presentacion
// y se gasta en otra, ej. un frasco de 15ml); una herramienta no, se cuenta
// siempre en unidades enteras.
export default function CamposInsumo({ valores, onChange, incluirStockInicial = false }) {
  function set(campo, valor) {
    onChange({ ...valores, [campo]: valor });
  }

  const esConsumible = valores.tipo !== 'herramienta';

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2 flex flex-col gap-1">
        <label className={campoLabel}>Nombre</label>
        <input
          value={valores.nombre}
          onChange={(e) => set('nombre', e.target.value)}
          className={campoInput}
          placeholder="Ej. Acetona"
        />
      </div>

      <div className="col-span-2 flex flex-col gap-1">
        <label className={campoLabel}>Tipo</label>
        <div className="grid grid-cols-2 gap-2">
          {TIPOS.map((t) => (
            <button
              key={t.valor}
              type="button"
              onClick={() => set('tipo', t.valor)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                valores.tipo === t.valor
                  ? 'border-dorado bg-dorado-fondo text-texto'
                  : 'border-borde-tarjeta bg-white text-texto-secundario hover:text-texto'
              }`}
            >
              {t.etiqueta}
            </button>
          ))}
        </div>
      </div>

      {esConsumible && (
        <div className="flex flex-col gap-1">
          <label className={campoLabel}>Tipo de medida</label>
          <select
            value={valores.tipo_medida}
            onChange={(e) => set('tipo_medida', e.target.value)}
            className={campoInput}
          >
            <option value="">Selecciona</option>
            {TIPOS_MEDIDA.map((m) => (
              <option key={m.valor} value={m.valor}>
                {m.etiqueta}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className={campoLabel}>Unidad de compra</label>
        <input
          value={valores.unidad_compra}
          onChange={(e) => set('unidad_compra', e.target.value)}
          className={campoInput}
          placeholder="frasco, paquete, rollo, caja, unidad..."
        />
      </div>

      {esConsumible && (
        <div className="flex flex-col gap-1">
          <label className={campoLabel}>Contenido por compra</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={valores.contenido_por_compra}
            onChange={(e) => set('contenido_por_compra', e.target.value)}
            className={campoInput}
            placeholder="Ej. 15 (un frasco trae 15 ml)"
          />
        </div>
      )}

      {incluirStockInicial && (
        <div className="flex flex-col gap-1">
          <label className={campoLabel}>Stock inicial</label>
          <input
            type="number"
            min="0"
            value={valores.stock_actual}
            onChange={(e) => set('stock_actual', e.target.value)}
            className={campoInput}
          />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className={campoLabel}>Stock minimo</label>
        <input
          type="number"
          min="0"
          value={valores.stock_minimo}
          onChange={(e) => set('stock_minimo', e.target.value)}
          className={campoInput}
        />
      </div>
    </div>
  );
}
