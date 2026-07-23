const selectClase =
  'rounded-xl border border-borde-tarjeta bg-white px-3 py-2 text-sm text-texto outline-none focus:border-dorado focus:ring-2 focus:ring-dorado/20';

export default function FiltrosDashboard({ usuario, sedes, servicios, empleadas, filtros, onChange }) {
  const esAdmin = usuario.rol === 'admin';

  function actualizar(campo, valor) {
    onChange({ ...filtros, [campo]: valor });
  }

  return (
    <div className="flex flex-col gap-3 rounded-[20px] border border-borde-tarjeta bg-white p-4 shadow-sm md:flex-row md:flex-wrap md:items-center">
      <select
        value={filtros.periodo}
        onChange={(e) => actualizar('periodo', e.target.value)}
        className={selectClase}
      >
        <option value="hoy">Hoy</option>
        <option value="semana">Esta semana</option>
        <option value="mes">Este mes</option>
        <option value="personalizado">Rango personalizado</option>
      </select>

      {filtros.periodo === 'personalizado' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filtros.fechaDesde}
            onChange={(e) => actualizar('fechaDesde', e.target.value)}
            className={selectClase}
          />
          <span className="text-sm text-texto-secundario">a</span>
          <input
            type="date"
            value={filtros.fechaHasta}
            onChange={(e) => actualizar('fechaHasta', e.target.value)}
            className={selectClase}
          />
        </div>
      )}

      {esAdmin && (
        <select
          value={filtros.sedeId}
          onChange={(e) => actualizar('sedeId', e.target.value)}
          className={selectClase}
        >
          <option value="">Todas las sedes</option>
          {sedes.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </select>
      )}

      <select
        value={filtros.servicioId}
        onChange={(e) => actualizar('servicioId', e.target.value)}
        className={selectClase}
      >
        <option value="">Todos los servicios</option>
        {servicios.map((s) => (
          <option key={s.id} value={s.id}>
            {s.nombre}
          </option>
        ))}
      </select>

      {esAdmin && (
        <select
          value={filtros.usuarioId}
          onChange={(e) => actualizar('usuarioId', e.target.value)}
          className={selectClase}
        >
          <option value="">Todas las empleadas</option>
          {empleadas.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nombre}
            </option>
          ))}
        </select>
      )}

      <label className="flex items-center gap-2 text-sm text-texto md:ml-auto">
        <input
          type="checkbox"
          checked={filtros.comparar}
          onChange={(e) => actualizar('comparar', e.target.checked)}
          className="h-4 w-4 rounded border-borde-tarjeta accent-dorado"
        />
        Comparar vs. periodo anterior
      </label>
    </div>
  );
}
