"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function SmoothScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Register ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);

    // Helper for discrete scrolling
    const enhanceSnapScrolling = () => {
      // Wait for a bit to ensure DOM is ready
      const timeoutId = setTimeout(() => {
        const snapContainer = document.querySelector(".snap-container");
        if (!snapContainer) return;

        let isScrolling = false;
        let scrollTimeout: NodeJS.Timeout;

        // Handle wheel events to make scrolling more discrete
        const handleWheel = (e: WheelEvent) => {
          // Don't handle if already scrolling
          if (isScrolling) {
            e.preventDefault();
            return;
          }

          const direction = e.deltaY > 0 ? 1 : -1;
          const sections = document.querySelectorAll(".snap-section");

          // Get current section
          const scrollTop =
            window.pageYOffset || document.documentElement.scrollTop;
          const windowHeight = window.innerHeight;
          const currentIndex = Math.round(scrollTop / windowHeight);

          // Calculate target section
          const targetIndex = Math.max(
            0,
            Math.min(sections.length - 1, currentIndex + direction)
          );
          const targetSection = sections[targetIndex] as HTMLElement;

          if (targetSection && currentIndex !== targetIndex) {
            e.preventDefault();
            isScrolling = true;

            // Scroll to the target section
            targetSection.scrollIntoView({ behavior: "smooth" });

            // Reset scrolling flag after animation completes
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
              isScrolling = false;
            }, 800); // Adjust timing as needed
          }
        };

        // Only use the wheel handler on desktop
        const mediaQuery = window.matchMedia("(min-width: 768px)");
        if (mediaQuery.matches) {
          window.addEventListener("wheel", handleWheel, { passive: false });
        }

        // Return cleanup function
        return () => {
          if (typeof window !== "undefined") {
            window.removeEventListener("wheel", handleWheel);
            clearTimeout(scrollTimeout);
          }
        };
      }, 500);

      // Return cleanup for the timeout
      return () => {
        clearTimeout(timeoutId);
      };
    };

    // Initialize the enhancement
    const cleanup = enhanceSnapScrolling();

    return () => {
      // Clean up
      cleanup();
    };
  }, []);

  return <>{children}</>;
}
