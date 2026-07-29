export default function StatTile({ icon: Icon, label, value }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-5">
      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wide mb-2">
        <Icon size={14} strokeWidth={2} />
        {label}
      </div>
      <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  );
}
