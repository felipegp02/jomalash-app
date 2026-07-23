import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { IconAlerta, IconMas } from '../Icons';
import CardSkeleton from '../dashboard/CardSkeleton';
import SinDatos from '../dashboard/SinDatos';

const campoLabel = 'text-sm font-medium text-texto-secundario';
const campoInput =
  'rounded-xl border border-borde-tarjeta bg-white px-3 py-2 text-sm text-texto outline-none focus:border-dorado focus:ring-2 focus:ring-dorado/20';

const NUEVO_VACIO = { nombre: '', unidad: '', stock_actual: '', stock_minimo: '' };

export default function SeccionStock() {
  const [insumos, setInsumos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [formAbierto, setFormAbierto] = useState(false);
  const [nuevo, setNuevo] = useState(NUEVO_VACIO);
  const [guardando, setGuardando] = useState(false);

  const [editandoId, setEditandoId] = useState(null);
  const [edicion, setEdicion] = useState({ nombre: '', unidad: '', stock_minimo: '' });

  function cargar() {
    setCargando(true);
    api
      .get('/insumos')
      .then((data) => setInsumos(data.insumos))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  async function handleCrear(e) {
    e.preventDefault();
    setError('');
    if (!nuevo.nombre || !nuevo.unidad) {
      setError('Nombre y unidad son requeridos');
      return;
    }

    setGuardando(true);
    try {
      await api.post('/insumos', {
        nombre: nuevo.nombre,
        unidad: nuevo.unidad,
        stock_actual: nuevo.stock_actual === '' ? 0 : Number(nuevo.stock_actual),
        stock_minimo: Number(nuevo.stock_minimo || 0),
      });
      setNuevo(NUEVO_VACIO);
      setFormAbierto(false);
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  function iniciarEdicion(insumo) {
    setEditandoId(insumo.id);
    setEdicion({ nombre: insumo.nombre, unidad: insumo.unidad, stock_minimo: String(insumo.stock_minimo) });
  }

  async function handleGuardarEdicion(id) {
    setError('');
    try {
      await api.put(`/insumos/${id}`, {
        nombre: edicion.nombre,
        unidad: edicion.unidad,
        stock_minimo: Number(edicion.stock_minimo),
      });
      setEditandoId(null);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[20px] border border-borde-tarjeta bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-texto">Insumos y stock</h3>
          <button
            type="button"
            onClick={() => setFormAbierto((v) => !v)}
            className="flex items-center gap-1 rounded-lg bg-dorado px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
          >
            <IconMas width={14} height={14} />
            Nuevo insumo
          </button>
        </div>

        {formAbierto && (
          <form onSubmit={handleCrear} className="mt-4 flex flex-col gap-3 border-t border-borde-tarjeta pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className={campoLabel}>Nombre</label>
                <input
                  value={nuevo.nombre}
                  onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
                  className={campoInput}
                  placeholder="Ej. Acetona"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className={campoLabel}>Unidad</label>
                <input
                  value={nuevo.unidad}
                  onChange={(e) => setNuevo({ ...nuevo, unidad: e.target.value })}
                  className={campoInput}
                  placeholder="ml, unidad, par..."
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className={campoLabel}>Stock inicial</label>
                <input
                  type="number"
                  min="0"
                  value={nuevo.stock_actual}
                  onChange={(e) => setNuevo({ ...nuevo, stock_actual: e.target.value })}
                  className={campoInput}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className={campoLabel}>Stock minimo</label>
                <input
                  type="number"
                  min="0"
                  value={nuevo.stock_minimo}
                  onChange={(e) => setNuevo({ ...nuevo, stock_minimo: e.target.value })}
                  className={campoInput}
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={guardando}
                className="rounded-lg bg-dorado px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
              >
                {guardando ? 'Guardando...' : 'Crear insumo'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormAbierto(false);
                  setNuevo(NUEVO_VACIO);
                  setError('');
                }}
                className="rounded-lg border border-borde-tarjeta px-4 py-2 text-sm font-medium text-texto-secundario hover:text-texto"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      {cargando || !insumos ? (
        <div className="flex flex-col gap-3">
          <CardSkeleton alto="h-16" />
          <CardSkeleton alto="h-16" />
        </div>
      ) : insumos.length === 0 ? (
        <SinDatos mensaje="Todavia no hay insumos registrados." />
      ) : (
        <div className="divide-y divide-borde-tarjeta rounded-[20px] border border-borde-tarjeta bg-white shadow-sm">
          {insumos.map((insumo) => (
            <div key={insumo.id} className="px-4 py-3">
              {editandoId === insumo.id ? (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className={campoLabel}>Nombre</label>
                      <input
                        value={edicion.nombre}
                        onChange={(e) => setEdicion({ ...edicion, nombre: e.target.value })}
                        className={campoInput}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className={campoLabel}>Unidad</label>
                      <input
                        value={edicion.unidad}
                        onChange={(e) => setEdicion({ ...edicion, unidad: e.target.value })}
                        className={campoInput}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className={campoLabel}>Stock minimo</label>
                      <input
                        type="number"
                        min="0"
                        value={edicion.stock_minimo}
                        onChange={(e) => setEdicion({ ...edicion, stock_minimo: e.target.value })}
                        className={campoInput}
                      />
                    </div>
                  </div>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleGuardarEdicion(insumo.id)}
                      className="rounded-lg bg-dorado px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditandoId(null);
                        setError('');
                      }}
                      className="rounded-lg border border-borde-tarjeta px-3 py-1.5 text-xs font-medium text-texto-secundario"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => iniciarEdicion(insumo)}
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate text-sm font-medium text-texto">
                      {insumo.nombre}
                      {insumo.alerta && (
                        <span
                          title="Stock por debajo del minimo"
                          className="flex items-center gap-1 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-rojo"
                        >
                          <IconAlerta width={12} height={12} />
                          Bajo stock
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-texto-secundario">
                      {insumo.stock_actual} {insumo.unidad} disponibles · minimo {insumo.stock_minimo}{' '}
                      {insumo.unidad}
                    </p>
                  </div>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
