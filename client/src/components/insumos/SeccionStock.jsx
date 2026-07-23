import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { IconAlerta, IconMas } from '../Icons';
import CardSkeleton from '../dashboard/CardSkeleton';
import SinDatos from '../dashboard/SinDatos';
import CamposInsumo from './CamposInsumo';
import AjusteInventario from './AjusteInventario';

const NUEVO_VACIO = {
  nombre: '',
  tipo: 'consumible',
  tipo_medida: '',
  unidad_compra: '',
  contenido_por_compra: '',
  stock_actual: '',
  stock_minimo: '',
};

// "255 ml disponibles (≈ 1 frasco)": solo aplica a consumibles. Division
// entera para saber cuantas unidades de compra completas hay; si sobra
// resto, es un numero aproximado (≈), no exacto.
function equivalenteEnUnidadCompra(insumo) {
  if (insumo.tipo !== 'consumible' || !insumo.contenido_por_compra || insumo.contenido_por_compra <= 1) {
    return null;
  }

  const cantidad = Math.floor(insumo.stock_actual / insumo.contenido_por_compra);
  const exacto = insumo.stock_actual % insumo.contenido_por_compra === 0;
  const unidad = cantidad === 1 ? insumo.unidad_compra : `${insumo.unidad_compra}s`;

  return `${exacto ? '' : '≈ '}${cantidad} ${unidad}`;
}

function FilaInsumo({ insumo, editando, edicion, onEdicionChange, onIniciarEdicion, onGuardar, onCancelar, error }) {
  if (editando) {
    return (
      <div className="px-4 py-3">
        <div className="flex flex-col gap-3">
          <CamposInsumo valores={edicion} onChange={onEdicionChange} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onGuardar}
              className="rounded-lg bg-dorado px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={onCancelar}
              className="rounded-lg border border-borde-tarjeta px-3 py-1.5 text-xs font-medium text-texto-secundario"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const equivalente = equivalenteEnUnidadCompra(insumo);

  return (
    <div className="px-4 py-3">
      <button
        type="button"
        onClick={() => onIniciarEdicion(insumo)}
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
          {insumo.tipo === 'consumible' ? (
            <p className="text-xs text-texto-secundario">
              {insumo.stock_actual} {insumo.tipo_medida} disponibles{equivalente && ` (${equivalente})`} · minimo{' '}
              {insumo.stock_minimo} {insumo.tipo_medida}
            </p>
          ) : (
            <p className="text-xs text-texto-secundario">
              {insumo.stock_actual} unidades disponibles · minimo {insumo.stock_minimo} unidades
            </p>
          )}
        </div>
      </button>
    </div>
  );
}

export default function SeccionStock() {
  const [insumos, setInsumos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [formAbierto, setFormAbierto] = useState(false);
  const [nuevo, setNuevo] = useState(NUEVO_VACIO);
  const [guardando, setGuardando] = useState(false);

  const [editandoId, setEditandoId] = useState(null);
  const [edicion, setEdicion] = useState(NUEVO_VACIO);

  const [modoInventario, setModoInventario] = useState(false);

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

    if (!nuevo.nombre || !nuevo.unidad_compra) {
      setError('Nombre y unidad de compra son requeridos');
      return;
    }
    if (nuevo.tipo === 'consumible' && !nuevo.tipo_medida) {
      setError('Selecciona un tipo de medida para el consumible');
      return;
    }

    setGuardando(true);
    try {
      await api.post('/insumos', {
        nombre: nuevo.nombre,
        tipo: nuevo.tipo,
        tipo_medida: nuevo.tipo === 'consumible' ? nuevo.tipo_medida : undefined,
        unidad_compra: nuevo.unidad_compra,
        contenido_por_compra: nuevo.tipo === 'consumible' ? nuevo.contenido_por_compra || 1 : undefined,
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
    setEdicion({
      nombre: insumo.nombre,
      tipo: insumo.tipo,
      tipo_medida: insumo.tipo_medida || '',
      unidad_compra: insumo.unidad_compra,
      contenido_por_compra: String(insumo.contenido_por_compra),
      stock_minimo: String(insumo.stock_minimo),
    });
  }

  async function handleGuardarEdicion() {
    setError('');
    if (edicion.tipo === 'consumible' && !edicion.tipo_medida) {
      setError('Selecciona un tipo de medida para el consumible');
      return;
    }

    try {
      await api.put(`/insumos/${editandoId}`, {
        nombre: edicion.nombre,
        tipo: edicion.tipo,
        tipo_medida: edicion.tipo === 'consumible' ? edicion.tipo_medida : undefined,
        unidad_compra: edicion.unidad_compra,
        contenido_por_compra: edicion.tipo === 'consumible' ? Number(edicion.contenido_por_compra || 1) : undefined,
        stock_minimo: Number(edicion.stock_minimo),
      });
      setEditandoId(null);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  if (modoInventario && insumos) {
    return (
      <AjusteInventario
        insumos={insumos}
        onCerrar={() => setModoInventario(false)}
        onGuardado={() => {
          setModoInventario(false);
          cargar();
        }}
      />
    );
  }

  const consumibles = insumos?.filter((i) => i.tipo === 'consumible') || [];
  const herramientas = insumos?.filter((i) => i.tipo === 'herramienta') || [];

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[20px] border border-borde-tarjeta bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-texto">Insumos y stock</h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setModoInventario(true)}
              className="rounded-lg border border-borde-tarjeta px-3 py-1.5 text-xs font-medium text-texto hover:bg-crema"
            >
              Inventario inicial
            </button>
            <button
              type="button"
              onClick={() => setFormAbierto((v) => !v)}
              className="flex items-center gap-1 rounded-lg bg-dorado px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            >
              <IconMas width={14} height={14} />
              Nuevo insumo
            </button>
          </div>
        </div>

        {formAbierto && (
          <form onSubmit={handleCrear} className="mt-4 flex flex-col gap-3 border-t border-borde-tarjeta pt-4">
            <CamposInsumo valores={nuevo} onChange={setNuevo} incluirStockInicial />

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
      ) : (
        <>
          <div>
            <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-texto-secundario">
              Consumibles
            </h3>
            {consumibles.length === 0 ? (
              <SinDatos mensaje="Todavia no hay consumibles registrados." />
            ) : (
              <div className="divide-y divide-borde-tarjeta rounded-[20px] border border-borde-tarjeta bg-white shadow-sm">
                {consumibles.map((insumo) => (
                  <FilaInsumo
                    key={insumo.id}
                    insumo={insumo}
                    editando={editandoId === insumo.id}
                    edicion={edicion}
                    onEdicionChange={setEdicion}
                    onIniciarEdicion={iniciarEdicion}
                    onGuardar={handleGuardarEdicion}
                    onCancelar={() => {
                      setEditandoId(null);
                      setError('');
                    }}
                    error={editandoId === insumo.id ? error : ''}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-texto-secundario">
              Herramientas
            </h3>
            {herramientas.length === 0 ? (
              <SinDatos mensaje="Todavia no hay herramientas registradas." />
            ) : (
              <div className="divide-y divide-borde-tarjeta rounded-[20px] border border-borde-tarjeta bg-white shadow-sm">
                {herramientas.map((insumo) => (
                  <FilaInsumo
                    key={insumo.id}
                    insumo={insumo}
                    editando={editandoId === insumo.id}
                    edicion={edicion}
                    onEdicionChange={setEdicion}
                    onIniciarEdicion={iniciarEdicion}
                    onGuardar={handleGuardarEdicion}
                    onCancelar={() => {
                      setEditandoId(null);
                      setError('');
                    }}
                    error={editandoId === insumo.id ? error : ''}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
