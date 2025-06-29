"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function AboutUsPage() {
  const backgroundRef = useRef<HTMLDivElement>(null);
  const mainElementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Set page title and meta description
    document.title = "About Us | June Of";

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        "Learn about June Of - where heritage meets the now. We work with Indian artisans to create sustainable, ethically-made clothing that celebrates tradition while embracing the future."
      );
    }

    // Update canonical URL
    const canonicalLink =
      document.querySelector('link[rel="canonical"]') ||
      document.createElement("link");
    canonicalLink.setAttribute("rel", "canonical");
    canonicalLink.setAttribute("href", "https://www.juneof.com/about-us");
    if (!document.querySelector('link[rel="canonical"]')) {
      document.head.appendChild(canonicalLink);
    }
  }, []);

  useEffect(() => {
    // Parallax Effect for backgroundRef
    if (backgroundRef.current && mainElementRef.current) {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: mainElementRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      tl.to(backgroundRef.current, {
        yPercent: -15,
        ease: "none",
      });

      return () => {
        tl.kill();
      };
    }
  }, []);

  return (
    <div className="relative min-h-screen">
      {/* Parallax Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          ref={backgroundRef}
          className="absolute inset-0 h-[130%] bg-cover bg-center grayscale-[0.3]"
          style={{
            backgroundImage: "url('/about_us.jpg')",
          }}
        />
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/50" />
      </div>

      <main ref={mainElementRef} className="relative min-h-screen text-white">
        <div className="container mx-auto px-4 sm:px-8 pt-32 pb-20 space-y-32">
          {/* First Paragraph - Left */}
          <div className="flex justify-start">
            <div className="max-w-[500px] text-left">
              <p className="text-xl sm:text-2xl lg:text-3xl font-light leading-relaxed lowercase tracking-wider">
                june of is where heritage meets the now. We take cues from the
                richness of Indian craft and rework it for a generation that
                lives in motion. Think of it as timeless fabrics in reimagined
                silhouettes, and a whole lot of intention behind every stitch.
              </p>
            </div>
          </div>

          {/* Second Paragraph - Right */}
          <div className="flex justify-end">
            <div className="max-w-[500px] text-right">
              <p className="text-xl sm:text-2xl lg:text-3xl font-light leading-relaxed lowercase tracking-wider">
                Our pieces are made for everyday wear but hopefully they never
                feel basic. Designed for bodies that live, our fits move with
                you, not against you. We believe style shouldn&apos;t come at
                the cost of comfort or even identity.
              </p>
            </div>
          </div>

          {/* Third Paragraph - Left */}
          <div className="flex justify-start">
            <div className="max-w-[500px] text-left">
              <p className="text-xl sm:text-2xl lg:text-3xl font-light leading-relaxed lowercase tracking-wider">
                Born in India, shaped by nostalgia, and tailored for the future,
                june of is for the ones who value wearing pieces with tales to
                tell. We&apos;re not here to copy tradition, only inspired by
                it.
              </p>
            </div>
          </div>

          {/* Fourth Paragraph - Right */}
          <div className="flex justify-end">
            <div className="max-w-[500px] text-right">
              <p className="text-xl sm:text-2xl lg:text-3xl font-light leading-relaxed lowercase tracking-wider">
                <strong>Sustainability for june of</strong>
                <br />
                <br />
                At june of, sustainability is a habit. From the fabrics we
                select to the hands that make them, every step is rooted in
                respect for people and heritage, keeping the bigger picture in
                mind.
              </p>
            </div>
          </div>

          {/* Fifth Paragraph - Left */}
          <div className="flex justify-start">
            <div className="max-w-[500px] text-left">
              <p className="text-xl sm:text-2xl lg:text-3xl font-light leading-relaxed lowercase tracking-wider">
                We source our fabrics from Jaipur, India, working with natural
                fibres that carry the richness of the land. But our
                responsibility doesn&apos;t end with fabric.
              </p>
            </div>
          </div>

          {/* Sixth Paragraph - Right */}
          <div className="flex justify-end">
            <div className="max-w-[500px] text-right">
              <p className="text-xl sm:text-2xl lg:text-3xl font-light leading-relaxed lowercase tracking-wider">
                Each piece arrives in a reusable, hand-woven cotton bag,
                designed to live beyond its first use. Our tags? They&apos;re
                intended to live on, made with seed paper tags tied with jute
                threads, replacing plastic and making room for new life.
              </p>
            </div>
          </div>

          {/* Seventh Paragraph - Left */}
          <div className="flex justify-start">
            <div className="max-w-[500px] text-left">
              <p className="text-xl sm:text-2xl lg:text-3xl font-light leading-relaxed lowercase tracking-wider">
                We produce in small, mindful quantities, making sure every
                garment receives the attention it deserves and doesn&apos;t end
                up as dead stock. This approach allows us to stay connected to
                the craftsmanship and reduce waste at every step.
              </p>
            </div>
          </div>

          {/* Eighth Paragraph - Right */}
          <div className="flex justify-end">
            <div className="max-w-[500px] text-right">
              <p className="text-xl sm:text-2xl lg:text-3xl font-light leading-relaxed lowercase tracking-wider">
                At its core, June Of is a celebration of heritage; a quiet
                homage to the artisanal depth of India. We work hand-in-hand
                with artisans and production teams, ensuring fair pay, safe
                working conditions, and opportunities for growth. For us,
                it&apos;s simple: to create beautiful, meaningful pieces that
                honour where they came from, uplift the hands that make them,
                and stand the test of time.
              </p>
            </div>
          </div>

          {/* Ninth Paragraph - Left */}
          <div className="flex justify-start">
            <div className="max-w-[500px] text-left">
              <p className="text-xl sm:text-2xl lg:text-3xl font-light leading-relaxed lowercase tracking-wider">
                Want to know more?{" "}
                <a
                  href="/contact-us"
                  className="underline hover:opacity-75 transition-opacity"
                >
                  reach out
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
