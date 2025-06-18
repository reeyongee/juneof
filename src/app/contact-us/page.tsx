"use client"; // Required for useEffect and useRef

import { useEffect, useRef } from "react";
import { BlurScrollEffect_Effect4 } from "@/lib/animations"; // Adjust path if needed
import gsap from "gsap"; // ScrollTrigger is globally registered

export default function ContactUsPage() {
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
            contact us
          </h1>
        </div>

        {/* Right Column (Scrollable Content) */}
        <div className="relative z-10 flex-grow p-8 bg-[rgba(0,0,0,0.02)] backdrop-blur-md">
          <div
            ref={contentRef}
            className="text-3xl lowercase tracking-wider text-black space-y-4 mix-blend-difference"
          >
            <p>
              we would love to hear from you. whether you have questions about
              our products, need assistance with your order, or simply want to
              share your feedback, our team is here to help you every step of
              the way.
            </p>
            <p>
              for general inquiries and customer support, please reach out to us
              at hello@juneof.com. our dedicated support team typically responds
              within 24 hours during business days and will ensure your
              questions are answered promptly and thoroughly.
            </p>
            <p>
              if you need assistance with sizing, styling advice, or product
              recommendations, our fashion consultants are available to provide
              personalized guidance. we believe in helping you find the perfect
              pieces that align with your personal style and preferences.
            </p>
            <p>
              for wholesale inquiries, press requests, or collaboration
              opportunities, please contact our partnerships team at
              partnerships@juneof.com. we are always excited to explore new
              opportunities and build meaningful relationships within the
              fashion community.
            </p>
            <p>
              our customer service hours are monday through friday, 9am to 6pm
              est. while we strive to respond to all inquiries as quickly as
              possible, please allow up to 48 hours for a complete response
              during peak periods.
            </p>
            <p>
              follow us on social media for the latest updates, styling
              inspiration, and behind-the-scenes content. we love connecting
              with our community and seeing how you style your june of pieces in
              your everyday life.
            </p>
            <p>
              thank you for choosing june of. your trust in our brand means
              everything to us, and we are committed to providing you with an
              exceptional experience from the moment you discover us to long
              after your purchase arrives.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
