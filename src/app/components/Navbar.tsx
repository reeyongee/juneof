"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState, useRef, useCallback } from "react";
import CartOverlay from "./CartOverlay";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

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
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const profileDropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navbarRef = useRef<HTMLElement>(null);
  const HOVER_DELAY_MS = 300;

  const { cartItems } = useCart();
  const { isAuthenticated, customerData, login, logout, isLoading } = useAuth();

  const totalCartItems = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const handleCloseCart = useCallback(() => {
    setIsCartOpen(false);
  }, []);

  useEffect(() => {
    // Function to measure and update navbar height
    const updateNavbarHeight = () => {
      if (navbarRef.current) {
        const height = navbarRef.current.offsetHeight;
        document.documentElement.style.setProperty(
          "--navbar-height",
          `${height}px`
        );
      }
    };

    // Update height on mount and resize
    updateNavbarHeight();
    window.addEventListener("resize", updateNavbarHeight);

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
          // Only hide navbar if we've actually scrolled down AND reached the bottom
          // Check if the page is tall enough to scroll
          const isPageScrollable =
            document.body.scrollHeight > window.innerHeight;
          const hasScrolledDown = window.scrollY > 100; // Only hide if scrolled down at least 100px

          // When bottomSentinel enters viewport (scrolled to bottom), hide navbar
          // But only if the page is scrollable and we've scrolled down
          if (entry.isIntersecting && isPageScrollable && hasScrolledDown) {
            setVisible(false);
          } else if (!entry.isIntersecting) {
            setVisible(true);
          }
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

    // Ensure navbar is visible on short pages that don't require scrolling
    const checkPageHeight = () => {
      const isPageScrollable = document.body.scrollHeight > window.innerHeight;
      if (!isPageScrollable) {
        setVisible(true); // Always show navbar on short pages
      }
    };

    // Check immediately and on resize
    checkPageHeight();
    window.addEventListener("resize", checkPageHeight);

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

      window.removeEventListener("resize", checkPageHeight);
      window.removeEventListener("resize", updateNavbarHeight);

      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (profileDropdownTimeoutRef.current) {
        clearTimeout(profileDropdownTimeoutRef.current);
      }
    };
  }, []);

  // Effect to manage navbar-hidden class on body
  useEffect(() => {
    if (visible) {
      document.body.classList.remove("navbar-hidden");
    } else {
      document.body.classList.add("navbar-hidden");
    }
  }, [visible]);

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
    // Navbar background becomes transparent if scrolled and not hovered
    transparent && !isNavItemHovered ? "bg-transparent" : "bg-[#F8F4EC]"
  }`;

  // Link items get mix-blend-difference if navbar is transparent, otherwise no special blend mode.
  const getLinkItemClasses = (isNavbarTransparent: boolean) =>
    `transition-all duration-300 ${
      isNavbarTransparent ? "mix-blend-difference" : ""
    }`;

  const navLinkBaseClasses =
    "text-lg lowercase tracking-wider hover:opacity-75"; // Changed from text-base to text-lg for even bigger font

  // Determine if the navbar is effectively transparent for item styling
  const isEffectivelyTransparent = transparent && !isNavItemHovered;

  return (
    <>
      <header ref={navbarRef} className={dynamicHeaderClasses}>
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
              className="pointer-events-none"
              style={{ userSelect: "none" }}
              draggable="false"
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
                data-underline-button-effect
              >
                shop
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
                  )}`}
                >
                  bag
                </button>
                {totalCartItems > 0 && (
                  <span className="absolute -top-4 -right-4 flex items-center justify-center w-5 h-5 bg-gray-800 text-white text-xs rounded-full">
                    {totalCartItems}
                  </span>
                )}
              </div>
              {/* Profile Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => {
                  if (profileDropdownTimeoutRef.current) {
                    clearTimeout(profileDropdownTimeoutRef.current);
                  }
                  setIsProfileDropdownOpen(true);
                }}
                onMouseLeave={() => {
                  profileDropdownTimeoutRef.current = setTimeout(() => {
                    setIsProfileDropdownOpen(false);
                  }, 150);
                }}
              >
                <button
                  className={`${getLinkItemClasses(
                    isEffectivelyTransparent
                  )} hover:opacity-75 transition-opacity`}
                  data-underline-button-effect
                >
                  <UserIcon />
                </button>
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[#F8F4EC] border border-gray-200 shadow-lg z-50">
                    <div className="py-1">
                      {isAuthenticated ? (
                        <>
                          {customerData && (
                            <div className="px-4 py-2 border-b border-gray-200">
                              <p className="text-sm lowercase tracking-wider text-gray-600">
                                hello,{" "}
                                {customerData.customer.firstName ||
                                  customerData.customer.displayName}
                              </p>
                            </div>
                          )}
                          <Link
                            href="/dashboard"
                            className="block px-4 py-2 text-lg lowercase tracking-wider hover:opacity-75 hover:bg-gray-100 transition-colors text-center"
                          >
                            dashboard
                          </Link>
                          <button
                            onClick={logout}
                            className="block w-full px-4 py-2 text-lg lowercase tracking-wider hover:opacity-75 hover:bg-gray-100 transition-colors text-center"
                          >
                            logout
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={login}
                          disabled={isLoading}
                          className="block w-full px-4 py-2 text-lg lowercase tracking-wider hover:opacity-75 hover:bg-gray-100 transition-colors text-center disabled:opacity-50"
                        >
                          {isLoading ? "logging in..." : "login"}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <Link
                href="https://www.instagram.com/juneofofficial/"
                target="_blank"
                rel="noopener noreferrer"
                className={`${getLinkItemClasses(isEffectivelyTransparent)}`}
                data-underline-button-effect
              >
                <InstagramIcon />
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
