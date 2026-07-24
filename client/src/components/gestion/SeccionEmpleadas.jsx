import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { IconMas } from '../Icons';
import CardSkeleton from '../dashboard/CardSkeleton';
import SinDatos from '../dashboard/SinDatos';
import CamposEmpleada from './CamposEmpleada';

const PERMISOS_VACIO = {
  ve_insumos: false,
  ve_nomina: false,
  ve_caja: false,
  ve_dashboard_completo: false,
  gestiona_catalogo: false,
  gestiona_empleadas: false,
};

const NUEVO_VACIO = {
  nombre: '',
  email_recuperacion: '',
  password: '',
  sede_id: '',
  porcentaje_comision: '',
  ...PERMISOS_VACIO,
};

export default function SeccionEmpleadas() {
  const [empleadas, setEmpleadas] = useState(null);
  const [sedes, setSedes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [formAbierto, setFormAbierto] = useState(false);
  const [nuevo, setNuevo] = useState(NUEVO_VACIO);
  const [guardando, setGuardando] = useState(false);

  const [editandoId, setEditandoId] = useState(null);
  const [edicion, setEdicion] = useState(NUEVO_VACIO);

  function cargar() {
    setCargando(true);
    api
      .get('/usuarios?rol=empleada&incluirInactivos=true')
      .then((data) => setEmpleadas(data.usuarios))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    api.get('/sedes').then((data) => setSedes(data.sedes));
    cargar();
  }, []);

  function nombreSede(id) {
    return sedes.find((s) => s.id === id)?.nombre || '';
  }

  async function handleCrear(e) {
    e.preventDefault();
    setError('');

    if (!nuevo.nombre || !nuevo.email_recuperacion || !nuevo.password || !nuevo.sede_id) {
      setError('Nombre, correo, contrasena y sede son requeridos');
      return;
    }

    setGuardando(true);
    try {
      await api.post('/usuarios', {
        nombre: nuevo.nombre,
        email_recuperacion: nuevo.email_recuperacion,
        password: nuevo.password,
        sede_id: Number(nuevo.sede_id),
        porcentaje_comision: Number(nuevo.porcentaje_comision || 0) / 100,
        ...Object.fromEntries(Object.keys(PERMISOS_VACIO).map((campo) => [campo, nuevo[campo]])),
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

  function iniciarEdicion(empleada) {
    setEditandoId(empleada.id);
    setEdicion({
      nombre: empleada.nombre,
      email_recuperacion: empleada.email_recuperacion,
      password: '',
      sede_id: String(empleada.sede_id),
      porcentaje_comision: String(Math.round(empleada.porcentaje_comision * 100)),
      ...Object.fromEntries(Object.keys(PERMISOS_VACIO).map((campo) => [campo, Boolean(empleada[campo])])),
    });
  }

  async function handleGuardarEdicion(id) {
    setError('');
    try {
      await api.put(`/usuarios/${id}`, {
        nombre: edicion.nombre,
        email_recuperacion: edicion.email_recuperacion,
        sede_id: Number(edicion.sede_id),
        porcentaje_comision: Number(edicion.porcentaje_comision || 0) / 100,
        ...Object.fromEntries(Object.keys(PERMISOS_VACIO).map((campo) => [campo, edicion[campo]])),
      });
      setEditandoId(null);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleActivo(empleada) {
    setError('');
    try {
      await api.put(`/usuarios/${empleada.id}`, { activo: !empleada.activo });
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  if (cargando || !empleadas) {
    return (
      <div className="flex flex-col gap-3">
        <CardSkeleton alto="h-16" />
        <CardSkeleton alto="h-16" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[20px] border border-borde-tarjeta bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-texto">Empleadas</h3>
          <button
            type="button"
            onClick={() => setFormAbierto((v) => !v)}
            className="flex items-center gap-1 rounded-lg bg-dorado px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
          >
            <IconMas width={14} height={14} />
            Nueva empleada
          </button>
        </div>

        {formAbierto && (
          <form onSubmit={handleCrear} className="mt-4 flex flex-col gap-3 border-t border-borde-tarjeta pt-4">
            <CamposEmpleada valores={nuevo} onChange={setNuevo} sedes={sedes} incluirPassword />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={guardando}
                className="rounded-lg bg-dorado px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
              >
                {guardando ? 'Guardando...' : 'Crear empleada'}
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

      {empleadas.length === 0 ? (
        <SinDatos mensaje="Todavia no hay empleadas registradas." />
      ) : (
        <div className="divide-y divide-borde-tarjeta rounded-[20px] border border-borde-tarjeta bg-white shadow-sm">
          {empleadas.map((empleada) => (
            <div key={empleada.id} className="px-4 py-3">
              {editandoId === empleada.id ? (
                <div className="flex flex-col gap-3">
                  <CamposEmpleada valores={edicion} onChange={setEdicion} sedes={sedes} />
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleGuardarEdicion(empleada.id)}
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
                  <button type="button" onClick={() => iniciarEdicion(empleada)} className="min-w-0 flex-1 text-left">
                    <p className="flex items-center gap-1.5 truncate text-sm font-medium text-texto">
                      {empleada.nombre}
                      {!empleada.activo && (
                        <span className="rounded-full bg-crema px-1.5 py-0.5 text-[10px] font-medium text-texto-secundario">
                          Inactiva
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-texto-secundario">
                      {nombreSede(empleada.sede_id)} · {Math.round(empleada.porcentaje_comision * 100)}% comision
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleActivo(empleada)}
                    className="shrink-0 text-xs font-medium text-texto-secundario hover:text-texto"
                  >
                    {empleada.activo ? 'Dar de baja' : 'Activar'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
