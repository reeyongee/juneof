"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useSplash } from "@/context/SplashContext";

gsap.registerPlugin(ScrollTrigger);

const imagesData = [
  { id: "10", alt: "Abstract Sculpture" },
  { id: "20", alt: "City Skyline" },
  { id: "30", alt: "Forest Path" },
  { id: "40", alt: "Mountain Range" },
  { id: "50", alt: "Ocean Waves" },
];

const ParallaxImageCarousel: React.FC = () => {
  const { showSplash } = useSplash();
  const sectionRef = useRef<HTMLElement>(null);
  const pinSpacerRef = useRef<HTMLDivElement>(null);
  const horizontalScrollerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);
  const mainSTRef = useRef<ScrollTrigger | null>(null);
  const mainTweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    console.log("GSAP Carousel: useEffect triggered. showSplash:", showSplash);

    if (showSplash) {
      console.log("GSAP Carousel: Splash is showing, delaying GSAP setup.");
      // If splash reappears, kill existing tweens/ScrollTriggers to prevent issues
      mainSTRef.current?.kill();
      mainTweenRef.current?.kill();
      itemRefs.current.forEach((_, index) => {
        if (imageRefs.current[index])
          gsap.killTweensOf(imageRefs.current[index]!);
      });
      ScrollTrigger.getAll().forEach((st) => st.kill()); // Kill any other STs from this component
      return;
    }

    itemRefs.current = itemRefs.current.slice(0, imagesData.length);
    imageRefs.current = imageRefs.current.slice(0, imagesData.length);

    const scroller = horizontalScrollerRef.current;
    const section = sectionRef.current;
    const pinSpacer = pinSpacerRef.current;

    console.log("GSAP Carousel: Refs status:", {
      scroller: !!scroller,
      section: !!section,
      pinSpacer: !!pinSpacer,
    });

    if (!scroller || !section || !pinSpacer) {
      console.error("GSAP Carousel: Critical refs missing. Exiting.");
      return;
    }
    console.log(
      "GSAP Carousel: Critical refs present. Setting up main scroll."
    );

    // --- Setup Main Horizontal Scroll Immediately ---
    const scrollDistance = scroller.scrollWidth - window.innerWidth;

    // Calculate precise centering: we want the last image center to align with viewport center
    // Last image starts at: scrollDistance (when scroll is complete)
    // Last image left edge position: scrollDistance + (35vw in pixels)
    // Last image center position: scrollDistance + (35vw + 15vw) = scrollDistance + 50vw
    // We want this center at viewport center (50vw), so we need to subtract the difference
    const lastImageLeftMargin = (35 * window.innerWidth) / 100; // 35vw in pixels
    const lastImageWidth = (30 * window.innerWidth) / 100; // 30vw in pixels
    const lastImageCenter = lastImageLeftMargin + lastImageWidth / 2; // Center of last image
    const viewportCenter = window.innerWidth / 2;
    const adjustmentNeeded = lastImageCenter - viewportCenter;
    const adjustedScrollDistance = scrollDistance - adjustmentNeeded;

    console.log("GSAP Carousel: Precise centering calculation:", {
      scrollDistance,
      lastImageLeftMargin,
      lastImageWidth,
      lastImageCenter,
      viewportCenter,
      adjustmentNeeded,
      adjustedScrollDistance,
    });

    if (adjustedScrollDistance <= 0) {
      console.warn(
        "GSAP Carousel: Main - Adjusted scroll distance is not positive. No horizontal scroll will be set up."
      );
    } else {
      mainTweenRef.current = gsap.to(scroller, {
        x: () => -adjustedScrollDistance,
        ease: "none",
      });

      mainSTRef.current = ScrollTrigger.create({
        trigger: section,
        pin: pinSpacer,
        start: "top top",
        end: () => `+=${adjustedScrollDistance}`,
        animation: mainTweenRef.current,
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) =>
          console.log("Pin ST Update:", self.progress.toFixed(3)),
        onEnter: () => console.log("Pin ST: Entered"),
      });
      ScrollTrigger.refresh(); // Refresh after main ST setup
      console.log(
        "GSAP Carousel: Main ScrollTrigger setup complete and refreshed."
      );
    }

    // --- Setup Individual Image Parallax Immediately ---
    // Set up parallax for all images immediately, don't wait for loading
    itemRefs.current.forEach((itemRef, index) => {
      const img = imageRefs.current[index];
      if (itemRef && img && mainTweenRef.current) {
        console.log(`GSAP Carousel: Setting up parallax for image ${index}`);
        gsap.fromTo(
          img,
          { xPercent: -15, scale: 1.75 },
          {
            xPercent: 15,
            ease: "none",
            scrollTrigger: {
              trigger: itemRef,
              containerAnimation: mainTweenRef.current,
              start: "left right",
              end: "right left",
              scrub: true,
              invalidateOnRefresh: true,
            },
          }
        );
      } else {
        console.log(
          `GSAP Carousel: Skipping parallax for image ${index} - missing refs`
        );
      }
    });

    ScrollTrigger.refresh(); // Final refresh after all setup
    console.log("GSAP Carousel: All parallax effects setup complete.");

    return () => {
      console.log(
        "GSAP Carousel: useEffect cleanup. showSplash was:",
        showSplash
      );
      mainSTRef.current?.kill();
      mainTweenRef.current?.kill();
      mainSTRef.current = null;
      mainTweenRef.current = null;
      // Kill tweens on images themselves
      imageRefs.current.forEach((img) => {
        if (img) gsap.killTweensOf(img);
      });
      // Kill all ScrollTriggers created by this component instance if any were missed
      // This is a bit broad, better to kill specific instances if possible
      // Capture ref values at cleanup time to avoid stale closure warnings
      const currentSection = section;
      const currentPinSpacer = pinSpacer;
      ScrollTrigger.getAll().forEach((st) => {
        // A bit hacky: check if the trigger is part of this component
        // This assumes itemRefs are direct children or identifiable
        if (
          itemRefs.current.includes(st.trigger as HTMLDivElement) ||
          st.trigger === currentSection ||
          st.pin === currentPinSpacer
        ) {
          st.kill();
        }
      });
    };
  }, [showSplash]);

  return (
    <section ref={sectionRef} className="relative w-full h-auto bg-[#F8F4EC]">
      {" "}
      {/* Adjust height as needed for content after */}
      <div ref={pinSpacerRef} className="h-screen w-full overflow-hidden">
        <div
          ref={horizontalScrollerRef}
          className="flex h-full items-center py-[5vh]" // py adds some vertical padding for items
        >
          {imagesData.map(
            (
              imgDataItem,
              index // Renamed imgData to imgDataCurrent to avoid conflict
            ) => (
              <div
                key={imgDataItem.id}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                className={`flex-shrink-0 w-[30vw] h-[70vh] relative ${
                  index === 0 ? "ml-[35vw] mr-[35vw]" : "ml-[35vw] mr-[35vw]"
                }`} // All images have consistent 35vw margins
              >
                <div className="w-full h-full relative overflow-hidden rounded-lg shadow-2xl">
                  <Image
                    ref={(el) => {
                      imageRefs.current[index] = el;
                    }}
                    src={`https://picsum.photos/id/${imgDataItem.id}/800/1000`} // Aspect ratio 0.8
                    alt={imgDataItem.alt}
                    width={800}
                    height={1000}
                    priority={index < 3} // Prioritize loading first 3 images
                    className="absolute inset-0 w-full h-full object-cover" // Scale is handled by GSAP
                  />
                </div>
              </div>
            )
          )}
          {/* Dummy element to ensure scroller.scrollWidth is greater than window.innerWidth easily */}
          <div className="flex-shrink-0 w-[1px] h-full"></div>
        </div>
      </div>
      {/* Content below the carousel will naturally appear here after horizontal scroll */}
    </section>
  );
};

export default ParallaxImageCarousel;
