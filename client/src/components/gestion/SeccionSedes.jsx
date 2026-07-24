import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { IconMas } from '../Icons';
import CardSkeleton from '../dashboard/CardSkeleton';
import SinDatos from '../dashboard/SinDatos';

const campoInput =
  'rounded-xl border border-borde-tarjeta bg-white px-3 py-2 text-sm text-texto outline-none focus:border-dorado focus:ring-2 focus:ring-dorado/20';

export default function SeccionSedes() {
  const [sedes, setSedes] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [formAbierto, setFormAbierto] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [guardando, setGuardando] = useState(false);

  const [editandoId, setEditandoId] = useState(null);
  const [nombreEdicion, setNombreEdicion] = useState('');

  function cargar() {
    setCargando(true);
    api
      .get('/sedes')
      .then((data) => setSedes(data.sedes))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  async function handleCrear(e) {
    e.preventDefault();
    setError('');
    if (!nombreNuevo.trim()) {
      setError('El nombre es requerido');
      return;
    }

    setGuardando(true);
    try {
      await api.post('/sedes', { nombre: nombreNuevo.trim() });
      setNombreNuevo('');
      setFormAbierto(false);
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  function iniciarEdicion(sede) {
    setEditandoId(sede.id);
    setNombreEdicion(sede.nombre);
  }

  async function handleGuardarEdicion(id) {
    setError('');
    try {
      await api.put(`/sedes/${id}`, { nombre: nombreEdicion.trim() });
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
          <h3 className="text-sm font-semibold text-texto">Sedes</h3>
          <button
            type="button"
            onClick={() => setFormAbierto((v) => !v)}
            className="flex items-center gap-1 rounded-lg bg-dorado px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
          >
            <IconMas width={14} height={14} />
            Nueva sede
          </button>
        </div>

        {formAbierto && (
          <form onSubmit={handleCrear} className="mt-4 flex flex-col gap-3 border-t border-borde-tarjeta pt-4">
            <input
              value={nombreNuevo}
              onChange={(e) => setNombreNuevo(e.target.value)}
              placeholder="Nombre de la sede"
              className={campoInput}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={guardando}
                className="rounded-lg bg-dorado px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
              >
                {guardando ? 'Guardando...' : 'Crear sede'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormAbierto(false);
                  setNombreNuevo('');
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

      {cargando || !sedes ? (
        <div className="flex flex-col gap-3">
          <CardSkeleton alto="h-16" />
        </div>
      ) : sedes.length === 0 ? (
        <SinDatos mensaje="Todavia no hay sedes registradas." />
      ) : (
        <div className="divide-y divide-borde-tarjeta rounded-[20px] border border-borde-tarjeta bg-white shadow-sm">
          {sedes.map((sede) => (
            <div key={sede.id} className="px-4 py-3">
              {editandoId === sede.id ? (
                <div className="flex flex-col gap-3">
                  <input
                    value={nombreEdicion}
                    onChange={(e) => setNombreEdicion(e.target.value)}
                    className={campoInput}
                  />
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleGuardarEdicion(sede.id)}
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
                  onClick={() => iniciarEdicion(sede)}
                  className="flex w-full items-center text-left text-sm font-medium text-texto"
                >
                  {sede.nombre}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
