/** Pantalla de carga: aparece al instante mientras el servidor arma la página. */
export default function PageSkeleton() {
  const bar = "animate-pulse rounded-xl bg-slate-200";
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Cargando">
      <div className={`${bar} h-8 w-1/2`} />
      <div className={`${bar} aspect-[4/3] w-full rounded-2xl`} />
      <div className="card space-y-3 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200" />
            <div className={`${bar} h-4 flex-1`} />
            <div className={`${bar} h-4 w-10`} />
          </div>
        ))}
      </div>
    </div>
  );
}
