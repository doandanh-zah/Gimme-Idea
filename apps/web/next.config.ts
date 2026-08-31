import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@gimme-idea/ui', '@gimme-idea/contracts'],
  experimental: { optimizePackageImports: ['lucide-react'] },
};
export default nextConfig;
