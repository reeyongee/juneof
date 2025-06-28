"use client";

import { useEffect } from "react";
import Script from "next/script";
import { initPixel, pageview, debugPixel, PIXEL_ID } from "@/lib/meta-pixel";
import { usePathname } from "next/navigation";

export default function MetaPixel() {
  const pathname = usePathname();

  // Track page views on route changes
  useEffect(() => {
    if (PIXEL_ID) {
      console.log(`[Meta Pixel] Route changed to: ${pathname}`);
      pageview();
    }
  }, [pathname]);

  // Initialize pixel when component mounts
  useEffect(() => {
    // Small delay to ensure the script has loaded
    const timer = setTimeout(() => {
      initPixel();
      debugPixel();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (!PIXEL_ID) {
    console.warn(
      "[Meta Pixel] NEXT_PUBLIC_META_PIXEL_ID not found in environment variables"
    );
    return null;
  }

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        onLoad={() => {
          console.log("[Meta Pixel] Script loaded successfully");
          initPixel();
        }}
        onError={(e) => {
          console.error("[Meta Pixel] Script failed to load:", e);
        }}
      >
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>

      {/* Noscript fallback */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
