'use client'

import { useState } from 'react'

/**
 * The dossier panel in the War Room — where the officer sees the reference
 * number, opens the printable form, and switches it into Marathi.
 *
 * Kept as a client island so the language toggle and print action don't force
 * the whole War Room page to re-render on the server.
 */

type Props = {
  missionId: string
  applicationNumber: string
  token: string
  /** Ward + issue, for the print window title. */
  title: string
}

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'mr', label: 'मराठी' },
  { code: 'hi', label: 'हिंदी' },
]

export function ApplicationFormPanel({ missionId, applicationNumber, token, title }: Props) {
  const [lang, setLang] = useState('en')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  const qs = new URLSearchParams()
  if (token) qs.set('token', token)
  qs.set('lang', lang)

  const htmlUrl = `/api/gov/application/${missionId}?${qs.toString()}&format=html`
  const textUrl = `/api/gov/application/${missionId}?${qs.toString()}&format=text`

  async function copyRef() {
    try {
      await navigator.clipboard.writeText(applicationNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard blocked */ }
  }

  /**
   * Open the rendered form in a window sized for printing. Fetched rather than
   * linked so a non-English rendering (which costs a translation round-trip)
   * shows a loading state instead of an apparently-dead click.
   */
  async function openForm() {
    setLoading(true)
    try {
      const res = await fetch(htmlUrl)
      if (!res.ok) return
      const html = await res.text()
      const w = window.open('', '_blank', 'width=880,height=1000')
      if (!w) return
      w.document.write(
        `<!doctype html><html><head><meta charset="utf-8"><title>${title} — ${applicationNumber}</title>` +
        `<meta name="viewport" content="width=device-width,initial-scale=1">` +
        `<style>body{margin:0;padding:24px;background:#f4f4ef}</style></head><body>${html}</body></html>`,
      )
      w.document.close()
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[10px] font-bold tracking-[0.22em] uppercase text-saffron mb-1.5">
            Grievance dossier
          </div>
          <h2 className="text-[15px] font-semibold text-white/90">
            Application form for the ward office
          </h2>
        </div>

        <div className="flex gap-1" role="group" aria-label="Dossier language">
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              aria-pressed={lang === l.code}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                lang === l.code
                  ? 'bg-saffron/15 text-saffron border-saffron/40'
                  : 'bg-white/[0.04] text-white/45 border-white/10 hover:text-white/70'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* The reference number — the thing both sides quote. */}
      <div className="rounded-xl border border-white/10 bg-[#0A1426]/60 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.18em] text-white/35 mb-0.5">
            Reference no.
          </div>
          <div className="font-mono text-[13px] text-white/90 tracking-wide break-all">
            {applicationNumber}
          </div>
        </div>
        <button
          onClick={copyRef}
          className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-white/[0.06]
                     border border-white/12 text-white/70 hover:text-white hover:bg-white/[0.1] transition-colors"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={openForm}
          disabled={loading}
          className="px-4 py-2 rounded-xl text-[12px] font-bold bg-saffron text-[#0A1426]
                     hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {loading ? 'Preparing…' : 'Open printable form'}
        </button>
        <a
          href={textUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-xl text-[12px] font-semibold bg-white/[0.06]
                     border border-white/12 text-white/70 hover:text-white transition-colors"
        >
          Plain text
        </a>
      </div>

      <p className="text-[10.5px] leading-relaxed text-white/35">
        Sushaasan tracking reference — not a PMC-issued application number. The dossier
        is an AI-compiled advisory; cost and timeline figures are indicative.
      </p>
    </section>
  )
}
