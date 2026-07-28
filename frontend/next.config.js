const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getGitCommitSha() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function ensureNextPackageJson() {
  const nextDir = path.join(__dirname, '.next');
  fs.mkdirSync(nextDir, { recursive: true });
  fs.writeFileSync(path.join(nextDir, 'package.json'), `${JSON.stringify({ type: 'commonjs' })}\n`);
}

class EnsureNextPackageJsonPlugin {
  apply(compiler) {
    compiler.hooks.beforeCompile.tap('EnsureNextPackageJsonPlugin', ensureNextPackageJson);
    compiler.hooks.afterEmit.tap('EnsureNextPackageJsonPlugin', ensureNextPackageJson);
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  poweredByHeader: false,

  env: {
    NEXT_PUBLIC_GIT_COMMIT_SHA: process.env.NEXT_PUBLIC_GIT_COMMIT_SHA || getGitCommitSha(),
  },

  async headers() {
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "form-action 'self' mailto:",
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https: http://localhost:*",
      "font-src 'self' data: https://fonts.gstatic.com",
      [
        "connect-src 'self'",
        "http://localhost:*",
        "ws://localhost:*",
        "https://*.supabase.co",
        "wss://*.supabase.co",
        "https://www.google-analytics.com",
        "https://www.googletagmanager.com",
        "https://api.mainnet-beta.solana.com",
        "https://api.devnet.solana.com",
        "https://*.helius-rpc.com",
        "https://*.helius.xyz",
        "https://kora.lazorkit.com",
        "https://portal.lazor.sh",
      ].join(" "),
      [
        "frame-src 'self'",
        "https://accounts.google.com",
        "https://www.googletagmanager.com",
        "https://*.supabase.co",
        "https://portal.lazor.sh",
      ].join(" "),
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
          },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },

  webpack: (config, { isServer }) => {
    // Ignore pino-pretty warnings (optional dependency from wallet adapters)
    config.resolve.alias = {
      ...config.resolve.alias,
      'pino-pretty': false,
    };

    // Suppress warnings for optional dependencies
    config.ignoreWarnings = [
      { module: /node_modules\/pino/ },
      { module: /node_modules\/@walletconnect/ },
    ];

    config.plugins = [
      ...config.plugins,
      new EnsureNextPackageJsonPlugin(),
    ];

    // Fallback for browser-only wallet/web3 chunks.
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        buffer: require.resolve('buffer/'),
        crypto: false,
        stream: require.resolve('stream-browserify'),
        process: require.resolve('process/browser'),
        zlib: require.resolve('browserify-zlib'),
        util: require.resolve('util/'),
        assert: require.resolve('assert/'),
        fs: false,
        net: false,
        tls: false,
        path: false,
      };

      const webpack = require('webpack');

      // Provide browser-safe Node globals only where wallet/web3 chunks reference them.
      config.plugins = [
        ...config.plugins,
        new webpack.DefinePlugin({
          global: 'globalThis',
        }),
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        }),
      ];
    }

    return config;
  },

  // Suppress console warnings during build
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  // Optimize images
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96],
  },
};

module.exports = nextConfig;
