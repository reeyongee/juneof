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

  // Comprehensive cursor reset function for edge cases
  const resetCursorToDefault = useCallback((reason: string = "unknown") => {
    console.log(`Resetting cursor to default state. Reason: ${reason}`);

    // Clear all state
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
        console.warn("Cursor shape validation failed, correcting:", {
          currentWidth,
          currentHeight,
          expectedSize,
          currentBorderRadius,
          isWrongSize,
          isNotCircular,
        });

        // Force correction
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
    console.log("Started cursor shape monitoring");
  }, [validateAndCorrectCursorShape]);

  const stopShapeMonitoring = useCallback(() => {
    if (shapeMonitorRef.current) {
      clearTimeout(shapeMonitorRef.current);
      shapeMonitorRef.current = null;
      console.log("Stopped cursor shape monitoring");
    }
  }, []);

  // Render loop for smooth cursor movement
  const render = useCallback(() => {
    if (!cursorWrapperRef.current || !isCursorActiveRef.current) {
      renderLoopRef.current = requestAnimationFrame(render);
      return;
    }

    try {
      let targetX, targetY, currentLerpAmount;

      if (isStuckRef.current && stuckToRef.current) {
        // Check if the stuck element still exists in DOM
        if (!document.contains(stuckToRef.current)) {
          console.warn("Stuck element removed from DOM, resetting cursor");
          resetCursorToDefault("stuck-element-removed");

          // Continue with normal mouse following
          targetX = mousePos.current.x;
          targetY = mousePos.current.y;
          currentLerpAmount = lerpAmount;
        } else {
          // Magnetic mode: target the center of the stuck element
          const targetRect = stuckToRef.current.getBoundingClientRect();

          // Check if element has valid dimensions (not hidden or collapsed)
          if (targetRect.width === 0 || targetRect.height === 0) {
            console.warn("Stuck element has no dimensions, resetting cursor");
            resetCursorToDefault("stuck-element-no-dimensions");

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
    } catch (error) {
      console.error("Cursor render error:", error);
      // Simple error recovery - reset cursor and continue
      resetCursorToDefault("render-error");
      renderLoopRef.current = requestAnimationFrame(render);
    }
  }, [lerpAmount, stuckLerpAmount, resetCursorToDefault]);

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
    console.log("Magnetic enter triggered on:", target);
    if (!outerCursorRef.current || !target) return;

    // Ensure target element still exists in DOM
    if (!document.contains(target)) {
      console.warn("Magnetic target no longer in DOM, aborting");
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
      console.log("Using circle effect for:", target);

      // Kill any existing magnetic tween before starting circle effect
      if (magneticTweenRef.current) {
        magneticTweenRef.current.kill();
        magneticTweenRef.current = null;
      }

      // Ensure we're not in stuck state for circle effects
      isStuckRef.current = false;
      stuckToRef.current = null;

      if (enlargeCursorTweenRef.current) {
        enlargeCursorTweenRef.current.play();
      }
      return;
    }

    console.log("Using magnetic effect for:", target);

    // Kill ALL existing tweens before starting magnetic effect
    if (enlargeCursorTweenRef.current) {
      enlargeCursorTweenRef.current.kill();
      // Reset any circle effect properties
      gsap.set(outerCursorRef.current, {
        backgroundColor: cursorOriginals.current.backgroundColor,
        borderColor: cursorOriginals.current.borderColor,
        opacity: 1,
      });
    }

    if (magneticTweenRef.current) {
      magneticTweenRef.current.kill();
      magneticTweenRef.current = null;
    }

    // Set magnetic state
    isStuckRef.current = true;
    stuckToRef.current = target;

    const targetRect = target.getBoundingClientRect();
    console.log("Target rect:", targetRect);

    // Add transition state to prevent jarring changes
    const transitionDuration = 0.15; // Shorter for snappier feel

    // Fade out the inner cursor dot when magnetic effect happens
    if (innerCursorRef.current) {
      gsap.to(innerCursorRef.current, {
        duration: transitionDuration,
        opacity: 0,
        ease: "power2.out",
      });
    }

    // Create magnetic effect: rounded rectangular border only (no background)
    magneticTweenRef.current = gsap.to(outerCursorRef.current, {
      duration: transitionDuration,
      width: targetRect.width + 16,
      height: targetRect.height + 24,
      backgroundColor: "transparent",
      borderColor: "rgba(128, 128, 128, 0.8)",
      borderWidth: "2px",
      borderRadius: "8px",
      opacity: 1,
      ease: "power2.out",
      // Add completion callback to ensure state is properly set
      onComplete: () => {
        console.log("Magnetic enter animation completed");
      },
      // Add error handling
      onInterrupt: () => {
        console.log("Magnetic enter animation interrupted");
      },
    });
  }, []);

  const handleMagneticLeave = useCallback(() => {
    console.log("Magnetic leave triggered");
    if (!outerCursorRef.current) return;

    // Check if we were using circle effect
    if (!isStuckRef.current) {
      // We were using circle effect, reverse it
      console.log("Reversing circle effect");
      if (enlargeCursorTweenRef.current) {
        enlargeCursorTweenRef.current.reverse();
      }
      return;
    }

    console.log("Reversing magnetic effect");

    // Clear magnetic state immediately to prevent race conditions
    const wasStuck = isStuckRef.current;

    isStuckRef.current = false;
    stuckToRef.current = null;

    // Validate that we actually had a magnetic state
    if (!wasStuck) {
      console.warn("handleMagneticLeave called but cursor wasn't stuck");
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

    const transitionDuration = 0.2; // Slightly longer for smoother exit

    // Fade the inner cursor dot back in
    if (innerCursorRef.current) {
      gsap.to(innerCursorRef.current, {
        duration: transitionDuration,
        opacity: 1,
        ease: "power2.out",
      });
    }

    // Revert to original appearance - ensure ALL properties are reset
    magneticTweenRef.current = gsap.to(outerCursorRef.current, {
      duration: transitionDuration,
      width: cursorOriginals.current.width,
      height: cursorOriginals.current.height,
      backgroundColor: cursorOriginals.current.backgroundColor,
      borderColor: cursorOriginals.current.borderColor,
      borderWidth: "2px",
      borderRadius: "50%", // Explicitly ensure circular shape
      opacity: 1,
      ease: "power2.out",
      // Force these properties to prevent shape distortion
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      // Add completion callback
      onComplete: () => {
        console.log("Magnetic leave animation completed");
        // Double-check that we're back to circular state
        if (outerCursorRef.current) {
          gsap.set(outerCursorRef.current, {
            borderRadius: "50%",
            scaleX: 1,
            scaleY: 1,
          });
        }
        // Validate shape after transition
        setTimeout(validateAndCorrectCursorShape, 50);
      },
      // Add error handling
      onInterrupt: () => {
        console.log("Magnetic leave animation interrupted");
        // Force reset to original state if interrupted
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
        // Validate shape after forced reset
        setTimeout(validateAndCorrectCursorShape, 50);
      },
    });
  }, [validateAndCorrectCursorShape]);

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
      resetCursorToDefault(`event-reset-${e.detail?.reason || "unknown"}`);

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
      console.log("Cleaning up cursor initialization");

      // Mark as not initialized
      isInitializedRef.current = false;

      // Stop render loop
      stopRenderLoop();

      // Stop shape monitoring
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
    pathname,
    startShapeMonitoring,
    stopShapeMonitoring,
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
    }
  }, [
    showSplash,
    startRenderLoop,
    stopRenderLoop,
    initializeCursor,
    startShapeMonitoring,
    validateAndCorrectCursorShape,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("CustomCursor component unmounting");

      // Mark as not initialized
      isInitializedRef.current = false;

      // Stop render loop
      stopRenderLoop();

      // Stop shape monitoring
      stopShapeMonitoring();

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
  }, [stopRenderLoop, stopShapeMonitoring]);

  // Debug utilities for development
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      process.env.NODE_ENV === "development"
    ) {
      const debugCursor = () => {
        if (!outerCursorRef.current) return { error: "Cursor not initialized" };

        const element = outerCursorRef.current;
        const computedStyle = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();

        return {
          state: {
            isStuck: isStuckRef.current,
            isInitialized: isInitializedRef.current,
            isCursorActive: isCursorActiveRef.current,
            stuckElement: stuckToRef.current?.tagName || null,
          },
          position: {
            mouse: mousePos.current,
            current: currentPos.current,
            wrapper: cursorWrapperRef.current
              ? {
                  transform: cursorWrapperRef.current.style.transform,
                  display: cursorWrapperRef.current.style.display,
                }
              : null,
          },
          dimensions: {
            computed: {
              width: computedStyle.width,
              height: computedStyle.height,
              borderRadius: computedStyle.borderRadius,
            },
            rect: {
              width: rect.width,
              height: rect.height,
            },
            expected: cursorOriginals.current,
          },
        };
      };

      const resetCursor = () => {
        console.log("Manual cursor reset triggered");
        resetCursorToDefault("manual-debug-reset");
      };

      // Expose debug functions
      const globalWindow = window as typeof window & {
        debugCursor?: () => object;
        resetCursor?: () => void;
      };
      globalWindow.debugCursor = debugCursor;
      globalWindow.resetCursor = resetCursor;
      console.log(
        "Debug functions available: window.debugCursor() and window.resetCursor()"
      );
    }
  }, [resetCursorToDefault]);

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
