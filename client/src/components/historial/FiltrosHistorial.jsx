const campoClase =
  'rounded-xl border border-borde-tarjeta bg-white px-3 py-2 text-sm text-texto outline-none focus:border-dorado focus:ring-2 focus:ring-dorado/20';

export default function FiltrosHistorial({ usuario, sedes, servicios, empleadas, filtros, onChange }) {
  const esAdmin = usuario.rol === 'admin';

  function actualizar(campo, valor) {
    onChange({ ...filtros, [campo]: valor });
  }

  return (
    <div className="flex flex-col gap-3 rounded-[20px] border border-borde-tarjeta bg-white p-4 shadow-sm md:flex-row md:flex-wrap md:items-center">
      {esAdmin && (
        <select
          value={filtros.sedeId}
          onChange={(e) => actualizar('sedeId', e.target.value)}
          className={campoClase}
        >
          <option value="">Todas las sedes</option>
          {sedes.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </select>
      )}

      {esAdmin && (
        <select
          value={filtros.usuarioId}
          onChange={(e) => actualizar('usuarioId', e.target.value)}
          className={campoClase}
        >
          <option value="">Todas las empleadas</option>
          {empleadas.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nombre}
            </option>
          ))}
        </select>
      )}

      <select
        value={filtros.servicioId}
        onChange={(e) => actualizar('servicioId', e.target.value)}
        className={campoClase}
      >
        <option value="">Todos los servicios</option>
        {servicios.map((s) => (
          <option key={s.id} value={s.id}>
            {s.nombre}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-2">
        <input
          type="date"
          value={filtros.fechaDesde}
          onChange={(e) => actualizar('fechaDesde', e.target.value)}
          className={campoClase}
        />
        <span className="text-sm text-texto-secundario">a</span>
        <input
          type="date"
          value={filtros.fechaHasta}
          onChange={(e) => actualizar('fechaHasta', e.target.value)}
          className={campoClase}
        />
      </div>
    </div>
  );
}
