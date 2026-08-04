const campoLabel = 'text-sm font-medium text-texto-secundario';
const campoInput =
  'rounded-xl border border-borde-tarjeta bg-white px-3 py-2 text-sm text-texto outline-none focus:border-dorado focus:ring-2 focus:ring-dorado/20';

// Permisos finos, más allá de admin/empleada (ver AUTH.md o
// server/prisma/schema.prisma -> Usuario para el detalle de cada uno).
const PERMISOS = [
  { campo: 've_insumos', etiqueta: 'Ver Insumos' },
  { campo: 've_nomina', etiqueta: 'Ver Nómina' },
  { campo: 've_caja', etiqueta: 'Ver Caja' },
  { campo: 've_dashboard_completo', etiqueta: 'Ver Resumen general completo' },
  { campo: 'gestiona_catalogo', etiqueta: 'Gestionar catálogo (Servicios)' },
  { campo: 'gestiona_empleadas', etiqueta: 'Gestionar empleadas' },
];

// Una empleada no tiene login propio: al crear no se pide correo ni
// contraseña (el backend los genera solos). Al editar, el correo generado
// se muestra de solo lectura -- es un identificador interno, no algo que
// el admin deba escribir o corregir a mano.
export default function CamposEmpleada({ valores, onChange, sedes, esNueva }) {
  function set(campo, valor) {
    onChange({ ...valores, [campo]: valor });
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2 flex flex-col gap-1">
        <label className={campoLabel}>Nombre</label>
        <input value={valores.nombre} onChange={(e) => set('nombre', e.target.value)} className={campoInput} />
      </div>

      {!esNueva && (
        <div className="col-span-2 flex flex-col gap-1">
          <label className={campoLabel}>Correo (interno, de solo lectura)</label>
          <input type="email" value={valores.email_recuperacion} disabled className={`${campoInput} bg-crema text-texto-secundario`} />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className={campoLabel}>Sede</label>
        <select value={valores.sede_id} onChange={(e) => set('sede_id', e.target.value)} className={campoInput}>
          <option value="">Selecciona</option>
          {sedes.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className={campoLabel}>% Comision</label>
        <input
          type="number"
          min="0"
          max="100"
          value={valores.porcentaje_comision}
          onChange={(e) => set('porcentaje_comision', e.target.value)}
          className={campoInput}
          placeholder="Ej. 55"
        />
      </div>

      <div className="col-span-2 flex flex-col gap-2">
        <label className={campoLabel}>Permisos</label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PERMISOS.map((p) => (
            <label key={p.campo} className="flex items-center gap-2 text-sm text-texto">
              <input
                type="checkbox"
                checked={Boolean(valores[p.campo])}
                onChange={(e) => set(p.campo, e.target.checked)}
                className="h-4 w-4 rounded border-borde-tarjeta accent-dorado"
              />
              {p.etiqueta}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
