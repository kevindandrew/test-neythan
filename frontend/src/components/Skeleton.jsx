/**
 * Primitivas de skeleton (placeholders animados) para estados de carga.
 * Se usan en vez de un simple texto "Cargando..." para dar sensación de
 * carga progresiva, mimetizando la forma real del contenido que viene.
 */

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-md bg-slate-200 ${className}`} />;
}

/** Tarjeta tipo producto/negocio: imagen + 2 líneas de texto */
export function SkeletonCard({ imgClassName = 'h-36' }) {
  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden">
      <Skeleton className={`w-full rounded-none ${imgClassName}`} />
      <div className="p-3.5 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

/** Grilla de N tarjetas, para reemplazar listados de productos/negocios */
export function SkeletonCardGrid({ count = 4, className = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' }) {
  return (
    <div className={`grid ${className} gap-5`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/** Fila de tabla con N columnas, para reemplazar listados administrativos */
export function SkeletonRow({ columns = 4 }) {
  return (
    <tr className="border-b border-slate-100">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="py-3 pr-4">
          <Skeleton className="h-4 w-full max-w-32" />
        </td>
      ))}
    </tr>
  );
}

/** Varias filas de tabla seguidas */
export function SkeletonTableRows({ rows = 4, columns = 4 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} columns={columns} />
      ))}
    </>
  );
}

/** Tile tipo StatTile: ícono + label + número */
export function SkeletonStatTile() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <Skeleton className="h-3 w-20 mb-3" />
      <Skeleton className="h-7 w-16" />
    </div>
  );
}

/** Fila simple con avatar/ícono + 2 líneas, para listas verticales (favoritos, pedidos, etc.) */
export function SkeletonListItem() {
  return (
    <div className="rounded-xl border border-slate-200 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-24" />
    </div>
  );
}
