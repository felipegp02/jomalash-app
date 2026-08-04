import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import Toast from '../components/Toast';
import { etiquetaDia, formatearHora, formatearMoneda } from '../utils/formato';

const campoLabel = 'text-sm font-medium text-texto-secundario';
const campoInput =
  'rounded-xl border border-borde-tarjeta bg-white px-4 py-3 text-texto outline-none focus:border-dorado focus:ring-2 focus:ring-dorado/20';

const METODOS_PAGO = [
  { valor: 'efectivo', etiqueta: 'Efectivo' },
  { valor: 'transferencia', etiqueta: 'Transferencia' },
  { valor: 'tarjeta', etiqueta: 'Tarjeta' },
];

export default function Registrar({ onVentaGuardada }) {
  const { usuario } = useAuth();
  const esAdmin = usuario.rol === 'admin';

  const [servicios, setServicios] = useState([]);
  const [empleadas, setEmpleadas] = useState([]);
  const [servicioId, setServicioId] = useState('');
  const [empleadaId, setEmpleadaId] = useState('');
  const [total, setTotal] = useState('');
  const [metodoPago, setMetodoPago] = useState('');
  const [fecha, setFecha] = useState('');
  const [propinaAbierta, setPropinaAbierta] = useState(false);
  const [propinaMonto, setPropinaMonto] = useState('');
  const [propinaMetodoPago, setPropinaMetodoPago] = useState('');
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

  function handleServicioChange(id) {
    setServicioId(id);
    const servicio = servicios.find((s) => String(s.id) === id);
    // RF-05: el total se autocompleta desde el catalogo, pero queda editable.
    setTotal(servicio ? String(servicio.precio) : '');
  }

  function mostrarToast() {
    setToastVisible(true);
    clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToastVisible(false), 3000);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setResumen(null);

    if (!servicioId) {
      setError('Selecciona un servicio');
      return;
    }
    if (esAdmin && !empleadaId) {
      setError('Selecciona una empleada');
      return;
    }
    if (!metodoPago) {
      setError('Selecciona un metodo de pago');
      return;
    }
    if (propinaMonto && !propinaMetodoPago) {
      setError('Selecciona el metodo de pago de la propina');
      return;
    }

    setEnviando(true);
    try {
      const body = {
        servicio_id: Number(servicioId),
        precio_total: total === '' ? undefined : Number(total),
        metodo_pago: metodoPago,
      };
      if (esAdmin) {
        body.usuario_id = Number(empleadaId);
        // Fecha retroactiva: solo Admin la ve (ver Registrar.jsx mas abajo).
        // Vacio = hoy, mismo comportamiento que siempre.
        if (fecha) body.fecha = fecha;
      }
      if (propinaMonto) {
        body.propina = Number(propinaMonto);
        body.propina_metodo_pago = propinaMetodoPago;
      }

      const data = await api.post('/ventas', body);

      // RF-07: resumen de confirmacion al guardar la venta.
      setResumen({
        servicio: data.venta.servicio.nombre,
        empleada: data.venta.usuario.nombre,
        total: data.venta.precio_total,
        fecha: data.venta.fecha,
        metodoPago: data.venta.metodo_pago,
        propina: data.venta.propina,
        propinaMetodoPago: data.venta.propina_metodo_pago,
      });
      mostrarToast();
      onVentaGuardada?.();

      setServicioId('');
      setEmpleadaId('');
      setTotal('');
      setMetodoPago('');
      setFecha('');
      setPropinaAbierta(false);
      setPropinaMonto('');
      setPropinaMetodoPago('');
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
        <div className="flex flex-col gap-1.5">
          <label htmlFor="servicio" className={campoLabel}>
            Servicio
          </label>
          <select
            id="servicio"
            value={servicioId}
            onChange={(e) => handleServicioChange(e.target.value)}
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
            <label htmlFor="empleada" className={campoLabel}>
              Empleada
            </label>
            <select
              id="empleada"
              value={empleadaId}
              onChange={(e) => setEmpleadaId(e.target.value)}
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

        <div className="flex flex-col gap-1.5">
          <label htmlFor="total" className={campoLabel}>
            Total
          </label>
          <input
            id="total"
            type="number"
            min="1"
            step="1"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            placeholder="Se autocompleta con el precio del servicio"
            className={campoInput}
          />
        </div>

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
        </div>

        {propinaAbierta ? (
          <div className="flex flex-col gap-3 rounded-xl border border-borde-tarjeta p-3">
            <div className="flex items-center justify-between">
              <span className={campoLabel}>Propina (100% para la empleada)</span>
              <button
                type="button"
                onClick={() => {
                  setPropinaAbierta(false);
                  setPropinaMonto('');
                  setPropinaMetodoPago('');
                }}
                className="text-xs font-medium text-texto-secundario hover:text-texto"
              >
                Quitar
              </button>
            </div>
            <input
              type="number"
              min="1"
              step="1"
              value={propinaMonto}
              onChange={(e) => setPropinaMonto(e.target.value)}
              placeholder="Monto de la propina"
              className={campoInput}
            />
            <div className="grid grid-cols-3 gap-2">
              {METODOS_PAGO.map((m) => (
                <button
                  key={m.valor}
                  type="button"
                  onClick={() => setPropinaMetodoPago(m.valor)}
                  className={`rounded-xl border px-2 py-2 text-xs font-medium transition-colors ${
                    propinaMetodoPago === m.valor
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
            onClick={() => setPropinaAbierta(true)}
            className="w-fit text-sm font-medium text-dorado hover:opacity-80"
          >
            + Agregar propina
          </button>
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
          <p className="font-medium text-texto">{resumen.servicio}</p>
          <p className="text-sm text-texto-secundario">Empleada: {resumen.empleada}</p>
          <p className="text-sm text-texto-secundario">Total: {formatearMoneda(resumen.total)}</p>
          <p className="text-sm text-texto-secundario">
            Pago: {METODOS_PAGO.find((m) => m.valor === resumen.metodoPago)?.etiqueta}
          </p>
          {resumen.propina > 0 && (
            <p className="text-sm text-texto-secundario">
              Propina: {formatearMoneda(resumen.propina)} (
              {METODOS_PAGO.find((m) => m.valor === resumen.propinaMetodoPago)?.etiqueta})
            </p>
          )}
          <p className="text-sm text-texto-secundario">
            {etiquetaDia(resumen.fecha)} · {formatearHora(resumen.fecha)}
          </p>
        </div>
      )}

      <Toast mensaje="Venta registrada" visible={toastVisible} />
    </div>
  );
}
