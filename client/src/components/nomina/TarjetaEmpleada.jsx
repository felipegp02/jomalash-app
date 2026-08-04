import { useState } from 'react';
import { formatearMoneda } from '../../utils/formato';
import FormularioPago from './FormularioPago';
import HistorialPagos from './HistorialPagos';

function Metrica({ etiqueta, valor }) {
  return (
    <div>
      <p className="text-xs text-texto-secundario">{etiqueta}</p>
      <p className="text-sm font-semibold text-texto">{valor}</p>
    </div>
  );
}

export default function TarjetaEmpleada({ empleada, onPagoRegistrado }) {
  const [formAbierto, setFormAbierto] = useState(false);
  const [refrescarHistorial, setRefrescarHistorial] = useState(0);

  function handlePagoGuardado() {
    setFormAbierto(false);
    onPagoRegistrado();
    setRefrescarHistorial((n) => n + 1);
  }

  const saldoNegativo = empleada.saldoPendiente < 0;

  return (
    <div className="rounded-[20px] border border-borde-tarjeta bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-texto">{empleada.nombre}</h3>
          <p className="text-xs text-texto-secundario">{empleada.sede}</p>
        </div>
        <button
          type="button"
          onClick={() => setFormAbierto((v) => !v)}
          className="rounded-lg bg-dorado px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
        >
          Registrar pago
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-borde-tarjeta pt-4 sm:grid-cols-5">
        <Metrica etiqueta="Dias trabajados" valor={empleada.diasTrabajados} />
        <Metrica etiqueta="Comision ganada" valor={formatearMoneda(empleada.comisionGanada)} />
        <Metrica etiqueta="Propinas" valor={formatearMoneda(empleada.propinaGanada)} />
        <Metrica etiqueta="Vales" valor={formatearMoneda(empleada.vales)} />
        <Metrica etiqueta="Liquidaciones" valor={formatearMoneda(empleada.liquidaciones)} />
      </div>

      <div className="mt-3 flex items-center justify-between rounded-xl bg-dorado-fondo px-3 py-2">
        <span className="text-sm font-medium text-texto">Saldo pendiente</span>
        <span className={`text-sm font-bold ${saldoNegativo ? 'text-rojo' : 'text-texto'}`}>
          {formatearMoneda(empleada.saldoPendiente)}
        </span>
      </div>

      {formAbierto && (
        <FormularioPago
          usuarioId={empleada.usuario_id}
          sedeId={empleada.sede_id}
          onGuardado={handlePagoGuardado}
          onCancelar={() => setFormAbierto(false)}
        />
      )}

      <div className="mt-4">
        <HistorialPagos usuarioId={empleada.usuario_id} refrescarTrigger={refrescarHistorial} />
      </div>
    </div>
  );
}
