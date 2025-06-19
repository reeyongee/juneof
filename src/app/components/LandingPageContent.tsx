"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import ScrollIndicator from "./ScrollIndicator";
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
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [animationsInitialized, setAnimationsInitialized] = useState(false);

  // Wait for all images to load
  useEffect(() => {
    const waitForImages = async () => {
      if (!containerRef.current) return;

      const images = containerRef.current.querySelectorAll("img");
      const imagePromises = Array.from(images).map((img) => {
        return new Promise<void>((resolve) => {
          if (img.complete && img.naturalHeight !== 0) {
            resolve();
          } else {
            const handleLoad = () => {
              img.removeEventListener("load", handleLoad);
              img.removeEventListener("error", handleError);
              resolve();
            };
            const handleError = () => {
              img.removeEventListener("load", handleLoad);
              img.removeEventListener("error", handleError);
              console.warn("Image failed to load:", img.src);
              resolve(); // Resolve anyway to not block the layout
            };
            img.addEventListener("load", handleLoad);
            img.addEventListener("error", handleError);
          }
        });
      });

      await Promise.all(imagePromises);

      // Additional delay to ensure DOM is stable
      await new Promise((resolve) => setTimeout(resolve, 100));

      setImagesLoaded(true);
    };

    waitForImages();
  }, []);

  // Initialize animations only after images are loaded
  useEffect(() => {
    if (!imagesLoaded || animationsInitialized) return;

    const initializeAnimations = () => {
      if (!containerRef.current) return;

      try {
        const width = window.innerWidth;
        const height = window.innerHeight;

        gsap.defaults({ ease: "none", duration: 2 });

        // Kill any existing ScrollTriggers to prevent conflicts
        ScrollTrigger.getAll().forEach((trigger) => trigger.kill());

        // Section 1 animations
        const section1panel = gsap.utils.toArray(".section1 .panel");
        const section1length = section1panel.length * height * 2;

        // Get first panel element with error checking
        const firstPanelElement = document.querySelector(
          ".section1 .panel.first"
        ) as HTMLElement;
        const firstpanelpos = firstPanelElement
          ? (width - firstPanelElement.offsetWidth) / 2
          : 0;
        const section1gap = 40 * (width / 100);

        // Set initial positions with error checking
        if (section1Ref.current) {
          section1Ref.current.style.top = "0px";
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
            firstPanel.style.marginRight = `${
              firstpanelpos - section1gap / 4
            }px`;
          }

          // Center images vertically with proper error checking
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

        if (section2Ref.current) {
          section2Ref.current.style.top = `${section1length - height}px`;
        }
        if (section3Ref.current) {
          section3Ref.current.style.top = `${section1length}px`;
        }

        // GSAP animations with error handling
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
        if (lastpanel && lastpanel.offsetWidth > 0) {
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

        // Section 3 parallax with error checking
        const section3Image = document.querySelector(
          ".section3 .container img"
        ) as HTMLImageElement;
        if (section3Image && section3Image.offsetHeight > 0) {
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

        // Position Section 4 after getting section3 height
        const section3length = section3Ref.current?.offsetHeight || 0;
        if (section4Ref.current) {
          section4Ref.current.style.top = `${
            section1length + section3length
          }px`;
        }

        // Section 4 parallax animations
        const section4Images = [
          { selector: ".section4 .pic1", yPercent: -150, scrub: 2 },
          { selector: ".section4 .pic2", yPercent: -120, scrub: 0.8 },
          { selector: ".section4 .pic3", yPercent: -130, scrub: 1 },
          { selector: ".section4 .pic4", yPercent: -140, scrub: 0.5 },
          { selector: ".section4 .pic5", yPercent: -160, scrub: 0.5 },
          { selector: ".section4 .pic6", yPercent: -125, scrub: 1.2 },
          { selector: ".section4 .pic7", yPercent: -145, scrub: 0.7 },
        ];

        section4Images.forEach(({ selector, yPercent, scrub }) => {
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

        // Set spacer height
        const section4length = section4Ref.current?.offsetHeight || 0;
        if (spacerRef.current) {
          spacerRef.current.style.height = `${
            section1length + section3length + section4length + height * 0.0001
          }px`;
        }

        setAnimationsInitialized(true);
      } catch (error) {
        console.error("Error initializing animations:", error);
      }
    };

    // Initialize animations
    initializeAnimations();

    // Handle resize with debouncing
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        setAnimationsInitialized(false);
        ScrollTrigger.refresh();
        initializeAnimations();
      }, 250); // Debounce resize events
    };

    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener("resize", handleResize);
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [imagesLoaded, animationsInitialized]);

  return (
    <div ref={containerRef} className="relative w-full z-[2]">
      {/* Scroll Indicator */}
      <ScrollIndicator />

      {/* Loading state while images load */}
      {!imagesLoaded && (
        <div className="fixed inset-0 bg-[#FDF3E1] z-10 flex items-center justify-center">
          <div className="text-black text-lg tracking-wider">Loading...</div>
        </div>
      )}

      {/* Section 1 - Image Panels */}
      <div
        ref={section1Ref}
        className="section1 absolute block w-screen bg-[#FDF3E1] text-black"
        style={{ opacity: imagesLoaded ? 1 : 0 }}
      >
        <div className="container flex flex-row h-screen overflow-hidden w-screen max-w-none left-0">
          <div className="panel first relative h-screen">
            <Image
              className="pic1 relative block w-full"
              src="/landing-images/1.webp"
              alt="pic1"
              width={800}
              height={600}
              priority
              sizes="(max-width: 768px) 80vw, 50vw"
            />
          </div>
          <div className="panel relative h-screen">
            <Image
              className="pic2 relative block w-full"
              src="/landing-images/2.webp"
              alt="pic2"
              width={800}
              height={600}
              sizes="(max-width: 768px) 80vw, 35vw"
            />
          </div>
          <div className="panel relative h-screen">
            <Image
              className="pic3 relative block w-full"
              src="/landing-images/3.webp"
              alt="pic3"
              width={800}
              height={600}
              sizes="(max-width: 768px) 80vw, 20vw"
            />
          </div>
          <div className="panel last relative h-screen">
            <Image
              className="pic4 relative block w-full"
              src="/landing-images/4.webp"
              alt="pic4"
              width={800}
              height={600}
              sizes="(max-width: 768px) 80vw, 55vw"
            />
          </div>
        </div>
      </div>

      {/* Section 2 - Sticky Image */}
      <div
        ref={section2Ref}
        className="section2"
        style={{ opacity: imagesLoaded ? 1 : 0 }}
      >
        <div className="container">
          <Image
            src="/landing-images/5.webp"
            alt="pic5"
            width={1800}
            height={1200}
            sizes="(max-width: 768px) 80vw, 55vw"
          />
        </div>
      </div>

      {/* Section 3 - Manifesto */}
      <div
        ref={section3Ref}
        className="section3 absolute block top-0 left-0 w-screen bg-[#FDF3E1]"
        style={{ opacity: imagesLoaded ? 1 : 0 }}
      >
        <div className="layout-text layout text box-border py-12 px-[3vw] lg:px-[3vw] max-lg:px-[5vw]">
          <p className="mt-0 mb-48 text-xs font-light">Manifesto</p>
          <h1 className="text-3xl font-normal m-0 leading-tight">
            The designs will speak to an opinionated,
          </h1>
          <h1 className="text-3xl font-normal m-0 leading-tight">
            cosmopolitan woman who would rather
          </h1>
          <h1 className="text-3xl font-normal m-0 leading-tight">
            invest in pieces that can be handed down
          </h1>
          <h1 className="text-3xl font-normal m-0 leading-tight">
            as heirlooms than trends.
          </h1>
          <p className="link mt-12 mb-0">
            <a href="#" className="text-black">
              Learn more
            </a>
          </p>
        </div>
        <div className="container overflow-hidden bg-teal w-screen max-w-none left-0">
          <Image
            className="w-full scale-[1.3]"
            src="/landing-images/6.webp"
            alt="pic6"
            width={1200}
            height={800}
            sizes="100vw"
          />
        </div>
      </div>

      {/* Section 4 - Floating Images */}
      <div
        ref={section4Ref}
        className="section4 absolute block top-0 left-0 w-screen h-screen overflow-hidden bg-[#F8F4EC]"
        style={{ opacity: imagesLoaded ? 1 : 0 }}
      >
        <Image
          className="pic1 absolute min-w-[150px] max-w-[300px] w-[20vw] top-[50vh] left-[8.5vw]"
          src="/landing-images/e4.webp"
          alt="pic7"
          width={300}
          height={400}
          sizes="(max-width: 768px) 200px, 20vw"
        />
        <Image
          className="pic2 absolute min-w-[150px] max-w-[300px] w-[16vw] top-[90vh] left-[23vw]"
          src="/landing-images/e1.webp"
          alt="pic8"
          width={300}
          height={400}
          sizes="(max-width: 768px) 200px, 16vw"
        />
        <Image
          className="pic3 absolute min-w-[150px] max-w-[300px] w-[20vw] top-[20vh] left-[40vw]"
          src="/landing-images/e3.webp"
          alt="pic9"
          width={300}
          height={400}
          sizes="(max-width: 768px) 200px, 20vw"
        />
        <Image
          className="pic4 absolute min-w-[150px] max-w-[300px] w-[19vw] top-[99vh] left-[80vw]"
          src="/landing-images/e2.webp"
          alt="pic10"
          width={300}
          height={400}
          sizes="(max-width: 768px) 200px, 19vw"
        />
        <Image
          className="pic5 absolute min-w-[150px] max-w-[300px] w-[15vw] top-0 right-0"
          src="/landing-images/e5.webp"
          alt="pic11"
          width={300}
          height={400}
          sizes="(max-width: 768px) 200px, 15vw"
        />
        <Image
          className="pic6 absolute min-w-[150px] max-w-[300px] w-[17vw] top-[70vh] right-[15vw]"
          src="/landing-images/e3.webp"
          alt="pic12"
          width={300}
          height={400}
          sizes="(max-width: 768px) 200px, 17vw"
        />
        <Image
          className="pic7 absolute min-w-[150px] max-w-[300px] w-[16vw] top-[40vh] right-[35vw]"
          src="/landing-images/e1.webp"
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
