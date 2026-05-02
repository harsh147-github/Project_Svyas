/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { domains: [] },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'maplibre-gl']
    }
    return config
  },
  /**
   * Framer landing proxy — MUST live in Next `afterFiles`, not only vercel.json.
   * Edge-level vercel rewrites can win before Route Handlers and cause `/api/*` to 404.
   * afterFiles runs after App Router API routes are matched, so `/api/health` always hits Next.
   */
  async rewrites() {
    const framer = 'https://novel-confidence-702589.framer.app'
    return {
      beforeFiles: [],
      afterFiles: [
        {
          source: '/',
          destination: `${framer}/`,
        },
        {
          source: '/:path((?!dashboard|api|geojson|_next|data).+)',
          destination: `${framer}/:path`,
        },
      ],
      fallback: [],
    }
  },
}

export default nextConfig
