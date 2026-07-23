import '../../charts/setup';
import { Bar } from 'react-chartjs-2';
import { COLOR_DORADO, COLOR_TEXTO, COLOR_BORDE } from '../../charts/setup';
import SinDatos from './SinDatos';

export default function ChartBarra({ etiquetas, datos, etiquetaSerie }) {
  const sinDatos = datos.every((d) => !d);
  if (sinDatos) return <SinDatos />;

  const data = {
    labels: etiquetas,
    datasets: [
      {
        label: etiquetaSerie,
        data: datos,
        backgroundColor: COLOR_DORADO,
        borderRadius: 6,
        maxBarThickness: 36,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: COLOR_TEXTO, font: { size: 10 }, autoSkip: true, maxRotation: 0 },
      },
      y: {
        beginAtZero: true,
        ticks: { precision: 0, color: COLOR_TEXTO, font: { size: 10 } },
        grid: { color: COLOR_BORDE },
      },
    },
  };

  return (
    <div className="h-48 sm:h-64">
      <Bar data={data} options={options} />
    </div>
  );
}
