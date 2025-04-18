"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register the ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function AnimatedLogo() {
  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!logoRef.current) return;

    // Set initial position
    const logoElement = logoRef.current;

    // Animation with position adjusted further down
    gsap.set(logoElement, {
      position: "fixed",
      width: "145px",
      height: "80px",
      left: "48px",
      top: "380px", // Moved further down
      zIndex: 1001,
    });

    // Simple animation with ScrollTrigger
    gsap.to(logoElement, {
      left: "54px",
      top: "24px",
      scrollTrigger: {
        trigger: ".collection-section",
        start: "top bottom",
        end: "top top",
        scrub: true,
      },
    });

    return () => {
      // Clean up scroll triggers
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  return (
    <div ref={logoRef} className="fixed pointer-events-auto">
      <Link href="/">
        <Image
          src="/images/juneof-logo.svg"
          alt="June Of Logo"
          width={145}
          height={80}
          priority
          className="cursor-pointer"
        />
      </Link>
    </div>
  );
}
