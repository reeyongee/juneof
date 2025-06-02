"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface SplashContextType {
  showSplash: boolean;
  setShowSplash: (show: boolean) => void;
  hasShownSplash: boolean;
}

const SplashContext = createContext<SplashContextType | undefined>(undefined);

export function SplashProvider({ children }: { children: ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const [hasShownSplash, setHasShownSplash] = useState(false);

  // Check if splash has been shown in this session
  useEffect(() => {
    const splashShown = sessionStorage.getItem("splashShown");
    if (splashShown === "true") {
      setShowSplash(false);
      setHasShownSplash(true);
    }
  }, []);

  const handleSetShowSplash = (show: boolean) => {
    setShowSplash(show);
    if (!show && !hasShownSplash) {
      setHasShownSplash(true);
      sessionStorage.setItem("splashShown", "true");
    }
  };

  return (
    <SplashContext.Provider
      value={{
        showSplash,
        setShowSplash: handleSetShowSplash,
        hasShownSplash,
      }}
    >
      {children}
    </SplashContext.Provider>
  );
}

export function useSplash() {
  const context = useContext(SplashContext);
  if (context === undefined) {
    throw new Error("useSplash must be used within a SplashProvider");
  }
  return context;
}
