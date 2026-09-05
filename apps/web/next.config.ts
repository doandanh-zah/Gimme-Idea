import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: ['127.0.0.1'],
  transpilePackages: ['@gimme-idea/ui', '@gimme-idea/contracts', '@gimme-idea/solana'],
  experimental: { optimizePackageImports: ['lucide-react'] },
};
export default nextConfig;
