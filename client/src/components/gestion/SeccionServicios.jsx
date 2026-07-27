import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { IconMas } from '../Icons';
import CardSkeleton from '../dashboard/CardSkeleton';
import SinDatos from '../dashboard/SinDatos';
import { formatearMoneda } from '../../utils/formato';
import CamposServicio from './CamposServicio';

const NUEVO_VACIO = { nombre: '', categoria: '', precio: '' };

function agruparPorCategoria(servicios) {
  const grupos = [];
  let actual = null;
  for (const s of servicios) {
    if (!actual || actual.categoria !== s.categoria) {
      actual = { categoria: s.categoria, servicios: [] };
      grupos.push(actual);
    }
    actual.servicios.push(s);
  }
  return grupos;
}

function HistorialPrecios({ servicioId }) {
  const [historial, setHistorial] = useState(null);

  useEffect(() => {
    api.get(`/servicios/${servicioId}/historial`).then((data) => setHistorial(data.historial));
  }, [servicioId]);

  if (!historial) return <p className="text-xs text-texto-secundario">Cargando historial...</p>;
  if (historial.length === 0) return <p className="text-xs text-texto-secundario">Sin cambios de precio registrados.</p>;

  return (
    <ul className="flex flex-col gap-1.5">
      {historial.map((h) => (
        <li key={h.id} className="text-xs text-texto-secundario">
          {formatearMoneda(h.precio_anterior)} → {formatearMoneda(h.precio_nuevo)} · {h.usuario.nombre} ·{' '}
          {new Date(h.fecha_cambio).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
        </li>
      ))}
    </ul>
  );
}

export default function SeccionServicios() {
  const [servicios, setServicios] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [formAbierto, setFormAbierto] = useState(false);
  const [nuevo, setNuevo] = useState(NUEVO_VACIO);
  const [guardando, setGuardando] = useState(false);

  const [editandoId, setEditandoId] = useState(null);
  const [edicion, setEdicion] = useState(NUEVO_VACIO);
  const [historialVisibleId, setHistorialVisibleId] = useState(null);

  function cargar() {
    setCargando(true);
    api
      .get('/servicios?incluirInactivos=true')
      .then((data) => setServicios(data.servicios))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  async function handleCrear(e) {
    e.preventDefault();
    setError('');
    if (!nuevo.nombre || !nuevo.categoria || !nuevo.precio) {
      setError('Nombre, categoría y precio son requeridos');
      return;
    }

    setGuardando(true);
    try {
      await api.post('/servicios', { ...nuevo, precio: Number(nuevo.precio) });
      setNuevo(NUEVO_VACIO);
      setFormAbierto(false);
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  function iniciarEdicion(servicio) {
    setEditandoId(servicio.id);
    setHistorialVisibleId(null);
    setEdicion({ nombre: servicio.nombre, categoria: servicio.categoria, precio: String(servicio.precio) });
  }

  async function handleGuardarEdicion(id) {
    setError('');
    try {
      await api.put(`/servicios/${id}`, { ...edicion, precio: Number(edicion.precio) });
      setEditandoId(null);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleActivo(servicio) {
    setError('');
    try {
      await api.put(`/servicios/${servicio.id}`, { activo: !servicio.activo });
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  if (cargando || !servicios) {
    return (
      <div className="flex flex-col gap-3">
        <CardSkeleton alto="h-16" />
        <CardSkeleton alto="h-16" />
      </div>
    );
  }

  const grupos = agruparPorCategoria(servicios);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[20px] border border-borde-tarjeta bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-texto">Catalogo de servicios</h3>
          <button
            type="button"
            onClick={() => setFormAbierto((v) => !v)}
            className="flex items-center gap-1 rounded-lg bg-dorado px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
          >
            <IconMas width={14} height={14} />
            Nuevo servicio
          </button>
        </div>

        {formAbierto && (
          <form onSubmit={handleCrear} className="mt-4 flex flex-col gap-3 border-t border-borde-tarjeta pt-4">
            <CamposServicio valores={nuevo} onChange={setNuevo} />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={guardando}
                className="rounded-lg bg-dorado px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
              >
                {guardando ? 'Guardando...' : 'Crear servicio'}
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

      {servicios.length === 0 ? (
        <SinDatos mensaje="Todavia no hay servicios en el catalogo." />
      ) : (
        grupos.map((grupo) => (
          <div key={grupo.categoria}>
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-texto-secundario">
              {grupo.categoria}
            </p>
            <div className="divide-y divide-borde-tarjeta rounded-[20px] border border-borde-tarjeta bg-white shadow-sm">
              {grupo.servicios.map((servicio) => (
                <div key={servicio.id} className="px-4 py-3">
                  {editandoId === servicio.id ? (
                    <div className="flex flex-col gap-3">
                      <CamposServicio valores={edicion} onChange={setEdicion} />
                      {error && <p className="text-sm text-red-600">{error}</p>}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleGuardarEdicion(servicio.id)}
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
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => iniciarEdicion(servicio)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="flex items-center gap-1.5 truncate text-sm font-medium text-texto">
                          {servicio.nombre}
                          {!servicio.activo && (
                            <span className="rounded-full bg-crema px-1.5 py-0.5 text-[10px] font-medium text-texto-secundario">
                              Inactivo
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-texto-secundario">{formatearMoneda(servicio.precio)}</p>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setHistorialVisibleId(historialVisibleId === servicio.id ? null : servicio.id)
                        }
                        className="shrink-0 text-xs font-medium text-dorado hover:opacity-80"
                      >
                        Historial
                      </button>

                      <button
                        type="button"
                        onClick={() => handleActivo(servicio)}
                        className="shrink-0 text-xs font-medium text-texto-secundario hover:text-texto"
                      >
                        {servicio.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  )}

                  {historialVisibleId === servicio.id && editandoId !== servicio.id && (
                    <div className="mt-3 border-t border-borde-tarjeta pt-3">
                      <HistorialPrecios servicioId={servicio.id} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
