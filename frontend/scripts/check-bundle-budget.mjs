#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import vm from 'node:vm';

const root = process.cwd();
const requestedRoute = process.argv[2] || process.env.BUNDLE_BUDGET_ROUTE || '/idea/page';
const route = requestedRoute.endsWith('/page') ? requestedRoute : `${requestedRoute.replace(/\/$/, '')}/page`;
const maxGzipBytes = Number(process.env.BUNDLE_BUDGET_GZIP_BYTES || 320 * 1024);

function routeToManifestPath(routeName) {
  if (routeName === '/page') return path.join(root, '.next/server/app/page_client-reference-manifest.js');
  return path.join(
    root,
    '.next/server/app',
    routeName.replace(/^\//, '').replace(/\/page$/, ''),
    'page_client-reference-manifest.js'
  );
}

function readNext14RouteFiles() {
  const manifestPath = path.join(root, '.next/app-build-manifest.json');
  if (!fs.existsSync(manifestPath)) return null;

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  return manifest.pages?.[route] || null;
}

function readNext16RouteFiles() {
  const buildManifestPath = path.join(root, '.next/build-manifest.json');
  const clientManifestPath = routeToManifestPath(route);
  if (!fs.existsSync(buildManifestPath) || !fs.existsSync(clientManifestPath)) return null;

  const buildManifest = JSON.parse(fs.readFileSync(buildManifestPath, 'utf8'));
  const sandbox = { globalThis: { __RSC_MANIFEST: {} } };
  vm.runInNewContext(fs.readFileSync(clientManifestPath, 'utf8'), sandbox, {
    filename: clientManifestPath,
  });

  const clientManifest = sandbox.globalThis.__RSC_MANIFEST?.[route];
  if (!clientManifest) return null;

  const files = new Set(buildManifest.rootMainFiles || []);
  const routeSourceSuffix = `/app${route === '/page' ? '/page' : route}.tsx`;
  const requiredSourceSuffixes = [
    '/app/layout.tsx',
    '/app/globals.css',
    routeSourceSuffix,
  ];

  for (const [sourcePath, entry] of Object.entries(clientManifest.clientModules || {})) {
    if (!requiredSourceSuffixes.some((suffix) => sourcePath.endsWith(suffix))) continue;

    for (const chunk of entry.chunks || []) {
      if (typeof chunk === 'string' && chunk.startsWith('static/') && chunk.endsWith('.js')) {
        files.add(chunk);
      }
    }
  }

  return Array.from(files);
}

const files = readNext14RouteFiles() || readNext16RouteFiles();

if (!files?.length) {
  console.error(`Route ${route} was not found in a supported Next build manifest. Run \`npm run build\` first.`);
  process.exit(1);
}

let rawBytes = 0;
let gzipBytes = 0;

for (const file of files) {
  const absolute = path.join(root, '.next', file);
  if (!fs.existsSync(absolute)) continue;

  const buffer = fs.readFileSync(absolute);
  rawBytes += buffer.length;
  gzipBytes += zlib.gzipSync(buffer).length;
}

const formatKiB = (bytes) => `${(bytes / 1024).toFixed(1)} KiB`;

console.log(
  `${route}: ${formatKiB(gzipBytes)} gzip (${formatKiB(rawBytes)} raw), budget ${formatKiB(maxGzipBytes)} gzip`
);

if (gzipBytes > maxGzipBytes) {
  console.error(`Bundle budget exceeded for ${route}.`);
  process.exit(1);
}
