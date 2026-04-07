/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    outputFileTracingIncludes: {
      '/api/invoices/[id]/pdf': ['./public/fonts/**'],
      '/api/quotes/[id]/pdf': ['./public/fonts/**'],
    },
  },
};

export default nextConfig;
