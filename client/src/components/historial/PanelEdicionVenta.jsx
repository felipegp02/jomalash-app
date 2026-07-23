import { useState } from 'react';
import { api } from '../../api/client';

const campoInput =
  'rounded-xl border border-borde-tarjeta bg-white px-3 py-2 text-sm text-texto outline-none focus:border-dorado focus:ring-2 focus:ring-dorado/20';

const METODOS_PAGO = [
  { valor: 'efectivo', etiqueta: 'Efectivo' },
  { valor: 'transferencia', etiqueta: 'Transferencia' },
  { valor: 'tarjeta', etiqueta: 'Tarjeta' },
];

// RF-09: editar (total/metodo de pago) o anular (con motivo) una venta ya
// registrada, dejando constancia de quien y cuando (lo hace el backend).
export default function PanelEdicionVenta({ venta, onGuardado, onCerrar }) {
  const [total, setTotal] = useState(String(venta.precio_total));
  const [metodoPago, setMetodoPago] = useState(venta.metodo_pago);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const [anulando, setAnulando] = useState(false);
  const [motivo, setMotivo] = useState('');

  async function handleGuardar() {
    setError('');
    const totalNum = Number(total);
    if (!Number.isFinite(totalNum) || totalNum <= 0) {
      setError('El total debe ser un numero positivo');
      return;
    }

    setGuardando(true);
    try {
      await api.put(`/ventas/${venta.id}`, { precio_total: totalNum, metodo_pago: metodoPago });
      onGuardado();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function handleAnular() {
    if (!motivo.trim()) {
      setError('El motivo de anulacion es requerido');
      return;
    }

    setError('');
    setGuardando(true);
    try {
      await api.put(`/ventas/${venta.id}`, { anulada: true, motivo });
      onGuardado();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  if (anulando) {
    return (
      <div className="mt-3 flex flex-col gap-3 border-t border-borde-tarjeta pt-3">
        <p className="text-sm font-medium text-texto">Anular esta venta</p>
        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Motivo de la anulacion"
          rows={2}
          className={campoInput}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleAnular}
            disabled={guardando}
            className="rounded-lg bg-rojo px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {guardando ? 'Anulando...' : 'Confirmar anulacion'}
          </button>
          <button
            type="button"
            onClick={() => {
              setAnulando(false);
              setError('');
            }}
            className="rounded-lg border border-borde-tarjeta px-4 py-2 text-sm font-medium text-texto-secundario hover:text-texto"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-3 border-t border-borde-tarjeta pt-3">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-texto-secundario">Total</label>
        <input
          type="number"
          min="1"
          value={total}
          onChange={(e) => setTotal(e.target.value)}
          className={campoInput}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-texto-secundario">Metodo de pago</label>
        <div className="grid grid-cols-3 gap-2">
          {METODOS_PAGO.map((m) => (
            <button
              key={m.valor}
              type="button"
              onClick={() => setMetodoPago(m.valor)}
              className={`rounded-xl border px-2 py-2 text-sm font-medium transition-colors ${
                metodoPago === m.valor
                  ? 'border-dorado bg-dorado-fondo text-texto'
                  : 'border-borde-tarjeta bg-white text-texto-secundario hover:text-texto'
              }`}
            >
              {m.etiqueta}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleGuardar}
          disabled={guardando}
          className="rounded-lg bg-dorado px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
        <button
          type="button"
          onClick={() => setAnulando(true)}
          className="rounded-lg border border-rojo/40 px-4 py-2 text-sm font-medium text-rojo hover:bg-red-50"
        >
          Anular venta
        </button>
        <button
          type="button"
          onClick={onCerrar}
          className="rounded-lg border border-borde-tarjeta px-4 py-2 text-sm font-medium text-texto-secundario hover:text-texto"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
