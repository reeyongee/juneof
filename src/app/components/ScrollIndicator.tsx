"use client";

import { useEffect, useState, useRef } from "react";
import { gsap } from "gsap";
import { usePathname } from "next/navigation";
import Link from "next/link";

const ShopButton = () => {
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const buttonRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Only show on home page
  const shouldShow = pathname === "/";

  useEffect(() => {
    if (!shouldShow) return;

    // Set initial opacity to 0
    if (buttonRef.current) {
      gsap.set(buttonRef.current, { opacity: 0 });
    }

    // Listen for scroll events
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      setScrollPosition(scrollY);

      if (!hasScrolled && scrollY > 10) {
        setHasScrolled(true);

        // Wait 1 second after scroll, then fade in the shop button
        setTimeout(() => {
          setIsVisible(true);
          if (buttonRef.current) {
            // Set initial opacity to 0, then animate to 1
            gsap.set(buttonRef.current, { opacity: 0 });
            gsap.to(buttonRef.current, {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: "power2.out",
            });
          }
        }, 1000); // Changed from 2000 to 1000 (1 second)
      }
    };

    // Add scroll listeners
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("scroll", handleScroll, { passive: true });

    // Listen for Lenis scroll events if available
    const checkLenis = () => {
      const lenis = (
        window as unknown as {
          lenis?: {
            on: (
              event: string,
              callback: (data: { scroll: number }) => void
            ) => void;
          };
        }
      ).lenis;
      if (lenis) {
        lenis.on("scroll", ({ scroll }: { scroll: number }) => {
          setScrollPosition(scroll);
          if (!hasScrolled && scroll > 10) {
            handleScroll();
          }
        });
      }
    };

    // Check for Lenis with delay to ensure it's loaded
    setTimeout(checkLenis, 500);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("scroll", handleScroll);
    };
  }, [shouldShow, hasScrolled]);

  if (!shouldShow || !isVisible) return null;

  // Calculate if we're in the first section (sticky) or should scroll with content
  const firstSectionHeight =
    typeof window !== "undefined" ? window.innerHeight : 800;
  const isInFirstSection = scrollPosition < firstSectionHeight;

  // Position classes based on section
  const positionClasses = isInFirstSection
    ? "fixed bottom-[20%] right-[8%] max-md:bottom-[10%] max-md:right-[5%]" // Sticky in first section
    : "absolute bottom-[20%] right-[8%] max-md:bottom-[10%] max-md:right-[5%]"; // Scrolls with content after first section

  return (
    <div
      ref={buttonRef}
      className={`${positionClasses} z-[100]`}
      style={{
        transform: !isInFirstSection
          ? `translateY(${scrollPosition - firstSectionHeight}px)`
          : undefined,
      }}
    >
      <Link
        href="/product-listing"
        className="bg-black text-white px-6 py-3 text-base font-medium tracking-wider lowercase hover:bg-gray-800 transition-colors duration-300 cursor-pointer max-md:px-4 max-md:py-2 max-md:text-sm"
      >
        shop
      </Link>
    </div>
  );
};

const ScrollIndicator = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);
  const bobbingAnimationRef = useRef<gsap.core.Tween | null>(null);
  const pathname = usePathname();

  // Only show on home page
  const shouldShow = pathname === "/";

  useEffect(() => {
    if (!shouldShow) return;

    // Show indicator immediately
    setIsVisible(true);

    // Listen for scroll events
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;

      if (!hasScrolled && scrollY > 10) {
        setHasScrolled(true);

        // Stop bobbing animation
        if (bobbingAnimationRef.current) {
          bobbingAnimationRef.current.kill();
          bobbingAnimationRef.current = null;
        }

        // Fade out quickly
        if (indicatorRef.current) {
          gsap.to(indicatorRef.current, {
            opacity: 0,
            duration: 0.3,
            ease: "power2.out",
            onComplete: () => {
              setIsVisible(false);
            },
          });
        }
      }
    };

    // Add scroll listeners
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("scroll", handleScroll, { passive: true });

    // Listen for Lenis scroll events if available
    const checkLenis = () => {
      const lenis = (
        window as unknown as {
          lenis?: {
            on: (
              event: string,
              callback: (data: { scroll: number }) => void
            ) => void;
          };
        }
      ).lenis;
      if (lenis) {
        lenis.on("scroll", ({ scroll }: { scroll: number }) => {
          if (!hasScrolled && scroll > 10) {
            handleScroll();
          }
        });
      }
    };

    // Check for Lenis with delay to ensure it's loaded
    setTimeout(checkLenis, 500);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("scroll", handleScroll);
      if (bobbingAnimationRef.current) {
        bobbingAnimationRef.current.kill();
        bobbingAnimationRef.current = null;
      }
    };
  }, [shouldShow, hasScrolled]);

  // Start vertical bobbing animation with more prominent movement
  useEffect(() => {
    if (isVisible && arrowRef.current && !bobbingAnimationRef.current) {
      bobbingAnimationRef.current = gsap.to(arrowRef.current, {
        y: "20px", // Increased from 8px to 20px for more prominent movement
        duration: 1.2, // Slightly faster for better rhythm
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    }

    return () => {
      if (bobbingAnimationRef.current) {
        bobbingAnimationRef.current.kill();
        bobbingAnimationRef.current = null;
      }
    };
  }, [isVisible]);

  if (!shouldShow || !isVisible) return null;

  return (
    <>
      <div
        ref={indicatorRef}
        className="fixed bottom-[15%] right-[8%] z-[100] pointer-events-none max-md:bottom-[5%] max-md:right-[5%]"
      >
        <div ref={arrowRef} className="flex items-center justify-center">
          <div className="text-black text-6xl font-light max-md:text-5xl leading-none">
            ↓
          </div>
        </div>
      </div>
      <ShopButton />
    </>
  );
};

export default ScrollIndicator;
