"use client";

import { useEffect } from "react";
import SplashScreen from "./SplashScreen";
import Navbar from "./Navbar";
import Footer from "./Footer";
import CustomCursor from "./CustomCursor";
import { useSplash } from "@/context/SplashContext";
import { SessionProvider } from "next-auth/react";
import { AddressProvider } from "@/context/AddressContext";
import { Toaster } from "@/components/ui/sonner";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const { showSplash, setShowSplash } = useSplash();

  const handleLoadComplete = () => {
    setShowSplash(false);
  };

  // Prevent scrolling when splash screen is visible
  useEffect(() => {
    console.log("ClientLayout Splash Effect: showSplash is", showSplash);
    if (showSplash) {
      console.log(
        "ClientLayout Splash Effect: Setting body.style.overflow = 'hidden'"
      );
      document.body.style.overflow = "hidden";
    } else {
      console.log(
        "ClientLayout Splash Effect: Setting body.style.overflow = 'unset'"
      );
      document.body.style.overflow = "unset";
    }

    return () => {
      console.log(
        "ClientLayout Splash Effect: Cleanup, setting body.style.overflow = 'unset'"
      );
      document.body.style.overflow = "unset";
    };
  }, [showSplash]);

  return (
    <SessionProvider>
      <AddressProvider>
        <CustomCursor />
        {showSplash && <SplashScreen onLoadComplete={handleLoadComplete} />}

        <div
          className={`transition-opacity duration-500 ${
            !showSplash ? "opacity-100" : "opacity-0"
          }`}
        >
          <Navbar />
          <main className="flex-grow bg-[#F8F4EC] relative z-[1]">
            {children}
          </main>
          <Footer />
        </div>
        <Toaster position="bottom-left" />
      </AddressProvider>
    </SessionProvider>
  );
}
