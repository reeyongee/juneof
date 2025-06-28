"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation"; // Import useSearchParams
import SplashScreen from "./SplashScreen";
import Navbar from "./Navbar";
import Footer from "./Footer";
import CustomCursor from "./CustomCursor";
import { useSplash } from "@/context/SplashContext";
import { useLoading } from "@/context/LoadingContext";
import { AddressProvider } from "@/context/AddressContext";
import { CartProvider } from "@/context/CartContext";
import { Toaster } from "@/components/ui/sonner";
import PostLoginRedirect from "@/components/PostLoginRedirect";
import * as pixel from "@/lib/meta-pixel"; // Import the pixel helper

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const { showSplash, setShowSplash } = useSplash();
  const { isGlobalLoading } = useLoading();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleLoadComplete = () => {
    setShowSplash(false);
  };

  // Track PageView events
  useEffect(() => {
    // This check ensures fbq is available before tracking
    if (pixel.PIXEL_ID) {
      pixel.pageview();
    }
  }, [pathname, searchParams]); // Re-fire on path or query param change

  // Prevent scrolling when splash screen is visible
  useEffect(() => {
    if (showSplash) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showSplash]);

  return (
    <AddressProvider>
      <CartProvider>
        <CustomCursor />
        <PostLoginRedirect />
        {showSplash && <SplashScreen onLoadComplete={handleLoadComplete} />}

        <div
          className={`transition-opacity duration-500 ${
            !showSplash && !isGlobalLoading ? "opacity-100" : "opacity-0"
          }`}
          style={{ display: isGlobalLoading ? "none" : "block" }}
        >
          <Navbar />
          <main className="min-h-screen bg-white">{children}</main>
          <Footer />
        </div>
        <Toaster position="bottom-left" />
      </CartProvider>
    </AddressProvider>
  );
}
