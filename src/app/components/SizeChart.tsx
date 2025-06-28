"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { createPortal } from "react-dom";

interface SizeChartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SizeChart({ isOpen, onClose }: SizeChartProps) {
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
        className="relative w-full bg-[#F8F4EC] p-8 max-h-[90vh] overflow-y-auto"
        // transform classes removed - GSAP controls position
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl tracking-widest lowercase font-serif">
            size guide
          </h2>
          <button
            onClick={handleCloseStart} // Trigger close animation start
            className="text-gray-600 hover:text-gray-900 transition-colors lowercase tracking-widest text-sm"
          >
            close
          </button>
        </div>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          {/* Left Column - Copy */}
          <div className="lg:w-1/2 space-y-6">
            <div className="space-y-4 text-gray-800 leading-relaxed">
              <p className="text-base tracking-wide lowercase">
                we design for{" "}
                <em className="italic font-medium">real bodies</em>—from extra
                petite to extra curvy and every in-between.
              </p>

              <p className="text-base tracking-wide lowercase">
                june of pieces are made to celebrate your shape, not squeeze it
                into a mould.
              </p>

              <p className="text-base tracking-wide lowercase">
                each silhouette is{" "}
                <em className="italic font-medium">thoughtfully</em> tailored
                for comfort, movement, and confidence.
              </p>
            </div>

            <div className="pt-8 border-t border-gray-300">
              <p className="text-base font-bold tracking-wide lowercase mb-4">
                not sure what fits you best?
              </p>
              <p className="text-base tracking-wide text-gray-700 lowercase">
                check our measurement chart below
              </p>
            </div>
          </div>

          {/* Right Column - Tables */}
          <div className="lg:w-1/2 space-y-8">
            {/* Top Table */}
            <div>
              <h3 className="text-lg font-medium tracking-wide lowercase mb-4 text-center">
                Top
              </h3>
              <div className="overflow-hidden border border-gray-300">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-3 text-left font-medium tracking-wide lowercase border-r border-gray-300">
                        Size
                      </th>
                      <th className="px-4 py-3 text-left font-medium tracking-wide lowercase border-r border-gray-300">
                        Bust Range (in)
                      </th>
                      <th className="px-4 py-3 text-left font-medium tracking-wide lowercase">
                        Updated waist
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-gray-300">
                      <td className="px-4 py-3 border-r border-gray-300 lowercase tracking-wide">
                        Extra petite
                      </td>
                      <td className="px-4 py-3 border-r border-gray-300 tracking-wide">
                        30-33
                      </td>
                      <td className="px-4 py-3 tracking-wide">24-26</td>
                    </tr>
                    <tr className="border-t border-gray-300">
                      <td className="px-4 py-3 border-r border-gray-300 lowercase tracking-wide">
                        Petite
                      </td>
                      <td className="px-4 py-3 border-r border-gray-300 tracking-wide">
                        33-36
                      </td>
                      <td className="px-4 py-3 tracking-wide">26-28</td>
                    </tr>
                    <tr className="border-t border-gray-300">
                      <td className="px-4 py-3 border-r border-gray-300 lowercase tracking-wide">
                        in-between
                      </td>
                      <td className="px-4 py-3 border-r border-gray-300 tracking-wide">
                        36-39
                      </td>
                      <td className="px-4 py-3 tracking-wide">28-31</td>
                    </tr>
                    <tr className="border-t border-gray-300">
                      <td className="px-4 py-3 border-r border-gray-300 lowercase tracking-wide">
                        Curvy
                      </td>
                      <td className="px-4 py-3 border-r border-gray-300 tracking-wide">
                        39-41
                      </td>
                      <td className="px-4 py-3 tracking-wide">31-34</td>
                    </tr>
                    <tr className="border-t border-gray-300">
                      <td className="px-4 py-3 border-r border-gray-300 lowercase tracking-wide">
                        Extra curvy
                      </td>
                      <td className="px-4 py-3 border-r border-gray-300 tracking-wide">
                        41-44
                      </td>
                      <td className="px-4 py-3 tracking-wide">34-38</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Skort Table */}
            <div>
              <h3 className="text-lg font-medium tracking-wide lowercase mb-4 text-center">
                Skort
              </h3>
              <div className="overflow-hidden border border-gray-300">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-3 text-left font-medium tracking-wide lowercase border-r border-gray-300"></th>
                      <th className="px-4 py-3 text-center font-medium tracking-wide lowercase border-r border-gray-300">
                        Extra petite
                      </th>
                      <th className="px-4 py-3 text-center font-medium tracking-wide lowercase border-r border-gray-300">
                        petite
                      </th>
                      <th className="px-4 py-3 text-center font-medium tracking-wide lowercase border-r border-gray-300">
                        in-between
                      </th>
                      <th className="px-4 py-3 text-center font-medium tracking-wide lowercase border-r border-gray-300">
                        curvy
                      </th>
                      <th className="px-4 py-3 text-center font-medium tracking-wide lowercase">
                        Extra curvy
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-gray-300">
                      <td className="px-4 py-3 border-r border-gray-300 lowercase tracking-wide font-medium">
                        Waist
                      </td>
                      <td className="px-4 py-3 border-r border-gray-300 text-center tracking-wide">
                        26
                      </td>
                      <td className="px-4 py-3 border-r border-gray-300 text-center tracking-wide">
                        28
                      </td>
                      <td className="px-4 py-3 border-r border-gray-300 text-center tracking-wide">
                        30
                      </td>
                      <td className="px-4 py-3 border-r border-gray-300 text-center tracking-wide">
                        32
                      </td>
                      <td className="px-4 py-3 text-center tracking-wide">
                        34
                      </td>
                    </tr>
                    <tr className="border-t border-gray-300">
                      <td className="px-4 py-3 border-r border-gray-300 lowercase tracking-wide font-medium">
                        Hips
                      </td>
                      <td className="px-4 py-3 border-r border-gray-300 text-center tracking-wide">
                        36.5
                      </td>
                      <td className="px-4 py-3 border-r border-gray-300 text-center tracking-wide">
                        38.5
                      </td>
                      <td className="px-4 py-3 border-r border-gray-300 text-center tracking-wide">
                        40.5
                      </td>
                      <td className="px-4 py-3 border-r border-gray-300 text-center tracking-wide">
                        42.5
                      </td>
                      <td className="px-4 py-3 text-center tracking-wide">
                        44
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom section - Still confused */}
        <div className="pt-8 mt-8 border-t border-gray-300">
          <p className="text-sm tracking-wide text-gray-600 lowercase mb-2">
            still confused about which size?
          </p>
          <p className="text-sm tracking-wide text-gray-600 lowercase">
            chat with us on{" "}
            <a
              href="mailto:reach@juneof.com"
              className="underline decoration-1 underline-offset-2 hover:text-gray-800 transition-colors"
            >
              reach@juneof.com
            </a>
            /our socials or{" "}
            <a
              href="/contact-us"
              className="underline decoration-1 underline-offset-2 hover:text-gray-800 transition-colors"
            >
              send us a message on the contact us page
            </a>{" "}
            and we&apos;ll help you out.
          </p>
        </div>
      </div>
    </div>,
    document.body // Target document.body for the portal
  );
}
