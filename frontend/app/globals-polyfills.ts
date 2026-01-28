"use client";

// Note: Global polyfills (global, Buffer, process) are now handled via:
// 1. Webpack ProvidePlugin in next.config.js (automatically injects Buffer and process)
// 2. Inline script in layout.tsx (sets window.global before any bundles load)
// 
// This file is kept for backward compatibility but is no longer required for polyfills.
// If needed in the future, additional client-side polyfills can be added here.
