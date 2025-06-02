"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";

interface SplashScreenProps {
  onLoadComplete: () => void;
}

export default function SplashScreen({ onLoadComplete }: SplashScreenProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [showWipeAnimation, setShowWipeAnimation] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const overlayPathRef = useRef<SVGPathElement | null>(null);
  const splashScreenRef = useRef<HTMLDivElement | null>(null);

  // Hide cursor during splash screen
  useEffect(() => {
    document.body.classList.add("splash-screen-active");

    return () => {
      document.body.classList.remove("splash-screen-active");
    };
  }, []);

  useEffect(() => {
    let progressValue = 0;

    // Function to check if page is fully loaded
    const checkPageLoad = () => {
      return new Promise<void>((resolve) => {
        const checkComplete = () => {
          // Check document ready state
          if (document.readyState !== "complete") {
            setTimeout(checkComplete, 100);
            return;
          }

          // Wait for all images to load
          const images = Array.from(document.images);
          const imagePromises = images.map((img) => {
            if (img.complete && img.naturalHeight !== 0) {
              return Promise.resolve();
            }
            return new Promise<void>((resolve) => {
              const timeout = setTimeout(() => resolve(), 3000); // 3s timeout per image
              img.onload = () => {
                clearTimeout(timeout);
                resolve();
              };
              img.onerror = () => {
                clearTimeout(timeout);
                resolve(); // Continue even if image fails
              };
            });
          });

          // Wait for fonts to load
          const fontPromise = document.fonts
            ? document.fonts.ready
            : Promise.resolve();

          // Wait for any pending network requests to complete
          const networkPromise = new Promise<void>((resolve) => {
            // Give some time for any pending requests
            setTimeout(resolve, 1000);
          });

          Promise.all([...imagePromises, fontPromise, networkPromise]).then(
            () => {
              // Additional delay to ensure everything is rendered
              setTimeout(resolve, 800);
            }
          );
        };

        checkComplete();
      });
    };

    // Simulate progressive loading with real checks
    const progressInterval = setInterval(() => {
      progressValue += Math.random() * 6 + 1; // Slower, more realistic progress

      if (progressValue >= 90) {
        setLoadingProgress(90);
        clearInterval(progressInterval);

        // Now wait for actual page load
        checkPageLoad().then(() => {
          setLoadingProgress(100);

          setTimeout(() => {
            setIsLoading(false);
            setShowWipeAnimation(true);
          }, 600);
        });
      } else {
        setLoadingProgress(Math.min(progressValue, 90));
      }
    }, 200);

    // Fallback timeout to prevent infinite loading
    const fallbackTimer = setTimeout(() => {
      clearInterval(progressInterval);
      setLoadingProgress(100);

      setTimeout(() => {
        setIsLoading(false);
        setShowWipeAnimation(true);
      }, 600);
    }, 12000); // 12 second maximum

    return () => {
      clearInterval(progressInterval);
      clearTimeout(fallbackTimer);
    };
  }, []);

  useLayoutEffect(() => {
    if (
      showWipeAnimation &&
      overlayPathRef.current &&
      splashScreenRef.current
    ) {
      const tl = gsap.timeline({
        onComplete: () => {
          if (splashScreenRef.current) {
            // Optionally hide or remove the splash screen element after animation
            // For now, we rely on ClientLayout to handle visibility based on SplashContext
          }
          onLoadComplete();
        },
      });

      tl
        // Phase 1: Overlay Wipe-Up Animation (Covers the logo)
        .set(overlayPathRef.current, {
          attr: { d: "M 0 100 V 100 Q 50 100 100 100 V 100 z" },
        })
        .to(
          overlayPathRef.current,
          {
            duration: 0.8,
            ease: "power4.in",
            attr: { d: "M 0 100 V 50 Q 50 0 100 50 V 100 z" },
          },
          0
        )
        .to(overlayPathRef.current, {
          duration: 0.3,
          ease: "power2",
          attr: { d: "M 0 100 V 0 Q 50 0 100 0 V 100 z" },
        })
        // Phase 2: Menu Reveal Animation (Wipes away the overlay to reveal content)
        .set(overlayPathRef.current, {
          attr: { d: "M 0 0 V 100 Q 50 100 100 100 V 0 z" },
        })
        .to(overlayPathRef.current, {
          duration: 0.3,
          ease: "power2.in",
          attr: { d: "M 0 0 V 50 Q 50 0 100 50 V 0 z" },
        })
        .to(overlayPathRef.current, {
          duration: 0.8,
          ease: "power4",
          attr: { d: "M 0 0 V 0 Q 50 0 100 0 V 0 z" },
        });
    }
  }, [showWipeAnimation, onLoadComplete]);

  return (
    <>
      {/* Main splash screen */}
      <div
        ref={splashScreenRef}
        className={`fixed inset-0 z-50 bg-transparent transition-opacity duration-300 ${
          showWipeAnimation ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        {/* Logo - Top Left Corner, Large but Balanced */}
        <div className="absolute top-6 left-6 md:top-8 md:left-8 lg:top-12 lg:left-12">
          <div className="relative w-96 h-96 md:w-[28rem] md:h-[28rem] lg:w-[32rem] lg:h-[32rem] xl:w-[36rem] xl:h-[36rem] 2xl:w-[40rem] 2xl:h-[40rem] splash-logo">
            <Image
              src="/juneof-logo.svg"
              alt="Juneof Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Progress Bar - Bottom Center */}
        {isLoading && (
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2">
            <div className="w-80 md:w-96 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gray-500 to-gray-700 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min(loadingProgress, 100)}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* GSAP Wipe Overlay */}
      <div className="fixed inset-0 z-[51] pointer-events-none">
        <svg
          className="absolute w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            ref={overlayPathRef}
            className="fill-black"
            d="M 0 100 V 100 Q 50 100 100 100 V 100 z"
          />
        </svg>
      </div>
    </>
  );
}
