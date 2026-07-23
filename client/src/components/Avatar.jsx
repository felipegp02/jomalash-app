export default function Avatar({ nombre }) {
  const inicial = nombre?.trim().charAt(0).toUpperCase() || '?';

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-dorado bg-white text-sm font-semibold text-texto">
      {inicial}
    </div>
  );
}
