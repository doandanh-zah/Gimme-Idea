// Critical polyfills that MUST run before any other code
// This file is imported first in ClientLayout and injected via webpack

(function() {
  'use strict';
  
  if (typeof window === 'undefined') return;

  // Polyfill global
  if (typeof window.global === 'undefined') {
    window.global = window;
  }

  // Polyfill globalThis  
  if (typeof window.globalThis === 'undefined') {
    window.globalThis = window;
  }

  // Polyfill process with more complete mock
  if (typeof window.process === 'undefined') {
    window.process = {
      env: {},
      version: 'v16.0.0',
      versions: { node: '16.0.0' },
      browser: true,
      platform: 'browser',
      argv: [],
      pid: 1,
      title: 'browser',
      nextTick: function(fn) {
        Promise.resolve().then(fn);
      },
      cwd: function() { return '/'; },
      exit: function() {},
      umask: function() { return 0; }
    };
  }

  // Ensure Buffer is available before any module tries to use it
  if (typeof window.Buffer === 'undefined') {
    // Try to import buffer polyfill
    try {
      const BufferPolyfill = require('buffer/').Buffer;
      window.Buffer = BufferPolyfill;
    } catch (e) {
      // Buffer will be provided by webpack ProvidePlugin later
      console.warn('[Polyfills] Buffer not yet available, will be provided by webpack');
    }
  }

  // Mark polyfills as loaded
  window.__POLYFILLS_LOADED__ = true;

  if (typeof console !== 'undefined' && console.log) {
    console.log('[Polyfills] ✓ Global polyfills loaded: global, globalThis, process');
  }
})();
