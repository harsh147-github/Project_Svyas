'use client'

import { useRef, useState } from 'react'

type Turn = { role: 'user' | 'assistant'; content: string }

// City-wide openers. Unlike the War Room copilot these are not scoped to one
// mission — they map to the cross-ward tools the command agent actually has.
const STARTERS = [
  'Which 5 wards have the most severe unresolved issues right now?',
  'Show me every open water-supply cluster across the city.',
  'Has anything been dispatched to officials this week?',
  'Is the data pipeline healthy — any source stopped working?',
]

export function CommandAgentChat({ token }: { token: string }) {
  const [turns, setTurns] = useState<Turn[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  async function ask(question: string) {
    if (busy) return
    setBusy(true); setError(null)
    // The route reads the last 6 turns — send exactly that window so multi-turn
    // works without shipping the whole transcript on every request.
    const history = turns.slice(-6).map((t) => ({ role: t.role, content: t.content }))
    setTurns((prev) => [...prev, { role: 'user', content: question }])
    // smooth scroll after paint
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 9e9, behavior: 'smooth' }))
    try {
      const res = await fetch('/api/gov/command-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-gov-token': token },
        body: JSON.stringify({ question, history }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error ?? `Error ${res.status}`)
      setTurns((prev) => [...prev, { role: 'assistant', content: data?.answer ?? '(no response)' }])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusy(false)
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 9e9, behavior: 'smooth' }))
    }
  }

  function submitFree(e: React.FormEvent) {
    e.preventDefault()
    const q = input.trim()
    if (q.length < 3) return
    setInput('')
    ask(q)
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-saffron/20 border border-saffron/40 flex items-center justify-center">
          <span className="w-2.5 h-2.5 rounded-full bg-saffron animate-none" />
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-semibold text-white">Sushaasan Command Agent</div>
          <div className="text-[10px] text-white/45 tracking-wide uppercase">City-wide civic intelligence</div>
        </div>
      </div>

      {/* Conversation */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
        {turns.length === 0 && (
          <div className="text-[12.5px] text-white/55 leading-relaxed">
            Ask anything that spans wards — where the pressure is building, which issues are
            still open, what has already been dispatched, whether the signal pipeline is
            healthy. I read the live ward, cluster, mission and dispatch records, and I ground
            every figure in them. I research and draft; I cannot send or dispatch anything.
            You stay in command.
          </div>
        )}
        {turns.map((t, i) => (
          <div key={i} className={t.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div className={[
              'max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed whitespace-pre-wrap',
              t.role === 'user'
                ? 'bg-saffron text-white rounded-br-md'
                : 'bg-white/[0.07] text-white/90 border border-white/10 rounded-bl-md',
            ].join(' ')}>
              {t.content}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="bg-white/[0.07] border border-white/10 rounded-2xl rounded-bl-md px-3.5 py-2.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-saffron animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-saffron animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-saffron animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        {error && <div className="text-[12px] text-red-300/90">{error}</div>}
      </div>

      {/* Starter prompts */}
      <div className="px-3 pt-2.5 pb-1.5 border-t border-white/10">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1.5">
          {STARTERS.map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              disabled={busy}
              className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full
                         bg-white/[0.06] hover:bg-white/[0.12] border border-white/10
                         text-[11px] font-medium text-white/80 whitespace-nowrap
                         disabled:opacity-40 transition-colors active:scale-95"
            >
              {s}
            </button>
          ))}
        </div>
        {/* Free input */}
        <form onSubmit={submitFree} className="flex items-center gap-2 pt-1.5 pb-1">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the Command Agent about any ward…"
            className="flex-1 bg-white/[0.06] border border-white/10 rounded-full px-3.5 py-2.5
                       text-[12.5px] text-white placeholder:text-white/35
                       focus:outline-none focus:border-saffron/50"
          />
          <button
            type="submit"
            disabled={busy || input.trim().length < 3}
            aria-label="Send"
            className="flex-shrink-0 w-9 h-9 rounded-full bg-saffron text-white flex items-center justify-center
                       disabled:opacity-40 active:scale-95 transition-transform"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </button>
        </form>
      </div>
    </div>
  )
}
