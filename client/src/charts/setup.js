import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  ArcElement,
  DoughnutController,
  PointElement,
  LineElement,
  LineController,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';

Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  ArcElement,
  DoughnutController,
  PointElement,
  LineElement,
  LineController,
  Filler,
  Tooltip,
  Legend,
);

// Paleta de marca Jomalash: dorado como color principal, gris y beige como
// secundarios. Se mantiene dentro de la misma familia calida (sin morado
// ni rosa) para los graficos con varias series/categorias.
export const COLOR_DORADO = '#C9A227';
export const COLOR_BEIGE = '#D9C48A';
export const COLOR_GRIS = '#8a8378';
export const COLOR_DORADO_OSCURO = '#8c6d1f';
export const COLOR_DORADO_CLARO = '#e8d9a0';
export const COLOR_TEXTO = '#3D2B2E';
export const COLOR_BORDE = '#EFE7D0';
export const COLOR_VERDE = '#3B6D11';
export const COLOR_ROJO = '#B3261E';

export const PALETA_CATEGORICA = [
  COLOR_DORADO,
  COLOR_BEIGE,
  COLOR_GRIS,
  COLOR_DORADO_OSCURO,
  COLOR_DORADO_CLARO,
];
