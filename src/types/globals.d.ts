// src/types/globals.d.ts

// This allows you to use window.fbq without TypeScript errors.
interface Window {
  fbq?: (...args: unknown[]) => void;
  _fbq?: (...args: unknown[]) => void;
}
