'use client'

import { useState } from 'react'
import ListenButton from '@/components/ui/ListenButton'

/**
 * The grievance application, as the citizen sees it after filing.
 *
 * ── Design intent ──────────────────────────────────────────────────────────
 * This is the moment the product either earns trust or loses it. A resident has
 * just spoken a complaint about their own municipality into a phone; what comes
 * back has to look like a document, not a chat bubble. So the card borrows the
 * furniture of official paper — a ruled header, a reference block, numbered
 * particulars, a prayer, a declaration — rendered with restraint.
 *
 * Deliberately not: gradients, drop shadows, coloured pills for their own sake,
 * or any motion that isn't a direct response to a tap. The brand rules call for
 * a $20k civic product, and the fastest way to look cheap is to decorate.
 *
 * Serif for the document body (Source Serif 4), sans for the chrome and labels
 * (Inter). Two families, as specified.
 */

export type ApplicationBody = {
  subject: string
  preamble: string
  particulars: string[]
  prayer: string
  declaration: string
  localised: {
    subject: string
    preamble: string
    particulars: string[]
    prayer: string
    declaration: string
  } | null
  missing: string[]
}

type Props = {
  application: ApplicationBody
  applicationNumber?: string | null
  wardName: string
  wardId: string
  department: string
  language?: string | null
  isEmergency?: boolean
}

export default function ApplicationCard({
  application,
  applicationNumber,
  wardName,
  wardId,
  department,
  language,
  isEmergency,
}: Props) {
  // Default to the citizen's own language when we have it — the document is in
  // their name, so their language is the primary view, not a translation toggle
  // they have to discover.
  const hasLocal = Boolean(application.localised)
  const [showLocal, setShowLocal] = useState(hasLocal)
  const [copied, setCopied] = useState(false)

  const body = showLocal && application.localised ? application.localised : application
  const readTarget = [body.subject, body.preamble, ...body.particulars, body.prayer].join('. ')

  async function copyRef() {
    if (!applicationNumber) return
    try {
      await navigator.clipboard.writeText(applicationNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard blocked */ }
  }

  return (
    <article className="rounded-[20px] border border-ink/12 bg-white overflow-hidden">
      {/* ── Header rule ─────────────────────────────────────────────── */}
      <header className="px-5 pt-4 pb-3.5 border-b-[2.5px] border-double border-ink/15">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[9.5px] font-bold tracking-[0.24em] uppercase text-saffron-dark">
              Grievance application
            </div>
            <h2
              className="text-[15px] leading-snug font-semibold text-ink mt-1.5"
              style={{ fontFamily: 'Source Serif 4, Georgia, serif' }}
              lang={showLocal ? language ?? undefined : 'en'}
            >
              {body.subject}
            </h2>
          </div>

          {hasLocal && (
            <button
              type="button"
              onClick={() => setShowLocal((v) => !v)}
              className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold
                         border border-ink/15 text-ink/50 hover:text-ink/80 hover:border-ink/30
                         transition-colors"
            >
              {showLocal ? 'English' : 'मराठी'}
            </button>
          )}
        </div>
      </header>

      {/* ── Reference block ─────────────────────────────────────────── */}
      <dl className="px-5 py-3 bg-paper/70 border-b border-ink/8 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
        {applicationNumber && (
          <>
            <dt className="text-[10px] uppercase tracking-[0.14em] text-ink/40 self-center">Reference</dt>
            <dd className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-[11.5px] text-navy tracking-tight truncate">
                {applicationNumber}
              </span>
              <button
                type="button"
                onClick={copyRef}
                className="shrink-0 text-[10px] font-semibold text-ink/35 hover:text-ink/70 transition-colors"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </dd>
          </>
        )}
        <dt className="text-[10px] uppercase tracking-[0.14em] text-ink/40">Ward</dt>
        <dd className="text-[11.5px] text-ink/75">{wardName} · Ward {wardId}</dd>
        <dt className="text-[10px] uppercase tracking-[0.14em] text-ink/40">Department</dt>
        <dd className="text-[11.5px] text-ink/75">{department}</dd>
      </dl>

      {/* ── Body ────────────────────────────────────────────────────── */}
      <div
        className="px-5 py-4 space-y-4"
        style={{ fontFamily: 'Source Serif 4, Georgia, serif' }}
        lang={showLocal ? language ?? undefined : 'en'}
      >
        <p className="text-[13.5px] leading-[1.65] text-ink/80">{body.preamble}</p>

        {body.particulars.length > 0 && (
          <section>
            <h3 className="text-[9.5px] font-bold tracking-[0.2em] uppercase text-ink/35 mb-2"
                style={{ fontFamily: 'Inter, sans-serif' }}>
              Particulars
            </h3>
            <ol className="space-y-2">
              {body.particulars.map((p, i) => (
                <li key={i} className="flex gap-3 text-[13.5px] leading-[1.6] text-ink/85">
                  <span className="shrink-0 text-ink/30 tabular-nums font-medium pt-px"
                        style={{ fontFamily: 'Inter, sans-serif' }}>
                    {i + 1}.
                  </span>
                  <span>{p}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="pt-1">
          <h3 className="text-[9.5px] font-bold tracking-[0.2em] uppercase text-ink/35 mb-2"
              style={{ fontFamily: 'Inter, sans-serif' }}>
            Relief sought
          </h3>
          <p className="text-[13.5px] leading-[1.65] text-ink font-medium">{body.prayer}</p>
        </section>

        <p className="text-[11.5px] leading-[1.6] text-ink/45 pt-1 border-t border-ink/8">
          {body.declaration}
        </p>
      </div>

      {/* ── Gaps the officer will need filled ───────────────────────── */}
      {application.missing.length > 0 && (
        <div className="px-5 py-3 border-t border-ink/8 bg-ink/[0.015]">
          <h3 className="text-[9.5px] font-bold tracking-[0.2em] uppercase text-ink/35 mb-1.5">
            Not stated in your report
          </h3>
          <p className="text-[11.5px] leading-relaxed text-ink/55">
            {application.missing.join(' · ')}
          </p>
          <p className="text-[10.5px] text-ink/35 mt-1.5 leading-snug">
            The ward office may ask for these. Nothing has been assumed on your behalf.
          </p>
        </div>
      )}

      {/* ── Actions ─────────────────────────────────────────────────── */}
      <footer className="px-5 py-3 border-t border-ink/8 flex items-center gap-2">
        <ListenButton
          text={readTarget}
          language={showLocal ? language ?? 'en-IN' : 'en-IN'}
          label="Hear it read"
        />
        {isEmergency && (
          <span className="ml-auto text-[10px] font-bold tracking-wide uppercase text-red-700">
            Urgent · escalated
          </span>
        )}
      </footer>
    </article>
  )
}
