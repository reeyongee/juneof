"use client";

import React, { useRef, useEffect, ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface RevealOnScrollUpProps {
  children: ReactNode[]; // Expecting two children: [mainContent, revealTarget]
}

const RevealOnScrollUp: React.FC<RevealOnScrollUpProps> = ({ children }) => {
  const mainContentRef = useRef<HTMLDivElement>(null);
  const revealTargetRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null); // Ref for the container/trigger

  useEffect(() => {
    const mainEl = mainContentRef.current;
    const revealEl = revealTargetRef.current;
    const triggerEl = triggerRef.current;

    if (
      !mainEl ||
      !revealEl ||
      !triggerEl ||
      !children ||
      children.length !== 2
    ) {
      console.warn("RevealOnScrollUp: Refs or children structure invalid.");
      return;
    }

    gsap.set(revealEl, { position: "sticky", bottom: 0, zIndex: 1 });
    gsap.set(mainEl, { position: "relative", zIndex: 2 });
    gsap.set(triggerEl, { backgroundColor: "white", overflow: "clip" }); // Adjust background as needed

    let st: ScrollTrigger | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    const createST = () => {
      if (timeoutId) clearTimeout(timeoutId);

      const revealHeight = revealEl.offsetHeight;
      if (revealHeight === 0) {
        console.warn(
          "Reveal target height still 0 after attempt. Animation might fail."
        );
        return;
      }

      st?.kill();

      st = ScrollTrigger.create({
        trigger: triggerEl,
        pin: triggerEl,
        pinSpacing: false,
        start: "bottom bottom",
        end: `+=${revealHeight}`,
        scrub: 1,
        animation: gsap.to(mainEl, {
          y: -revealHeight,
          ease: "none",
        }),
        invalidateOnRefresh: true,
      });
      console.log(
        "ScrollTrigger created in RevealOnScrollUp with height:",
        revealHeight
      );
    };

    const initialHeight = revealEl.offsetHeight;
    if (initialHeight > 0) {
      createST();
    } else {
      console.warn(
        "RevealOnScrollUp: Target height 0 initially, delaying setup..."
      );
      timeoutId = setTimeout(createST, 150);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      st?.kill();
    };
  }, [children]);

  if (!children || children.length !== 2) {
    console.error(
      "RevealOnScrollUp requires exactly two children: the main content and the element to reveal."
    );
    return <>{children}</>;
  }

  const [mainContent, revealTarget] = children;

  return (
    <div ref={triggerRef}>
      <div ref={mainContentRef}>{mainContent}</div>
      <div ref={revealTargetRef}>{revealTarget}</div>
    </div>
  );
};

export default RevealOnScrollUp;
