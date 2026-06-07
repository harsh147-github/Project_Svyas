import type { Metadata, Viewport } from 'next'
import { Inter, Source_Serif_4 } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { SmoothScroll } from '@/components/ui/SmoothScroll'
import '../styles/globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: { default: 'Sushasan — Civic Intelligence for Pune', template: '%s | Sushasan' },
  description: 'AI-powered ward map turning public civic signal into government action. NIBM · Wanowrie · Kondhwa pilot.',
  metadataBase: new URL('https://sushasan.in'),
  openGraph: {
    siteName: 'Sushasan',
    type: 'website',
    locale: 'en_IN',
    title: 'Sushasan — Civic Intelligence for Pune',
    description: 'AI-powered civic issue detection, mapping & resolution tracking for Pune. Real-time ward-level intelligence.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Sushasan civic intelligence map' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sushasan — Civic Intelligence for Pune',
    description: 'AI-powered civic issue detection, mapping & resolution tracking for Pune.',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${sourceSerif.variable}`}>
      <head>
        <script
          defer
          data-domain={process.env.PLAUSIBLE_DOMAIN ?? 'sushasan.in'}
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
