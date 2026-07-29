import { useState } from 'react';
import { api } from '../../api/client';

const campoInput =
  'w-28 shrink-0 rounded-xl border border-borde-tarjeta bg-white px-3 py-2 text-sm text-texto outline-none focus:border-dorado focus:ring-2 focus:ring-dorado/20';

// Insumos con envase (ml/gramos) no son practicos de medir a ojo en su
// unidad cruda ("¿cuantos ml de aceite quedan?"), asi que para esos el
// input pide la cantidad en unidad_compra (frascos, tarros...) y se
// convierte con contenido_por_compra. Los que ya se cuentan sueltos
// (tipo_medida 'unidades', ej. algodon/toallas/tijeras) no cambian: ahi
// contar la unidad real es lo practico.
function esConvertible(insumo) {
  return insumo.tipo === 'consumible' && (insumo.tipo_medida === 'ml' || insumo.tipo_medida === 'gramos');
}

// Redondea a 4 decimales (misma precision que stock_actual en la base) para
// que ida y vuelta (dividir para mostrar, multiplicar para guardar) no
// arrastre ruido de punto flotante y dispare guardados sin cambios reales.
function redondear(valor) {
  return Math.round(valor * 10000) / 10000;
}

// Carga o corrige el stock real de cada insumo de una sola vez. A
// diferencia de una compra, esto no queda registrado en el historial de
// compras: es solo una foto del stock real (para arrancar con números
// reales, o para corregir un conteo).
export default function AjusteInventario({ insumos, onCerrar, onGuardado }) {
  const [valores, setValores] = useState(() =>
    Object.fromEntries(
      insumos.map((i) => {
        const inicial = esConvertible(i) ? redondear(i.stock_actual / i.contenido_por_compra) : i.stock_actual;
        return [i.id, String(inicial)];
      }),
    ),
  );
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function handleGuardar() {
    setError('');
    setGuardando(true);
    try {
      const cambios = insumos
        .map((i) => {
          const ingresado = Number(valores[i.id]) || 0;
          const stockNuevo = esConvertible(i) ? redondear(ingresado * i.contenido_por_compra) : ingresado;
          return { insumo: i, stockNuevo };
        })
        .filter(({ insumo, stockNuevo }) => stockNuevo !== Number(insumo.stock_actual));

      await Promise.all(
        cambios.map(({ insumo, stockNuevo }) =>
          api.put(`/insumos/${insumo.id}/inventario`, { stock_actual: stockNuevo }),
        ),
      );
      onGuardado();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="rounded-[20px] border border-borde-tarjeta bg-white p-5 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-texto">Inventario inicial</h3>
        <button
          type="button"
          onClick={onCerrar}
          className="text-sm font-medium text-texto-secundario hover:text-texto"
        >
          Cerrar
        </button>
      </div>
      <p className="mb-4 text-xs text-texto-secundario">
        Carga el stock real de cada insumo. Este ajuste no queda registrado como una compra.
      </p>

      {insumos.length === 0 ? (
        <p className="text-sm text-texto-secundario">Todavia no hay insumos para ajustar.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {insumos.map((i) => {
            const convertible = esConvertible(i);
            const etiqueta = convertible ? i.unidad_compra : i.tipo === 'consumible' ? i.tipo_medida : 'unidades';
            const ingresado = Number(valores[i.id]) || 0;

            return (
              <div key={i.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-texto">{i.nombre}</p>
                  <p className="text-xs text-texto-secundario">
                    {etiqueta}
                    {convertible && (
                      <span> · = {redondear(ingresado * i.contenido_por_compra)} {i.tipo_medida}</span>
                    )}
                  </p>
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={valores[i.id]}
                  onChange={(e) => setValores((v) => ({ ...v, [i.id]: e.target.value }))}
                  className={campoInput}
                />
              </div>
            );
          })}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleGuardar}
        disabled={guardando || insumos.length === 0}
        className="mt-4 w-fit rounded-lg bg-dorado px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        {guardando ? 'Guardando...' : 'Guardar inventario'}
      </button>
    </div>
  );
}
