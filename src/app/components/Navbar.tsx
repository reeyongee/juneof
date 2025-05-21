"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState, useRef, useCallback } from "react";
import CartOverlay from "./CartOverlay";

// Placeholder SVGs - Replace with actual SVGs
const InstagramIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6"
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const Navbar: React.FC = () => {
  const [visible, setVisible] = useState(true);
  const [transparent, setTransparent] = useState(false);
  const [isNavItemHovered, setIsNavItemHovered] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const HOVER_DELAY_MS = 300;

  const handleCloseCart = useCallback(() => {
    setIsCartOpen(false);
  }, []);

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

    // Create the bottom intersection observer (for hiding)
    const bottomObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // When bottomSentinel enters viewport (scrolled to bottom), hide navbar
          // When bottomSentinel exits viewport (scrolled up), show navbar
          setVisible(!entry.isIntersecting);
        });
      },
      {
        threshold: 0, // Trigger as soon as any part becomes visible
      }
    );

    // Create the top intersection observer (for transparency)
    const topObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // When the top of main is NOT intersecting with viewport,
          // make navbar transparent (meaning we've scrolled down to main content)
          setTransparent(!entry.isIntersecting);
        });
      },
      {
        rootMargin: "0px", // Changed from -72px to 0px to sync exactly with viewport edge
        threshold: 0,
      }
    );

    // Start observing
    if (bottomSentinel) {
      bottomObserver.observe(bottomSentinel);
    }

    if (topSentinel) {
      topObserver.observe(topSentinel);
    }

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
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

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

  const dynamicHeaderClasses = `sticky top-0 left-0 right-0 z-50 text-black p-4 transition-all duration-300 ${
    visible ? "translate-y-0" : "-translate-y-full"
  } ${
    // Navbar background becomes transparent if scrolled and not hovered
    transparent && !isNavItemHovered ? "bg-transparent" : "bg-[#F8F4EC]"
  }`;

  // Link items get mix-blend-difference if navbar is transparent, otherwise no special blend mode.
  const getLinkItemClasses = (isNavbarTransparent: boolean) =>
    `transition-all duration-300 ${
      isNavbarTransparent ? "mix-blend-difference" : ""
    }`;

  const navLinkBaseClasses =
    "text-sm uppercase tracking-wider hover:opacity-75"; // Default styling for text links

  // Determine if the navbar is effectively transparent for item styling
  const isEffectivelyTransparent = transparent && !isNavItemHovered;

  return (
    <>
      <header className={dynamicHeaderClasses}>
        <div className="container mx-auto flex justify-between items-center">
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
              width={150} // Adjust as needed
              height={40} // Adjust as needed
              priority
            />
          </Link>

          {/* Navigation Links and Icons */}
          <nav className="flex items-center">
            {/* Group the right-hand navigation items */}
            <div
              className={`flex items-center space-x-6 px-4 py-2`}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <Link
                href="/product-listing"
                className={`${navLinkBaseClasses} ${getLinkItemClasses(
                  isEffectivelyTransparent
                )}`}
              >
                Shop
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setIsCartOpen(true);
                }}
                className={`${navLinkBaseClasses} ${getLinkItemClasses(
                  isEffectivelyTransparent
                )}`}
              >
                Bag
              </button>
              <Link
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className={`hover:opacity-75 ${getLinkItemClasses(
                  isEffectivelyTransparent
                )}`}
              >
                <InstagramIcon />
              </Link>
              <Link
                href="/account"
                className={`hover:opacity-75 ${getLinkItemClasses(
                  isEffectivelyTransparent
                )}`}
              >
                <UserIcon />
              </Link>
            </div>
          </nav>
        </div>
      </header>
      <CartOverlay isOpen={isCartOpen} onClose={handleCloseCart} />
    </>
  );
};

export default Navbar;
