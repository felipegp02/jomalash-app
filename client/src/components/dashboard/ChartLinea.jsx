import { useEffect, useRef } from 'react';
import '../../charts/setup';
import { Line } from 'react-chartjs-2';
import { COLOR_DORADO, COLOR_TEXTO, COLOR_BORDE } from '../../charts/setup';
import { formatearMoneda } from '../../utils/formato';
import SinDatos from './SinDatos';

const OCULTAR_TOOLTIP_MS = 3000;

// En touch no hay "hover": Chart.js solo dispara el tooltip mientras el dedo
// esta sobre el canvas. Este hook lo deja visible unos segundos despues de
// soltar (o hasta el siguiente toque), imitando lo que se ve en escritorio.
function useTooltipTactil(chartRef) {
  const timeoutRef = useRef(null);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return undefined;

    const canvas = chart.canvas;

    function cancelarOcultar() {
      clearTimeout(timeoutRef.current);
    }

    function programarOcultar() {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        chart.setActiveElements([]);
        chart.tooltip?.setActiveElements([], { x: 0, y: 0 });
        chart.update();
      }, OCULTAR_TOOLTIP_MS);
    }

    canvas.addEventListener('touchstart', cancelarOcultar, { passive: true });
    canvas.addEventListener('touchend', programarOcultar);

    return () => {
      canvas.removeEventListener('touchstart', cancelarOcultar);
      canvas.removeEventListener('touchend', programarOcultar);
      clearTimeout(timeoutRef.current);
    };
  });
}

export default function ChartLinea({ etiquetas, datos, formatoValor = formatearMoneda, enteros = false }) {
  const chartRef = useRef(null);
  useTooltipTactil(chartRef);

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
        // Un punto visible solo en los dias/meses que tuvieron actividad.
        pointRadius: datos.map((d) => (d > 0 ? 4 : 0)),
        // Radio de toque mas grande que el punto visible, para que sea facil
        // acertarle con el dedo en pantallas chicas.
        pointHitRadius: 14,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    // Con intersect:false alcanza con tocar cerca de la linea (no exacto
    // sobre el punto) para que aparezca el tooltip del valor mas cercano.
    interaction: { mode: 'nearest', intersect: false, axis: 'x' },
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => formatoValor(ctx.parsed.y) } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: COLOR_TEXTO, font: { size: 10 } } },
      y: {
        beginAtZero: true,
        ticks: { color: COLOR_TEXTO, font: { size: 10 }, precision: enteros ? 0 : undefined },
        grid: { color: COLOR_BORDE },
      },
    },
  };

  return (
    <div className="h-48 sm:h-64">
      <Line ref={chartRef} data={data} options={options} />
    </div>
  );
}
