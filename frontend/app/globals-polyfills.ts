"use client";

// Polyfill minimal Node globals expected by some third-party libs when running in the browser.
// This file must be imported before other client code so `global` exists synchronously.
if (typeof window !== "undefined") {
  if (typeof (window as any).global === "undefined") {
    (window as any).global = window;
  }

  // Attach a browser-friendly Buffer implementation if available.
  // Use dynamic import so bundlers that provide a polyfill for 'buffer' will resolve it.
  import("buffer")
    .then(({ Buffer }) => {
      (window as any).Buffer = (window as any).Buffer || Buffer;
    })
    .catch(() => {
      // ignore if buffer polyfill isn't available
    });
}
