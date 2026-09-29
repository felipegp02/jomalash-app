const fs = require('fs');
const path = require('path');

// Carpetas donde "prisma generate" deja los binarios del engine (engineType
// = "binary" en schema.prisma). En un host tipo "Web Apps" (build y runtime
// en entornos separados, como Vercel) el bit +x se puede perder entre el
// build y el deploy final, dejando el engine sin poder levantar: Prisma lo
// relanza en un puerto nuevo en cada intento fallido, de ahi el
// ECONNREFUSED con puerto distinto cada vez.
const CARPETAS = [
  path.join(__dirname, '..', 'node_modules', '.prisma', 'client'),
  path.join(__dirname, '..', 'node_modules', '@prisma', 'engines'),
];

const FIRMA_ELF = Buffer.from([0x7f, 0x45, 0x4c, 0x46]); // 0x7F 'E' 'L' 'F'

function listarBinariosEngine() {
  const encontrados = [];
  for (const carpeta of CARPETAS) {
    let archivos;
    try {
      archivos = fs.readdirSync(carpeta);
    } catch (err) {
      continue; // carpeta ausente: "prisma generate" no corrio (todavia)
    }
    for (const nombre of archivos) {
      if (!/engine/i.test(nombre)) continue;
      if (/\.(js|wasm|map|tmp\d*)$/i.test(nombre)) continue;
      encontrados.push(path.join(carpeta, nombre));
    }
  }
  return encontrados;
}

function inspeccionar(archivo) {
  const stat = fs.statSync(archivo);
  const modo = stat.mode & 0o777;
  const buffer = Buffer.alloc(4);
  const fd = fs.openSync(archivo, 'r');
  try {
    fs.readSync(fd, buffer, 0, 4, 0);
  } finally {
    fs.closeSync(fd);
  }
  return {
    archivo,
    bytes: stat.size,
    modoOctal: modo.toString(8).padStart(3, '0'),
    ejecutablePorDueno: Boolean(modo & 0o100),
    primerosBytesHex: buffer.toString('hex'),
    esBinarioELF: buffer.equals(FIRMA_ELF),
  };
}

// Se llama tanto al arrancar el server (self-heal, no fatal si falla: puede
// que el filesystem de runtime sea de solo lectura) como desde el
// postinstall (donde el filesystem del build normalmente si es escribible).
function asegurarPermisos({ log = console.log } = {}) {
  return listarBinariosEngine().map((archivo) => {
    let info;
    try {
      info = inspeccionar(archivo);
    } catch (err) {
      return { archivo, accion: 'error_inspeccion', error: err.message };
    }
    if (info.ejecutablePorDueno) {
      return { ...info, accion: 'ya_ejecutable' };
    }
    try {
      fs.chmodSync(archivo, 0o755);
      log(`[prisma-engine] chmod +x aplicado a ${archivo}`);
      return { ...info, accion: 'chmod_aplicado' };
    } catch (err) {
      log(`[prisma-engine] No se pudo chmod +x ${archivo}: ${err.message} (filesystem de solo lectura?)`);
      return { ...info, accion: 'chmod_fallo', error: err.message };
    }
  });
}

module.exports = { listarBinariosEngine, inspeccionar, asegurarPermisos };
