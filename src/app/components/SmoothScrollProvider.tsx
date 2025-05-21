"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function SmoothScrollProvider() {
  const pathname = usePathname();

  useEffect(() => {
    console.log("SmoothScrollProvider effect running for path:", pathname);

    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);

    gsap.ticker.lagSmoothing(0);

    const rafId = requestAnimationFrame(() => {
      console.log("Refreshing ScrollTrigger in provider...");
      ScrollTrigger.refresh();
    });

    return () => {
      console.log("Cleaning up SmoothScrollProvider for path:", pathname);
      cancelAnimationFrame(rafId);
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
    };
  }, [pathname]);

  return null;
}
