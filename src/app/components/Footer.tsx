"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

// Custom hook to detect mobile devices
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const userAgent =
        navigator.userAgent ||
        navigator.vendor ||
        (window as unknown as { opera?: string }).opera ||
        "";
      const mobileRegex =
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
      const isMobileDevice = mobileRegex.test(userAgent.toLowerCase());
      const isSmallScreen = window.innerWidth <= 768; // Consider screens <= 768px as mobile

      setIsMobile(isMobileDevice || isSmallScreen);
    };

    // Check on mount
    checkDevice();

    // Check on resize
    window.addEventListener("resize", checkDevice);

    return () => {
      window.removeEventListener("resize", checkDevice);
    };
  }, []);

  return isMobile;
};

const Footer = () => {
  const isMobile = useIsMobile();
  // Use a color close to the image, adjust as needed
  const backgroundColor = "bg-[#FDF3E1]"; // Example: A pale beige/orange
  const textColor = "text-black"; // Example: Black text

  // Legal links component for reuse
  const LegalLinks = ({ className }: { className?: string }) => (
    <div className={className}>
      <Link
        href="/terms-and-conditions"
        className="hover:opacity-75 mb-1"
        data-underline-button-effect
      >
        terms &amp; conditions
      </Link>
      <Link
        href="/privacy-policy"
        className="hover:opacity-75 mb-1"
        data-underline-button-effect
      >
        privacy policy
      </Link>
      <Link
        href="/shipping-and-delivery"
        className="hover:opacity-75 mb-1"
        data-underline-button-effect
      >
        shipping &amp; delivery
      </Link>
      <Link
        href="/cancellations-and-refund"
        className="hover:opacity-75"
        data-underline-button-effect
      >
        cancellations &amp; refund
      </Link>
    </div>
  );

  return (
    <footer className="w-full" id="footer">
      <div
        className={`w-full ${backgroundColor} ${textColor} pt-8 pb-10 overflow-x-hidden`}
      >
        <div className="container mx-auto px-4 md:px-8 flex flex-col justify-between min-h-[400px]">
          {/* Links Section */}
          {!isMobile ? (
            // Desktop Layout - Original
            <div className="flex flex-wrap justify-between items-start text-base tracking-wider mb-8">
              {/* Column 1: Empty (was Newsletter) */}
              <div className="w-full md:w-1/4 mb-6 md:mb-0">
                {/* Intentionally empty */}
              </div>

              {/* Column 2: Social/Shop */}
              <div className="w-full sm:w-auto md:w-1/4 mb-6 md:mb-0 flex flex-col items-start md:items-center">
                <a
                  href="https://www.instagram.com/juneof__"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-75 mb-1"
                  data-underline-button-effect
                >
                  instagram
                </a>
                {/* Removed TikTok and Shop Lello */}
              </div>

              {/* Column 3: Legal */}
              <LegalLinks className="w-full sm:w-auto md:w-1/4 mb-6 md:mb-0 flex flex-col items-start md:items-center" />

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
          ) : (
            // Mobile Layout - Reorganized
            <div className="flex justify-between items-start text-base tracking-wider mb-8">
              {/* Left Column: Social + Company */}
              <div className="flex flex-col items-start">
                <a
                  href="https://www.instagram.com/juneof__"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-75 mb-1"
                  data-underline-button-effect
                >
                  instagram
                </a>
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

              {/* Right Column: Legal Links */}
              <LegalLinks className="flex flex-col items-end" />
            </div>
          )}

          {/* Logo Section - Smaller, left-aligned */}
          <div className="w-full flex justify-start">
            <Image
              src="/juneof-logo.svg"
              alt="Juneof Logo"
              width={640} // Reduced width by 20%
              height={160} // Reduced height by 20%
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
