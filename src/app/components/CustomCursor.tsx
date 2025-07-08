"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import { useSplash } from "@/context/SplashContext";
import gsap from "gsap";

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

export default function CustomCursor() {
  const isMobile = useIsMobile();
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

  // Disable custom cursor for admin routes
  const isAdminRoute = pathname.startsWith("/admin");

  // Restore native cursor for admin routes
  useEffect(() => {
    if (isAdminRoute) {
      document.body.classList.remove("custom-cursor-active");
      document.body.style.cursor = "auto";
      document.body.setAttribute("data-admin-route", "true");
      return;
    } else {
      document.body.removeAttribute("data-admin-route");
    }
  }, [isAdminRoute]);

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

  // Comprehensive cursor reset function for edge cases
  const resetCursorToDefault = useCallback(() => {
    isStuckRef.current = false;
    stuckToRef.current = null;

    // Kill all tweens
    if (enlargeCursorTweenRef.current) {
      enlargeCursorTweenRef.current.kill();
      enlargeCursorTweenRef.current = null;
    }

    if (magneticTweenRef.current) {
      magneticTweenRef.current.kill();
      magneticTweenRef.current = null;
    }

    // Force reset all cursor properties with explicit values
    if (outerCursorRef.current) {
      gsap.set(outerCursorRef.current, {
        width: cursorOriginals.current.width,
        height: cursorOriginals.current.height,
        backgroundColor: cursorOriginals.current.backgroundColor,
        borderColor: cursorOriginals.current.borderColor,
        borderWidth: "2px",
        borderRadius: "50%",
        opacity: 1,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        skewX: 0,
        skewY: 0,
        // Clear any transform-origin changes
        transformOrigin: "50% 50%",
        // Reset any potential CSS transforms
        transform: "none",
        // Ensure no flex distortion
        flexShrink: 0,
      });
    }

    // Reset inner cursor
    if (innerCursorRef.current) {
      gsap.set(innerCursorRef.current, {
        opacity: 1,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        skewX: 0,
        skewY: 0,
      });
    }

    // Ensure cursor wrapper is properly positioned
    if (cursorWrapperRef.current) {
      gsap.set(cursorWrapperRef.current, {
        autoAlpha: 1,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
      });
    }
  }, []);

  // Shape validation and correction function
  const validateAndCorrectCursorShape = useCallback(() => {
    if (!outerCursorRef.current) return;

    const element = outerCursorRef.current;
    const computedStyle = window.getComputedStyle(element);

    // Get current dimensions
    const currentWidth = parseFloat(computedStyle.width);
    const currentHeight = parseFloat(computedStyle.height);
    const currentBorderRadius = computedStyle.borderRadius;

    // Check if cursor is in normal (circular) state
    const shouldBeCircular = !isStuckRef.current;

    if (shouldBeCircular) {
      // Validate circular shape
      const expectedSize = cursorOriginals.current.width;
      const tolerance = 1; // 1px tolerance

      const isWrongSize =
        Math.abs(currentWidth - expectedSize) > tolerance ||
        Math.abs(currentHeight - expectedSize) > tolerance;
      const isNotCircular = !currentBorderRadius.includes("50%");

      if (isWrongSize || isNotCircular) {
        gsap.set(element, {
          width: expectedSize,
          height: expectedSize,
          borderRadius: "50%",
          scaleX: 1,
          scaleY: 1,
        });
      }
    }
  }, []);

  // Periodic shape monitoring
  const shapeMonitorRef = useRef<NodeJS.Timeout | null>(null);

  const startShapeMonitoring = useCallback(() => {
    if (shapeMonitorRef.current) return; // Already monitoring

    const monitorShape = () => {
      validateAndCorrectCursorShape();
      shapeMonitorRef.current = setTimeout(monitorShape, 500); // Check every 500ms
    };

    monitorShape();
  }, [validateAndCorrectCursorShape]);

  const stopShapeMonitoring = useCallback(() => {
    if (shapeMonitorRef.current) {
      clearTimeout(shapeMonitorRef.current);
      shapeMonitorRef.current = null;
    }
  }, []);

  // Render loop for smooth cursor movement
  const render = useCallback(() => {
    if (!cursorWrapperRef.current) {
      renderLoopRef.current = requestAnimationFrame(render);
      return;
    }

    // Force cursor active if elements exist but state is wrong
    if (!isCursorActiveRef.current && cursorWrapperRef.current) {
      isCursorActiveRef.current = true;
      document.body.classList.add("custom-cursor-active");
      document.body.style.cursor = "none";
    }

    try {
      let targetX, targetY, currentLerpAmount;

      if (isStuckRef.current && stuckToRef.current) {
        // Check if the stuck element still exists in DOM
        if (!document.contains(stuckToRef.current)) {
          resetCursorToDefault();

          // Continue with normal mouse following
          targetX = mousePos.current.x;
          targetY = mousePos.current.y;
          currentLerpAmount = lerpAmount;
        } else {
          // Magnetic mode: target the center of the stuck element
          const targetRect = stuckToRef.current.getBoundingClientRect();

          // Check if element has valid dimensions (not hidden or collapsed)
          if (targetRect.width === 0 || targetRect.height === 0) {
            resetCursorToDefault();

            // Force reset and continue with mouse following
            targetX = mousePos.current.x;
            targetY = mousePos.current.y;
            currentLerpAmount = lerpAmount;
          } else {
            targetX = targetRect.left + targetRect.width / 2;
            targetY = targetRect.top + targetRect.height / 2;
            currentLerpAmount = stuckLerpAmount;
          }
        }
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
    } catch {
      resetCursorToDefault();
      renderLoopRef.current = requestAnimationFrame(render);
    }
  }, [lerpAmount, stuckLerpAmount, resetCursorToDefault]);

  const startRenderLoop = useCallback(() => {
    if (renderLoopRef.current) {
      cancelAnimationFrame(renderLoopRef.current);
    }

    renderLoopRef.current = requestAnimationFrame(render);
  }, [render]);

  const stopRenderLoop = useCallback(() => {
    if (renderLoopRef.current) {
      cancelAnimationFrame(renderLoopRef.current);
      renderLoopRef.current = null;
    }
  }, []);

  // Magnetic hover handlers for buttons
  const handleMagneticEnter = useCallback((e: Event) => {
    const target = e.currentTarget as Element;
    if (!outerCursorRef.current || !target) return;

    // Ensure target element still exists in DOM
    if (!document.contains(target)) {
      return;
    }

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

    // Fade out the inner cursor dot when magnetic effect happens
    if (innerCursorRef.current) {
      gsap.to(innerCursorRef.current, {
        duration: 0.15,
        opacity: 0,
        ease: "power2.out",
      });
    }

    // Create magnetic effect: rounded rectangular border only (no background)
    magneticTweenRef.current = gsap.to(outerCursorRef.current, {
      duration: 0.15,
      width: targetRect.width + 16,
      height: targetRect.height + 24,
      backgroundColor: "transparent",
      borderColor: "rgba(128, 128, 128, 0.8)",
      borderWidth: "2px",
      borderRadius: "8px",
      opacity: 1,
      ease: "power2.out",
      onComplete: () => {},
      onInterrupt: () => {},
    });
  }, []);

  const handleMagneticLeave = useCallback(() => {
    if (!outerCursorRef.current) return;

    // Check if we were using circle effect
    if (!isStuckRef.current) {
      // We were using circle effect, reverse it
      if (enlargeCursorTweenRef.current) {
        enlargeCursorTweenRef.current.reverse();
      }
      return;
    }

    // Clear magnetic state immediately to prevent race conditions
    const wasStuck = isStuckRef.current;

    isStuckRef.current = false;
    stuckToRef.current = null;

    // Validate that we actually had a magnetic state
    if (!wasStuck) {
      return;
    }

    // Kill any existing tweens with proper cleanup
    if (magneticTweenRef.current) {
      magneticTweenRef.current.kill();
      magneticTweenRef.current = null;
    }

    // Also kill any enlarging cursor tweens to prevent conflicts
    if (enlargeCursorTweenRef.current) {
      enlargeCursorTweenRef.current.kill();
    }

    // Fade the inner cursor dot back in
    if (innerCursorRef.current) {
      gsap.to(innerCursorRef.current, {
        duration: 0.2,
        opacity: 1,
        ease: "power2.out",
      });
    }

    // Revert to original appearance - ensure ALL properties are reset
    magneticTweenRef.current = gsap.to(outerCursorRef.current, {
      duration: 0.2,
      width: cursorOriginals.current.width,
      height: cursorOriginals.current.height,
      backgroundColor: cursorOriginals.current.backgroundColor,
      borderColor: cursorOriginals.current.borderColor,
      borderWidth: "2px",
      borderRadius: "50%", // Explicitly ensure circular shape
      opacity: 1,
      ease: "power2.out",
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      onComplete: () => {
        setTimeout(validateAndCorrectCursorShape, 50);
      },
      onInterrupt: () => {
        if (outerCursorRef.current) {
          gsap.set(outerCursorRef.current, {
            width: cursorOriginals.current.width,
            height: cursorOriginals.current.height,
            backgroundColor: cursorOriginals.current.backgroundColor,
            borderColor: cursorOriginals.current.borderColor,
            borderRadius: "50%",
            scaleX: 1,
            scaleY: 1,
          });
        }
        setTimeout(validateAndCorrectCursorShape, 50);
      },
    });
  }, [validateAndCorrectCursorShape]);

  // Initialize cursor and animations
  const initializeCursor = useCallback(() => {
    if (!outerCursorRef.current || !cursorWrapperRef.current) return;

    // Check if device has fine pointer (mouse/trackpad)
    const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (!hasFinePointer) return;

    // Allow reinitialization for navigation reliability
    // Reset any existing state first
    if (isInitializedRef.current) {
      // Clean up existing tweens
      if (enlargeCursorTweenRef.current) {
        enlargeCursorTweenRef.current.kill();
        enlargeCursorTweenRef.current = null;
      }
      if (magneticTweenRef.current) {
        magneticTweenRef.current.kill();
        magneticTweenRef.current = null;
      }
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
      // Ensure default cursor is hidden
      document.body.style.cursor = "none";
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

      magneticElements.forEach((element) => {
        // Skip if already has magnetic listeners
        if (element.hasAttribute("data-magnetic-attached")) return;

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
    const handleCursorReset = () => {
      resetCursorToDefault();

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
      // Start shape monitoring for robustness
      startShapeMonitoring();
    }

    // Mark as initialized
    isInitializedRef.current = true;

    // Cleanup function
    return () => {
      stopRenderLoop();
      stopShapeMonitoring();

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
    resetCursorToDefault,
    fullCursorSize,
    easing,
    showSplash,
    startShapeMonitoring,
    stopShapeMonitoring,
  ]);

  // Initialize on mount and reinitialize on pathname changes for bulletproof reliability
  useEffect(() => {
    if (showSplash) {
      return;
    }

    // Force complete reinitialization on every pathname change
    // This is more reliable than trying to partially update

    // First, clean up any existing state
    stopRenderLoop();
    stopShapeMonitoring();

    // Reset initialization flag to allow fresh init
    isInitializedRef.current = false;

    // Reset all cursor state
    isStuckRef.current = false;
    stuckToRef.current = null;
    isCursorActiveRef.current = false;

    // Clean up existing magnetic listeners
    const existingMagneticElements = document.querySelectorAll(
      "[data-magnetic-attached]"
    );
    existingMagneticElements.forEach((element) => {
      element.removeEventListener("mouseenter", handleMagneticEnter);
      element.removeEventListener("mouseleave", handleMagneticLeave);
      element.removeAttribute("data-magnetic-attached");
    });

    // Small delay to ensure DOM is ready and any transitions are complete
    const initTimeout = setTimeout(() => {
      // Fresh initialization
      const cleanup = initializeCursor();

      // Store cleanup function for this pathname
      return cleanup;
    }, 50);

    // Cleanup function
    return () => {
      clearTimeout(initTimeout);
      stopRenderLoop();
      stopShapeMonitoring();

      // Clean up magnetic listeners
      const magneticElements = document.querySelectorAll(
        "[data-magnetic-attached]"
      );
      magneticElements.forEach((element) => {
        element.removeEventListener("mouseenter", handleMagneticEnter);
        element.removeEventListener("mouseleave", handleMagneticLeave);
        element.removeAttribute("data-magnetic-attached");
      });
    };
  }, [
    pathname,
    showSplash,
    initializeCursor,
    handleMagneticEnter,
    handleMagneticLeave,
    stopRenderLoop,
    stopShapeMonitoring,
  ]);

  // Handle splash screen visibility changes
  useEffect(() => {
    if (!cursorWrapperRef.current) return;

    if (showSplash) {
      // Hide cursor during splash screen
      cursorWrapperRef.current.style.display = "none";
      document.body.classList.remove("custom-cursor-active");
      isCursorActiveRef.current = false;

      // Stop render loop during splash
      stopRenderLoop();
    } else {
      // Show cursor after splash screen
      cursorWrapperRef.current.style.display = "block";
      gsap.to(cursorWrapperRef.current, { duration: 0.3, autoAlpha: 1 });
      document.body.classList.add("custom-cursor-active");
      isCursorActiveRef.current = true;

      // Start render loop after splash screen
      startRenderLoop();

      // Start shape monitoring after splash
      startShapeMonitoring();

      // Initialize cursor if not already initialized
      if (!isInitializedRef.current) {
        setTimeout(() => {
          initializeCursor();
        }, 100);
      }

      // Validate cursor shape after splash transition
      setTimeout(validateAndCorrectCursorShape, 200);
    }
  }, [
    showSplash,
    startRenderLoop,
    stopRenderLoop,
    initializeCursor,
    startShapeMonitoring,
    validateAndCorrectCursorShape,
  ]);

  // Handle mobile to desktop transition
  useEffect(() => {
    if (isMobile) {
      // Clean up when going to mobile
      if (isCursorActiveRef.current) {
        document.body.classList.remove("custom-cursor-active");
        document.body.style.cursor = "auto";
        isCursorActiveRef.current = false;
      }
      stopRenderLoop();
      stopShapeMonitoring();
    } else {
      // Reinitialize when coming back from mobile to desktop
      if (!showSplash && cursorWrapperRef.current) {
        // Reset initialization flag to allow fresh init
        isInitializedRef.current = false;

        // Show cursor wrapper
        cursorWrapperRef.current.style.display = "block";
        gsap.set(cursorWrapperRef.current, { autoAlpha: 1 });

        // Add cursor active class
        document.body.classList.add("custom-cursor-active");
        isCursorActiveRef.current = true;

        // Start render loop
        startRenderLoop();
        startShapeMonitoring();

        // Capture initial mouse position for smooth transition
        captureInitialMousePosition();

        // Initialize cursor with a slight delay to ensure DOM is ready
        setTimeout(() => {
          initializeCursor();
        }, 100);

        // Validate cursor shape after initialization
        setTimeout(validateAndCorrectCursorShape, 200);
      }
    }
  }, [
    isMobile,
    showSplash,
    startRenderLoop,
    stopRenderLoop,
    startShapeMonitoring,
    stopShapeMonitoring,
    initializeCursor,
    validateAndCorrectCursorShape,
    captureInitialMousePosition,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRenderLoop();
      stopShapeMonitoring();

      if (isCursorActiveRef.current) {
        document.body.classList.remove("custom-cursor-active");
        // Restore default cursor
        document.body.style.cursor = "auto";
        isCursorActiveRef.current = false;
      }

      if (enlargeCursorTweenRef.current) {
        enlargeCursorTweenRef.current.kill();
      }
      if (magneticTweenRef.current) {
        magneticTweenRef.current.kill();
      }
    };
  }, [stopRenderLoop, stopShapeMonitoring]);

  // Don't render cursor on mobile devices or admin routes
  if (isMobile || isAdminRoute) {
    return null;
  }

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
