"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  const footerRef = useRef<HTMLElement>(null);

  // Use a color close to the image, adjust as needed
  const backgroundColor = "bg-[#FDF3E1]"; // Example: A pale beige/orange
  const textColor = "text-black"; // Example: Black text

  useEffect(() => {
    const calculateFooterHeight = () => {
      if (footerRef.current) {
        const height = window.innerHeight;

        // Get all sections and calculate their total height
        const sections = document.querySelectorAll("main section, section");
        let totalSectionHeight = 0;

        sections.forEach((section) => {
          totalSectionHeight += (section as HTMLElement).offsetHeight;
        });

        // Add the ParallaxImageCarousel height if it exists
        const mainElement = document.querySelector("main");
        const parallaxCarousel =
          document.querySelector('[class*="parallax"]') ||
          document.querySelector('[class*="carousel"]') ||
          (mainElement ? mainElement.firstElementChild : null);

        if (parallaxCarousel && parallaxCarousel !== sections[0]) {
          totalSectionHeight += (parallaxCarousel as HTMLElement).offsetHeight;
        }

        // Footer height = total content height + 55vh for the reveal effect
        const footerHeight = totalSectionHeight + height * 0.55;

        console.log("Footer height calculation:", {
          totalSectionHeight,
          viewportHeight: height,
          revealSpace: height * 0.55,
          finalFooterHeight: footerHeight,
          sectionsCount: sections.length,
        });

        footerRef.current.style.height = `${footerHeight}px`;

        // Add bottom padding to body to create scroll space for fixed footer
        document.body.style.paddingBottom = `${height * 0.55}px`;
      }
    };

    // Calculate after content is loaded
    const timer = setTimeout(calculateFooterHeight, 500);

    // Recalculate on resize
    window.addEventListener("resize", calculateFooterHeight);

    // Also recalculate when images load
    window.addEventListener("load", calculateFooterHeight);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", calculateFooterHeight);
      window.removeEventListener("load", calculateFooterHeight);
      // Clean up the body padding
      document.body.style.paddingBottom = "";
    };
  }, []);

  return (
    <footer
      ref={footerRef}
      className="fixed top-0 left-0 w-full z-[-1] block"
      id="footer"
    >
      <div
        className={`sticky top-[45vh] w-full h-[55vh] ${backgroundColor} ${textColor} pt-2 pb-10 overflow-x-hidden flex flex-col justify-between`}
      >
        <div className="container mx-auto px-4 md:px-8 h-full flex flex-col justify-between">
          {/* Links Section */}
          <div className="flex flex-wrap justify-between items-start text-base tracking-wider">
            {/* Column 1: Empty (was Newsletter) */}
            <div className="w-full md:w-1/4 mb-6 md:mb-0">
              {/* Intentionally empty */}
            </div>

            {/* Column 2: Social/Shop */}
            <div className="w-full sm:w-auto md:w-1/4 mb-6 md:mb-0 flex flex-col items-start md:items-center">
              <Link
                href="#"
                className="hover:opacity-75 mb-1"
                data-underline-button-effect
              >
                instagram
              </Link>
              {/* Removed TikTok and Shop Lello */}
            </div>

            {/* Column 3: Legal */}
            <div className="w-full sm:w-auto md:w-1/4 mb-6 md:mb-0 flex flex-col items-start md:items-center">
              <Link
                href="/terms-of-use"
                className="hover:opacity-75 mb-1"
                data-underline-button-effect
              >
                terms of use
              </Link>
              <Link
                href="/privacy-policy"
                className="hover:opacity-75"
                data-underline-button-effect
              >
                privacy policy
              </Link>
            </div>

            {/* Column 4: Company */}
            <div className="w-full sm:w-auto md:w-1/4 mb-6 md:mb-0 flex flex-col items-start md:items-end">
              <Link
                href="/about-us"
                className="hover:opacity-75 mb-1"
                data-underline-button-effect
              >
                about us
              </Link>
              <Link
                href="/contact-us"
                className="hover:opacity-75 mb-1"
                data-underline-button-effect
              >
                contact us
              </Link>
              {/* Removed Credits */}
              <a
                href="https://juneof.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-75 mt-4"
                data-underline-button-effect
              >
                juneof.com
              </a>
            </div>
          </div>

          {/* Logo Section - Removed cutoff, smaller, left-aligned */}
          <div className="w-full flex justify-start">
            <Image
              src="/juneof-logo.svg"
              alt="Juneof Logo"
              width={640} // Reduced width by 20%
              height={160} // Reduced height by 20%
              // Removed transform class
              className="pointer-events-none"
              style={{ userSelect: "none" }}
              draggable="false"
              priority // Optional: Keep if logo is critical LCP
            />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
