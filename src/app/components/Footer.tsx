"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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

  return (
    <footer className="w-full" id="footer">
      <div
        className={`w-full ${backgroundColor} ${textColor} pt-8 pb-10 overflow-x-hidden`}
      >
        <div className="container mx-auto px-4 md:px-8 flex flex-col justify-between min-h-[400px]">
          {/* Email Section */}
          {SHOW_EMAIL_SECTION && (
            <div className="mb-8">
              <Card className="bg-white border-gray-300 max-w-md mx-auto">
                <CardContent className="p-6">
                  <h3 className="text-lg font-serif lowercase tracking-widest text-black mb-4 text-center">
                    want to reach out? drop an email
                  </h3>
                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div className="flex gap-2 items-center">
                      <div
                        className={cn(
                          "flex h-10 w-full border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                          "relative items-center flex-1"
                        )}
                      >
                        <Label
                          htmlFor="footer-email"
                          className="text-muted-foreground mr-2 whitespace-nowrap cursor-default lowercase tracking-wider text-xs"
                        >
                          email :
                        </Label>
                        <Input
                          id="footer-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your email address"
                          className="flex-1 border-none bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 lowercase tracking-wider text-xs"
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
                </CardContent>
              </Card>
            </div>
          )}

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
