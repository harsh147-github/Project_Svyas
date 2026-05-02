'use client'

export function FindMyWardButton() {
  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent('sushasan:find-my-ward'))}
      className="flex items-center gap-2 px-5 py-2.5 rounded-full
                 bg-saffron text-white font-semibold text-sm shadow-lg
                 hover:bg-saffron-dark active:scale-95 transition-all"
    >
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
        <circle cx="8" cy="8" r="3" fill="currentColor" />
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
        <line x1="8" y1="0" x2="8" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="8" y1="13" x2="8" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="0" y1="8" x2="3" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="13" y1="8" x2="16" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      Find my ward
    </button>
  )
}
