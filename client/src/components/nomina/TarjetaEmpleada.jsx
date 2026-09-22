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

// Solo el número de día ("2026-09-16" -> "16"), para mostrar el rango del
// corte ("16 - 30") sin repetir mes/año, que ya se ve en el selector de mes.
function dia(fechaCivil) {
  return String(Number(fechaCivil.slice(8, 10)));
}

function EstadoCorte({ corte }) {
  if (corte.noIniciado) {
    return (
      <div className="mt-3 flex items-center justify-between rounded-xl bg-crema px-3 py-2">
        <span className="text-sm font-medium text-texto-secundario">Corte en curso</span>
        <span className="text-xs text-texto-secundario">Aún no comienza</span>
      </div>
    );
  }

  if (corte.saldoPendiente <= 0) {
    return (
      <div className="mt-3 flex items-center justify-between rounded-xl bg-verde/10 px-3 py-2">
        <span className="text-sm font-medium text-texto">Saldo del corte</span>
        <span className="text-sm font-bold text-verde">✓ Liquidado</span>
      </div>
    );
  }

  return (
    <div className="mt-3 flex items-center justify-between rounded-xl bg-dorado-fondo px-3 py-2">
      <span className="text-sm font-medium text-texto">Pendiente</span>
      <span className="text-sm font-bold text-texto">{formatearMoneda(corte.saldoPendiente)}</span>
    </div>
  );
}

function BloqueCorte({ titulo, corte }) {
  // corte puede faltar un instante durante un despliegue en curso (frontend
  // ya actualizado, backend todavia sirviendo la respuesta vieja): se avisa
  // en vez de romper el render de toda la pagina de Nomina.
  if (!corte) {
    return (
      <div className="rounded-xl border border-borde-tarjeta p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-texto-secundario">{titulo}</p>
        <p className="mt-2 text-sm text-texto-secundario">
          No se pudo cargar este corte. Recargá la página en un momento.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-borde-tarjeta p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-texto-secundario">
        {titulo} · {dia(corte.desde)} - {dia(corte.hasta)}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Metrica etiqueta="Dias trabajados" valor={corte.diasTrabajados} />
        <Metrica etiqueta="Comision ganada" valor={formatearMoneda(corte.comisionGanada)} />
        <Metrica etiqueta="Propinas" valor={formatearMoneda(corte.propinaGanada)} />
        <Metrica etiqueta="Vales" valor={formatearMoneda(corte.vales)} />
        <Metrica etiqueta="Liquidaciones" valor={formatearMoneda(corte.liquidaciones)} />
      </div>

      <EstadoCorte corte={corte} />
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

      <div className="mt-4 flex flex-col gap-3 border-t border-borde-tarjeta pt-4">
        <BloqueCorte titulo="Corte 1" corte={empleada.corte1} />
        <BloqueCorte titulo="Corte 2" corte={empleada.corte2} />
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
