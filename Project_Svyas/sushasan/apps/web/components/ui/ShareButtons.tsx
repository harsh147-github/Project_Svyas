'use client'
import { useState } from 'react'

interface ShareButtonsProps {
  url: string       // path like '/dashboard/nibm'
  title: string
  description?: string
  compact?: boolean // small icons only mode
}

export function ShareButtons({ url, title, description, compact = false }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)
  const fullUrl = `https://sushaasan.in${url}`
  const text = description ? `${title} — ${description}` : title

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(text + '\n\n' + fullUrl)}`, '_blank')
  }

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(fullUrl)}`, '_blank')
  }

  // Robust copy: modern Clipboard API can throw (blocked permission, insecure
  // context, unfocused doc) — fall back to legacy execCommand, and always give
  // the user feedback instead of silently failing.
  const copyLink = async () => {
    let ok = false
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(fullUrl)
        ok = true
      }
    } catch { /* fall through to legacy path */ }
    if (!ok) {
      try {
        const ta = document.createElement('textarea')
        ta.value = fullUrl
        ta.style.position = 'fixed'
        ta.style.top = '0'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.focus()
        ta.select()
        ok = document.execCommand('copy')
        document.body.removeChild(ta)
      } catch { ok = false }
    }
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } else {
      setCopyFailed(true)
      setTimeout(() => setCopyFailed(false), 2500)
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <button onClick={shareWhatsApp} className="w-7 h-7 rounded-full bg-[#25D366] text-white flex items-center justify-center text-xs hover:scale-110 transition-transform" title="Share on WhatsApp" aria-label="Share on WhatsApp">W</button>
        <button onClick={shareTwitter} className="w-7 h-7 rounded-full bg-[#0B1F3A] text-white flex items-center justify-center text-xs hover:scale-110 transition-transform" title="Share on X/Twitter" aria-label="Share on X / Twitter">𝕏</button>
        <button onClick={copyLink} className="w-7 h-7 rounded-full bg-ink/8 text-ink/60 flex items-center justify-center text-xs hover:scale-110 transition-transform" title="Copy link" aria-label={copied ? 'Link copied' : copyFailed ? 'Copy failed' : 'Copy link'}>{copied ? '✓' : copyFailed ? '✕' : '🔗'}</button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[10px] text-ink/40 uppercase tracking-wider font-semibold">Share:</span>
      <button onClick={shareWhatsApp} className="whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#25D366]/10 text-[#25D366] text-xs font-semibold hover:bg-[#25D366]/20 transition-colors">
        WhatsApp
      </button>
      <button onClick={shareTwitter} className="whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0B1F3A]/8 text-[#0B1F3A] text-xs font-semibold hover:bg-[#0B1F3A]/15 transition-colors">
        X / Twitter
      </button>
      <button onClick={copyLink} className="whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ink/6 text-ink/60 text-xs font-semibold hover:bg-ink/10 transition-colors">
        {copied ? '✓ Copied' : copyFailed ? 'Press & hold to copy' : 'Copy link'}
      </button>
    </div>
  )
}
