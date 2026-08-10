'use client'

import { useEffect, useState } from 'react'

// Registers the service worker and offers a one-tap "Add to Home Screen" so
// citizens can launch Sushaasan like an app — no store, no download.
// Android/Chrome: uses the native beforeinstallprompt.
// iOS/Safari: shows the manual Share → Add to Home Screen hint (iOS has no API).

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'sushaasan:a2hs-dismissed'

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [iosHint, setIosHint] = useState(false)

  useEffect(() => {
    // Register the service worker (enables installability + faster repeat loads).
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => { /* non-fatal */ })
    }

    // Already installed / running standalone → never prompt.
    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      // iOS Safari
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    if (standalone) return

    let dismissed = false
    try { dismissed = localStorage.getItem(DISMISS_KEY) === '1' } catch { /* private mode */ }
    if (dismissed) return

    // Don't fight the first-visit welcome overlay. If it hasn't been seen yet,
    // hold the install prompt until it's dismissed; otherwise show after a beat.
    let welcomePending = false
    try { welcomePending = localStorage.getItem('sushaasan_welcome_seen') !== '1' } catch { /* ignore */ }

    const reveal = (fn: () => void, delay: number) => {
      if (welcomePending) {
        const onWelcome = () => { window.setTimeout(fn, 1200) }
        window.addEventListener('sushaasan:welcome-dismissed', onWelcome, { once: true })
      } else {
        window.setTimeout(fn, delay)
      }
    }

    // Android / desktop Chrome: capture the install event for our own button.
    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      reveal(() => setShow(true), 3500)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)

    // iOS Safari: no install API — detect and show the manual hint instead.
    const ua = window.navigator.userAgent
    const isIOS = /iphone|ipad|ipod/i.test(ua)
    const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua)
    if (isIOS && isSafari) {
      reveal(() => { setIosHint(true); setShow(true) }, 4000)
    }

    const onInstalled = () => { setShow(false); setDeferred(null) }
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  function dismiss() {
    setShow(false)
    try { localStorage.setItem(DISMISS_KEY, '1') } catch { /* ignore */ }
  }

  async function install() {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice.catch(() => null)
    setDeferred(null)
    setShow(false)
  }

  if (!show) return null

  return (
    <div
      role="dialog"
      aria-label="Add Sushaasan to your home screen"
      // --mobile-sheet-h (set by MobilePanel, sheet + floating chip row
      // combined) already bakes in the sheet's own safe-area spacer, so we
      // only add an 8px gap here — no separate env(safe-area-inset-bottom)
      // term, or it'd double-count.
      className="fixed inset-x-0 z-[60] px-3 pointer-events-none
                bottom-[calc(var(--mobile-sheet-h,0px)_+_8px)]
                md:bottom-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <div className="pointer-events-auto mx-auto max-w-md bg-white rounded-2xl border border-ink/10
                      shadow-[0_-6px_32px_rgba(10,31,58,0.18)] p-3.5 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-saffron flex-shrink-0 flex items-center justify-center
                        text-white font-serif font-bold text-lg shadow-[0_2px_8px_rgba(255,153,51,0.35)]">
          स
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold text-ink leading-tight">Add Sushaasan to your phone</p>
          {iosHint ? (
            <p className="text-[11.5px] text-ink-3 mt-0.5 leading-snug">
              Tap <span aria-hidden>⎋</span> Share, then <b>Add to Home Screen</b> — opens instantly, no app store.
            </p>
          ) : (
            <p className="text-[11.5px] text-ink-3 mt-0.5 leading-snug">
              One tap to launch it full-screen like an app — no download.
            </p>
          )}
        </div>
        {!iosHint && deferred && (
          <button
            onClick={install}
            className="flex-shrink-0 px-3.5 py-2 rounded-full bg-saffron text-white text-[12.5px] font-semibold
                       active:scale-95 transition-transform"
          >
            Add
          </button>
        )}
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-ink/40 hover:bg-ink/5"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  )
}
