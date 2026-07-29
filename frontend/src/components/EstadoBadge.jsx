const ESTADO_CLASSES = {
  pendiente: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
  'en camino': 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300',
  confirmado: 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300',
  entregado: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
  terminado: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
  disponible: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
  ocupado: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
};

export default function EstadoBadge({ estado }) {
  const key = String(estado || '').toLowerCase();
  const classes =
    ESTADO_CLASSES[key] || 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200';

  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${classes}`}>
      {estado}
    </span>
  );
}
