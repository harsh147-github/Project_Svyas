'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const STORAGE_KEY = 'sushaasan_welcome_seen'

export function FirstVisitOverlay() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setShow(true)
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setShow(false)
  }

  useEffect(() => {
    if (!show) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [show])

  if (!show || typeof document === 'undefined') return null

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        background: 'rgba(11,31,58,0.45)',
        backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        paddingTop: 'max(20px, env(safe-area-inset-top))',
        animation: 'fadeIn 0.3s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) dismiss() }}
    >
      <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
      <div
        style={{
          background: '#ffffff',
          borderRadius: 24,
          padding: 'max(2rem, env(safe-area-inset-top)) clamp(1rem, 5vw, 2rem) 1.75rem',
          maxWidth: 440,
          width: 'min(440px, calc(100vw - 2rem))',
          boxShadow: '0 24px 80px rgba(11,31,58,0.22)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={dismiss}
          style={{
            position: 'absolute', top: 16, right: 16,
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(10,10,10,0.06)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, color: 'rgba(10,10,10,0.5)',
          }}
          aria-label="Close"
        >✕</button>

        {/* Logo mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: '#FF9933',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 16, fontFamily: 'serif',
          }}>स</div>
          <div>
            <div style={{ fontFamily: 'serif', fontWeight: 600, fontSize: 16, color: '#0A0A0A', lineHeight: 1 }}>Sushaasan</div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', color: 'rgba(10,10,10,0.4)', textTransform: 'uppercase', marginTop: 2 }}>Civic Intelligence · Pune</div>
          </div>
        </div>

        {/* Headline */}
        <h2 style={{
          fontFamily: 'serif', fontSize: 26, fontWeight: 600,
          color: '#0A0A0A', lineHeight: 1.2, margin: '0 0 12px',
        }}>
          Civic intelligence<br />for Pune.
        </h2>

        {/* Body */}
        <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(10,10,10,0.6)', margin: '0 0 24px' }}>
          Sushaasan reads public posts about civic issues and turns them into structured, budgeted briefs for your ward office — so problems get solved, not just reported.
        </p>

        {/* Pilot badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,153,51,0.08)', border: '1px solid rgba(255,153,51,0.25)',
          borderRadius: 999, padding: '5px 12px', marginBottom: 24,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#138808', display: 'inline-block' }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(10,10,10,0.5)' }}>
            Pilot · NIBM · Kondhwa · Wanowrie
          </span>
        </div>

        {/* CTA */}
        <button
          onClick={dismiss}
          style={{
            width: '100%', padding: '14px 20px', borderRadius: 14, border: 'none',
            background: '#FF9933', color: '#fff', fontWeight: 700, fontSize: 15,
            cursor: 'pointer', letterSpacing: '0.01em',
            boxShadow: '0 4px 18px rgba(255,153,51,0.4)',
            minHeight: 44,
          }}
        >
          See the Map ↓
        </button>
      </div>
    </div>,
    document.body
  )
}
