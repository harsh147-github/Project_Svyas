'use client'

import { useRef, useState } from 'react'

type Turn = { role: 'user' | 'assistant'; content: string; label?: string }

const QUICK: { key: string; label: string; icon: string }[] = [
  { key: 'root_cause', label: 'Root-cause analysis', icon: '🔬' },
  { key: 'department', label: 'Who owns this · who to call', icon: '🏛️' },
  { key: 'work_order', label: 'Draft work order', icon: '📋' },
  { key: 'cost_breakdown', label: 'Break down the cost', icon: '₹' },
  { key: 'precedent', label: 'How other wards solved it', icon: '🧭' },
  { key: 'citizen_update', label: 'Draft citizen update', icon: '📣' },
  { key: 'risks', label: 'Risks if ignored', icon: '⚠️' },
  { key: 'escalation', label: 'Draft escalation note', icon: '⬆️' },
]

export function WarRoomCopilot({ missionId, token }: { missionId: string; token: string }) {
  const [turns, setTurns] = useState<Turn[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  async function ask(payload: { question?: string; quickAction?: string }, label: string) {
    if (busy) return
    setBusy(true); setError(null)
    const history = turns.map((t) => ({ role: t.role, content: t.content }))
    setTurns((prev) => [...prev, { role: 'user', content: label, label }])
    // smooth scroll after paint
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 9e9, behavior: 'smooth' }))
    try {
      const res = await fetch('/api/gov/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-gov-token': token },
        body: JSON.stringify({ missionId, history, ...payload }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? `Error ${res.status}`)
      setTurns((prev) => [...prev, { role: 'assistant', content: data.answer ?? '(no response)' }])
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
    ask({ question: q }, q)
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-saffron/20 border border-saffron/40 flex items-center justify-center">
          <span className="w-2.5 h-2.5 rounded-full bg-saffron animate-none" />
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-semibold text-white">Sushaasan AI</div>
          <div className="text-[10px] text-white/45 tracking-wide uppercase">Your grievance copilot</div>
        </div>
      </div>

      {/* Conversation */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
        {turns.length === 0 && (
          <div className="text-[12.5px] text-white/55 leading-relaxed">
            Ask anything about this grievance, or tap a quick action below. I&rsquo;ve read the full
            dossier — the reports, the severity, the budget, and the proposed plan. I&rsquo;ll help you
            dissect it, draft what you need, and decide the next move. You stay in command.
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

      {/* Quick actions */}
      <div className="px-3 pt-2.5 pb-1.5 border-t border-white/10">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1.5">
          {QUICK.map((q) => (
            <button
              key={q.key}
              onClick={() => ask({ quickAction: q.key }, q.label)}
              disabled={busy}
              className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full
                         bg-white/[0.06] hover:bg-white/[0.12] border border-white/10
                         text-[11px] font-medium text-white/80 whitespace-nowrap
                         disabled:opacity-40 transition-colors active:scale-95"
            >
              <span aria-hidden>{q.icon}</span>{q.label}
            </button>
          ))}
        </div>
        {/* Free input */}
        <form onSubmit={submitFree} className="flex items-center gap-2 pt-1.5 pb-1">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Sushaasan AI about this grievance…"
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
