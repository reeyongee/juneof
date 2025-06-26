"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function AboutUsPage() {
  const backgroundRef = useRef<HTMLDivElement>(null);
  const mainElementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Parallax Effect for backgroundRef
    if (backgroundRef.current && mainElementRef.current) {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: mainElementRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      tl.to(backgroundRef.current, {
        yPercent: -15,
        ease: "none",
      });

      return () => {
        tl.kill();
      };
    }
  }, []);

  return (
    <div className="relative min-h-screen">
      {/* Parallax Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          ref={backgroundRef}
          className="absolute inset-0 h-[130%] bg-cover bg-center"
          style={{
            backgroundImage: "url('/landing-images/about.jpg')",
          }}
        />
      </div>

      <main ref={mainElementRef} className="relative min-h-screen text-white">
        <div className="container mx-auto px-4 sm:px-8 py-20 space-y-32">
          {/* First Paragraph - Left */}
          <div className="flex justify-start">
            <div className="max-w-[500px] text-left transform -rotate-2">
              <p className="text-xl sm:text-2xl lg:text-3xl font-light leading-relaxed lowercase tracking-wider">
                june of was founded with the desire to create beautiful unique
                and simple garments for all to wear anytime, anywhere.
              </p>
            </div>
          </div>

          {/* Second Paragraph - Right */}
          <div className="flex justify-end">
            <div className="max-w-[500px] text-right transform rotate-2">
              <p className="text-xl sm:text-2xl lg:text-3xl font-light leading-relaxed lowercase tracking-wider">
                june of is a timeless brand for the modern and classical people
                who love to express their individuality boldly with styles to
                match.
              </p>
            </div>
          </div>

          {/* Third Paragraph - Left */}
          <div className="flex justify-start">
            <div className="max-w-[500px] text-left transform -rotate-1">
              <p className="text-xl sm:text-2xl lg:text-3xl font-light leading-relaxed lowercase tracking-wider">
                our pieces are crafted with intention, blending heritage
                techniques with contemporary design to create garments that
                transcend seasons and trends.
              </p>
            </div>
          </div>

          {/* Fourth Paragraph - Right */}
          <div className="flex justify-end">
            <div className="max-w-[500px] text-right transform rotate-1">
              <p className="text-xl sm:text-2xl lg:text-3xl font-light leading-relaxed lowercase tracking-wider">
                we believe in slow fashion, quality over quantity, and creating
                pieces that tell stories while honoring the craft and the
                craftspeople behind them.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
