const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const prisma = require('../lib/prisma');

// Mismo criterio que client/src/utils/formato.js (formatearMoneda): separador
// de miles al estilo colombiano, sin el espacio que agrega style:'currency'.
function formatearMoneda(valor) {
  const redondeado = Math.round(valor || 0);
  const signo = redondeado < 0 ? '-' : '';
  const numero = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(Math.abs(redondeado));
  return `${signo}$${numero}`;
}

// Sin auto-filtro por rol: llegar aqui ya exige el permiso ve_caja (una
// herramienta de negocio a nivel de sede, no de desempeno individual), asi
// que cualquiera que lo tenga puede elegir libremente que filtrar.
function construirFiltros(req, query) {
  const filtros = {};
  if (query.usuario_id) filtros.usuario_id = Number(query.usuario_id);
  if (query.sede_id) filtros.sede_id = Number(query.sede_id);
  if (query.servicio_id) filtros.servicio_id = Number(query.servicio_id);
  return filtros;
}

async function generarExcel(res, ventas, desde, hasta) {
  const workbook = new ExcelJS.Workbook();

  const totalServicios = ventas.length;
  const totalVenta = ventas.reduce((suma, v) => suma + v.precio_total, 0);
  const totalComision = ventas.reduce((suma, v) => suma + v.comision, 0);

  const resumen = workbook.addWorksheet('Resumen');
  resumen.columns = [{ width: 30 }, { width: 22 }];
  resumen.addRow(['Reporte Jomalash']).font = { bold: true };
  resumen.addRow(['Periodo', `${desde.toLocaleDateString('es-CO')} - ${hasta.toLocaleDateString('es-CO')}`]);
  resumen.addRow([]);
  resumen.addRow(['Servicios', totalServicios]);
  resumen.addRow(['Venta bruta', totalVenta]);
  resumen.addRow(['Comisiones', totalComision]);
  resumen.addRow(['Venta neta (sin comisiones)', totalVenta - totalComision]);

  const hoja = workbook.addWorksheet('Ventas');
  hoja.columns = [
    { header: 'Fecha', key: 'fecha', width: 14 },
    { header: 'Hora', key: 'hora', width: 10 },
    { header: 'Servicio', key: 'servicio', width: 30 },
    { header: 'Categoria', key: 'categoria', width: 18 },
    { header: 'Empleada', key: 'empleada', width: 20 },
    { header: 'Sede', key: 'sede', width: 14 },
    { header: 'Metodo de pago', key: 'metodo', width: 16 },
    { header: 'Total', key: 'total', width: 14 },
    { header: 'Comision', key: 'comision', width: 14 },
  ];
  hoja.getRow(1).font = { bold: true };

  for (const v of ventas) {
    hoja.addRow({
      fecha: v.fecha.toLocaleDateString('es-CO'),
      hora: v.fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      servicio: v.servicio.nombre,
      categoria: v.servicio.categoria,
      empleada: v.usuario.nombre,
      sede: v.sede.nombre,
      metodo: v.metodo_pago,
      total: v.precio_total,
      comision: v.comision,
    });
  }

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="reporte-jomalash.xlsx"');
  await workbook.xlsx.write(res);
  res.end();
}

function generarPdf(res, ventas, desde, hasta) {
  const doc = new PDFDocument({ margin: 40 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="reporte-jomalash.pdf"');
  doc.pipe(res);

  const totalServicios = ventas.length;
  const totalVenta = ventas.reduce((suma, v) => suma + v.precio_total, 0);
  const totalComision = ventas.reduce((suma, v) => suma + v.comision, 0);

  doc.fontSize(18).text('Reporte Jomalash', { align: 'center' });
  doc.moveDown();
  doc.fontSize(11).text(`Periodo: ${desde.toLocaleDateString('es-CO')} - ${hasta.toLocaleDateString('es-CO')}`);
  doc.moveDown();

  doc.fontSize(13).text('Resumen', { underline: true });
  doc.fontSize(11);
  doc.text(`Servicios: ${totalServicios}`);
  doc.text(`Venta bruta: ${formatearMoneda(totalVenta)}`);
  doc.text(`Comisiones: ${formatearMoneda(totalComision)}`);
  doc.text(`Venta neta (sin comisiones): ${formatearMoneda(totalVenta - totalComision)}`);
  doc.moveDown();

  const porCategoria = new Map();
  for (const v of ventas) {
    const cat = v.servicio.categoria;
    const actual = porCategoria.get(cat) || { servicios: 0, venta: 0 };
    actual.servicios += 1;
    actual.venta += v.precio_total;
    porCategoria.set(cat, actual);
  }
  doc.fontSize(13).text('Por categoria', { underline: true });
  doc.fontSize(11);
  for (const [cat, datos] of porCategoria) {
    doc.text(`${cat}: ${datos.servicios} servicios - ${formatearMoneda(datos.venta)}`);
  }
  doc.moveDown();

  const porServicio = new Map();
  for (const v of ventas) {
    const actual = porServicio.get(v.servicio_id) || { nombre: v.servicio.nombre, servicios: 0, venta: 0 };
    actual.servicios += 1;
    actual.venta += v.precio_total;
    porServicio.set(v.servicio_id, actual);
  }
  const rankingServicios = [...porServicio.values()].sort((a, b) => b.servicios - a.servicios).slice(0, 10);
  doc.fontSize(13).text('Servicios mas realizados', { underline: true });
  doc.fontSize(11);
  for (const s of rankingServicios) {
    doc.text(`${s.nombre}: ${s.servicios} servicios - ${formatearMoneda(s.venta)}`);
  }

  doc.end();
}

// GET /reportes/exportar?formato=excel|pdf&desde=&hasta=&sede_id=&servicio_id=&usuario_id= (Admin)
async function exportar(req, res) {
  const { formato, desde, hasta } = req.query;
  if (!desde || !hasta) return res.status(400).json({ error: 'Debes indicar desde y hasta' });
  if (formato !== 'excel' && formato !== 'pdf') {
    return res.status(400).json({ error: 'El formato debe ser excel o pdf' });
  }

  const filtros = construirFiltros(req, req.query);
  const desdeDate = new Date(desde);
  const hastaDate = new Date(hasta);

  const ventas = await prisma.venta.findMany({
    where: { ...filtros, anulada: false, fecha: { gte: desdeDate, lt: hastaDate } },
    include: {
      servicio: { select: { nombre: true, categoria: true } },
      usuario: { select: { nombre: true } },
      sede: { select: { nombre: true } },
    },
    orderBy: { fecha: 'asc' },
  });

  if (formato === 'excel') {
    await generarExcel(res, ventas, desdeDate, hastaDate);
  } else {
    generarPdf(res, ventas, desdeDate, hastaDate);
  }
}

module.exports = { exportar };
