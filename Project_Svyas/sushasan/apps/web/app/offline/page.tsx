import Link from 'next/link'

export const metadata = { title: 'Offline' }

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-paper text-ink flex items-center justify-center px-6">
      <div className="max-w-sm text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-saffron flex items-center justify-center
                        text-white font-serif font-bold text-2xl shadow-[0_4px_18px_rgba(255,153,51,0.35)]">
          स
        </div>
        <h1 className="font-serif text-2xl font-semibold">You&rsquo;re offline</h1>
        <p className="text-ink-2 text-sm leading-relaxed">
          Sushaasan needs a connection to load the live ward map and submit reports.
          Reconnect and try again — anything you were typing is safe.
        </p>
        <Link href="/" className="inline-block px-5 py-2.5 rounded-full bg-saffron text-white text-sm font-semibold">
          Retry
        </Link>
      </div>
    </main>
  )
}
