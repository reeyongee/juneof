"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { createPortal } from "react-dom";

// Define props interface (can be reused or renamed if preferred)
interface WashCareOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

// Rename component
export default function WashCareOverlay({
  isOpen,
  onClose,
}: WashCareOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleCloseStart = () => {
    if (!isAnimatingOut) {
      setIsAnimatingOut(true);
    }
  };

  useEffect(() => {
    const overlayElement = overlayRef.current;
    const contentElement = contentRef.current;
    const backdropElement =
      overlayElement?.querySelector<HTMLDivElement>(".backdrop");

    if (!overlayElement || !contentElement || !backdropElement) return;

    tl.current?.kill();

    if (isOpen && !isAnimatingOut) {
      // Open animation logic (same as SizeChart)
      gsap.set(overlayElement, { autoAlpha: 1 });
      gsap.set(contentElement, { y: "100%", opacity: 0 });
      gsap.set(backdropElement, { opacity: 0 });

      tl.current = gsap
        .timeline()
        .to(backdropElement, {
          opacity: 1,
          duration: 0.4,
        })
        .to(
          contentElement,
          {
            y: "0%",
            opacity: 1,
            duration: 0.5,
            ease: "power3.out",
          },
          "-=0.3"
        );
    } else if (isAnimatingOut) {
      // Close animation logic (same as SizeChart)
      tl.current = gsap
        .timeline({
          onComplete: () => {
            if (overlayElement) {
              gsap.set(overlayElement, { autoAlpha: 0 });
            }
            onClose();
            setIsAnimatingOut(false);
          },
        })
        .to(contentElement, {
          y: "100%",
          opacity: 0,
          duration: 0.4,
          ease: "power2.in",
        })
        .to(
          backdropElement,
          {
            opacity: 0,
            duration: 0.3,
          },
          "-=0.2"
        );
    }

    return () => {
      tl.current?.kill();
    };
  }, [isOpen, isAnimatingOut, onClose]);

  if (!isOpen && !isAnimatingOut) {
    // Keep the element structure available for GSAP to target initially
  }

  if (!isMounted) {
    return null;
  }

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end invisible" // Start invisible
      style={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === overlayRef.current?.querySelector(".backdrop")) {
          handleCloseStart();
        }
      }}
    >
      {/* Backdrop (same as SizeChart) */}
      <div className="backdrop absolute inset-0 bg-black/20 backdrop-blur-sm" />

      {/* Wash Care Content */}
      <div
        ref={contentRef}
        className="relative w-full bg-[#F8F4EC] p-4 sm:p-8 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl tracking-widest lowercase font-serif">
            wash instructions
          </h2>
          <button
            onClick={handleCloseStart}
            className="text-gray-600 hover:text-gray-900 transition-colors lowercase tracking-widest text-sm"
          >
            close
          </button>
        </div>

        {/* Wash Care Content */}
        <div className="space-y-6 sm:space-y-8 text-gray-800">
          {/* Top Product */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-medium tracking-wide lowercase">
              product:{" "}
              <span className="underline decoration-1 underline-offset-2">
                top
              </span>
            </h3>

            <p className="text-sm sm:text-base tracking-wide lowercase">
              materials used: lined with poplin and made from soft{" "}
              <span className="underline decoration-1 underline-offset-2">
                kantha
              </span>{" "}
              cotton.
            </p>

            <ul className="space-y-2 text-sm sm:text-base tracking-wide lowercase ml-4">
              <li className="flex items-start">
                <span className="mr-3">•</span>
                <span>gentle machine wash in cold water</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3">•</span>
                <span>
                  wash with similar{" "}
                  <span className="underline decoration-1 underline-offset-2">
                    colours
                  </span>
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-3">•</span>
                <span>mild detergent only</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3">•</span>
                <span>do not bleach or tumble dry</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3">•</span>
                <span>line dry in shade</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3">•</span>
                <span>iron on low, inside out</span>
              </li>
            </ul>

            <p className="text-sm sm:text-base tracking-wide lowercase italic pt-2">
              soft, flexible, and low-maintenance.
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-300"></div>

          {/* Skort Product */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-medium tracking-wide lowercase">
              product:{" "}
              <span className="underline decoration-1 underline-offset-2">
                skort
              </span>
            </h3>

            <p className="text-sm sm:text-base tracking-wide lowercase">
              materials used: made from soft{" "}
              <span className="underline decoration-1 underline-offset-2">
                kantha
              </span>{" "}
              cotton, shorts lined with voile, fastened with a zipper.
            </p>

            <ul className="space-y-2 text-sm sm:text-base tracking-wide lowercase ml-4">
              <li className="flex items-start">
                <span className="mr-3">•</span>
                <span>gentle machine wash in cold water</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3">•</span>
                <span>zip up before washing</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3">•</span>
                <span>
                  wash with similar{" "}
                  <span className="underline decoration-1 underline-offset-2">
                    colours
                  </span>
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-3">•</span>
                <span>mild detergent only</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3">•</span>
                <span>no bleach, no tumble dry</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3">•</span>
                <span>line dry in shade</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3">•</span>
                <span>iron on low, avoiding the zipper</span>
              </li>
            </ul>

            <p className="text-sm sm:text-base tracking-wide lowercase italic pt-2">
              built for movement, made to last.
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-300"></div>

          {/* Summer Jacket Product */}
          <div className="space-y-4 pb-4">
            <h3 className="text-base sm:text-lg font-medium tracking-wide lowercase">
              product:{" "}
              <span className="underline decoration-1 underline-offset-2">
                summer jacket
              </span>
            </h3>

            <p className="text-sm sm:text-base tracking-wide lowercase italic">
              (wash care instructions coming soon)
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
