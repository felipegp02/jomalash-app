// Corre despues de "prisma generate" en el postinstall. Refuerza el bit +x
// del engine binary justo despues de generarlo, mientras el filesystem del
// build todavia es de escritura (a diferencia del runtime en algunos hosts
// tipo "Web Apps", que despliega el bundle como solo-lectura).
const { asegurarPermisos } = require('../lib/prismaEnginePermissions');

const resultados = asegurarPermisos();
console.log('[postinstall] Permisos del engine de Prisma:');
console.log(JSON.stringify(resultados, null, 2));
