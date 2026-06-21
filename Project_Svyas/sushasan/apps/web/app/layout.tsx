import type { Metadata, Viewport } from 'next'
import { Inter, Source_Serif_4 } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { SmoothScroll } from '@/components/ui/SmoothScroll'
import { InstallPrompt } from '@/components/pwa/InstallPrompt'
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
  themeColor: '#FF9933',
}

export const metadata: Metadata = {
  title: { default: 'Sushaasan — Civic Intelligence for Pune', template: '%s | Sushaasan' },
  description: 'AI-powered ward map turning public civic signal into government action across Pune — transparent, structured, and built for every ward.',
  metadataBase: new URL('https://sushaasan.in'),
  manifest: '/manifest.webmanifest',
  applicationName: 'Sushaasan',
  appleWebApp: {
    capable: true,
    title: 'Sushaasan',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon-180.png', sizes: '180x180', type: 'image/png' }],
  },
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
    <html lang="en" className={`${inter.variable} ${sourceSerif.variable}`}>
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
        <InstallPrompt />
        <Analytics />
        <Toaster position="bottom-center" toastOptions={{ style: { background: '#0B1F3A', color: '#FAFAF7', border: 'none' } }} />
      </body>
    </html>
  )
}
