const ESTADO_CLASSES = {
  pendiente: 'bg-amber-100 text-amber-800',
  'en camino': 'bg-sky-100 text-sky-800',
  confirmado: 'bg-sky-100 text-sky-800',
  entregado: 'bg-emerald-100 text-emerald-800',
  terminado: 'bg-emerald-100 text-emerald-800',
  disponible: 'bg-emerald-100 text-emerald-800',
  ocupado: 'bg-slate-200 text-slate-700',
};

export default function EstadoBadge({ estado }) {
  const key = String(estado || '').toLowerCase();
  const classes = ESTADO_CLASSES[key] || 'bg-slate-200 text-slate-700';

  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${classes}`}>
      {estado}
    </span>
  );
}
