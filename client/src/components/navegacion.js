import { IconDashboard, IconRegistrar, IconHistorial, IconInsumos } from './Icons';

export const PESTANAS = [
  { id: 'dashboard', etiqueta: 'Dashboard', Icono: IconDashboard, disponible: true },
  { id: 'registrar', etiqueta: 'Registrar', Icono: IconRegistrar, disponible: true },
  { id: 'historial', etiqueta: 'Historial', Icono: IconHistorial, disponible: true },
  { id: 'insumos', etiqueta: 'Insumos', Icono: IconInsumos, soloAdmin: true, disponible: true },
];
