/**
 * Skeleton screen shown while the first forecast loads. It mirrors the real
 * layout (hero + details grid + strip) so the page doesn't jump when data
 * arrives. A shimmering pulse signals "working" without a spinner.
 */
function Block({ className = '' }) {
  return <div className={`shimmer rounded-2xl ${className}`} />;
}

export default function LoadingState() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading forecast">
      {/* Hero */}
      <div className="glass rounded-3xl p-6 sm:p-8">
        <div className="flex items-center justify-between gap-6">
          <div className="flex-1 space-y-3">
            <Block className="h-5 w-40" />
            <Block className="h-3 w-52" />
            <Block className="h-20 w-32" />
            <Block className="h-4 w-44" />
          </div>
          <Block className="h-28 w-28 rounded-full" />
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Block key={i} className="h-24" />
        ))}
      </div>

      {/* Hourly strip */}
      <Block className="h-36" />

      {/* Daily list */}
      <Block className="h-72" />
    </div>
  );
}
