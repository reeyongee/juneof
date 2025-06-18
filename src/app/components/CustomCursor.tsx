"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useSplash } from "@/context/SplashContext";
import gsap from "gsap";

export default function CustomCursor() {
  const cursorWrapperRef = useRef<HTMLDivElement>(null);
  const outerCursorRef = useRef<HTMLDivElement>(null);
  const innerCursorRef = useRef<HTMLDivElement>(null);
  const enlargeCursorTweenRef = useRef<gsap.core.Tween | null>(null);
  const magneticTweenRef = useRef<gsap.core.Tween | null>(null);
  const isCursorActiveRef = useRef(false);
  const isStuckRef = useRef(false);
  const stuckToRef = useRef<Element | null>(null);
  const renderLoopRef = useRef<number | null>(null); // Track render loop RAF ID
  const isInitializedRef = useRef(false); // Track initialization state

  const pathname = usePathname();
  const { showSplash } = useSplash();

  // Configuration
  const fullCursorSize = 40;
  const easing = "power2.out";
  const lerpAmount = 0.15; // Normal mouse following smoothness
  const stuckLerpAmount = 0.2; // Magnetic snap smoothness - reduced for smoother movement

  // Mouse position tracking - Initialize with center of screen as fallback
  const mousePos = useRef({
    x: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
    y: typeof window !== "undefined" ? window.innerHeight / 2 : 0,
  });
  const currentPos = useRef({
    x: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
    y: typeof window !== "undefined" ? window.innerHeight / 2 : 0,
  });

  // Store original cursor properties
  const cursorOriginals = useRef({
    width: 6,
    height: 6,
    borderColor: "white",
    backgroundColor: "white",
    borderRadius: "50%", // Store original border radius
  });

  // Capture initial mouse position immediately when component mounts
  const captureInitialMousePosition = useCallback(() => {
    const handleInitialMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      currentPos.current = { x: e.clientX, y: e.clientY };
      console.log("Initial mouse position captured:", e.clientX, e.clientY);

      // Remove this one-time listener after capturing initial position
      document.removeEventListener("mousemove", handleInitialMouseMove);
    };

    // Add temporary listener to capture first mouse movement
    document.addEventListener("mousemove", handleInitialMouseMove, {
      once: true,
    });

    // Fallback: If no mouse movement detected within 100ms, use current cursor position
    setTimeout(() => {
      document.removeEventListener("mousemove", handleInitialMouseMove);
    }, 100);
  }, []);

  const updateMousePosition = useCallback((e: MouseEvent) => {
    mousePos.current = { x: e.clientX, y: e.clientY };
  }, []);

  // Render loop for smooth cursor movement
  const render = useCallback(() => {
    if (!cursorWrapperRef.current || !isCursorActiveRef.current) {
      renderLoopRef.current = requestAnimationFrame(render);
      return;
    }

    let targetX, targetY, currentLerpAmount;

    if (isStuckRef.current && stuckToRef.current) {
      // Magnetic mode: target the center of the stuck element
      const targetRect = stuckToRef.current.getBoundingClientRect();
      targetX = targetRect.left + targetRect.width / 2;
      targetY = targetRect.top + targetRect.height / 2;
      currentLerpAmount = stuckLerpAmount;
    } else {
      // Normal mode: follow mouse
      targetX = mousePos.current.x;
      targetY = mousePos.current.y;
      currentLerpAmount = lerpAmount;
    }

    // Linear interpolation for smooth movement
    currentPos.current.x +=
      (targetX - currentPos.current.x) * currentLerpAmount;
    currentPos.current.y +=
      (targetY - currentPos.current.y) * currentLerpAmount;

    // Update cursor position
    gsap.set(cursorWrapperRef.current, {
      x: currentPos.current.x,
      y: currentPos.current.y,
    });

    renderLoopRef.current = requestAnimationFrame(render);
  }, [lerpAmount, stuckLerpAmount]);

  const startRenderLoop = useCallback(() => {
    console.log("Starting render loop");

    // Stop any existing render loop
    if (renderLoopRef.current) {
      cancelAnimationFrame(renderLoopRef.current);
    }

    // Start new render loop immediately
    renderLoopRef.current = requestAnimationFrame(render);
  }, [render]);

  const stopRenderLoop = useCallback(() => {
    console.log("Stopping render loop");
    if (renderLoopRef.current) {
      cancelAnimationFrame(renderLoopRef.current);
      renderLoopRef.current = null;
    }
  }, []);

  // Magnetic hover handlers for buttons
  const handleMagneticEnter = useCallback((e: Event) => {
    const target = e.currentTarget as Element;
    console.log("Magnetic enter triggered on:", target); // Debug log
    if (!outerCursorRef.current || !target) return;

    // Check if this element should use enlarging circle instead of magnetic box
    const shouldUseCircle =
      target.closest('a[href="/"]') || // Logo link
      target.classList.contains("clear-cart-btn") ||
      target.textContent?.toLowerCase().includes("wash care") ||
      target.textContent?.toLowerCase().includes("size chart") ||
      target.textContent?.trim() === "+" || // Cart quantity increase
      target.textContent?.trim() === "-" || // Cart quantity decrease
      target.getAttribute("aria-label")?.includes("Remove") ||
      (target as HTMLElement).querySelector(".h-6.w-6"); // Close button with icon

    if (shouldUseCircle) {
      // Use enlarging circle effect
      if (enlargeCursorTweenRef.current) {
        enlargeCursorTweenRef.current.play();
      }
      return;
    }

    isStuckRef.current = true;
    stuckToRef.current = target;

    const targetRect = target.getBoundingClientRect();
    console.log("Target rect:", targetRect); // Debug log

    // Kill any existing magnetic tween
    if (magneticTweenRef.current) {
      magneticTweenRef.current.kill();
    }

    // Fade out the inner cursor dot when magnetic effect happens
    if (innerCursorRef.current) {
      gsap.to(innerCursorRef.current, {
        duration: 0.2,
        opacity: 0,
        ease: "power3.out",
      });
    }

    // Create magnetic effect: rounded rectangular border only (no background)
    magneticTweenRef.current = gsap.to(outerCursorRef.current, {
      duration: 0.2,
      width: targetRect.width + 16,
      height: targetRect.height + 24,
      backgroundColor: "transparent",
      borderColor: "rgba(128, 128, 128, 0.8)",
      borderWidth: "2px",
      borderRadius: "8px",
      opacity: 1,
      ease: "power3.out",
    });
  }, []);

  const handleMagneticLeave = useCallback(() => {
    console.log("Magnetic leave triggered"); // Debug log
    if (!outerCursorRef.current) return;

    // Check if we were using circle effect
    if (!isStuckRef.current) {
      // We were using circle effect, reverse it
      if (enlargeCursorTweenRef.current) {
        enlargeCursorTweenRef.current.reverse();
      }
      return;
    }

    isStuckRef.current = false;
    stuckToRef.current = null;

    // Kill any existing magnetic tween
    if (magneticTweenRef.current) {
      magneticTweenRef.current.kill();
    }

    // Fade the inner cursor dot back in
    if (innerCursorRef.current) {
      gsap.to(innerCursorRef.current, {
        duration: 0.2,
        opacity: 1,
        ease: "power3.out",
      });
    }

    // Revert to original appearance - ensure circular shape
    magneticTweenRef.current = gsap.to(outerCursorRef.current, {
      duration: 0.2,
      width: cursorOriginals.current.width,
      height: cursorOriginals.current.height,
      backgroundColor: cursorOriginals.current.backgroundColor,
      borderColor: cursorOriginals.current.borderColor,
      borderWidth: "2px",
      borderRadius: "50%", // Explicitly ensure circular shape
      opacity: 1,
      ease: "power3.out",
    });
  }, []);

  // Initialize cursor and animations
  const initializeCursor = useCallback(() => {
    if (!outerCursorRef.current || !cursorWrapperRef.current) return;

    console.log("Initializing cursor, pathname:", pathname);

    // Check if device has fine pointer (mouse/trackpad)
    const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (!hasFinePointer) return;

    // Prevent multiple initializations
    if (isInitializedRef.current) {
      console.log("Cursor already initialized, skipping...");
      return;
    }

    // Reset cursor state to prevent phantom element issues
    isStuckRef.current = false;
    stuckToRef.current = null;

    // Capture initial mouse position immediately
    captureInitialMousePosition();

    // Show custom cursor only if splash screen is not showing
    if (cursorWrapperRef.current) {
      cursorWrapperRef.current.style.display = showSplash ? "none" : "block";
      if (!showSplash) {
        gsap.to(cursorWrapperRef.current, { duration: 0.3, autoAlpha: 1 });
      }
    }

    if (!showSplash) {
      document.body.classList.add("custom-cursor-active");
      isCursorActiveRef.current = true;
    }

    // Reset cursor to original state
    gsap.set(outerCursorRef.current, {
      width: cursorOriginals.current.width,
      height: cursorOriginals.current.height,
      backgroundColor: cursorOriginals.current.backgroundColor,
      borderColor: cursorOriginals.current.borderColor,
      borderRadius: "50%",
      opacity: 1,
    });

    // Reset inner cursor to original state
    if (innerCursorRef.current) {
      gsap.set(innerCursorRef.current, {
        opacity: 1,
      });
    }

    // Create GSAP tween for regular enlarging cursor effect (for special elements)
    enlargeCursorTweenRef.current = gsap.to(outerCursorRef.current, {
      duration: 0.3,
      width: fullCursorSize,
      height: fullCursorSize,
      backgroundColor: "grey",
      borderColor: "grey",
      opacity: 0.6,
      ease: easing,
      paused: true,
    });

    // Function to attach magnetic listeners to elements
    const attachMagneticListeners = () => {
      // Don't attach listeners during splash screen
      if (showSplash) return;

      // Remove existing listeners first
      const existingMagneticElements = document.querySelectorAll(
        "[data-magnetic-attached]"
      );
      existingMagneticElements.forEach((element) => {
        element.removeEventListener("mouseenter", handleMagneticEnter);
        element.removeEventListener("mouseleave", handleMagneticLeave);
        element.removeAttribute("data-magnetic-attached");
      });

      // Attach magnetic event listeners to buttons and links
      const magneticElements = document.querySelectorAll("button, a");
      console.log(
        "Found magnetic elements (buttons + links):",
        magneticElements.length
      );

      magneticElements.forEach((element, index) => {
        // Skip if already has magnetic listeners
        if (element.hasAttribute("data-magnetic-attached")) return;

        console.log(
          `Attaching magnetic listeners to element ${index}:`,
          element
        );
        element.addEventListener("mouseenter", handleMagneticEnter);
        element.addEventListener("mouseleave", handleMagneticLeave);
        element.setAttribute("data-magnetic-attached", "true");
      });
    };

    // Initial attachment with delay to ensure DOM is ready (only if not showing splash)
    if (!showSplash) {
      setTimeout(attachMagneticListeners, 100);
    }

    // Set up MutationObserver to watch for dynamically added elements
    const observer = new MutationObserver((mutations) => {
      // Don't reattach during splash screen
      if (showSplash) return;

      let shouldReattach = false;
      mutations.forEach((mutation) => {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (
                element.matches("button, a") ||
                element.querySelector("button, a")
              ) {
                shouldReattach = true;
              }
            }
          });
        }
      });

      if (shouldReattach) {
        console.log("DOM changed, reattaching magnetic listeners");
        setTimeout(attachMagneticListeners, 100);
      }
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Add mouse move listener
    document.addEventListener("mousemove", updateMousePosition);

    // Add cursor reset event listener
    const handleCursorReset = (e: CustomEvent) => {
      console.log("Cursor reset triggered:", e.detail);
      // Reset cursor state
      isStuckRef.current = false;
      stuckToRef.current = null;

      // Kill any existing tweens
      if (enlargeCursorTweenRef.current) {
        enlargeCursorTweenRef.current.kill();
      }
      if (magneticTweenRef.current) {
        magneticTweenRef.current.kill();
      }

      // Reset cursor to original state
      if (outerCursorRef.current) {
        gsap.set(outerCursorRef.current, {
          width: cursorOriginals.current.width,
          height: cursorOriginals.current.height,
          backgroundColor: cursorOriginals.current.backgroundColor,
          borderColor: cursorOriginals.current.borderColor,
          borderRadius: "50%",
          opacity: 1,
        });
      }

      // Reset inner cursor
      if (innerCursorRef.current) {
        gsap.set(innerCursorRef.current, {
          opacity: 1,
        });
      }

      // Ensure cursor wrapper is visible
      if (cursorWrapperRef.current) {
        cursorWrapperRef.current.style.display = "block";
        gsap.set(cursorWrapperRef.current, { autoAlpha: 1 });
      }
    };

    document.addEventListener(
      "cursor-reset",
      handleCursorReset as EventListener
    );

    // Start render loop only if not showing splash - NO DELAY
    if (!showSplash) {
      startRenderLoop();
    }

    // Mark as initialized
    isInitializedRef.current = true;

    // Cleanup function
    return () => {
      console.log("Cleaning up cursor initialization");

      // Mark as not initialized
      isInitializedRef.current = false;

      // Stop render loop
      stopRenderLoop();

      // Reset state
      isStuckRef.current = false;
      stuckToRef.current = null;

      // Remove magnetic listeners
      const magneticElements = document.querySelectorAll(
        "[data-magnetic-attached]"
      );
      magneticElements.forEach((element) => {
        element.removeEventListener("mouseenter", handleMagneticEnter);
        element.removeEventListener("mouseleave", handleMagneticLeave);
        element.removeAttribute("data-magnetic-attached");
      });

      // Disconnect observer
      observer.disconnect();

      document.removeEventListener("mousemove", updateMousePosition);
      document.removeEventListener(
        "cursor-reset",
        handleCursorReset as EventListener
      );

      if (enlargeCursorTweenRef.current) {
        enlargeCursorTweenRef.current.kill();
        enlargeCursorTweenRef.current = null;
      }

      if (magneticTweenRef.current) {
        magneticTweenRef.current.kill();
        magneticTweenRef.current = null;
      }
    };
  }, [
    handleMagneticEnter,
    handleMagneticLeave,
    updateMousePosition,
    startRenderLoop,
    stopRenderLoop,
    captureInitialMousePosition,
    fullCursorSize,
    easing,
    showSplash,
    pathname,
  ]);

  // Initialize on mount and pathname changes - but be smarter about it
  useEffect(() => {
    console.log(
      "Cursor useEffect triggered - pathname:",
      pathname,
      "showSplash:",
      showSplash
    );

    // Don't initialize during splash screen
    if (showSplash) {
      console.log("Skipping cursor initialization during splash screen");
      return;
    }

    // For route changes, we don't need to completely reinitialize
    // Just refresh the magnetic listeners and ensure cursor is active
    if (isInitializedRef.current) {
      console.log("Cursor already initialized, refreshing for route change");

      // Refresh magnetic listeners for new page content
      setTimeout(() => {
        const existingMagneticElements = document.querySelectorAll(
          "[data-magnetic-attached]"
        );
        existingMagneticElements.forEach((element) => {
          element.removeEventListener("mouseenter", handleMagneticEnter);
          element.removeEventListener("mouseleave", handleMagneticLeave);
          element.removeAttribute("data-magnetic-attached");
        });

        // Reattach to new elements
        const magneticElements = document.querySelectorAll("button, a");
        magneticElements.forEach((element) => {
          if (!element.hasAttribute("data-magnetic-attached")) {
            element.addEventListener("mouseenter", handleMagneticEnter);
            element.addEventListener("mouseleave", handleMagneticLeave);
            element.setAttribute("data-magnetic-attached", "true");
          }
        });
      }, 100);

      return;
    }

    // Full initialization only if not initialized yet
    const cleanup = initializeCursor();
    return cleanup;
  }, [
    initializeCursor,
    pathname,
    showSplash,
    handleMagneticEnter,
    handleMagneticLeave,
  ]);

  // Handle splash screen visibility changes
  useEffect(() => {
    if (!cursorWrapperRef.current) return;

    if (showSplash) {
      // Hide cursor during splash screen
      console.log("Hiding cursor for splash screen");
      cursorWrapperRef.current.style.display = "none";
      document.body.classList.remove("custom-cursor-active");
      isCursorActiveRef.current = false;

      // Stop render loop during splash
      stopRenderLoop();
    } else {
      // Show cursor after splash screen
      console.log("Showing cursor after splash screen");
      const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
      if (hasFinePointer) {
        cursorWrapperRef.current.style.display = "block";
        gsap.to(cursorWrapperRef.current, { duration: 0.3, autoAlpha: 1 });
        document.body.classList.add("custom-cursor-active");
        isCursorActiveRef.current = true;

        // Start render loop after splash screen
        startRenderLoop();

        // Initialize cursor if not already initialized
        if (!isInitializedRef.current) {
          setTimeout(() => {
            initializeCursor();
          }, 100);
        }
      }
    }
  }, [showSplash, startRenderLoop, stopRenderLoop, initializeCursor]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("CustomCursor component unmounting");

      // Mark as not initialized
      isInitializedRef.current = false;

      // Stop render loop
      stopRenderLoop();

      if (isCursorActiveRef.current) {
        document.body.classList.remove("custom-cursor-active");
        isCursorActiveRef.current = false;
      }

      if (enlargeCursorTweenRef.current) {
        enlargeCursorTweenRef.current.kill();
      }
      if (magneticTweenRef.current) {
        magneticTweenRef.current.kill();
      }
    };
  }, [stopRenderLoop]);

  return (
    <div
      ref={cursorWrapperRef}
      className="cursor-wrapper"
      style={{ display: "none" }}
    >
      <div ref={outerCursorRef} className="custom-cursor custom-cursor--outer">
        <div
          ref={innerCursorRef}
          className="custom-cursor custom-cursor--inner"
        ></div>
      </div>
    </div>
  );
}
