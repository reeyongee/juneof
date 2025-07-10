"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { Instagram } from "lucide-react";
import ScrollIndicator from "./ScrollIndicator";
import { useViewportHeight } from "@/hooks/useViewportHeight";
import "../landing-page.css";

// --- Sanity Imports ---
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// --- Define an interface for our fetched image data ---
interface LandingPageData {
  _id: string;
  title: string;
  section1_image1: SanityImageSource;
  section1_image2: SanityImageSource;
  section1_image3: SanityImageSource;
  section1_image4: SanityImageSource;
  sticky_image: SanityImageSource;
  text_section_image: SanityImageSource;
  galleryImages: SanityImageSource[];
}

// --- The GROQ Query to fetch our data ---
const LANDING_PAGE_QUERY = `*[_type == "landingPage" && !(_id in path("drafts.**"))][0] {
  _id,
  title,
  section1_image1,
  section1_image2,
  section1_image3,
  section1_image4,
  sticky_image,
  text_section_image,
  galleryImages
}`;

export default function LandingPageContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const section1Ref = useRef<HTMLDivElement>(null);
  const section2Ref = useRef<HTMLDivElement>(null);
  const section3Ref = useRef<HTMLDivElement>(null);
  const section4Ref = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);

  // --- State for our fetched Sanity data ---
  const [pageData, setPageData] = useState<LandingPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- Restored layout state ---
  const {
    dimensions,
    isMobile,
    isInitialized: isViewportInitialized,
  } = useViewportHeight();
  const [isMobileOverlayVisible, setIsMobileOverlayVisible] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const loadedImagesRef = useRef(new Set<string>());
  const animationsInitializedRef = useRef(false);

  // --- Fetch data from Sanity ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching landing page data from Sanity...");
        const data: LandingPageData = await client.fetch(LANDING_PAGE_QUERY);
        if (data) {
          setPageData(data);
          console.log("Sanity data loaded successfully:", data);
        } else {
          console.error("No landing page data found in Sanity.");
        }
      } catch (error) {
        console.error("Failed to fetch landing page data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- Helper to safely get image URLs ---
  const getImageUrl = (source: SanityImageSource | undefined) => {
    if (!source) return "/placeholder.jpg"; // Fallback image
    return urlFor(source).url();
  };

  // Track image loading for animations
  const handleImageLoad = useCallback((src: string) => {
    loadedImagesRef.current.add(src);
    // Check if we have loaded enough critical images
    if (loadedImagesRef.current.size >= 6) {
      // 6 critical images
      setImagesLoaded(true);
    }
  }, []);

  // Ensure DOM is ready and CSS is painted
  const ensureDOMReady = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
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

    if (!firstPanel?.offsetWidth || !lastPanel?.offsetWidth) {
      return false;
    }

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
    if (!containerRef.current || animationsInitializedRef.current || !pageData)
      return;

    try {
      await ensureDOMReady();

      if (!validateDimensions()) {
        setTimeout(() => initializeAnimations(), 100);
        return;
      }

      const width = dimensions.width;
      const height = dimensions.height;

      console.log("[LandingPage] Starting GSAP animations with dimensions:", {
        width,
        height,
        isMobile,
      });

      gsap.defaults({ ease: "none", duration: 2 });
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());

      // Section 1 animations
      const section1panel = gsap.utils.toArray(".section1 .panel");
      const section1length = section1panel.length * height * 2;

      const firstPanelElement = document.querySelector(
        ".section1 .panel.first"
      ) as HTMLElement;
      if (!firstPanelElement?.offsetWidth) {
        throw new Error("First panel has no width");
      }

      const firstpanelpos = (width - firstPanelElement.offsetWidth) / 2;
      const section1gap = 40 * (width / 100);

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

        const images = section1Ref.current.querySelectorAll(".panel img");
        images.forEach((img) => {
          const imgElement = img as HTMLImageElement;
          if (isMobile && imgElement.classList.contains("pic1")) return;

          if (imgElement.offsetHeight > 0) {
            imgElement.style.marginTop = `${(height - imgElement.offsetHeight) / 2}px`;
          }
        });
      }

      // Position sections
      if (section2Ref.current) {
        section2Ref.current.style.top = `${section1length - height}px`;
      }
      if (section3Ref.current) {
        section3Ref.current.style.top = `${section1length}px`;
      }

      // GSAP animations
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

      // Section 3 parallax
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

      // Position Section 4
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
        const element = document.querySelector(selector);
        if (element) {
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
        }
      });

      ScrollTrigger.refresh();

      // Set spacer height
      const section4length = section4Ref.current?.offsetHeight || 0;
      if (spacerRef.current) {
        spacerRef.current.style.height = `${section1length + section3length + section4length + height * 0.0001}px`;
      }

      animationsInitializedRef.current = true;
    } catch (error) {
      console.error("Error initializing animations:", error);
      setTimeout(() => {
        animationsInitializedRef.current = false;
        initializeAnimations();
      }, 500);
    }
  }, [ensureDOMReady, validateDimensions, dimensions, isMobile, pageData]);

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Mobile scroll-based overlay visibility
  useEffect(() => {
    if (!isMobile || !section4Ref.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.intersectionRatio >= 0.5) {
            setIsMobileOverlayVisible(true);
          } else {
            setIsMobileOverlayVisible(false);
          }
        });
      },
      {
        threshold: [0, 0.5, 1],
        rootMargin: "0px",
      }
    );

    observer.observe(section4Ref.current);

    return () => {
      observer.disconnect();
    };
  }, [isMobile, isHydrated]);

  // Initialize animations when all conditions are met
  useEffect(() => {
    if (!isHydrated || !imagesLoaded || !isViewportInitialized || !pageData)
      return;

    console.log("[LandingPage] Initializing animations:", {
      isHydrated,
      imagesLoaded,
      isViewportInitialized,
      pageData: !!pageData,
      isMobile,
      dimensions,
    });

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
    pageData,
  ]);

  // Trigger re-initialization when dimensions change
  useEffect(() => {
    if (isViewportInitialized && isHydrated && imagesLoaded && pageData) {
      animationsInitializedRef.current = false;
      ScrollTrigger.refresh();

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
    pageData,
  ]);

  // --- Conditional Rendering ---
  // Show a loading state until data is fetched
  if (isLoading || !pageData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FDF3E1]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full z-[2]">
      <ScrollIndicator />

      {/* --- SECTION 1 --- */}
      <div
        ref={section1Ref}
        className="section1 absolute block w-screen bg-[#FDF3E1] text-black md:bg-transparent"
      >
        <div className="container flex flex-row h-screen md:h-screen max-md:h-auto overflow-hidden w-screen max-w-none left-0 max-md:flex-col">
          <div className="panel first relative h-screen md:h-screen max-md:h-auto max-md:flex max-md:items-center max-md:justify-center max-md:pt-24 max-md:pb-12">
            <Image
              className="pic1 relative block w-auto md:w-full max-md:w-[90vw] max-md:h-auto"
              src={getImageUrl(pageData.section1_image1)}
              alt="june of sustainable fashion model wearing heritage-inspired clothing"
              width={800}
              height={600}
              priority
              sizes="(max-width: 768px) 90vw, 50vw"
              onLoad={() =>
                handleImageLoad(getImageUrl(pageData.section1_image1))
              }
            />
          </div>
          <div className="panel relative h-screen max-md:h-auto max-md:flex max-md:items-center max-md:justify-center max-md:pt-24 max-md:pb-12">
            <Image
              className="pic2 relative block w-full"
              src={getImageUrl(pageData.section1_image2)}
              alt="artisanal handwoven kantha cotton clothing from june of"
              width={800}
              height={600}
              priority
              sizes="(max-width: 768px) 72vw, 35vw"
              onLoad={() =>
                handleImageLoad(getImageUrl(pageData.section1_image2))
              }
            />
          </div>
          <div className="panel relative h-screen max-md:h-auto max-md:flex max-md:items-center max-md:justify-center max-md:pt-24 max-md:pb-12">
            <Image
              className="pic3 relative block w-full"
              src={getImageUrl(pageData.section1_image3)}
              alt="june of ethical fashion model showcasing timeless silhouettes"
              width={800}
              height={600}
              priority
              sizes="(max-width: 768px) 80vw, 20vw"
              onLoad={() =>
                handleImageLoad(getImageUrl(pageData.section1_image3))
              }
            />
          </div>
          <div className="panel last relative h-screen">
            <Image
              className="pic4 relative block w-full"
              src={getImageUrl(pageData.section1_image4)}
              alt="sustainable fashion portrait featuring june of's contemporary take on textiles"
              width={800}
              height={600}
              priority
              sizes="(max-width: 768px) 80vw, 55vw"
              onLoad={() =>
                handleImageLoad(getImageUrl(pageData.section1_image4))
              }
            />
          </div>
        </div>
      </div>

      {/* --- SECTION 2 --- */}
      <div ref={section2Ref} className="section2">
        <div className="container">
          <Image
            src={getImageUrl(pageData.sticky_image)}
            alt="june of model in flowing sustainable garment"
            width={1800}
            height={1200}
            priority
            sizes="(max-width: 768px) 80vw, 55vw"
            onLoad={() => handleImageLoad(getImageUrl(pageData.sticky_image))}
          />
        </div>
      </div>

      {/* --- SECTION 3 --- */}
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
            src={getImageUrl(pageData.text_section_image)}
            alt="june of sustainable fashion collection showcasing indian heritage"
            width={1200}
            height={800}
            priority
            sizes="100vw"
            onLoad={() =>
              handleImageLoad(getImageUrl(pageData.text_section_image))
            }
          />
        </div>
      </div>

      {/* --- SECTION 4 --- */}
      <div
        ref={section4Ref}
        className={`section4 absolute block top-0 left-0 w-screen h-screen overflow-hidden bg-[#F8F4EC] group ${
          // Only make it clickable on desktop or when mobile overlay is visible
          !isMobile || isMobileOverlayVisible
            ? "cursor-pointer"
            : "cursor-default"
        } ${
          isMobile && isMobileOverlayVisible ? "mobile-overlay-visible" : ""
        }`}
        onClick={() => {
          // Only allow click on desktop or when mobile overlay is visible
          if (!isMobile || isMobileOverlayVisible) {
            window.open(
              "https://www.instagram.com/juneof__",
              "_blank",
              "noopener,noreferrer"
            );
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Visit June Of on Instagram - Sustainable fashion editorial and behind-the-scenes content"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            // Only allow keyboard activation on desktop or when mobile overlay is visible
            if (!isMobile || isMobileOverlayVisible) {
              window.open(
                "https://www.instagram.com/juneof__",
                "_blank",
                "noopener,noreferrer"
              );
            }
          }
        }}
      >
        {/* Dark overlay that appears on hover (desktop) or scroll (mobile) */}
        <div
          className={`absolute inset-0 bg-black/60 transition-opacity duration-500 ease-out z-10 pointer-events-none ${
            isMobile
              ? isMobileOverlayVisible
                ? "opacity-100"
                : "opacity-0"
              : "opacity-0 group-hover:opacity-100"
          }`}
        />

        {/* Instagram icon that appears on hover (desktop) or scroll (mobile) */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ease-out z-20 pointer-events-none ${
            isMobile
              ? isMobileOverlayVisible
                ? "opacity-100"
                : "opacity-0"
              : "opacity-0 group-hover:opacity-100"
          }`}
        >
          <Instagram
            className="w-16 h-16 md:w-20 md:h-20 text-white"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </div>

        {/* We now map over the gallery images from Sanity */}
        {pageData.galleryImages?.map((image, index) => {
          // Define positions to match the original design
          const positions = [
            "top-[50vh] left-[8.5vw] w-[20vw]",
            "top-[90vh] left-[23vw] w-[16vw]",
            "top-[20vh] left-[40vw] w-[20vw]",
            "top-[99vh] left-[80vw] w-[19vw]",
            "top-0 right-0 w-[15vw]",
            "top-[70vh] right-[15vw] w-[17vw]",
            "top-[40vh] right-[35vw] w-[16vw]",
          ];
          const positionClass = positions[index % positions.length];
          return (
            <Image
              key={index}
              className={`pic${
                index + 1
              } absolute min-w-[150px] max-w-[300px] ${positionClass}`}
              src={getImageUrl(image)}
              alt={`Gallery image ${index + 1} from june of collection`}
              width={300}
              height={400}
              sizes="(max-width: 768px) 200px, 20vw"
            />
          );
        })}
      </div>

      {/* This spacer element is still important for your scroll animations */}
      <div ref={spacerRef} id="spacer"></div>
    </div>
  );
}
