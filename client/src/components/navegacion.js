import { IconDashboard, IconRegistrar, IconHistorial, IconInsumos } from './Icons';

export const PESTANAS = [
  { id: 'dashboard', etiqueta: 'Dashboard', Icono: IconDashboard },
  { id: 'registrar', etiqueta: 'Registrar', Icono: IconRegistrar },
  { id: 'historial', etiqueta: 'Historial', Icono: IconHistorial },
  { id: 'insumos', etiqueta: 'Insumos', Icono: IconInsumos, soloAdmin: true },
];
