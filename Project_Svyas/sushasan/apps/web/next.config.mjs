/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { domains: [] },
  experimental: {
    externalDir: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'maplibre-gl']
    }
    return config
  },
}

export default nextConfig
