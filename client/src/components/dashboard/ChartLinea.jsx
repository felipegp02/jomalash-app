import '../../charts/setup';
import { Line } from 'react-chartjs-2';
import { COLOR_DORADO, COLOR_TEXTO, COLOR_BORDE } from '../../charts/setup';
import SinDatos from './SinDatos';

export default function ChartLinea({ etiquetas, datos }) {
  const sinDatos = datos.every((d) => !d);
  if (sinDatos) return <SinDatos />;

  const data = {
    labels: etiquetas,
    datasets: [
      {
        data: datos,
        borderColor: COLOR_DORADO,
        backgroundColor: 'rgba(201, 162, 39, 0.15)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: COLOR_DORADO,
        // Un punto visible solo en los dias/meses que tuvieron ventas.
        pointRadius: datos.map((d) => (d > 0 ? 4 : 0)),
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: COLOR_TEXTO, font: { size: 10 } } },
      y: {
        beginAtZero: true,
        ticks: { color: COLOR_TEXTO, font: { size: 10 } },
        grid: { color: COLOR_BORDE },
      },
    },
  };

  return (
    <div className="h-48 sm:h-64">
      <Line data={data} options={options} />
    </div>
  );
}
