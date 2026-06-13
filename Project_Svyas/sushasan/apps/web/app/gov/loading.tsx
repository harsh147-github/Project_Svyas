export default function GovLoading() {
  return (
    <div className="min-h-screen bg-paper text-ink px-4 sm:px-6 py-8 animate-pulse">
      {/* Header skeleton */}
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="h-6 w-40 bg-ink/8 rounded-full" />
        <div className="h-8 w-64 bg-ink/10 rounded-xl" />

        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-ink/8 p-5 space-y-2">
              <div className="h-3 w-16 bg-ink/8 rounded-full" />
              <div className="h-7 w-10 bg-ink/10 rounded-lg" />
            </div>
          ))}
        </div>

        {/* Solution cards */}
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-ink/8 p-6 space-y-3">
              <div className="h-4 w-24 bg-saffron/20 rounded-full" />
              <div className="h-5 w-3/4 bg-ink/10 rounded-lg" />
              <div className="h-3 w-full bg-ink/6 rounded-full" />
              <div className="h-3 w-2/3 bg-ink/6 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
