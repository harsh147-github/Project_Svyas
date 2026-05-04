import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { domains: [] },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'maplibre-gl']
    }
    // Resolve packages from apps/web/node_modules for code in packages/ and workers/
    config.resolve.modules = [
      resolve(__dirname, 'node_modules'),
      'node_modules',
      ...(config.resolve.modules || []),
    ]
    return config
  },
}

export default nextConfig
