import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { SmoothScroll } from '@/components/ui/SmoothScroll'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: { default: 'Sushasan — Civic Intelligence for Pune', template: '%s | Sushasan' },
  description: 'AI-powered ward map turning public civic signal into government action. NIBM · Wanowrie · Tribeca pilot.',
  metadataBase: new URL('https://sushasan.in'),
  openGraph: { siteName: 'Sushasan', type: 'website', locale: 'en_IN' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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
      </body>
    </html>
  )
}
