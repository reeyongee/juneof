"use client"; // Required for useEffect and useRef

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BlurScrollEffect_Effect4 } from "@/lib/animations"; // Adjust path if needed
import gsap from "gsap"; // ScrollTrigger is globally registered

export default function CancellationsAndRefundPage() {
  const contentRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null); // For parallax background
  const mainElementRef = useRef<HTMLElement>(null); // For main scroll trigger
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Set page title
    document.title = "cancellations & refund - june of";
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
            cancellations &amp; refund
          </h1>

          <div className="text-base lowercase tracking-wide text-black space-y-4 leading-relaxed">
            <p className="font-bold">returns &amp; exchanges</p> <br />
            <p>
              we accept returns or exchanges under the following conditions:
            </p>{" "}
            <br />
            <p className="font-bold">eligibility:</p> <br />
            <p>request is made within 7 days of receiving the order</p>
            <p>
              item is unworn, unwashed, and in original condition with tags
            </p>{" "}
            <br />
            <p className="font-bold">non-returnable items:</p> <br />
            <p>sale items</p> <br />
            <p>custom-made or pre-ordered pieces</p> <br />
            <p className="font-bold">how to initiate a return:</p> <br />
            <p>
              email us at reach@juneof.com or use the &quot;send us a
              message&quot; form on our
              <Link href="/contact-us" className="hover:no-underline">
                contact us page
              </Link>{" "}
              with your order number and reason for return.
            </p>{" "}
            <br />
            <p className="font-bold">refunds:</p> <br />
            <p>
              refunds will be processed to your original payment method within
              [insert timeframe] after receiving and inspecting the returned
              item.
            </p>
            <p className="font-bold">damages or issues :</p>
            <p>
              if your order arrives damaged or defective, please contact us
              within 24 hours with photos and order details.
            </p>
            <p className="font-bold">cancellations :</p>
            <p>
              orders can be cancelled within 8 hours of placement. once
              processed, cancellations are not possible. refunds for
              cancellations will be refunded within 7 working days.
            </p>
            <p className="font-bold">contact us :</p> <br />
            <p>
              questions? write to us at reach@juneof.com or visit the{" "}
              <Link href="/contact-us" className="hover:no-underline">
                contact us page
              </Link>{" "}
              to send us a message
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
            cancellations &amp; refund
          </h1>
        </div>

        {/* Right Column (Scrollable Content) */}
        <div className="relative z-10 flex-grow p-8 bg-[rgba(0,0,0,0.02)] backdrop-blur-md">
          <div
            ref={contentRef}
            className="text-xl lowercase tracking-wider text-black space-y-4 mix-blend-difference"
          >
            <p className="font-bold">returns &amp; exchanges</p> <br />
            <p>
              we accept returns or exchanges under the following conditions:
            </p>{" "}
            <br />
            <p className="font-bold">eligibility:</p> <br />
            <p>request is made within 7 days of receiving the order</p>
            <p>
              item is unworn, unwashed, and in original condition with tags
            </p>{" "}
            <br />
            <p className="font-bold">non-returnable items:</p> <br />
            <p>sale items</p> <br />
            <p>custom-made or pre-ordered pieces</p> <br />
            <p className="font-bold">how to initiate a return:</p> <br />
            <p>
              email us at reach@juneof.com or use the &quot;send us a
              message&quot; form on our
              <Link href="/contact-us" className="hover:no-underline">
                contact us page
              </Link>{" "}
              with your order number and reason for return.
            </p>{" "}
            <br />
            <p className="font-bold">refunds:</p> <br />
            <p>
              refunds will be processed to your original payment method within
              [insert timeframe] after receiving and inspecting the returned
              item.
            </p>
            <p className="font-bold">damages or issues :</p>
            <p>
              if your order arrives damaged or defective, please contact us
              within 24 hours with photos and order details.
            </p>
            <p className="font-bold">cancellations :</p>
            <p>
              orders can be cancelled within 8 hours of placement. once
              processed, cancellations are not possible. refunds for
              cancellations will be refunded within 7 working days.
            </p>
            <p className="font-bold">contact us :</p> <br />
            <p>
              questions? write to us at reach@juneof.com or visit the{" "}
              <Link href="/contact-us" className="hover:no-underline">
                contact us page
              </Link>{" "}
              to send us a message
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
