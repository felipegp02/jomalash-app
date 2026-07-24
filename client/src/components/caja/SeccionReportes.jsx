import { useState } from 'react';
import { calcularRango } from '../../utils/periodo';

const API_URL = import.meta.env.VITE_API_URL;

const campoInput =
  'rounded-xl border border-borde-tarjeta bg-white px-3 py-2 text-sm text-texto outline-none focus:border-dorado focus:ring-2 focus:ring-dorado/20';

function primerDiaMesActual() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function hoyIso() {
  return new Date().toISOString().slice(0, 10);
}

// RF-23: exportar el periodo seleccionado en Excel o PDF. El archivo llega
// como blob (no JSON), por eso no se usa el cliente api.js: se hace un fetch
// directo con credenciales y se dispara la descarga en el navegador.
export default function SeccionReportes({ sedes }) {
  const [sedeId, setSedeId] = useState('');
  const [desde, setDesde] = useState(primerDiaMesActual());
  const [hasta, setHasta] = useState(hoyIso());
  const [descargando, setDescargando] = useState('');
  const [error, setError] = useState('');

  async function descargar(formato) {
    setError('');
    setDescargando(formato);
    try {
      // El rango incluye completo el dia "hasta" (mismo criterio que
      // Dashboard/Historial), no solo hasta la medianoche.
      const rango = calcularRango('personalizado', desde, hasta);
      const params = new URLSearchParams({
        formato,
        desde: rango.desde.toISOString(),
        hasta: rango.hasta.toISOString(),
      });
      if (sedeId) params.set('sede_id', sedeId);

      const res = await fetch(`${API_URL}/reportes/exportar?${params}`, { credentials: 'include' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'No se pudo generar el reporte');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-jomalash.${formato === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setDescargando('');
    }
  }

  return (
    <div className="rounded-[20px] border border-borde-tarjeta bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-texto">Exportar reporte</h3>
      <p className="mt-1 text-sm text-texto-secundario">
        Descarga el resumen y el detalle de ventas del periodo seleccionado.
      </p>

      <div className="mt-4 flex flex-col gap-3 border-t border-borde-tarjeta pt-4">
        {sedes.length > 1 && (
          <select value={sedeId} onChange={(e) => setSedeId(e.target.value)} className={campoInput}>
            <option value="">Todas las sedes</option>
            {sedes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        )}

        <div className="flex items-center gap-2">
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className={campoInput} />
          <span className="text-sm text-texto-secundario">a</span>
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className={campoInput} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => descargar('excel')}
            disabled={Boolean(descargando)}
            className="rounded-lg bg-dorado px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {descargando === 'excel' ? 'Generando...' : 'Descargar Excel'}
          </button>
          <button
            type="button"
            onClick={() => descargar('pdf')}
            disabled={Boolean(descargando)}
            className="rounded-lg border border-borde-tarjeta px-4 py-2 text-sm font-medium text-texto hover:bg-crema disabled:opacity-60"
          >
            {descargando === 'pdf' ? 'Generando...' : 'Descargar PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}
