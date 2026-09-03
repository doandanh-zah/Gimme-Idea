import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@gimme-idea/ui', '@gimme-idea/contracts', '@gimme-idea/solana'],
  experimental: { optimizePackageImports: ['lucide-react'] },
};
export default nextConfig;
