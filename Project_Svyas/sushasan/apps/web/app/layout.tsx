import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { SmoothScroll } from '@/components/ui/SmoothScroll'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: { default: 'Sushaasan — Civic Intelligence for Pune', template: '%s | Sushaasan' },
  description: 'AI-powered ward map turning public civic signal into government action across Pune — transparent, structured, and built for every ward.',
  metadataBase: new URL('https://sushaasan.in'),
  openGraph: {
    siteName: 'Sushaasan',
    type: 'website',
    locale: 'en_IN',
    title: 'Sushaasan — Civic Intelligence for Pune',
    description: 'AI-powered civic issue detection, mapping & resolution tracking for Pune. Real-time ward-level intelligence.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Sushaasan civic intelligence map' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sushaasan — Civic Intelligence for Pune',
    description: 'AI-powered civic issue detection, mapping & resolution tracking for Pune.',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          defer
          data-domain={process.env.PLAUSIBLE_DOMAIN ?? 'sushaasan.in'}
          src="https://plausible.io/js/script.js"
        />
      </head>
      <body>
        <SmoothScroll />
        {children}
        <Analytics />
        <Toaster position="bottom-center" toastOptions={{ style: { background: '#0B1F3A', color: '#FAFAF7', border: 'none' } }} />
      </body>
    </html>
  )
}
