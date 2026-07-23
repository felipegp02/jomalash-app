import { IconCheck } from './Icons';

export default function Toast({ mensaje, visible }) {
  return (
    <div
      className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-dorado-fondo px-4 py-3 text-sm font-medium text-toast-texto shadow-md transition-opacity duration-500 ${
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      role="status"
    >
      <IconCheck width={18} height={18} />
      {mensaje}
    </div>
  );
}
