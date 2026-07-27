import {
  IconDashboard,
  IconRegistrar,
  IconHistorial,
  IconInsumos,
  IconGestion,
  IconCaja,
  IconNomina,
} from './Icons';

// El orden de este array es el orden real del sidebar de escritorio: no se
// toca por el rediseno del BottomNav movil (ver enBarraMovil abajo, que
// BottomNav.jsx usa para armar su propio orden fijo sin depender de este).
export const PESTANAS = [
  // destacado + separadorDespues: Registrar es la acción mas usada del dia a
  // dia. En el sidebar de escritorio va sola arriba de todo con su propio
  // estilo; en movil (BottomNav) es el boton circular flotante.
  { id: 'registrar', etiqueta: 'Registrar', Icono: IconRegistrar, disponible: true, destacado: true, separadorDespues: true },
  { id: 'dashboard', etiqueta: 'Dashboard', Icono: IconDashboard, disponible: true, enBarraMovil: true },
  { id: 'historial', etiqueta: 'Historial', Icono: IconHistorial, disponible: true, enBarraMovil: true },
  { id: 'caja', etiqueta: 'Caja', Icono: IconCaja, disponible: true, visible: (u) => u.ve_caja },
  { id: 'nomina', etiqueta: 'Nómina', Icono: IconNomina, disponible: true, visible: (u) => u.ve_nomina },
  // enBarraMovil: estas 3 (dashboard/historial/insumos) ocupan los slots
  // fijos del BottomNav junto con el boton "Mas". El resto (con permiso)
  // vive dentro de "Mas" para no saturar la barra en pantallas angostas.
  { id: 'insumos', etiqueta: 'Insumos', Icono: IconInsumos, disponible: true, visible: (u) => u.ve_insumos, enBarraMovil: true },
  // separador: arranca el grupo de configuracion administrativa, visualmente
  // distinto del resto (operacion del dia a dia) en el sidebar de escritorio.
  // Ajustes agrupa Servicios/Empleadas/Sedes: aparece si el usuario puede
  // gestionar al menos una de esas cosas (Sedes no tiene permiso propio,
  // queda reservado a rol admin dentro de la pantalla).
  {
    id: 'ajustes',
    etiqueta: 'Ajustes',
    Icono: IconGestion,
    disponible: true,
    separador: true,
    visible: (u) => u.gestiona_catalogo || u.gestiona_empleadas || u.rol === 'admin',
  },
];

// Helper compartido: puede verse esta pestana con los permisos del usuario?
export function puedeVerPestana(id, usuario) {
  const pestana = PESTANAS.find((p) => p.id === id);
  return !pestana?.visible || pestana.visible(usuario);
}
