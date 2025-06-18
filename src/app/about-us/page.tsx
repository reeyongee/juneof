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
    <div className="relative">
      {/* Clipping container for the parallax image */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          ref={backgroundRef}
          className="absolute inset-0 z-0 h-[130%] bg-[url('https://picsum.photos/1920/1080')] bg-cover bg-center"
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
            <p>
              june of is a contemporary fashion brand dedicated to creating
              timeless pieces that celebrate individuality and self-expression.
              founded with a vision to bridge the gap between comfort and style,
              we craft clothing that empowers you to feel confident in every
              moment.
            </p>
            <p>
              our journey began with a simple belief that fashion should be
              accessible, sustainable, and meaningful. every piece in our
              collection is thoughtfully designed with attention to detail,
              quality craftsmanship, and versatile styling that transcends
              seasons and trends.
            </p>
            <p>
              we are committed to ethical manufacturing practices and work
              closely with our production partners to ensure fair working
              conditions and environmental responsibility. our materials are
              carefully sourced with sustainability in mind, reflecting our
              dedication to both style and conscience.
            </p>
            <p>
              the june of community is built on the foundation of authenticity
              and inclusivity. we celebrate diversity in all its forms and
              believe that true beauty lies in embracing your unique self. our
              designs are created for real people living real lives, not just
              for the runway.
            </p>
            <p>
              from our studio to your wardrobe, every step of our process is
              infused with passion and purpose. we are not just creating
              clothes; we are crafting experiences, memories, and moments that
              matter. thank you for being part of our story.
            </p>
            <p>
              join us as we continue to evolve, innovate, and inspire. together,
              we are redefining what it means to dress with intention and live
              with purpose. welcome to june of – where every day is an
              opportunity to express your authentic self.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
