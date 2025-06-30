"use client"; // Required for useEffect and useRef

import { useEffect, useRef, useState } from "react";
import { BlurScrollEffect_Effect4 } from "@/lib/animations"; // Adjust path if needed
import gsap from "gsap"; // ScrollTrigger is globally registered

export default function CancellationsAndRefundPage() {
  const contentRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null); // For parallax background
  const mainElementRef = useRef<HTMLElement>(null); // For main scroll trigger
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Set page title and comprehensive SEO metadata
    document.title = "cancellations & refund - june of";

    // Add meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        "learn about june of's cancellation and refund policy. 7-day return window, 8-hour cancellation period, and easy return process for our sustainable fashion collection."
      );
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content =
        "learn about june of's cancellation and refund policy. 7-day return window, 8-hour cancellation period, and easy return process for our sustainable fashion collection.";
      document.head.appendChild(meta);
    }

    // Add keywords meta tag
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute(
        "content",
        "cancellation policy, refund policy, june of returns, sustainable fashion returns, order cancellation, refund process"
      );
    } else {
      const meta = document.createElement("meta");
      meta.name = "keywords";
      meta.content =
        "cancellation policy, refund policy, june of returns, sustainable fashion returns, order cancellation, refund process";
      document.head.appendChild(meta);
    }

    // Add canonical link
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute(
        "href",
        "https://www.juneof.com/cancellations-and-refund"
      );
    } else {
      const link = document.createElement("link");
      link.rel = "canonical";
      link.href = "https://www.juneof.com/cancellations-and-refund";
      document.head.appendChild(link);
    }

    // Add Open Graph meta tags
    const ogTags = [
      { property: "og:title", content: "cancellations & refund - june of" },
      {
        property: "og:description",
        content:
          "learn about june of's cancellation and refund policy. 7-day return window, 8-hour cancellation period, and easy return process for our sustainable fashion collection.",
      },
      {
        property: "og:url",
        content: "https://www.juneof.com/cancellations-and-refund",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "june of" },
      {
        property: "og:image",
        content: "https://www.juneof.com/landing-images/logo.svg",
      },
      {
        property: "og:image:alt",
        content: "june of cancellation and refund policy",
      },
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
      { name: "twitter:title", content: "cancellations & refund - june of" },
      {
        name: "twitter:description",
        content:
          "learn about june of's cancellation and refund policy. 7-day return window, 8-hour cancellation period, and easy return process for our sustainable fashion collection.",
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

    // Add structured data for return policy
    const returnPolicySchema = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "cancellations & refund - june of",
      description:
        "learn about june of's cancellation and refund policy. 7-day return window, 8-hour cancellation period, and easy return process for our sustainable fashion collection.",
      url: "https://www.juneof.com/cancellations-and-refund",
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
            name: "cancellations & refund",
            item: "https://www.juneof.com/cancellations-and-refund",
          },
        ],
      },
      publisher: {
        "@type": "Organization",
        name: "june of",
        url: "https://www.juneof.com",
      },
      mainEntity: {
        "@type": "Service",
        name: "return and refund service",
        provider: {
          "@type": "Organization",
          name: "june of",
        },
        hasPolicy: {
          "@type": "ReturnPolicy",
          returnPolicyCategory: "MerchantReturnFiniteReturnWindow",
          merchantReturnDays: 7,
          returnMethod: "ReturnByMail",
          returnFees: "FreeReturn",
        },
      },
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(returnPolicySchema);
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
            returns, refunds &amp; exchanges
          </h1>

          <div className="text-base lowercase tracking-wide text-black space-y-4 leading-relaxed">
            <p>
              we accept returns or exchanges under the following conditions:
            </p>

            <p className="font-bold">eligibility:</p>
            <p>• request is made within 7 days of receiving the order</p>
            <p>
              • item is unworn, unwashed, and in original condition with tags
            </p>

            <p className="font-bold">non-returnable items:</p>
            <p>• sale items</p>
            <p>• custom-made or pre-ordered pieces</p>

            <p className="font-bold">how to initiate a return:</p>
            <p>
              email us at reach@juneof.com with your order number and reason for
              return.
            </p>

            <p className="font-bold">refunds</p>
            <p>
              refunds will be processed to your original payment method within
              5-7 business days after receiving and inspecting the returned
              item.
            </p>

            <p className="font-bold">damages or issues</p>
            <p>
              if your order arrives damaged or defective, please contact us
              within 24 hours with photos and order details.
            </p>

            <p className="font-bold">cancellations</p>
            <p>
              orders can be cancelled within 8 hours of placement. once
              processed, cancellations are not possible.
            </p>
            <p>
              refunds for cancellations will be refunded within 7 working days.
            </p>

            <p>
              questions? write to us at reach@juneof.com or dm us on instagram
            </p>
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
            returns, refunds &amp; exchanges
          </h1>
        </div>

        {/* Right Column (Scrollable Content) */}
        <div className="relative z-10 flex-grow p-8 bg-[rgba(0,0,0,0.02)] backdrop-blur-md">
          <div
            ref={contentRef}
            className="text-xl lowercase tracking-wider text-black space-y-4 mix-blend-difference"
          >
            <p>
              we accept returns or exchanges under the following conditions:
            </p>

            <p className="font-bold">eligibility:</p>
            <p>• request is made within 7 days of receiving the order</p>
            <p>
              • item is unworn, unwashed, and in original condition with tags
            </p>

            <p className="font-bold">non-returnable items:</p>
            <p>• sale items</p>
            <p>• custom-made or pre-ordered pieces</p>

            <p className="font-bold">how to initiate a return:</p>
            <p>
              email us at reach@juneof.com with your order number and reason for
              return.
            </p>

            <p className="font-bold">refunds</p>
            <p>
              refunds will be processed to your original payment method within
              5-7 business days after receiving and inspecting the returned
              item.
            </p>

            <p className="font-bold">damages or issues</p>
            <p>
              if your order arrives damaged or defective, please contact us
              within 24 hours with photos and order details.
            </p>

            <p className="font-bold">cancellations</p>
            <p>
              orders can be cancelled within 8 hours of placement. once
              processed, cancellations are not possible.
            </p>
            <p>
              refunds for cancellations will be refunded within 7 working days.
            </p>

            <p>
              questions? write to us at reach@juneof.com or dm us on instagram
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
