"use client";

import { useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Custom hook to detect mobile devices
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

    // Check on mount
    checkDevice();

    // Check on resize
    window.addEventListener("resize", checkDevice);

    return () => {
      window.removeEventListener("resize", checkDevice);
    };
  }, []);

  return isMobile;
};

interface LenisProviderProps {
  children: React.ReactNode;
}

export default function LenisProvider({ children }: LenisProviderProps) {
  const lenisRef = useRef<Lenis | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const isMobile = useIsMobile();

  // Function to initialize Lenis
  const initializeLenis = () => {
    if (lenisRef.current || isMobile) return; // Don't initialize if already exists or on mobile

    const lenis = new Lenis({
      duration: 1.5,
      easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      touchMultiplier: 2,
      infinite: false,
    });

    lenisRef.current = lenis;

    // Make lenis available globally for debugging
    (window as unknown as { lenis: Lenis }).lenis = lenis;

    // Integrate Lenis with GSAP ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    // Use requestAnimationFrame loop
    function raf(time: number) {
      if (lenisRef.current) {
        lenisRef.current.raf(time);
        rafIdRef.current = requestAnimationFrame(raf);
      }
    }
    rafIdRef.current = requestAnimationFrame(raf);
  };

  // Function to destroy Lenis
  const destroyLenis = () => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    if (lenisRef.current) {
      lenisRef.current.destroy();
      lenisRef.current = null;
    }

    // Clean up global reference
    delete (window as unknown as { lenis?: Lenis }).lenis;
  };

  // Handle mobile/desktop transitions
  useEffect(() => {
    if (isMobile) {
      // Destroy Lenis when going to mobile
      destroyLenis();
    } else {
      // Initialize Lenis when going to desktop (with delay to ensure DOM is ready)
      const timeoutId = setTimeout(() => {
        initializeLenis();
      }, 100);

      return () => {
        clearTimeout(timeoutId);
      };
    }

    // Cleanup function
    return () => {
      destroyLenis();
    };
  }, [isMobile]);

  return <>{children}</>;
}
