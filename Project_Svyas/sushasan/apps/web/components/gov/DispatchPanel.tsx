'use client'

import { useState } from 'react'

// The "missile" — share the grievance brief to the ward officer via the channel
// they actually use: WhatsApp, email, or a copied deep link to the War Room.
export function DispatchPanel({
  subject, whatsappText, link,
}: { subject: string; whatsappText: string; link: string }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState<'link' | 'msg' | null>(null)

  const waUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`
  const mailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(whatsappText)}`

  async function copy(text: string, which: 'link' | 'msg') {
    let ok = false
    try { await navigator.clipboard.writeText(text); ok = true } catch { /* fallback */ }
    if (!ok) {
      try {
        const ta = document.createElement('textarea'); ta.value = text
        ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta)
        ta.select(); ok = document.execCommand('copy'); document.body.removeChild(ta)
      } catch { ok = false }
    }
    if (ok) { setCopied(which); setTimeout(() => setCopied(null), 2000) }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14]
                   border border-white/15 text-[11.5px] font-semibold text-white/85 transition-colors"
      >
        <span aria-hidden>🚀</span> Dispatch brief
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-[260px] rounded-2xl border border-white/15
                          bg-[#0E1A30] shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-3 space-y-1.5">
            <div className="text-[10px] font-bold tracking-[0.16em] uppercase text-white/40 px-1 pb-1">
              Send to the ward office
            </div>
            <a href={waUrl} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 transition-colors">
              <span className="w-7 h-7 rounded-full bg-[#25D366] text-white flex items-center justify-center text-xs font-bold">W</span>
              <span className="text-[12.5px] font-medium text-white/90">WhatsApp</span>
            </a>
            <a href={mailUrl}
               className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] transition-colors">
              <span className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-sm">✉</span>
              <span className="text-[12.5px] font-medium text-white/90">Email</span>
            </a>
            <button onClick={() => copy(link, 'link')}
               className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] transition-colors text-left">
              <span className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-sm">🔗</span>
              <span className="text-[12.5px] font-medium text-white/90">{copied === 'link' ? 'Link copied ✓' : 'Copy War Room link'}</span>
            </button>
            <button onClick={() => copy(whatsappText, 'msg')}
               className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] transition-colors text-left">
              <span className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-sm">📋</span>
              <span className="text-[12.5px] font-medium text-white/90">{copied === 'msg' ? 'Brief copied ✓' : 'Copy full brief'}</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
