export function ServiceBusinessWorkspaceSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-neutral-100" />
        ))}
      </div>
      <div className="h-36 animate-pulse rounded-2xl bg-neutral-100" />
      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_460px]">
        <div className="h-96 animate-pulse rounded-2xl bg-neutral-100" />
        <div className="h-96 animate-pulse rounded-2xl bg-neutral-100" />
      </div>
    </div>
  );
}
