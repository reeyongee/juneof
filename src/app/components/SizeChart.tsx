"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { createPortal } from "react-dom";

interface SizeChartProps {
  isOpen: boolean;
  onClose: () => void;
  content?: string; // HTML content from Sanity
}

export default function SizeChart({
  isOpen,
  onClose,
  content,
}: SizeChartProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  // Internal state to manage the exit animation phase
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const [isMounted, setIsMounted] = useState(false); // State for client-side mount

  // Effect to set isMounted to true once component is on the client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Function to trigger the start of the closing process
  const handleCloseStart = () => {
    if (!isAnimatingOut) {
      // Prevent triggering multiple times
      setIsAnimatingOut(true);
    }
  };

  useEffect(() => {
    // Target the elements safely
    const overlayElement = overlayRef.current;
    const contentElement = contentRef.current;
    const backdropElement =
      overlayElement?.querySelector<HTMLDivElement>(".backdrop");

    if (!overlayElement || !contentElement || !backdropElement) return;

    // Kill previous animations
    tl.current?.kill();

    if (isOpen && !isAnimatingOut) {
      // --- OPEN ANIMATION ---
      gsap.set(overlayElement, { autoAlpha: 1 }); // Use autoAlpha for visibility + opacity
      gsap.set(contentElement, { y: "100%", opacity: 0 }); // Start below and transparent
      gsap.set(backdropElement, { opacity: 0 }); // Start backdrop transparent

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
      // --- CLOSE ANIMATION ---
      tl.current = gsap
        .timeline({
          // When the timeline completes, hide the overlay, call parent's onClose, and reset internal state
          onComplete: () => {
            if (overlayElement) {
              // Ensure element exists before setting
              gsap.set(overlayElement, { autoAlpha: 0 }); // Hide the main container
            }
            onClose(); // Signal parent
            setIsAnimatingOut(false); // Reset for next time
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
      // Note: We don't set autoAlpha: 0 here anymore,
      // because the parent might unmount it based on onClose,
      // or if kept mounted, the initial state handles invisibility.
    }

    // Cleanup
    return () => {
      tl.current?.kill();
    };

    // Note: onClose added to dependency array as it's used in onComplete
  }, [isOpen, isAnimatingOut, onClose]);

  // The component stays rendered; GSAP + parent state control visibility
  // We need it rendered even when isOpen is false if isAnimatingOut is true.
  if (!isOpen && !isAnimatingOut) {
    // If it's not open AND not animating out, don't render anything visually
    // We set initial state to invisible in the JSX anyway
    // returning null might cause issues if parent logic relies on ref
    // return null; // Optional: could return null if really desired, but visibility handled ok
  }

  // If not mounted on client, don't render portal
  if (!isMounted) {
    return null;
  }

  // Use createPortal to render the overlay into document.body
  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end invisible" // Removed justify-center
      style={{ opacity: 0 }} // Reinforce starting invisible for GSAP's autoAlpha
      onClick={(e) => {
        // Trigger close animation start on backdrop click
        if (e.target === overlayRef.current?.querySelector(".backdrop")) {
          handleCloseStart();
        }
      }}
    >
      {/* Backdrop with blur - Added specific class '.backdrop' */}
      <div className="backdrop absolute inset-0 bg-black/20 backdrop-blur-sm" />

      {/* Size Chart Content */}
      <div
        ref={contentRef}
        className="relative w-full bg-[#F8F4EC] p-4 sm:p-8 max-h-[90vh] overflow-y-auto"
        // transform classes removed - GSAP controls position
      >
        <div className="flex justify-between items-center mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl tracking-widest lowercase font-serif">
            size guide
          </h2>
          <button
            onClick={handleCloseStart} // Trigger close animation start
            className="text-gray-600 hover:text-gray-900 transition-colors lowercase tracking-widest text-sm"
          >
            close
          </button>
        </div>

        {/* Dynamic Size Guide Content from Sanity */}
        {content ? (
          <div
            className="size-guide-content text-gray-800"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 tracking-wide lowercase">
              size guide not available for this product
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body // Target document.body for the portal
  );
}
