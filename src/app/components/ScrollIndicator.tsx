"use client";

import { useEffect, useState, useRef } from "react";
import { gsap } from "gsap";
import { useAuth } from "@/context/AuthContext";

const ScrollIndicator = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const bobbingAnimationRef = useRef<gsap.core.Tween | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Check if user has seen this indicator before (only if logged in)
    const hasSeenIndicator = isAuthenticated
      ? localStorage.getItem("hasSeenScrollIndicator")
      : null;

    if (!hasSeenIndicator) {
      // Show indicator immediately
      setIsVisible(true);

      // Listen for scroll events
      const handleScroll = () => {
        if (!hasScrolled) {
          setHasScrolled(true);

          // Stop bobbing animation
          if (bobbingAnimationRef.current) {
            bobbingAnimationRef.current.kill();
          }

          // Fade out quickly
          if (indicatorRef.current) {
            gsap.to(indicatorRef.current, {
              opacity: 0,
              duration: 0.3,
              ease: "power2.out",
              onComplete: () => {
                setIsVisible(false);
                // Mark as seen in localStorage only if logged in
                if (isAuthenticated) {
                  localStorage.setItem("hasSeenScrollIndicator", "true");
                }
              },
            });
          }
        }
      };

      window.addEventListener("scroll", handleScroll, { passive: true });

      return () => {
        window.removeEventListener("scroll", handleScroll);
        if (bobbingAnimationRef.current) {
          bobbingAnimationRef.current.kill();
        }
      };
    }
  }, [hasScrolled, isAuthenticated]);

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
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      ref={indicatorRef}
      className="fixed bottom-[20%] right-[8%] z-[100] pointer-events-none"
      style={{ opacity: hasScrolled ? 0 : 1 }}
    >
      <div ref={messageRef} className="flex items-center">
        {/* Message Text with Arrow */}
        <div className="text-black text-base font-medium tracking-wider lowercase">
          swipe down to see more {">"}
          {">"}
          {">"}
        </div>
      </div>
    </div>
  );
};

export default ScrollIndicator;
