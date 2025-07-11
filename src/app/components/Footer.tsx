"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Toggle for email section visibility
const SHOW_EMAIL_SECTION = true;

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
  const [email, setEmail] = useState("");

  // Use a color close to the image, adjust as needed
  const backgroundColor = "bg-[#FDF3E1]"; // Example: A pale beige/orange
  const textColor = "text-black"; // Example: Black text

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement email submission logic
    console.log("Email submitted:", email);
  };

  // Legal links component for reuse
  const LegalLinks = ({ className }: { className?: string }) => (
    <div className={className}>
      <Link
        href="/legal/terms-and-conditions"
        className="hover:opacity-75 mb-1"
        data-underline-button-effect
      >
        terms &amp; conditions
      </Link>
      <Link
        href="/legal/privacy-policy"
        className="hover:opacity-75 mb-1"
        data-underline-button-effect
      >
        privacy policy
      </Link>
      <Link
        href="/legal/shipping-and-delivery"
        className="hover:opacity-75 mb-1"
        data-underline-button-effect
      >
        shipping &amp; delivery
      </Link>
      <Link
        href="/legal/cancellations-and-refunds"
        className="hover:opacity-75"
        data-underline-button-effect
      >
        cancellations &amp; refund
      </Link>
    </div>
  );

  // Email section component for reuse
  const EmailSection = ({ className }: { className?: string }) => (
    <div className={className}>
      <h3 className="text-base font-normal lowercase tracking-wider text-black mb-4">
        want to reach out? drop an email
      </h3>
      <form onSubmit={handleEmailSubmit} className="space-y-4">
        <div className="flex gap-2 items-center">
          <div
            className={cn(
              "flex h-10 w-full bg-transparent px-3 py-2 text-sm",
              "relative items-center flex-1 border border-gray-300"
            )}
          >
            <Input
              id="footer-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your email address"
              className="flex-1 border-none bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 lowercase tracking-wider text-xs shadow-none"
              required
            />
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="absolute right-0 flex items-center justify-center h-full w-10 text-muted-foreground hover:bg-transparent hover:text-foreground"
              aria-label="Send email"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </form>
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
            // Desktop Layout - Email section as first column
            <div className="flex flex-wrap justify-between items-start text-base tracking-wider mb-8">
              {/* Column 1: Email Section */}
              {SHOW_EMAIL_SECTION && (
                <div className="w-full md:w-1/4 mb-6 md:mb-0">
                  <EmailSection />
                </div>
              )}

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

          {/* Mobile Email Section - Above Logo */}
          {isMobile && SHOW_EMAIL_SECTION && (
            <div className="mb-6">
              <EmailSection />
            </div>
          )}

          {/* Logo Section - Smaller on mobile, left-aligned */}
          <div className="w-full flex justify-start">
            <Image
              src="/juneof-logo.svg"
              alt="Juneof Logo"
              width={isMobile ? 480 : 640} // Smaller on mobile
              height={isMobile ? 120 : 160} // Smaller on mobile
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
