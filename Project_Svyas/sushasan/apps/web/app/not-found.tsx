import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col items-center justify-center px-5">
      <div className="max-w-md w-full space-y-8 text-center">

        <div className="flex justify-center">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-saffron flex items-center justify-center
                            shadow-[0_4px_16px_rgba(255,153,51,0.3)]">
              <span className="font-serif font-bold text-lg text-white">स</span>
            </div>
          </Link>
        </div>

        <div className="space-y-3">
          <div className="text-[10px] font-bold tracking-[0.22em] uppercase text-ink-4">
            404 — Not found
          </div>
          <h1 className="font-serif text-3xl font-semibold text-ink leading-tight">
            This ward or page doesn&rsquo;t exist yet.
          </h1>
          <p className="text-ink-2 text-sm leading-relaxed">
            The Sushaasan pilot covers Ward 46 (NIBM–Mohammadwadi) and Ward 47 (Salunke Vihar–Wanowrie).
            Other wards will be added as the platform expands across Pune.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/"
                className="px-5 py-2.5 rounded-full bg-saffron text-white text-xs font-semibold
                           shadow-[0_4px_18px_rgba(255,153,51,0.3)] hover:bg-saffron-dark transition-colors">
            Back to the map ↗
          </Link>
          <Link href="/dashboard"
                className="px-5 py-2.5 rounded-full bg-white text-ink text-xs font-semibold
                           border border-ink/12 hover:border-ink/25 transition-colors">
            Transparency dashboard →
          </Link>
        </div>

        <p className="text-[11px] text-ink-4">
          Sushaasan · Pune Civic Intelligence ·{' '}
          <a href="mailto:contact@sushaasan.in" className="underline hover:text-ink-2 transition-colors">
            Contact
          </a>
        </p>
      </div>
    </div>
  )
}
