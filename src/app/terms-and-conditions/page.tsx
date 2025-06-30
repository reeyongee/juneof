"use client"; // Required for useEffect and useRef

import { useEffect, useRef, useState } from "react";
import { BlurScrollEffect_Effect4 } from "@/lib/animations"; // Adjust path if needed
import gsap from "gsap"; // ScrollTrigger is globally registered

export default function TermsAndConditionsPage() {
  const contentRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null); // For parallax background
  const mainElementRef = useRef<HTMLElement>(null); // For main scroll trigger
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Set page title and meta description
    document.title = "terms & conditions - june of";

    // Add meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        "read june of's terms and conditions for shopping our sustainable fashion collection. understand our policies for orders, payments, and product usage."
      );
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content =
        "read june of's terms and conditions for shopping our sustainable fashion collection. understand our policies for orders, payments, and product usage.";
      document.head.appendChild(meta);
    }

    // Add keywords meta tag
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute(
        "content",
        "terms and conditions, june of terms, sustainable fashion terms, shopping terms, order policies, payment terms"
      );
    } else {
      const meta = document.createElement("meta");
      meta.name = "keywords";
      meta.content =
        "terms and conditions, june of terms, sustainable fashion terms, shopping terms, order policies, payment terms";
      document.head.appendChild(meta);
    }

    // Add canonical link
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute(
        "href",
        "https://www.juneof.com/terms-and-conditions"
      );
    } else {
      const link = document.createElement("link");
      link.rel = "canonical";
      link.href = "https://www.juneof.com/terms-and-conditions";
      document.head.appendChild(link);
    }

    // Add Open Graph meta tags
    const ogTags = [
      { property: "og:title", content: "terms & conditions - june of" },
      {
        property: "og:description",
        content:
          "read june of's terms and conditions for shopping our sustainable fashion collection. understand our policies for orders, payments, and product usage.",
      },
      {
        property: "og:url",
        content: "https://www.juneof.com/terms-and-conditions",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "june of" },
      {
        property: "og:image",
        content: "https://www.juneof.com/landing-images/logo.svg",
      },
      { property: "og:image:alt", content: "june of terms and conditions" },
    ];

    ogTags.forEach((tag) => {
      const existingTag = document.querySelector(
        `meta[property="${tag.property}"]`
      );
      if (existingTag) {
        existingTag.setAttribute("content", tag.content);
      } else {
        const meta = document.createElement("meta");
        meta.setAttribute("property", tag.property);
        meta.setAttribute("content", tag.content);
        document.head.appendChild(meta);
      }
    });

    // Add Twitter Card meta tags
    const twitterTags = [
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "terms & conditions - june of" },
      {
        name: "twitter:description",
        content:
          "read june of's terms and conditions for shopping our sustainable fashion collection. understand our policies for orders, payments, and product usage.",
      },
      {
        name: "twitter:image",
        content: "https://www.juneof.com/landing-images/logo.svg",
      },
    ];

    twitterTags.forEach((tag) => {
      const existingTag = document.querySelector(`meta[name="${tag.name}"]`);
      if (existingTag) {
        existingTag.setAttribute("content", tag.content);
      } else {
        const meta = document.createElement("meta");
        meta.setAttribute("name", tag.name);
        meta.setAttribute("content", tag.content);
        document.head.appendChild(meta);
      }
    });

    // Add structured data for terms and conditions
    const termsSchema = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "terms & conditions - june of",
      description:
        "read june of's terms and conditions for shopping our sustainable fashion collection. understand our policies for orders, payments, and product usage.",
      url: "https://www.juneof.com/terms-and-conditions",
      dateModified: "2025-06-20",
      inLanguage: "en-US",
      isPartOf: {
        "@type": "WebSite",
        name: "june of",
        url: "https://www.juneof.com",
      },
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "home",
            item: "https://www.juneof.com",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "terms & conditions",
            item: "https://www.juneof.com/terms-and-conditions",
          },
        ],
      },
      publisher: {
        "@type": "Organization",
        name: "june of",
        url: "https://www.juneof.com",
      },
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(termsSchema);
    document.head.appendChild(script);

    return () => {
      // Cleanup function would go here if needed
    };
  }, []);

  // Mobile detection
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    return () => {
      window.removeEventListener("resize", checkDevice);
    };
  }, []);

  useEffect(() => {
    // Only apply effects on desktop
    if (!isMobile && contentRef.current) {
      new BlurScrollEffect_Effect4(contentRef.current);
    }
  }, [isMobile]);

  useEffect(() => {
    // Only apply parallax effect on desktop
    if (!isMobile && backgroundRef.current && mainElementRef.current) {
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
        tl.kill(); // Kill the timeline and its ScrollTrigger
      };
    }
  }, [isMobile]);

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="relative bg-[#fdf3e1] min-h-screen">
        <main className="relative text-black pt-24 px-6 pb-12">
          <h1 className="text-2xl font-medium tracking-widest lowercase text-black mb-8">
            terms &amp; conditions
          </h1>

          <div className="text-base lowercase tracking-wide text-black space-y-4 leading-relaxed">
            <p className="font-bold">effective date: </p>
            <p>
              welcome to june of. by accessing or using our website
              www.juneof.com, you agree to comply with and be bound by the
              following terms &amp; conditions. if you do not agree, please do
              not use our services.
            </p>

            <p className="font-bold">1. use of the site</p>
            <p>
              you agree to use the site for lawful purposes only. you may not:
            </p>
            <p>• attempt to gain unauthorized access to our systems</p>
            <p>• interfere with the site&apos;s operation</p>
            <p>• copy or distribute any content without our consent</p>

            <p className="font-bold">2. product descriptions</p>
            <p>
              we strive to display accurate descriptions and images of our
              products. however, slight variations in colour or fabric may occur
              due to screen settings or natural differences in textile dye
              batches.
            </p>

            <p className="font-bold">3. orders &amp; payments</p>
            <p>
              all orders are subject to availability and confirmation. we
              reserve the right to cancel or refuse any order for any reason.
            </p>
            <p>
              prices are listed in inr, and payments are processed via razorpay.
            </p>

            <p className="font-bold">4. intellectual property</p>
            <p>
              all content on this site—including text, graphics, logos, and
              product designs—is the property of june of and protected under
              applicable copyright and trademark laws.
            </p>

            <p className="font-bold">5. limitation of liability</p>
            <p>
              we are not liable for any indirect, incidental, or consequential
              damages resulting from your use of our site or products.
            </p>

            <p className="font-bold">6. governing law</p>
            <p>
              these terms are governed by the laws of india. any disputes will
              be subject to the exclusive jurisdiction of the courts in
              thiruvananthapuram, kerala.
            </p>

            <p>for any concerns, email us at reach@juneof.com</p>
          </div>
        </main>
      </div>
    );
  }

  // Desktop Layout (Original)
  return (
    <div className="relative" style={{ backgroundColor: "#fdf3e1" }}>
      {/* Clipping container for the parallax image */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          ref={backgroundRef}
          className="absolute inset-0 z-0 h-[130%] opacity-0"
        ></div>
      </div>

      <main
        ref={mainElementRef}
        className="relative flex min-h-screen text-black pt-24"
      >
        {/* Left Column (Sticky Title) */}
        <div className="relative sticky top-0 z-10 flex h-screen w-[40%] flex-shrink-0 flex-col justify-center p-8 border-r border-gray-300">
          <h1 className="text-xl font-medium tracking-widest lowercase text-black mix-blend-difference">
            terms &amp; conditions
          </h1>
        </div>

        {/* Right Column (Scrollable Content) */}
        <div className="relative z-10 flex-grow p-8 bg-[rgba(0,0,0,0.02)] backdrop-blur-md">
          <div
            ref={contentRef}
            className="text-xl lowercase tracking-wider text-black space-y-4 mix-blend-difference"
          >
            <p className="font-bold">effective date: </p>
            <p>
              welcome to june of. by accessing or using our website
              www.juneof.com, you agree to comply with and be bound by the
              following terms &amp; conditions. if you do not agree, please do
              not use our services.
            </p>

            <p className="font-bold">1. use of the site</p>
            <p>
              you agree to use the site for lawful purposes only. you may not:
            </p>
            <p>• attempt to gain unauthorized access to our systems</p>
            <p>• interfere with the site&apos;s operation</p>
            <p>• copy or distribute any content without our consent</p>

            <p className="font-bold">2. product descriptions</p>
            <p>
              we strive to display accurate descriptions and images of our
              products. however, slight variations in colour or fabric may occur
              due to screen settings or natural differences in textile dye
              batches.
            </p>

            <p className="font-bold">3. orders &amp; payments</p>
            <p>
              all orders are subject to availability and confirmation. we
              reserve the right to cancel or refuse any order for any reason.
            </p>
            <p>
              prices are listed in inr, and payments are processed via razorpay.
            </p>

            <p className="font-bold">4. intellectual property</p>
            <p>
              all content on this site—including text, graphics, logos, and
              product designs—is the property of june of and protected under
              applicable copyright and trademark laws.
            </p>

            <p className="font-bold">5. limitation of liability</p>
            <p>
              we are not liable for any indirect, incidental, or consequential
              damages resulting from your use of our site or products.
            </p>

            <p className="font-bold">6. governing law</p>
            <p>
              these terms are governed by the laws of india. any disputes will
              be subject to the exclusive jurisdiction of the courts in
              thiruvananthapuram, kerala.
            </p>

            <p>for any concerns, email us at reach@juneof.com</p>
          </div>
        </div>
      </main>
    </div>
  );
}
