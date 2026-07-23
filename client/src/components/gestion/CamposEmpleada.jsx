const campoLabel = 'text-sm font-medium text-texto-secundario';
const campoInput =
  'rounded-xl border border-borde-tarjeta bg-white px-3 py-2 text-sm text-texto outline-none focus:border-dorado focus:ring-2 focus:ring-dorado/20';

export default function CamposEmpleada({ valores, onChange, sedes, incluirPassword }) {
  function set(campo, valor) {
    onChange({ ...valores, [campo]: valor });
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2 flex flex-col gap-1">
        <label className={campoLabel}>Nombre</label>
        <input value={valores.nombre} onChange={(e) => set('nombre', e.target.value)} className={campoInput} />
      </div>

      <div className="col-span-2 flex flex-col gap-1">
        <label className={campoLabel}>Correo</label>
        <input
          type="email"
          value={valores.email_recuperacion}
          onChange={(e) => set('email_recuperacion', e.target.value)}
          className={campoInput}
        />
      </div>

      {incluirPassword && (
        <div className="col-span-2 flex flex-col gap-1">
          <label className={campoLabel}>Contrasena inicial</label>
          <input
            type="password"
            value={valores.password}
            onChange={(e) => set('password', e.target.value)}
            className={campoInput}
            placeholder="Minimo 8 caracteres"
          />
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
    </div>
  );
}
