import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { IconMas, IconPapelera } from '../Icons';
import CardSkeleton from '../dashboard/CardSkeleton';

const campoLabel = 'text-sm font-medium text-texto-secundario';
const campoInput =
  'rounded-xl border border-borde-tarjeta bg-white px-3 py-2 text-sm text-texto outline-none focus:border-dorado focus:ring-2 focus:ring-dorado/20';

export default function SeccionRecetas() {
  const [servicios, setServicios] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [servicioId, setServicioId] = useState('');
  const [lineas, setLineas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    api.get('/servicios').then((data) => setServicios(data.servicios));
    // Las recetas solo pueden usar consumibles: una herramienta no se
    // descuenta al vender, no tiene sentido ofrecerla aca.
    api.get('/insumos').then((data) => setInsumos(data.insumos.filter((i) => i.tipo === 'consumible')));
  }, []);

  useEffect(() => {
    if (!servicioId) {
      setLineas([]);
      return;
    }
    setCargando(true);
    setGuardado(false);
    api
      .get(`/receta/${servicioId}`)
      .then((data) =>
        setLineas(data.receta.map((r) => ({ insumo_id: String(r.insumo_id), cantidad_usada: String(r.cantidad_usada) }))),
      )
      .finally(() => setCargando(false));
  }, [servicioId]);

  function actualizarLinea(index, campo, valor) {
    setLineas((prev) => prev.map((l, i) => (i === index ? { ...l, [campo]: valor } : l)));
  }

  function agregarLinea() {
    setLineas((prev) => [...prev, { insumo_id: '', cantidad_usada: '' }]);
  }

  function quitarLinea(index) {
    setLineas((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleGuardar() {
    setError('');
    setGuardado(false);

    for (const linea of lineas) {
      if (!linea.insumo_id || !linea.cantidad_usada || Number(linea.cantidad_usada) <= 0) {
        setError('Cada linea necesita un insumo y una cantidad valida');
        return;
      }
    }
    const idsUsados = lineas.map((l) => l.insumo_id);
    if (new Set(idsUsados).size !== idsUsados.length) {
      setError('No repitas el mismo insumo en la receta');
      return;
    }

    setGuardando(true);
    try {
      await api.put(`/receta/${servicioId}`, {
        lineas: lineas.map((l) => ({
          insumo_id: Number(l.insumo_id),
          cantidad_usada: Number(l.cantidad_usada),
        })),
      });
      setGuardado(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="rounded-[20px] border border-borde-tarjeta bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-texto">Receta por servicio</h3>

      <div className="flex flex-col gap-1.5">
        <label className={campoLabel}>Servicio</label>
        <select
          value={servicioId}
          onChange={(e) => setServicioId(e.target.value)}
          className={campoInput}
        >
          <option value="">Selecciona un servicio</option>
          {servicios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </select>
      </div>

      {servicioId && (
        <div className="mt-4 flex flex-col gap-3 border-t border-borde-tarjeta pt-4">
          {cargando ? (
            <CardSkeleton alto="h-24" />
          ) : (
            <>
              {lineas.length === 0 && (
                <p className="text-sm text-texto-secundario">Este servicio todavia no tiene receta definida.</p>
              )}

              {lineas.map((linea, index) => (
                <div key={index} className="flex items-center gap-2">
                  <select
                    value={linea.insumo_id}
                    onChange={(e) => actualizarLinea(index, 'insumo_id', e.target.value)}
                    className={`${campoInput} flex-1`}
                  >
                    <option value="">Insumo</option>
                    {insumos.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.nombre} ({i.tipo_medida})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={linea.cantidad_usada}
                    onChange={(e) => actualizarLinea(index, 'cantidad_usada', e.target.value)}
                    placeholder="Cantidad"
                    className={`${campoInput} w-24`}
                  />
                  <button
                    type="button"
                    onClick={() => quitarLinea(index)}
                    className="shrink-0 rounded-lg p-2 text-texto-secundario hover:bg-crema hover:text-rojo"
                    title="Quitar linea"
                  >
                    <IconPapelera width={16} height={16} />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={agregarLinea}
                className="flex w-fit items-center gap-1 text-sm font-medium text-dorado hover:opacity-80"
              >
                <IconMas width={14} height={14} />
                Agregar insumo
              </button>

              {error && <p className="text-sm text-red-600">{error}</p>}
              {guardado && <p className="text-sm text-verde">Receta guardada.</p>}

              <button
                type="button"
                onClick={handleGuardar}
                disabled={guardando}
                className="mt-1 w-fit rounded-lg bg-dorado px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
              >
                {guardando ? 'Guardando...' : 'Guardar receta'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
