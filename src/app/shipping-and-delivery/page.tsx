"use client"; // Required for useEffect and useRef

import { useEffect, useRef, useState } from "react";
import { BlurScrollEffect_Effect4 } from "@/lib/animations"; // Adjust path if needed
import gsap from "gsap"; // ScrollTrigger is globally registered

export default function ShippingAndDeliveryPage() {
  const contentRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null); // For parallax background
  const mainElementRef = useRef<HTMLElement>(null); // For main scroll trigger
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Set page title
    document.title = "shipping & delivery - june of";
  }, []);

  // Mobile detection
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    return () => {
      window.removeEventListener("resize", checkDevice);
    };
  }, []);

  useEffect(() => {
    // Only apply effects on desktop
    if (!isMobile && contentRef.current) {
      new BlurScrollEffect_Effect4(contentRef.current);
    }
  }, [isMobile]);

  useEffect(() => {
    // Only apply parallax effect on desktop
    if (!isMobile && backgroundRef.current && mainElementRef.current) {
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
  }, [isMobile]);

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="relative bg-[#fdf3e1] min-h-screen">
        <main className="relative text-black pt-24 px-6 pb-12">
          <h1 className="text-2xl font-medium tracking-widest lowercase text-black mb-8">
            shipping &amp; returns
          </h1>

          <div className="text-base lowercase tracking-wide text-black space-y-4 leading-relaxed">
            <p className="font-bold">effective date: june 20, 2025</p>
            <p>
              at june of, we want your experience to be smooth and delightful.
              here&apos;s everything you need to know about shipping and
              returns:
            </p>
            <p className="font-bold">1. shipping</p> <br />
            <p className="font-bold">shipping locations: </p>
            <p>we currently ship pan india.</p> <br />
            <p className="font-bold">dispatch time: </p>
            <p>
              orders are typically processed and dispatched within 7 working
              days.
            </p>
            <p className="font-bold">shipping charges:</p>
            <p>domestic (india): ₹100</p> <br />
            <p className="font-bold">tracking: </p>
            <p>
              once your order is shipped, you will receive a tracking number via
              email.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Desktop Layout (Original)
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
            shipping &amp; returns
          </h1>
        </div>

        {/* Right Column (Scrollable Content) */}
        <div className="relative z-10 flex-grow p-8 bg-[rgba(0,0,0,0.02)] backdrop-blur-md">
          <div
            ref={contentRef}
            className="text-xl lowercase tracking-wider text-black space-y-4 mix-blend-difference"
          >
            <p className="font-bold">effective date: june 20, 2025</p>
            <p>
              at june of, we want your experience to be smooth and delightful.
              here&apos;s everything you need to know about shipping and
              returns:
            </p>
            <p className="font-bold">1. shipping</p> <br />
            <p className="font-bold">shipping locations: </p>
            <p>we currently ship pan india.</p> <br />
            <p className="font-bold">dispatch time: </p>
            <p>
              orders are typically processed and dispatched within 7 working
              days.
            </p>
            <p className="font-bold">shipping charges:</p>
            <p>domestic (india): ₹100</p> <br />
            <p className="font-bold">tracking: </p>
            <p>
              once your order is shipped, you will receive a tracking number via
              email.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
