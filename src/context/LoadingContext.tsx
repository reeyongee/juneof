"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";

interface LoadingContextType {
  isGlobalLoading: boolean;
  startLoading: (source: string, minDuration?: number) => void;
  stopLoading: (source: string) => void;
  setLoadingMessage: (message: string) => void;
  loadingMessage: string;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
};

interface LoadingProviderProps {
  children: React.ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({
  children,
}) => {
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const activeLoadersRef = useRef<Set<string>>(new Set());
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const startLoading = useCallback((source: string, minDuration = 1000) => {
    console.log(
      `LoadingManager: Starting loading for ${source} with min duration ${minDuration}ms`
    );

    activeLoadersRef.current.add(source);
    setIsGlobalLoading(true);

    // Clear any existing timer for this source
    const existingTimer = timersRef.current.get(source);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set minimum duration timer - auto-stop after min duration + 1s padding
    const paddedMinDuration = minDuration + 1000; // 0.5s start + actual duration + 0.5s end
    const timer = setTimeout(() => {
      console.log(
        `LoadingManager: Auto-stopping ${source} after ${paddedMinDuration}ms`
      );

      activeLoadersRef.current.delete(source);
      timersRef.current.delete(source);

      // Only stop global loading if no active loaders
      if (activeLoadersRef.current.size === 0) {
        console.log(
          "LoadingManager: All loaders stopped, hiding global loading"
        );
        setIsGlobalLoading(false);
        setLoadingMessage("");
      }
    }, paddedMinDuration);

    timersRef.current.set(source, timer);
  }, []);

  const stopLoading = useCallback((source: string) => {
    console.log(`LoadingManager: Manually stopping loading for ${source}`);

    // Clear timer and remove from active loaders
    const timer = timersRef.current.get(source);
    if (timer) {
      clearTimeout(timer);
    }

    activeLoadersRef.current.delete(source);
    timersRef.current.delete(source);

    console.log(
      `LoadingManager: Stopped loading for ${source}. Active loaders:`,
      Array.from(activeLoadersRef.current)
    );

    // Only stop global loading if no active loaders
    if (activeLoadersRef.current.size === 0) {
      console.log("LoadingManager: All loaders stopped, hiding global loading");
      setIsGlobalLoading(false);
      setLoadingMessage("");
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  return (
    <LoadingContext.Provider
      value={{
        isGlobalLoading,
        startLoading,
        stopLoading,
        setLoadingMessage,
        loadingMessage,
      }}
    >
      {children}
      {isGlobalLoading && (
        <div className="fixed inset-0 bg-[#F8F4EC] flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      )}
    </LoadingContext.Provider>
  );
};
