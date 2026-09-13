export function RideCardSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border p-6">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-40 rounded bg-muted" />
          <div className="h-3 w-24 rounded bg-muted" />
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <div className="h-5 w-full rounded bg-muted" />
        <div className="h-5 w-3/4 rounded bg-muted" />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="h-16 rounded-2xl bg-muted" />
        <div className="h-16 rounded-2xl bg-muted" />
        <div className="h-16 rounded-2xl bg-muted" />
        <div className="h-16 rounded-2xl bg-muted" />
      </div>

      <div className="mt-8 h-12 rounded-xl bg-muted" />
    </div>
  );
}
