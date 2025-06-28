// src/lib/meta-pixel.ts

// The Meta Pixel ID from your Meta Events Manager
export const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

// Standard event types for Meta Pixel
type StandardEvent =
  | "ViewContent"
  | "AddToCart"
  | "InitiateCheckout"
  | "Purchase";

// Type for event parameters
interface EventParams {
  content_ids?: (string | undefined)[];
  content_name?: string;
  content_type?: string;
  currency?: string;
  value?: number;
  num_items?: number;
  [key: string]: unknown;
}

/**
 * Logs a standard PageView event.
 * This should be called on every route change.
 */
export const pageview = (): void => {
  if (typeof window !== "undefined" && window.fbq) {
    console.log("[Meta Pixel] Tracking PageView");
    window.fbq("track", "PageView");
  } else {
    console.warn(
      "[Meta Pixel] PageView not sent. window.fbq not available or not in browser environment."
    );
  }
};

/**
 * Tracks a standard Meta Pixel event.
 * @param eventName The name of the standard event to track.
 * @param params Additional parameters for the event.
 */
export const track = (eventName: StandardEvent, params: EventParams): void => {
  if (typeof window !== "undefined" && window.fbq && PIXEL_ID) {
    console.log(
      `[Meta Pixel] Tracking event "${eventName}" with params:`,
      params
    );
    window.fbq("track", eventName, params);
  } else {
    console.warn(`Meta Pixel event "${eventName}" not sent. Reasons:`, {
      windowExists: typeof window !== "undefined",
      fbqExists: typeof window !== "undefined" && !!window.fbq,
      pixelIdExists: !!PIXEL_ID,
      pixelId: PIXEL_ID || "Not set",
    });
  }
};

/**
 * Initialize Meta Pixel with debugging information
 */
export const initPixel = (): void => {
  if (typeof window !== "undefined") {
    if (PIXEL_ID) {
      console.log(`[Meta Pixel] Initializing with ID: ${PIXEL_ID}`);

      // Check if fbq is already loaded
      if (window.fbq) {
        console.log(
          "[Meta Pixel] fbq already exists, pixel likely already initialized"
        );
      } else {
        console.warn(
          "[Meta Pixel] fbq not found on window object. Make sure the Meta Pixel script is loaded."
        );
      }
    } else {
      console.error(
        "[Meta Pixel] NEXT_PUBLIC_META_PIXEL_ID environment variable not set"
      );
    }
  }
};

/**
 * Debug function to check Meta Pixel status
 */
export const debugPixel = (): void => {
  if (typeof window !== "undefined") {
    console.log("[Meta Pixel Debug] Status check:", {
      pixelId: PIXEL_ID || "Not set",
      fbqExists: !!window.fbq,
      fbqType: typeof window.fbq,
      windowLocation: window.location.href,
      userAgent: navigator.userAgent,
    });
  } else {
    console.log("[Meta Pixel Debug] Not in browser environment");
  }
};
