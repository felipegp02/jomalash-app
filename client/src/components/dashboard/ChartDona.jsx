import '../../charts/setup';
import { Doughnut } from 'react-chartjs-2';
import { PALETA_CATEGORICA } from '../../charts/setup';
import SinDatos from './SinDatos';

export default function ChartDona({ categorias }) {
  if (!categorias.length) return <SinDatos />;

  const total = categorias.reduce((suma, c) => suma + c.servicios, 0);

  const data = {
    labels: categorias.map((c) => c.categoria),
    datasets: [
      {
        data: categorias.map((c) => c.servicios),
        backgroundColor: PALETA_CATEGORICA,
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    cutout: '65%',
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="h-40 sm:h-48">
        <Doughnut data={data} options={options} />
      </div>
      <ul className="flex flex-col gap-2">
        {categorias.map((c, i) => (
          <li key={c.categoria} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-texto">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: PALETA_CATEGORICA[i % PALETA_CATEGORICA.length] }}
              />
              {c.categoria}
            </span>
            <span className="text-texto-secundario">
              {total ? Math.round((c.servicios / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
