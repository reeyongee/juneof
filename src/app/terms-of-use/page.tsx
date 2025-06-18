"use client"; // Required for useEffect and useRef

import { useEffect, useRef } from "react";
import { BlurScrollEffect_Effect4 } from "@/lib/animations"; // Adjust path if needed
import gsap from "gsap"; // ScrollTrigger is globally registered

export default function TermsOfUsePage() {
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
            terms of use
          </h1>
        </div>

        {/* Right Column (Scrollable Content) */}
        <div className="relative z-10 flex-grow p-8 bg-[rgba(0,0,0,0.02)] backdrop-blur-md">
          <div
            ref={contentRef}
            className="text-3xl lowercase tracking-wider text-black space-y-4 mix-blend-difference"
          >
            <p>
              these terms of use govern your access to and use of our website
              and services. by accessing or using our services, you agree to be
              bound by these terms. if you do not agree to these terms, please
              do not use our services.
            </p>
            <p>
              we reserve the right to modify these terms at any time. your
              continued use of our services after any changes constitutes
              acceptance of the new terms. it is your responsibility to review
              these terms periodically for updates.
            </p>
            <p>
              you agree to use our services only for lawful purposes and in
              accordance with these terms. you may not use our services in any
              way that could damage, disable, overburden, or impair our systems
              or interfere with any other party&apos;s use of our services.
            </p>
            <p>
              all content on our website, including text, graphics, logos,
              images, and software, is our property or the property of our
              licensors and is protected by copyright and other intellectual
              property laws. you may not reproduce, distribute, or create
              derivative works from our content without express written
              permission.
            </p>
            <p>
              our services are provided &quot;as is&quot; without warranties of
              any kind, either express or implied. we do not warrant that our
              services will be uninterrupted, error-free, or free of viruses or
              other harmful components.
            </p>
            <p>
              in no event shall we be liable for any indirect, incidental,
              special, consequential, or punitive damages arising out of or
              relating to your use of our services, even if we have been advised
              of the possibility of such damages.
            </p>
            <p>
              these terms shall be governed by and construed in accordance with
              applicable laws. any disputes arising under these terms shall be
              subject to the exclusive jurisdiction of the appropriate courts.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
