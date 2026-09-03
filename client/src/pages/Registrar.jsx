import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import Toast from '../components/Toast';
import { etiquetaDia, formatearHora, formatearMoneda } from '../utils/formato';

const campoLabel = 'text-sm font-medium text-texto-secundario';
const campoInput =
  'rounded-xl border border-borde-tarjeta bg-white px-4 py-3 text-texto outline-none focus:border-dorado focus:ring-2 focus:ring-dorado/20';
const campoInputChico =
  'rounded-xl border border-borde-tarjeta bg-white px-3 py-2 text-sm text-texto outline-none focus:border-dorado focus:ring-2 focus:ring-dorado/20';

const METODOS_PAGO = [
  { valor: 'efectivo', etiqueta: 'Efectivo' },
  { valor: 'transferencia', etiqueta: 'Transferencia' },
  { valor: 'tarjeta', etiqueta: 'Tarjeta' },
];

function lineaVacia() {
  return {
    servicioId: '',
    empleadaId: '',
    total: '',
    propinaAbierta: false,
    propinaMonto: '',
    propinaMetodoPago: '',
  };
}

// RF-05 y siguientes: arranca con 1 sola linea (servicio/empleada/monto,
// igual que siempre). "Agregar otro servicio" permite sumar mas lineas para
// una misma visita (ej. Manicure + Pedicure + Pestañas, con empleadas
// distintas si hace falta), y el pago total se puede repartir libremente
// entre metodos sin atarlo a una linea especifica. Con 1 sola linea y 1 solo
// metodo (el caso de siempre) el resultado es identico al de antes: una
// venta suelta, sin ningun Cobro de por medio (ver server/controllers/cobros.controller.js).
export default function Registrar({ onVentaGuardada }) {
  const { usuario } = useAuth();
  const esAdmin = usuario.rol === 'admin';

  const [servicios, setServicios] = useState([]);
  const [empleadas, setEmpleadas] = useState([]);
  const [lineas, setLineas] = useState([lineaVacia()]);
  const [fecha, setFecha] = useState('');

  const [metodoPago, setMetodoPago] = useState('');
  const [pagoDivididoAbierto, setPagoDivididoAbierto] = useState(false);
  const [montosPorMetodo, setMontosPorMetodo] = useState({ efectivo: '', transferencia: '', tarjeta: '' });

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [resumen, setResumen] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimeout = useRef(null);

  useEffect(() => {
    api.get('/servicios').then((data) => setServicios(data.servicios));
    if (esAdmin) {
      api.get('/usuarios?rol=empleada').then((data) => setEmpleadas(data.usuarios));
    }
  }, [esAdmin]);

  useEffect(() => () => clearTimeout(toastTimeout.current), []);

  const totalGeneral = lineas.reduce((suma, l) => suma + (Number(l.total) || 0), 0);

  function actualizarLinea(index, cambios) {
    setLineas((prev) => prev.map((l, i) => (i === index ? { ...l, ...cambios } : l)));
  }

  function handleServicioChange(index, id) {
    const servicio = servicios.find((s) => String(s.id) === id);
    // RF-05: el total se autocompleta desde el catalogo, pero queda editable.
    actualizarLinea(index, { servicioId: id, total: servicio ? String(servicio.precio) : '' });
  }

  function agregarLinea() {
    setLineas((prev) => [...prev, lineaVacia()]);
  }

  function quitarLinea(index) {
    setLineas((prev) => prev.filter((_, i) => i !== index));
  }

  function mostrarToast() {
    setToastVisible(true);
    clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToastVisible(false), 3000);
  }

  function resetForm() {
    setLineas([lineaVacia()]);
    setFecha('');
    setMetodoPago('');
    setPagoDivididoAbierto(false);
    setMontosPorMetodo({ efectivo: '', transferencia: '', tarjeta: '' });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setResumen(null);

    for (const l of lineas) {
      if (!l.servicioId) {
        setError('Selecciona un servicio en cada linea');
        return;
      }
      if (esAdmin && !l.empleadaId) {
        setError('Selecciona una empleada en cada linea');
        return;
      }
      if (l.propinaMonto && !l.propinaMetodoPago) {
        setError('Selecciona el metodo de pago de la propina');
        return;
      }
    }

    let pagos;
    if (pagoDivididoAbierto) {
      pagos = METODOS_PAGO.filter((m) => Number(montosPorMetodo[m.valor]) > 0).map((m) => ({
        metodo_pago: m.valor,
        monto: Number(montosPorMetodo[m.valor]),
      }));
      if (pagos.length === 0) {
        setError('Ingresa al menos un monto de pago');
        return;
      }
      const sumaPagos = pagos.reduce((suma, p) => suma + p.monto, 0);
      if (sumaPagos !== totalGeneral) {
        setError(`La suma de los pagos (${formatearMoneda(sumaPagos)}) debe coincidir con el total (${formatearMoneda(totalGeneral)})`);
        return;
      }
    } else {
      if (!metodoPago) {
        setError('Selecciona un metodo de pago');
        return;
      }
      pagos = [{ metodo_pago: metodoPago, monto: totalGeneral }];
    }

    setEnviando(true);
    try {
      const body = {
        lineas: lineas.map((l) => {
          const linea = {
            servicio_id: Number(l.servicioId),
            precio_total: l.total === '' ? undefined : Number(l.total),
          };
          if (esAdmin) linea.usuario_id = Number(l.empleadaId);
          if (l.propinaMonto) {
            linea.propina = Number(l.propinaMonto);
            linea.propina_metodo_pago = l.propinaMetodoPago;
          }
          return linea;
        }),
        pagos,
      };
      // Fecha retroactiva: solo Admin la ve. Vacio = hoy, mismo comportamiento de siempre.
      if (esAdmin && fecha) body.fecha = fecha;

      const data = await api.post('/cobros', body);

      // RF-07: resumen de confirmacion, una linea por servicio.
      setResumen({
        lineas: data.ventas.map((v) => ({
          servicio: v.servicio.nombre,
          empleada: v.usuario.nombre,
          total: v.precio_total,
          propina: v.propina,
          propinaMetodoPago: v.propina_metodo_pago,
        })),
        total: totalGeneral,
        pagos,
        fecha: data.ventas[0].fecha,
      });
      mostrarToast();
      onVentaGuardada?.();
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-[20px] border border-borde-tarjeta bg-white p-6 shadow-sm"
      >
        {lineas.map((linea, index) => (
          <div
            key={index}
            className={lineas.length > 1 ? 'flex flex-col gap-3 rounded-xl border border-borde-tarjeta p-3' : 'flex flex-col gap-3'}
          >
            {lineas.length > 1 && (
              <div className="flex items-center justify-between">
                <span className={campoLabel}>Servicio {index + 1}</span>
                <button
                  type="button"
                  onClick={() => quitarLinea(index)}
                  className="text-xs font-medium text-texto-secundario hover:text-texto"
                >
                  Quitar
                </button>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className={campoLabel}>Servicio</label>
              <select
                value={linea.servicioId}
                onChange={(e) => handleServicioChange(index, e.target.value)}
                className={campoInput}
              >
                <option value="">Selecciona un servicio</option>
                {servicios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} - {formatearMoneda(s.precio)}
                  </option>
                ))}
              </select>
            </div>

            {esAdmin && (
              <div className="flex flex-col gap-1.5">
                <label className={campoLabel}>Empleada</label>
                <select
                  value={linea.empleadaId}
                  onChange={(e) => actualizarLinea(index, { empleadaId: e.target.value })}
                  className={campoInput}
                >
                  <option value="">Selecciona una empleada</option>
                  {empleadas.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className={campoLabel}>Total</label>
              <input
                type="number"
                min="1"
                step="1"
                value={linea.total}
                onChange={(e) => actualizarLinea(index, { total: e.target.value })}
                placeholder="Se autocompleta con el precio del servicio"
                className={campoInput}
              />
            </div>

            {linea.propinaAbierta ? (
              <div className="flex flex-col gap-2 rounded-xl border border-borde-tarjeta p-3">
                <div className="flex items-center justify-between">
                  <span className={campoLabel}>Propina (100% para la empleada)</span>
                  <button
                    type="button"
                    onClick={() => actualizarLinea(index, { propinaAbierta: false, propinaMonto: '', propinaMetodoPago: '' })}
                    className="text-xs font-medium text-texto-secundario hover:text-texto"
                  >
                    Quitar
                  </button>
                </div>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={linea.propinaMonto}
                  onChange={(e) => actualizarLinea(index, { propinaMonto: e.target.value })}
                  placeholder="Monto de la propina"
                  className={campoInputChico}
                />
                <div className="grid grid-cols-3 gap-2">
                  {METODOS_PAGO.map((m) => (
                    <button
                      key={m.valor}
                      type="button"
                      onClick={() => actualizarLinea(index, { propinaMetodoPago: m.valor })}
                      className={`rounded-xl border px-2 py-2 text-xs font-medium transition-colors ${
                        linea.propinaMetodoPago === m.valor
                          ? 'border-dorado bg-dorado-fondo text-texto'
                          : 'border-borde-tarjeta bg-white text-texto-secundario hover:text-texto'
                      }`}
                    >
                      {m.etiqueta}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => actualizarLinea(index, { propinaAbierta: true })}
                className="w-fit text-sm font-medium text-dorado hover:opacity-80"
              >
                + Agregar propina
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={agregarLinea}
          className="w-fit text-sm font-medium text-dorado hover:opacity-80"
        >
          + Agregar otro servicio
        </button>

        {esAdmin && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fecha" className={campoLabel}>
              Fecha (dejar vacio para hoy)
            </label>
            <input
              id="fecha"
              type="date"
              value={fecha}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setFecha(e.target.value)}
              className={campoInput}
            />
          </div>
        )}

        <div className="flex items-center justify-between border-t border-borde-tarjeta pt-3">
          <span className="text-sm font-medium text-texto-secundario">Total a pagar</span>
          <span className="text-lg font-semibold text-texto">{formatearMoneda(totalGeneral)}</span>
        </div>

        {pagoDivididoAbierto ? (
          <div className="flex flex-col gap-3 rounded-xl border border-borde-tarjeta p-3">
            <div className="flex items-center justify-between">
              <span className={campoLabel}>Pago dividido</span>
              <button
                type="button"
                onClick={() => {
                  setPagoDivididoAbierto(false);
                  setMontosPorMetodo({ efectivo: '', transferencia: '', tarjeta: '' });
                }}
                className="text-xs font-medium text-texto-secundario hover:text-texto"
              >
                Usar un solo metodo
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {METODOS_PAGO.map((m) => (
                <div key={m.valor} className="flex flex-col gap-1">
                  <label className="text-xs text-texto-secundario">{m.etiqueta}</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={montosPorMetodo[m.valor]}
                    onChange={(e) => setMontosPorMetodo((v) => ({ ...v, [m.valor]: e.target.value }))}
                    className={campoInputChico}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <span className={campoLabel}>Metodo de pago</span>
            <div className="grid grid-cols-3 gap-2">
              {METODOS_PAGO.map((m) => (
                <button
                  key={m.valor}
                  type="button"
                  onClick={() => setMetodoPago(m.valor)}
                  className={`rounded-xl border px-2 py-2.5 text-sm font-medium transition-colors ${
                    metodoPago === m.valor
                      ? 'border-dorado bg-dorado-fondo text-texto'
                      : 'border-borde-tarjeta bg-white text-texto-secundario hover:text-texto'
                  }`}
                >
                  {m.etiqueta}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPagoDivididoAbierto(true)}
              className="w-fit text-sm font-medium text-dorado hover:opacity-80"
            >
              Dividir pago
            </button>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="mt-2 rounded-xl bg-dorado py-4 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {enviando ? 'Guardando...' : 'Registrar venta'}
        </button>
      </form>

      {resumen && (
        <div className="flex flex-col gap-1.5 rounded-[20px] border border-borde-tarjeta bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-texto">Venta registrada</h3>
          {resumen.lineas.map((l, i) => (
            <div key={i} className={resumen.lineas.length > 1 ? 'border-b border-borde-tarjeta pb-1.5' : ''}>
              <p className="font-medium text-texto">{l.servicio}</p>
              <p className="text-sm text-texto-secundario">
                {l.empleada} · {formatearMoneda(l.total)}
              </p>
              {l.propina > 0 && (
                <p className="text-xs text-texto-secundario">
                  Propina: {formatearMoneda(l.propina)} ({METODOS_PAGO.find((m) => m.valor === l.propinaMetodoPago)?.etiqueta})
                </p>
              )}
            </div>
          ))}
          <p className="text-sm text-texto-secundario">Total: {formatearMoneda(resumen.total)}</p>
          {resumen.pagos.map((p) => (
            <p key={p.metodo_pago} className="text-sm text-texto-secundario">
              Pago: {METODOS_PAGO.find((m) => m.valor === p.metodo_pago)?.etiqueta} {formatearMoneda(p.monto)}
            </p>
          ))}
          <p className="text-sm text-texto-secundario">
            {etiquetaDia(resumen.fecha)} · {formatearHora(resumen.fecha)}
          </p>
        </div>
      )}

      <Toast mensaje="Venta registrada" visible={toastVisible} />
    </div>
  );
}
