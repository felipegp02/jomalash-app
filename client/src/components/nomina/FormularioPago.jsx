import { useState } from 'react';
import { api } from '../../api/client';

const campoInput =
  'rounded-xl border border-borde-tarjeta bg-white px-3 py-2 text-sm text-texto outline-none focus:border-dorado focus:ring-2 focus:ring-dorado/20';

const TIPOS = [
  { valor: 'vale', etiqueta: 'Vale' },
  { valor: 'liquidacion', etiqueta: 'Liquidacion' },
];

const METODOS_PAGO = [
  { valor: 'efectivo', etiqueta: 'Efectivo' },
  { valor: 'transferencia', etiqueta: 'Transferencia' },
];

export default function FormularioPago({ usuarioId, sedeId, onGuardado, onCancelar }) {
  const [tipo, setTipo] = useState('vale');
  const [monto, setMonto] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFin, setPeriodoFin] = useState('');
  const [nota, setNota] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function handleGuardar(e) {
    e.preventDefault();
    setError('');

    const montoNum = Number(monto);
    if (!Number.isFinite(montoNum) || montoNum <= 0) {
      setError('El monto debe ser un numero positivo');
      return;
    }

    setGuardando(true);
    try {
      await api.post('/nomina', {
        usuario_id: usuarioId,
        sede_id: sedeId,
        tipo,
        monto: montoNum,
        metodo_pago: metodoPago,
        periodo_inicio: tipo === 'liquidacion' && periodoInicio ? periodoInicio : undefined,
        periodo_fin: tipo === 'liquidacion' && periodoFin ? periodoFin : undefined,
        nota: nota.trim() || undefined,
      });
      onGuardado();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={handleGuardar} className="mt-3 flex flex-col gap-3 border-t border-borde-tarjeta pt-3">
      <div className="grid grid-cols-2 gap-2">
        {TIPOS.map((t) => (
          <button
            key={t.valor}
            type="button"
            onClick={() => setTipo(t.valor)}
            className={`rounded-xl border px-2 py-2 text-sm font-medium transition-colors ${
              tipo === t.valor
                ? 'border-dorado bg-dorado-fondo text-texto'
                : 'border-borde-tarjeta bg-white text-texto-secundario hover:text-texto'
            }`}
          >
            {t.etiqueta}
          </button>
        ))}
      </div>

      <input
        type="number"
        min="1"
        value={monto}
        onChange={(e) => setMonto(e.target.value)}
        placeholder="Monto ($)"
        className={campoInput}
      />

      <div className="grid grid-cols-2 gap-2">
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

      {tipo === 'liquidacion' && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-texto-secundario">Periodo que cubre (opcional)</label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={periodoInicio}
              onChange={(e) => setPeriodoInicio(e.target.value)}
              className={campoInput}
            />
            <span className="text-sm text-texto-secundario">a</span>
            <input
              type="date"
              value={periodoFin}
              onChange={(e) => setPeriodoFin(e.target.value)}
              className={campoInput}
            />
          </div>
        </div>
      )}

      <textarea
        value={nota}
        onChange={(e) => setNota(e.target.value)}
        placeholder="Nota (opcional)"
        rows={2}
        className={campoInput}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={guardando}
          className="rounded-lg bg-dorado px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {guardando ? 'Guardando...' : 'Registrar pago'}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="rounded-lg border border-borde-tarjeta px-4 py-2 text-sm font-medium text-texto-secundario hover:text-texto"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
