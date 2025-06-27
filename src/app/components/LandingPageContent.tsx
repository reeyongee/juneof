"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import ScrollIndicator from "./ScrollIndicator";
import { useViewportHeight } from "@/hooks/useViewportHeight";
import "../landing-page.css";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function LandingPageContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const section1Ref = useRef<HTMLDivElement>(null);
  const section2Ref = useRef<HTMLDivElement>(null);
  const section3Ref = useRef<HTMLDivElement>(null);
  const section4Ref = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);

  // Use our custom viewport height hook
  const {
    dimensions,
    isMobile,
    isInitialized: isViewportInitialized,
  } = useViewportHeight();

  // Track image loading state
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const loadedImagesRef = useRef(new Set<string>());
  const animationsInitializedRef = useRef(false);

  // Critical images that must load before animations
  const criticalImages = [
    "/landing-images/1.jpg",
    "/landing-images/2.jpg",
    "/landing-images/3.jpg",
    "/landing-images/4.jpg",
    "/landing-images/5.jpg",
    "/landing-images/6.jpg",
  ];

  // Handle individual image load
  const handleImageLoad = useCallback(
    (src: string) => {
      loadedImagesRef.current.add(src);

      // Check if all critical images are loaded
      if (loadedImagesRef.current.size >= criticalImages.length) {
        setImagesLoaded(true);
      }
    },
    [criticalImages.length]
  );

  // Ensure DOM is ready and CSS is painted
  const ensureDOMReady = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      // Use requestAnimationFrame to ensure paint is complete
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Double RAF ensures layout is complete
          resolve();
        });
      });
    });
  }, []);

  // Validate that elements have proper dimensions
  const validateDimensions = useCallback((): boolean => {
    if (!section1Ref.current) return false;

    const firstPanel = section1Ref.current.querySelector(
      ".panel.first"
    ) as HTMLElement;
    const lastPanel = section1Ref.current.querySelector(
      ".panel.last"
    ) as HTMLElement;
    const images = section1Ref.current.querySelectorAll(".panel img");

    // Check that panels have width
    if (!firstPanel?.offsetWidth || !lastPanel?.offsetWidth) {
      return false;
    }

    // Check that images have dimensions
    for (const img of images) {
      const imgElement = img as HTMLImageElement;
      if (!imgElement.offsetHeight || !imgElement.offsetWidth) {
        return false;
      }
    }

    return true;
  }, []);

  // Main animation initialization
  const initializeAnimations = useCallback(async () => {
    if (!containerRef.current || animationsInitializedRef.current) return;

    try {
      // Ensure DOM is ready
      await ensureDOMReady();

      // Validate dimensions before proceeding
      if (!validateDimensions()) {
        // Retry after a short delay
        setTimeout(() => initializeAnimations(), 100);
        return;
      }

      const width = dimensions.width;
      const height = dimensions.height;

      // Log initialization for debugging
      console.log("[LandingPage] Starting GSAP animations with dimensions:", {
        width,
        height,
        isMobile,
        source: "useViewportHeight",
      });

      gsap.defaults({ ease: "none", duration: 2 });

      // Kill any existing ScrollTriggers to prevent conflicts
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());

      // Section 1 animations - with proper dimension validation
      const section1panel = gsap.utils.toArray(".section1 .panel");
      const section1length = section1panel.length * height * 2;

      // Get first panel width with validation
      const firstPanelElement = document.querySelector(
        ".section1 .panel.first"
      ) as HTMLElement;

      if (!firstPanelElement?.offsetWidth) {
        throw new Error("First panel has no width");
      }

      const firstpanelpos = (width - firstPanelElement.offsetWidth) / 2;
      const section1gap = 40 * (width / 100);

      // Set styles with proper validation
      if (section1Ref.current) {
        section1Ref.current.style.height = `${section1length}px`;

        const container = section1Ref.current.querySelector(
          ".container"
        ) as HTMLElement;
        if (container) {
          container.style.columnGap = `${section1gap}px`;
        }

        const firstPanel = section1Ref.current.querySelector(
          ".panel.first"
        ) as HTMLElement;
        if (firstPanel) {
          firstPanel.style.marginLeft = `${firstpanelpos}px`;
          firstPanel.style.marginRight = `${firstpanelpos - section1gap / 4}px`;
        }

        // Center images vertically with dimension validation
        const images = section1Ref.current.querySelectorAll(".panel img");
        images.forEach((img) => {
          const imgElement = img as HTMLImageElement;
          if (imgElement.offsetHeight > 0) {
            imgElement.style.marginTop = `${
              (height - imgElement.offsetHeight) / 2
            }px`;
          }
        });
      }

      // Position sections with proper calculations
      if (section2Ref.current) {
        section2Ref.current.style.top = `${section1length - height}px`;
      }
      if (section3Ref.current) {
        section3Ref.current.style.top = `${section1length}px`;
      }

      // GSAP animations with proper validation
      gsap.to(".section1 .container", {
        scrollTrigger: {
          trigger: ".section1",
          start: "top top",
          end: "bottom bottom",
          pin: ".section1 .container",
          pinSpacing: false,
          scrub: true,
          markers: false,
        },
      });

      const lastpanel = document.querySelector(
        ".section1 .panel.last"
      ) as HTMLElement;

      if (lastpanel?.offsetWidth) {
        const lastpanelmove =
          lastpanel.offsetLeft + lastpanel.offsetWidth - width;
        gsap.to(section1panel, {
          scrollTrigger: {
            trigger: ".section1",
            start: "top top",
            end: () => `+=${section1length - 2 * height}`,
            scrub: true,
            markers: false,
            id: "section1-move",
          },
          ease: "power1.out",
          x: () => `+=${-lastpanelmove}`,
        });
      }

      // Section 3 parallax with dimension validation
      const section3Image = document.querySelector(
        ".section3 .container img"
      ) as HTMLImageElement;
      if (section3Image?.offsetHeight) {
        gsap.to(".section3 .container img", {
          scrollTrigger: {
            trigger: ".section3 .container",
            start: "top bottom",
            end: "bottom top",
            scrub: true,
            markers: false,
          },
          y: () => `+=${0.3 * section3Image.offsetHeight}`,
        });
      }

      // Position Section 4 with proper height calculation
      const section3length = section3Ref.current?.offsetHeight || 0;
      if (section4Ref.current) {
        section4Ref.current.style.top = `${section1length + section3length}px`;
      }

      // Section 4 parallax animations
      const section4Animations = [
        { selector: ".section4 .pic1", scrub: 2, yPercent: -150 },
        { selector: ".section4 .pic2", scrub: 0.8, yPercent: -120 },
        { selector: ".section4 .pic3", scrub: 1, yPercent: -130 },
        { selector: ".section4 .pic4", scrub: 0.5, yPercent: -140 },
        { selector: ".section4 .pic5", scrub: 0.5, yPercent: -160 },
        { selector: ".section4 .pic6", scrub: 1.2, yPercent: -125 },
        { selector: ".section4 .pic7", scrub: 0.7, yPercent: -145 },
      ];

      section4Animations.forEach(({ selector, scrub, yPercent }) => {
        gsap.to(selector, {
          scrollTrigger: {
            trigger: selector,
            start: "top bottom",
            endTrigger: ".section4",
            end: "bottom top",
            scrub,
            markers: false,
          },
          yPercent,
        });
      });

      // Set spacer height with proper calculation
      const section4length = section4Ref.current?.offsetHeight || 0;
      if (spacerRef.current) {
        spacerRef.current.style.height = `${
          section1length + section3length + section4length + height * 0.0001
        }px`;
      }

      // Mark animations as initialized
      animationsInitializedRef.current = true;
    } catch (error) {
      console.error("Error initializing animations:", error);
      // Retry after a delay if there was an error
      setTimeout(() => {
        animationsInitializedRef.current = false;
        initializeAnimations();
      }, 500);
    }
  }, [ensureDOMReady, validateDimensions, dimensions, isMobile]);

  // Trigger re-initialization when dimensions change (handled by useViewportHeight)
  useEffect(() => {
    if (isViewportInitialized && isHydrated && imagesLoaded) {
      // Reset animations when viewport dimensions change
      animationsInitializedRef.current = false;
      ScrollTrigger.refresh();

      // Re-initialize animations with new dimensions
      const timeoutId = setTimeout(() => {
        initializeAnimations();
      }, 50);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [
    dimensions,
    isViewportInitialized,
    isHydrated,
    imagesLoaded,
    initializeAnimations,
  ]);

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Initialize animations when all conditions are met
  useEffect(() => {
    if (!isHydrated || !imagesLoaded || !isViewportInitialized) return;

    // Log initialization for debugging
    console.log("[LandingPage] Initializing animations:", {
      isHydrated,
      imagesLoaded,
      isViewportInitialized,
      isMobile,
      dimensions,
    });

    // All conditions met, initializing animations
    initializeAnimations();

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      animationsInitializedRef.current = false;
    };
  }, [
    isHydrated,
    imagesLoaded,
    isViewportInitialized,
    isMobile,
    dimensions,
    initializeAnimations,
  ]);

  return (
    <div ref={containerRef} className="relative w-full z-[2]">
      {/* Scroll Indicator */}
      {!isMobile && <ScrollIndicator />}

      {/* Section 1 - Image Panels */}
      <div
        ref={section1Ref}
        className="section1 absolute block w-screen bg-[#FDF3E1] text-black"
      >
        <div className="container flex flex-row h-screen overflow-hidden w-screen max-w-none left-0">
          <div className="panel first relative h-screen">
            <Image
              className="pic1 relative block w-full"
              src="/landing-images/1.jpg"
              alt="pic1"
              width={800}
              height={600}
              priority
              sizes="(max-width: 768px) 48vw, 50vw"
              onLoad={() => handleImageLoad("/landing-images/1.jpg")}
            />
          </div>
          <div className="panel relative h-screen">
            <Image
              className="pic2 relative block w-full"
              src="/landing-images/2.jpg"
              alt="pic2"
              width={800}
              height={600}
              priority
              sizes="(max-width: 768px) 80vw, 35vw"
              onLoad={() => handleImageLoad("/landing-images/2.jpg")}
            />
          </div>
          <div className="panel relative h-screen">
            <Image
              className="pic3 relative block w-full"
              src="/landing-images/3.jpg"
              alt="pic3"
              width={800}
              height={600}
              priority
              sizes="(max-width: 768px) 80vw, 20vw"
              onLoad={() => handleImageLoad("/landing-images/3.jpg")}
            />
          </div>
          <div className="panel last relative h-screen">
            <Image
              className="pic4 relative block w-full"
              src="/landing-images/4.jpg"
              alt="pic4"
              width={800}
              height={600}
              priority
              sizes="(max-width: 768px) 80vw, 55vw"
              onLoad={() => handleImageLoad("/landing-images/4.jpg")}
            />
          </div>
        </div>
      </div>

      {/* Section 2 - Sticky Image */}
      <div ref={section2Ref} className="section2">
        <div className="container">
          <Image
            src="/landing-images/5.jpg"
            alt="pic5"
            width={1800}
            height={1200}
            priority
            sizes="(max-width: 768px) 80vw, 55vw"
            onLoad={() => handleImageLoad("/landing-images/5.jpg")}
          />
        </div>
      </div>

      {/* Section 3 - Text Section */}
      <div
        ref={section3Ref}
        className="section3 absolute block top-0 left-0 w-screen bg-[#FDF3E1]"
      >
        <div className="layout-text layout text box-border py-12 px-[3vw] lg:px-[3vw] max-lg:px-[5vw] flex justify-end">
          <div className="w-full md:w-1/2">
            <h1 className="text-3xl font-normal m-0 leading-tight lowercase tracking-widest">
              a playful homage to the creative depth of India
            </h1>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 mt-12 mb-0">
              <p className="link">
                <a
                  href="/about-us"
                  className="text-black lowercase tracking-widest hover:opacity-75 transition-opacity"
                >
                  about us
                </a>
              </p>
              <p className="link">
                <a
                  href="/product-listing"
                  className="text-black lowercase tracking-widest hover:opacity-75 transition-opacity"
                >
                  visit shop
                </a>
              </p>
            </div>
          </div>
        </div>
        <div className="container overflow-hidden bg-teal w-screen max-w-none left-0">
          <Image
            className="w-full scale-[1.3]"
            src="/landing-images/6.jpg"
            alt="pic6"
            width={1200}
            height={800}
            priority
            sizes="100vw"
            onLoad={() => handleImageLoad("/landing-images/6.jpg")}
          />
        </div>
      </div>

      {/* Section 4 - Floating Images */}
      <div
        ref={section4Ref}
        className="section4 absolute block top-0 left-0 w-screen h-screen overflow-hidden bg-[#F8F4EC]"
      >
        <Image
          className="pic1 absolute min-w-[150px] max-w-[300px] w-[20vw] top-[50vh] left-[8.5vw]"
          src="/landing-images/e4.jpg"
          alt="pic7"
          width={300}
          height={400}
          sizes="(max-width: 768px) 200px, 20vw"
        />
        <Image
          className="pic2 absolute min-w-[150px] max-w-[300px] w-[16vw] top-[90vh] left-[23vw]"
          src="/landing-images/e1.jpg"
          alt="pic8"
          width={300}
          height={400}
          sizes="(max-width: 768px) 200px, 16vw"
        />
        <Image
          className="pic3 absolute min-w-[150px] max-w-[300px] w-[20vw] top-[20vh] left-[40vw]"
          src="/landing-images/e3.jpg"
          alt="pic9"
          width={300}
          height={400}
          sizes="(max-width: 768px) 200px, 20vw"
        />
        <Image
          className="pic4 absolute min-w-[150px] max-w-[300px] w-[19vw] top-[99vh] left-[80vw]"
          src="/landing-images/e2.jpg"
          alt="pic10"
          width={300}
          height={400}
          sizes="(max-width: 768px) 200px, 19vw"
        />
        <Image
          className="pic5 absolute min-w-[150px] max-w-[300px] w-[15vw] top-0 right-0"
          src="/landing-images/e5.jpg"
          alt="pic11"
          width={300}
          height={400}
          sizes="(max-width: 768px) 200px, 15vw"
        />
        <Image
          className="pic6 absolute min-w-[150px] max-w-[300px] w-[17vw] top-[70vh] right-[15vw]"
          src="/landing-images/e3.jpg"
          alt="pic12"
          width={300}
          height={400}
          sizes="(max-width: 768px) 200px, 17vw"
        />
        <Image
          className="pic7 absolute min-w-[150px] max-w-[300px] w-[16vw] top-[40vh] right-[35vw]"
          src="/landing-images/e1.jpg"
          alt="pic13"
          width={300}
          height={400}
          sizes="(max-width: 768px) 200px, 16vw"
        />
      </div>

      <div ref={spacerRef} id="spacer"></div>
    </div>
  );
}
