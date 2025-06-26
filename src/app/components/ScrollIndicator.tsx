"use client";

import { useEffect, useState, useRef } from "react";
import { gsap } from "gsap";
import { usePathname } from "next/navigation";
import Link from "next/link";

const ShopButton = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Only show on home page
  const shouldShow = pathname === "/";

  useEffect(() => {
    if (!shouldShow) return;

    // Listen for scroll events
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;

      if (!hasScrolled && scrollY > 10) {
        setHasScrolled(true);

        // Wait 2 seconds after scroll, then fade in the shop button
        setTimeout(() => {
          setIsVisible(true);
          if (buttonRef.current) {
            gsap.fromTo(
              buttonRef.current,
              { opacity: 0, y: 20 },
              {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: "power2.out",
              }
            );
          }
        }, 2000);
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
    };
  }, [shouldShow, hasScrolled]);

  if (!shouldShow || !isVisible) return null;

  return (
    <div
      ref={buttonRef}
      className="fixed bottom-[20%] right-[8%] z-[100] opacity-0"
    >
      <Link
        href="/product-listing"
        className="bg-black text-white px-6 py-3 text-base font-medium tracking-wider lowercase hover:bg-gray-800 transition-colors duration-300 cursor-default"
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
  const messageRef = useRef<HTMLDivElement>(null);
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

  // Start bobbing animation when component becomes visible
  useEffect(() => {
    if (isVisible && messageRef.current && !bobbingAnimationRef.current) {
      bobbingAnimationRef.current = gsap.to(messageRef.current, {
        x: "12px",
        duration: 1.75,
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
        className="fixed bottom-[20%] right-[8%] z-[100] pointer-events-none"
      >
        <div ref={messageRef} className="flex items-center">
          <div className="text-black text-base font-medium tracking-wider lowercase">
            swipe down to see more {">"}
            {">"}
            {">"}
          </div>
        </div>
      </div>
      <ShopButton />
    </>
  );
};

export default ScrollIndicator;
