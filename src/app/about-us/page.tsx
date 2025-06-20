"use client"; // Required for useEffect and useRef

import { useEffect, useRef } from "react";
import { BlurScrollEffect_Effect4 } from "@/lib/animations"; // Adjust path if needed
import gsap from "gsap"; // ScrollTrigger is globally registered

export default function AboutUsPage() {
  const contentRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null); // For parallax background
  const mainElementRef = useRef<HTMLElement>(null); // For main scroll trigger

  useEffect(() => {
    // Existing BlurScrollEffect logic for contentRef
    if (contentRef.current) {
      new BlurScrollEffect_Effect4(contentRef.current);
    }
  }, []);

  useEffect(() => {
    // New Parallax Effect for backgroundRef
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
        tl.kill(); // Kill the timeline and its ScrollTrigger
      };
    }
  }, []);

  return (
    <div className="relative" style={{ backgroundColor: "#fdf3e1" }}>
      {/* Clipping container for the parallax image */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          ref={backgroundRef}
          className="absolute inset-0 z-0 h-[130%] opacity-0"
        ></div>
      </div>

      <main
        ref={mainElementRef}
        className="relative flex min-h-screen text-black pt-24"
      >
        {/* Left Column (Sticky Title) */}
        <div className="relative sticky top-0 z-10 flex h-screen w-[40%] flex-shrink-0 flex-col justify-center p-8 border-r border-gray-300">
          <h1 className="text-xl font-medium tracking-widest lowercase text-black mix-blend-difference">
            about us
          </h1>
        </div>

        {/* Right Column (Scrollable Content) */}
        <div className="relative z-10 flex-grow p-8 bg-[rgba(0,0,0,0.02)] backdrop-blur-md">
          <div
            ref={contentRef}
            className="text-3xl lowercase tracking-wider text-black space-y-4 mix-blend-difference"
          >
            <p>june of is where heritage meets the now.</p>
            <p>
              we take cues from the richness of indian craft and rework it for a
              generation that lives in motion. think of it as timeless fabrics
              in reimagined silhouettes, and a whole lot of intention behind
              every stitch.
            </p>
            <p>
              our pieces are made for everyday wear but hopefully they never
              feel basic. designed for bodies that live, our fits move with you,
              not against you. we believe style shouldn&apos;t come at the cost
              of comfort or even identity.
            </p>
            <p>
              born in india, shaped by nostalgia, and tailored for the future,
              june of is for the ones who value wearing pieces with tales to
              tell.
            </p>
            <p>we&apos;re not here to copy tradition, only inspired by it.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
