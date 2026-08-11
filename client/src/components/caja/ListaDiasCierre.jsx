import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { formatearMoneda } from '../../utils/formato';
import CardSkeleton from '../dashboard/CardSkeleton';
import SinDatos from '../dashboard/SinDatos';

const campoInput =
  'rounded-xl border border-borde-tarjeta bg-white px-3 py-2 text-sm text-texto outline-none focus:border-dorado focus:ring-2 focus:ring-dorado/20';

function formatearFecha(fechaYMD) {
  return new Date(`${fechaYMD}T00:00:00Z`).toLocaleDateString('es-CO', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function inicioDeMesISO() {
  const hoy = new Date();
  return new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

// Solo lectura: lista los dias con al menos una venta en el rango elegido,
// cerrados (con el total neto guardado) o pendientes (con la venta bruta
// como referencia). Un click carga ese dia en el selector de arriba.
export default function ListaDiasCierre({ sedeId, onSeleccionarFecha }) {
  const [desde, setDesde] = useState(inicioDeMesISO());
  const [hasta, setHasta] = useState(hoyISO());
  const [dias, setDias] = useState(null);
  const [cargando, setCargando] = useState(true);

  function cargar() {
    if (!sedeId) return;
    setCargando(true);
    api
      .get(`/cierres-caja/dias?sede_id=${sedeId}&desde=${desde}&hasta=${hasta}`)
      .then((data) => setDias(data.dias))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, [sedeId, desde, hasta]);

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-texto">Días registrados</h3>

      <div className="mb-3 flex items-center gap-2 rounded-[20px] border border-borde-tarjeta bg-white p-4 shadow-sm">
        <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className={campoInput} />
        <span className="text-sm text-texto-secundario">a</span>
        <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className={campoInput} />
      </div>

      {cargando || !dias ? (
        <CardSkeleton alto="h-24" />
      ) : dias.length === 0 ? (
        <SinDatos mensaje="No hay ventas registradas en este rango." />
      ) : (
        <div className="divide-y divide-borde-tarjeta rounded-[20px] border border-borde-tarjeta bg-white shadow-sm">
          {dias.map((d) => (
            <button
              key={d.fecha}
              type="button"
              onClick={() => onSeleccionarFecha(d.fecha)}
              className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-crema/70"
            >
              <div>
                <p className="text-sm font-medium text-texto">{formatearFecha(d.fecha)}</p>
                <p className="text-xs text-texto-secundario">
                  {d.servicios} servicios ·{' '}
                  {d.cerrado ? (
                    <span className="font-medium text-verde">Cerrado</span>
                  ) : (
                    <span className="font-medium text-dorado">Pendiente</span>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-texto">
                  {formatearMoneda(d.cerrado ? d.totalNeto : d.ventaBruta)}
                </p>
                <p className="text-xs text-texto-secundario">{d.cerrado ? 'neto' : 'venta bruta'}</p>
                {d.cerrado && (
                  <p className="text-xs text-texto-secundario">{formatearMoneda(d.ventaBruta)} venta bruta</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
