import type { MetadataRoute } from 'next'

// Installable PWA manifest — lets citizens "Add to Home Screen" and launch
// Sushaasan full-screen like a native app, no app store, no download.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Sushaasan — Civic Intelligence for Pune',
    short_name: 'Sushaasan',
    description:
      'Report civic issues in seconds and see them on a live ward map. AI turns public signal into government action across Pune.',
    id: '/',
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FAFAF7',
    theme_color: '#FF9933',
    lang: 'en-IN',
    categories: ['government', 'social', 'utilities'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    // Long-press the home-screen icon → jump straight into the action.
    shortcuts: [
      {
        name: 'Report an issue',
        short_name: 'Report',
        description: 'Report a civic problem in your area in seconds',
        url: '/add-report?source=shortcut',
        icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Live ward map',
        short_name: 'Map',
        description: "See what's happening across Pune wards",
        url: '/?source=shortcut',
        icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Transparency dashboard',
        short_name: 'Dashboard',
        description: 'Track issue status and resolutions',
        url: '/dashboard?source=shortcut',
        icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
    ],
  }
}
