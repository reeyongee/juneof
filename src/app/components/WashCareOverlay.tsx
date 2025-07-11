"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { createPortal } from "react-dom";

// Define props interface (can be reused or renamed if preferred)
interface WashCareOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  content?: string; // HTML content from Sanity
}

// Rename component
export default function WashCareOverlay({
  isOpen,
  onClose,
  content,
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

        {/* Dynamic Wash Care Content from Sanity */}
        {content ? (
          <div
            className="wash-care-content text-gray-800"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 tracking-wide lowercase">
              wash care instructions not available for this product
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
