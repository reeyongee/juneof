"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// Mobile detection hook
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const userAgent =
        navigator.userAgent ||
        navigator.vendor ||
        (window as unknown as { opera?: string }).opera ||
        "";
      const mobileRegex =
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
      const isMobileDevice = mobileRegex.test(userAgent.toLowerCase());
      const isSmallScreen = window.innerWidth <= 768; // Consider screens <= 768px as mobile

      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    return () => {
      window.removeEventListener("resize", checkDevice);
    };
  }, []);

  return isMobile;
};

interface ViewportDimensions {
  width: number;
  height: number;
}

interface UseViewportHeightReturn {
  dimensions: ViewportDimensions;
  isMobile: boolean;
  isInitialized: boolean;
}

export const useViewportHeight = (): UseViewportHeightReturn => {
  const isMobile = useIsMobile();
  const [dimensions, setDimensions] = useState<ViewportDimensions>({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Store the last height for threshold comparison
  const lastHeightRef = useRef<number>(0);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Threshold for mobile - dual toolbars (top + bottom) can be 120-140px, so 150px is safe
  const MOBILE_THRESHOLD = 150;

  // Debounce delay for desktop
  const DESKTOP_DEBOUNCE_DELAY = 150;

  const updateDimensions = useCallback(
    (forceUpdate = false) => {
      const currentWidth = window.innerWidth;
      const currentHeight = window.innerHeight;

      if (!isInitialized) {
        // First initialization - always set dimensions
        setDimensions({ width: currentWidth, height: currentHeight });
        lastHeightRef.current = currentHeight;
        setIsInitialized(true);
        return;
      }

      if (isMobile) {
        // Mobile: Only update if change is substantial or width changed (orientation)
        const heightDiff = Math.abs(currentHeight - lastHeightRef.current);
        const isSubstantialChange = heightDiff > MOBILE_THRESHOLD;
        const isOrientationChange = currentWidth !== dimensions.width;

        if (forceUpdate || isSubstantialChange || isOrientationChange) {
          setDimensions({ width: currentWidth, height: currentHeight });
          lastHeightRef.current = currentHeight;

          console.log("[ViewportHeight] Mobile update triggered:", {
            reason: forceUpdate
              ? "forced"
              : isOrientationChange
                ? "orientation"
                : "substantial",
            heightDiff,
            newDimensions: { width: currentWidth, height: currentHeight },
          });
        } else {
          console.log("[ViewportHeight] Mobile update ignored:", {
            heightDiff,
            threshold: MOBILE_THRESHOLD,
            currentHeight,
            storedHeight: lastHeightRef.current,
          });
        }
      } else {
        // Desktop: Always update (normal responsive behavior)
        setDimensions({ width: currentWidth, height: currentHeight });
        lastHeightRef.current = currentHeight;

        console.log("[ViewportHeight] Desktop update:", {
          newDimensions: { width: currentWidth, height: currentHeight },
        });
      }
    },
    [isMobile, dimensions.width, isInitialized]
  );

  const handleResize = useCallback(() => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }

    if (isMobile) {
      // Mobile: Apply threshold logic immediately (no debounce needed for threshold checks)
      updateDimensions();
    } else {
      // Desktop: Debounce to avoid excessive calls during window dragging
      resizeTimeoutRef.current = setTimeout(() => {
        updateDimensions();
      }, DESKTOP_DEBOUNCE_DELAY);
    }
  }, [isMobile, updateDimensions]);

  // Handle mobile/desktop transitions
  useEffect(() => {
    // Force update when switching between mobile/desktop
    updateDimensions(true);
  }, [isMobile, updateDimensions]);

  useEffect(() => {
    // Initial setup
    if (!isInitialized) {
      updateDimensions();
    }

    // Add resize listener
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [handleResize, isInitialized, updateDimensions]);

  return {
    dimensions,
    isMobile,
    isInitialized,
  };
};
