export default function CardSkeleton({ alto = 'h-64' }) {
  return (
    <div
      className={`animate-pulse rounded-[20px] border border-borde-tarjeta bg-gray-200 ${alto}`}
    />
  );
}
