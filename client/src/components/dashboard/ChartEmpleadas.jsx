import '../../charts/setup';
import { Bar } from 'react-chartjs-2';
import { COLOR_DORADO, COLOR_TEXTO, COLOR_BORDE } from '../../charts/setup';
import { formatearMoneda } from '../../utils/formato';
import SinDatos from './SinDatos';

// valor: 'comision' o 'venta' o 'servicios' segun que se quiera graficar
export default function ChartEmpleadas({ ranking, valor = 'comision', esMoneda = true }) {
  if (!ranking.length) return <SinDatos />;

  const data = {
    labels: ranking.map((r) => r.nombre),
    datasets: [
      {
        data: ranking.map((r) => r[valor]),
        backgroundColor: COLOR_DORADO,
        borderRadius: 6,
        maxBarThickness: 28,
      },
    ],
  };

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const item = ranking[ctx.dataIndex];
            const cifra = esMoneda ? formatearMoneda(item[valor]) : item[valor];
            return `${cifra} · ${item.servicios} servicios`;
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { color: COLOR_TEXTO, font: { size: 10 } },
        grid: { color: COLOR_BORDE },
      },
      y: { grid: { display: false }, ticks: { color: COLOR_TEXTO, font: { size: 11 } } },
    },
  };

  const alto = Math.max(140, ranking.length * 40);

  return (
    <div style={{ height: alto }}>
      <Bar data={data} options={options} />
    </div>
  );
}
