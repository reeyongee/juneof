"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./AnimatedLogo.module.css";

// Register the ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function AnimatedLogo() {
  const logoRef = useRef<HTMLDivElement>(null);
  const [isLightSection, setIsLightSection] = useState(false);

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

    // Function to check which section is in view and update logo color
    const checkSectionColors = () => {
      const scrollPosition = window.scrollY + window.innerHeight / 3;

      // Check if we're in a light-colored section (like the collection section)
      const collectionSection = document.querySelector(".collection-section");

      if (collectionSection) {
        const sectionTop =
          collectionSection.getBoundingClientRect().top + window.scrollY;
        setIsLightSection(scrollPosition >= sectionTop);
      }
    };

    // Simple animation with ScrollTrigger
    gsap.to(logoElement, {
      left: "54px",
      top: "24px",
      scrollTrigger: {
        trigger: ".collection-section",
        start: "top bottom",
        end: "top top",
        scrub: true,
        onUpdate: checkSectionColors,
      },
    });

    // Initial check
    checkSectionColors();

    // Add scroll event listener for more accurate updates
    window.addEventListener("scroll", checkSectionColors);

    return () => {
      // Clean up scroll triggers and listeners
      ScrollTrigger.getAll().forEach((st) => st.kill());
      window.removeEventListener("scroll", checkSectionColors);
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
          className={`cursor-pointer transition-all duration-300 ${
            isLightSection ? "" : styles.invertLogo
          }`}
        />
      </Link>
    </div>
  );
}
