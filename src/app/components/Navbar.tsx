"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import CartOverlay from "./CartOverlay";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

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

// Icon Components
const BagIcon = ({ className }: { className?: string }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M6 7V6C6 3.79086 7.79086 2 10 2H14C16.2091 2 18 3.79086 18 6V7M6 7H4C3.44772 7 3 7.44772 3 8V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V8C21 7.44772 20.5523 7 20 7H18M6 7H18M10 11V13M14 11V13"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ShopIcon = ({ className }: { className?: string }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M3 7V5C3 4.44772 3.44772 4 4 4H20C20.5523 4 21 4.44772 21 5V7M3 7L5 19C5.10557 19.5526 5.52671 20 6 20H18C18.4733 20 18.8944 19.5526 19 19L21 7M3 7H21M8 10V12M12 10V12M16 10V12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const UserIcon = ({ className }: { className?: string }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const AboutIcon = ({ className }: { className?: string }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
      fill="currentColor"
    />
  </svg>
);

const Navbar: React.FC = () => {
  const [visible, setVisible] = useState(true);
  const [transparent, setTransparent] = useState(false);
  const [isNavItemHovered, setIsNavItemHovered] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const HOVER_DELAY_MS = 300;

  const isMobile = useIsMobile();
  const pathname = usePathname();
  const { cartItems } = useCart();
  const { isAuthenticated, customerData, login, isLoading } = useAuth();

  // Determine if transparency is allowed on current page
  const isTransparencyAllowed =
    pathname === "/" ||
    pathname === "/privacy-policy" ||
    pathname === "/terms-and-conditions" ||
    pathname === "/shipping-and-delivery" ||
    pathname === "/cancellations-and-refund" ||
    pathname === "/about-us" ||
    pathname === "/contact-us";

  const totalCartItems = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const handleCloseCart = useCallback(() => {
    setIsCartOpen(false);
  }, []);

  // Reset transparency when navigating to pages where it's not allowed
  useEffect(() => {
    if (!isTransparencyAllowed) {
      setTransparent(false);
    }
  }, [pathname, isTransparencyAllowed]);

  useEffect(() => {
    // --- Bottom Observer (for hiding navbar) ---
    const bottomSentinelId = "navbar-bottom-sentinel";
    let bottomSentinel = document.getElementById(bottomSentinelId);

    // If sentinel doesn't exist, create and append it to the end of main
    if (!bottomSentinel) {
      bottomSentinel = document.createElement("div");
      bottomSentinel.id = bottomSentinelId;
      Object.assign(bottomSentinel.style, {
        position: "absolute",
        bottom: "0",
        width: "100%",
        height: "1px",
        opacity: "0",
      });

      // Find the main element and append the sentinel
      const main = document.querySelector("main");
      if (main) {
        main.style.position = "relative"; // Ensure we can position the sentinel
        main.appendChild(bottomSentinel);
      }
    }

    // --- Top Observer (for transparency) ---
    const topSentinelId = "navbar-top-sentinel";
    let topSentinel = document.getElementById(topSentinelId);

    // If top sentinel doesn't exist, create and append it to the top of main
    if (!topSentinel) {
      topSentinel = document.createElement("div");
      topSentinel.id = topSentinelId;
      Object.assign(topSentinel.style, {
        position: "absolute",
        top: "0",
        width: "100%",
        height: "1px",
        opacity: "0",
      });

      const main = document.querySelector("main");
      if (main && !main.contains(topSentinel)) {
        main.appendChild(topSentinel);
      }
    }

    // Robust page height and scroll position checker
    const checkNavbarVisibility = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );

      const isPageScrollable = documentHeight > windowHeight;
      const hasScrolledDown = scrollY > 100;
      const isNearBottom = scrollY + windowHeight >= documentHeight - 50; // 50px threshold

      // Show navbar if:
      // 1. Page is not scrollable, OR
      // 2. We haven't scrolled down much, OR
      // 3. We're not near the bottom
      const shouldShowNavbar =
        !isPageScrollable || !hasScrolledDown || !isNearBottom;

      setVisible(shouldShowNavbar);
    };

    // Create the bottom intersection observer (for hiding) - now with more robust logic
    const bottomObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(() => {
          // Use the robust checker instead of simple intersection logic
          checkNavbarVisibility();
        });
      },
      {
        threshold: 0,
        // Add some margin to trigger earlier
        rootMargin: "50px 0px 50px 0px",
      }
    );

    // Create the top intersection observer (for transparency)
    const topObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Only set transparent if transparency is allowed on current page
          // When the top of main is NOT intersecting with viewport,
          // make navbar transparent (meaning we've scrolled down to main content)
          setTransparent(isTransparencyAllowed && !entry.isIntersecting);
        });
      },
      {
        rootMargin: "0px", // Changed from -72px to 0px to sync exactly with viewport edge
        threshold: 0,
      }
    );

    // Add scroll listener for more responsive navbar visibility
    const handleScroll = () => {
      checkNavbarVisibility();
    };

    // Add mutation observer to detect content changes
    const mutationObserver = new MutationObserver(() => {
      // Debounce the check to avoid excessive calls
      setTimeout(checkNavbarVisibility, 100);
    });

    // Start observing
    if (bottomSentinel) {
      bottomObserver.observe(bottomSentinel);
    }

    if (topSentinel) {
      topObserver.observe(topSentinel);
    }

    // Add scroll listener
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Observe changes to main content
    const main = document.querySelector("main");
    if (main) {
      mutationObserver.observe(main, {
        childList: true,
        subtree: true,
        attributes: false,
      });
    }

    // Initial check and setup resize listener
    checkNavbarVisibility();
    window.addEventListener("resize", checkNavbarVisibility);

    // Cleanup on unmount
    return () => {
      if (bottomSentinel) {
        bottomObserver.unobserve(bottomSentinel);
        bottomSentinel.remove();
      }

      if (topSentinel) {
        topObserver.unobserve(topSentinel);
        topSentinel.remove();
      }

      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", checkNavbarVisibility);
      mutationObserver.disconnect();

      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, [isTransparencyAllowed]);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsNavItemHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsNavItemHovered(false);
    }, HOVER_DELAY_MS);
  };

  const dynamicHeaderClasses = `fixed top-0 left-0 right-0 z-50 text-black p-4 transition-all duration-300 ${
    visible ? "translate-y-0" : "-translate-y-full"
  } ${
    // Navbar is always transparent on landing page, about us, and contact us pages
    pathname === "/" || pathname === "/about-us" || pathname === "/contact-us"
      ? "bg-transparent"
      : transparent && !isNavItemHovered
      ? "bg-transparent"
      : "bg-[#F8F4EC]"
  }`;

  // Link items get mix-blend-difference if navbar is transparent, otherwise no special blend mode.
  const getLinkItemClasses = (isNavbarTransparent: boolean) =>
    `transition-all duration-300 ${
      isNavbarTransparent ? "mix-blend-difference" : ""
    }`;

  const navLinkBaseClasses =
    "text-lg lowercase tracking-wider hover:opacity-75"; // Changed from text-base to text-lg for even bigger font

  // Determine if the navbar is effectively transparent for item styling
  const isEffectivelyTransparent =
    pathname === "/" || pathname === "/about-us" || pathname === "/contact-us"
      ? true
      : transparent && !isNavItemHovered;

  return (
    <>
      <header className={dynamicHeaderClasses}>
        <div
          className={`container mx-auto flex justify-between items-center ${
            isMobile ? "pl-4 pr-2" : ""
          }`}
        >
          {/* Logo */}
          <Link
            href="/"
            className={`flex-shrink-0 ${getLinkItemClasses(
              isEffectivelyTransparent
            )}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <Image
              src="/juneof-logo.svg" // Assuming it's in public folder
              alt="Juneof Logo"
              width={isMobile ? 120 : 150} // Smaller logo on mobile
              height={isMobile ? 32 : 40} // Smaller logo on mobile
              priority
              className="pointer-events-none"
              style={{ userSelect: "none" }}
              draggable="false"
            />
          </Link>

          {/* Navigation Links and Icons */}
          <nav className="flex items-center">
            {/* Group the right-hand navigation items */}
            <div
              className={`flex items-center ${
                isMobile ? "space-x-2" : "space-x-6"
              } ${isMobile ? "pl-2 pr-0 py-1" : "px-4 py-2"}`}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <Link
                href="/product-listing"
                className={`${navLinkBaseClasses} ${getLinkItemClasses(
                  isEffectivelyTransparent
                )} ${
                  isMobile
                    ? "text-base p-2 flex items-center justify-center"
                    : ""
                }`}
                data-underline-button-effect
              >
                {isMobile ? <ShopIcon className="w-5 h-5" /> : "shop"}
              </Link>
              <Link
                href="/about-us"
                className={`${navLinkBaseClasses} ${getLinkItemClasses(
                  isEffectivelyTransparent
                )} ${
                  isMobile
                    ? "text-base p-2 flex items-center justify-center"
                    : ""
                }`}
                data-underline-button-effect
              >
                {isMobile ? <AboutIcon className="w-5 h-5" /> : "about us"}
              </Link>
              {/* Bag Button with Notification Bubble */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setIsCartOpen(true);
                  }}
                  className={`${navLinkBaseClasses} ${getLinkItemClasses(
                    isEffectivelyTransparent
                  )} ${isMobile ? "text-base p-2" : ""} ${
                    isMobile ? "flex items-center justify-center" : ""
                  }`}
                >
                  {isMobile ? <BagIcon className="w-5 h-5" /> : "bag"}
                </button>
                {totalCartItems > 0 && (
                  <span
                    className={`absolute flex items-center justify-center w-5 h-5 bg-gray-800 text-white text-xs rounded-full ${
                      isMobile ? "-top-1 -right-1" : "-top-4 -right-4"
                    }`}
                  >
                    {totalCartItems}
                  </span>
                )}
              </div>
              {/* Profile/Login Button - Hide on mobile or show abbreviated */}
              {!isMobile && (
                <>
                  {isAuthenticated && customerData ? (
                    <Link
                      href="/dashboard"
                      className={`${navLinkBaseClasses} ${getLinkItemClasses(
                        isEffectivelyTransparent
                      )}`}
                      data-underline-button-effect
                    >
                      {customerData.customer.firstName ||
                        customerData.customer.displayName ||
                        "dashboard"}
                    </Link>
                  ) : (
                    <button
                      onClick={login}
                      disabled={isLoading}
                      className={`${navLinkBaseClasses} ${getLinkItemClasses(
                        isEffectivelyTransparent
                      )} disabled:opacity-50`}
                      data-underline-button-effect
                    >
                      {isLoading ? "logging in..." : "login"}
                    </button>
                  )}
                </>
              )}
              {/* Mobile Profile/Login Button - Simplified */}
              {isMobile && (
                <>
                  {isAuthenticated && customerData ? (
                    <Link
                      href="/dashboard"
                      className={`${navLinkBaseClasses} ${getLinkItemClasses(
                        isEffectivelyTransparent
                      )} text-base p-2 flex items-center justify-center`}
                      data-underline-button-effect
                    >
                      <UserIcon className="w-5 h-5" />
                    </Link>
                  ) : (
                    <button
                      onClick={login}
                      disabled={isLoading}
                      className={`${navLinkBaseClasses} ${getLinkItemClasses(
                        isEffectivelyTransparent
                      )} disabled:opacity-50 text-base p-2 flex items-center justify-center`}
                      data-underline-button-effect
                    >
                      <UserIcon className="w-5 h-5" />
                    </button>
                  )}
                </>
              )}
            </div>
          </nav>
        </div>
      </header>
      <CartOverlay isOpen={isCartOpen} onClose={handleCloseCart} />
    </>
  );
};

export default Navbar;
