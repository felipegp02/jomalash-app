const prisma = require('../lib/prisma');

const TIPOS = ['consumible', 'herramienta'];
const TIPOS_MEDIDA = ['ml', 'gramos', 'unidades'];

function conAlerta(insumo) {
  return {
    ...insumo,
    stock_actual: Number(insumo.stock_actual),
    stock_minimo: Number(insumo.stock_minimo),
    contenido_por_compra: Number(insumo.contenido_por_compra),
    alerta: Number(insumo.stock_actual) < Number(insumo.stock_minimo),
  };
}

// GET /insumos (RF-16: alerta cuando el stock cae debajo del minimo)
async function listar(req, res) {
  const insumos = await prisma.insumo.findMany({ orderBy: { nombre: 'asc' } });
  res.json({ insumos: insumos.map(conAlerta) });
}

// POST /insumos
async function crear(req, res) {
  const { nombre, tipo, tipo_medida, unidad_compra, contenido_por_compra, stock_minimo, stock_actual } =
    req.body || {};

  if (!nombre || !unidad_compra) {
    return res.status(400).json({ error: 'Nombre y unidad de compra son requeridos' });
  }

  const tipoFinal = tipo || 'consumible';
  if (!TIPOS.includes(tipoFinal)) {
    return res.status(400).json({ error: 'El tipo debe ser consumible o herramienta' });
  }

  // tipo_medida solo aplica a consumibles: una herramienta se cuenta siempre
  // como unidades enteras, sin necesidad de distinguirlo.
  let tipoMedidaFinal = null;
  if (tipoFinal === 'consumible') {
    if (!TIPOS_MEDIDA.includes(tipo_medida)) {
      return res.status(400).json({ error: 'Los consumibles necesitan un tipo de medida (ml, gramos o unidades)' });
    }
    tipoMedidaFinal = tipo_medida;
  }

  const minimo = Number(stock_minimo);
  if (!Number.isFinite(minimo) || minimo < 0) {
    return res.status(400).json({ error: 'El stock minimo debe ser un numero valido' });
  }

  const inicial = stock_actual === undefined || stock_actual === null || stock_actual === '' ? 0 : Number(stock_actual);
  if (!Number.isFinite(inicial) || inicial < 0) {
    return res.status(400).json({ error: 'El stock inicial debe ser un numero valido' });
  }

  // Para herramientas la compra siempre es 1 a 1 (unidades enteras, sin conversion).
  let contenido = 1;
  if (tipoFinal === 'consumible') {
    contenido = contenido_por_compra === undefined || contenido_por_compra === null || contenido_por_compra === ''
      ? 1
      : Number(contenido_por_compra);
    if (!Number.isFinite(contenido) || contenido <= 0) {
      return res.status(400).json({ error: 'El contenido por compra debe ser un numero positivo' });
    }
  }

  const insumo = await prisma.insumo.create({
    data: {
      nombre,
      tipo: tipoFinal,
      tipo_medida: tipoMedidaFinal,
      unidad_compra,
      contenido_por_compra: contenido,
      stock_minimo: minimo,
      stock_actual: inicial,
    },
  });

  res.status(201).json({ insumo: conAlerta(insumo) });
}

// PUT /insumos/:id
async function actualizar(req, res) {
  const id = Number(req.params.id);
  const { nombre, tipo, tipo_medida, unidad_compra, contenido_por_compra, stock_minimo } = req.body || {};

  const existente = await prisma.insumo.findUnique({ where: { id } });
  if (!existente) {
    return res.status(404).json({ error: 'Insumo no encontrado' });
  }

  const data = {};
  if (nombre !== undefined) data.nombre = nombre;
  if (unidad_compra !== undefined) data.unidad_compra = unidad_compra;

  const tipoFinal = tipo !== undefined ? tipo : existente.tipo;
  if (tipo !== undefined) {
    if (!TIPOS.includes(tipo)) {
      return res.status(400).json({ error: 'El tipo debe ser consumible o herramienta' });
    }
    if (tipo === 'herramienta') {
      // No tiene sentido convertir en herramienta un insumo que ya se usa
      // en alguna receta: las recetas solo pueden usar consumibles.
      const enUso = await prisma.receta.count({ where: { insumo_id: id } });
      if (enUso > 0) {
        return res.status(400).json({ error: 'No puedes marcarlo como herramienta: se usa en una o mas recetas' });
      }
    }
    data.tipo = tipo;
  }

  if (tipoFinal === 'consumible') {
    const medidaFinal = tipo_medida !== undefined ? tipo_medida : existente.tipo_medida;
    if (!TIPOS_MEDIDA.includes(medidaFinal)) {
      return res.status(400).json({ error: 'Los consumibles necesitan un tipo de medida (ml, gramos o unidades)' });
    }
    data.tipo_medida = medidaFinal;
  } else {
    data.tipo_medida = null;
  }

  if (stock_minimo !== undefined) {
    const minimo = Number(stock_minimo);
    if (!Number.isFinite(minimo) || minimo < 0) {
      return res.status(400).json({ error: 'El stock minimo debe ser un numero valido' });
    }
    data.stock_minimo = minimo;
  }

  if (contenido_por_compra !== undefined && tipoFinal === 'consumible') {
    const contenido = Number(contenido_por_compra);
    if (!Number.isFinite(contenido) || contenido <= 0) {
      return res.status(400).json({ error: 'El contenido por compra debe ser un numero positivo' });
    }
    data.contenido_por_compra = contenido;
  }

  const insumo = await prisma.insumo.update({ where: { id }, data });
  res.json({ insumo: conAlerta(insumo) });
}

// PUT /insumos/:id/inventario (inventario inicial / correccion manual: no
// queda registrado como compra, solo fija el stock real).
async function ajustarInventario(req, res) {
  const id = Number(req.params.id);
  const { stock_actual } = req.body || {};

  const existente = await prisma.insumo.findUnique({ where: { id } });
  if (!existente) {
    return res.status(404).json({ error: 'Insumo no encontrado' });
  }

  const valor = Number(stock_actual);
  if (!Number.isFinite(valor) || valor < 0) {
    return res.status(400).json({ error: 'El stock debe ser un numero valido' });
  }

  const insumo = await prisma.insumo.update({ where: { id }, data: { stock_actual: valor } });
  res.json({ insumo: conAlerta(insumo) });
}

module.exports = { listar, crear, actualizar, ajustarInventario };
