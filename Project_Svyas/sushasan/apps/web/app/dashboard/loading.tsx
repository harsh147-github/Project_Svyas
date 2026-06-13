export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-paper text-ink px-4 sm:px-6 py-8 animate-pulse">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <div className="h-3 w-28 bg-ink/8 rounded-full" />
          <div className="h-8 w-56 bg-ink/10 rounded-xl" />
          <div className="h-4 w-72 bg-ink/6 rounded-full" />
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-ink/8 p-5 space-y-2">
              <div className="h-3 w-14 bg-ink/8 rounded-full" />
              <div className="h-7 w-10 bg-ink/10 rounded-lg" />
            </div>
          ))}
        </div>

        {/* Issue cards */}
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-ink/8 p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-ink/8" />
                <div className="h-4 w-32 bg-ink/10 rounded-lg" />
                <div className="ml-auto h-5 w-20 bg-saffron/15 rounded-full" />
              </div>
              <div className="h-3 w-full bg-ink/6 rounded-full" />
              <div className="h-3 w-3/4 bg-ink/6 rounded-full" />
              <div className="h-2 w-full bg-ink/5 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
