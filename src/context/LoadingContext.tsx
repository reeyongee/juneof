"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";

interface RequestTracker {
  source: string;
  startTime: number;
  isActive: boolean;
}

interface LoadingContextType {
  isGlobalLoading: boolean;
  startRequest: (source: string) => void;
  endRequest: (source: string) => void;
  startLoading: (source: string, minDuration?: number) => void; // Legacy support
  stopLoading: (source: string) => void; // Legacy support
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
  const activeRequestsRef = useRef<Map<string, RequestTracker>>(new Map());
  const gracePeriodTimerRef = useRef<NodeJS.Timeout | null>(null);
  const minimumDisplayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const loadingStartTimeRef = useRef<number | null>(null);
  const legacyTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // New request-aware loading functions
  const startRequest = useCallback(
    (source: string) => {
      console.log(`LoadingManager: Starting request for ${source}`);

      const now = Date.now();

      // Add request to active requests
      activeRequestsRef.current.set(source, {
        source,
        startTime: now,
        isActive: true,
      });

      // Clear grace period timer if it exists
      if (gracePeriodTimerRef.current) {
        clearTimeout(gracePeriodTimerRef.current);
        gracePeriodTimerRef.current = null;
      }

      // Start loading if not already loading
      if (!isGlobalLoading) {
        console.log("LoadingManager: Starting global loading (first request)");
        setIsGlobalLoading(true);
        loadingStartTimeRef.current = now;
      }
    },
    [isGlobalLoading]
  );

  const endRequest = useCallback((source: string) => {
    console.log(`LoadingManager: Ending request for ${source}`);

    // Remove request from active requests
    activeRequestsRef.current.delete(source);

    console.log(
      `LoadingManager: Active requests remaining:`,
      Array.from(activeRequestsRef.current.keys())
    );

    // If no more active requests, start grace period
    if (activeRequestsRef.current.size === 0) {
      console.log(
        "LoadingManager: All requests complete, starting grace period"
      );

      // Clear any existing grace period timer
      if (gracePeriodTimerRef.current) {
        clearTimeout(gracePeriodTimerRef.current);
      }

      // Start grace period (200ms after last request)
      gracePeriodTimerRef.current = setTimeout(() => {
        console.log(
          "LoadingManager: Grace period expired, checking minimum display time"
        );

        const now = Date.now();
        const loadingDuration = loadingStartTimeRef.current
          ? now - loadingStartTimeRef.current
          : 0;
        const minimumDisplayTime = 500; // 0.5s minimum display time

        if (loadingDuration >= minimumDisplayTime) {
          // Minimum time has passed, hide loading immediately
          console.log(
            `LoadingManager: Minimum display time met (${loadingDuration}ms), hiding loading`
          );
          setIsGlobalLoading(false);
          setLoadingMessage("");
          loadingStartTimeRef.current = null;
        } else {
          // Wait for minimum display time
          const remainingTime = minimumDisplayTime - loadingDuration;
          console.log(
            `LoadingManager: Waiting ${remainingTime}ms more for minimum display time`
          );

          minimumDisplayTimerRef.current = setTimeout(() => {
            console.log(
              "LoadingManager: Minimum display time reached, hiding loading"
            );
            setIsGlobalLoading(false);
            setLoadingMessage("");
            loadingStartTimeRef.current = null;
          }, remainingTime);
        }
      }, 200); // 200ms grace period
    }
  }, []);

  // Legacy functions for backward compatibility
  const startLoading = useCallback((source: string, minDuration = 1000) => {
    console.log(
      `LoadingManager: Legacy startLoading for ${source} with min duration ${minDuration}ms`
    );

    // Use legacy timer system for existing code
    const paddedMinDuration = minDuration + 1000;

    setIsGlobalLoading(true);

    const timer = setTimeout(() => {
      console.log(`LoadingManager: Legacy timer expired for ${source}`);
      legacyTimersRef.current.delete(source);

      // Check if any legacy timers are still active
      if (
        legacyTimersRef.current.size === 0 &&
        activeRequestsRef.current.size === 0
      ) {
        setIsGlobalLoading(false);
        setLoadingMessage("");
      }
    }, paddedMinDuration);

    legacyTimersRef.current.set(source, timer);
  }, []);

  const stopLoading = useCallback((source: string) => {
    console.log(`LoadingManager: Legacy stopLoading for ${source}`);

    const timer = legacyTimersRef.current.get(source);
    if (timer) {
      clearTimeout(timer);
      legacyTimersRef.current.delete(source);
    }

    // Check if any legacy timers or requests are still active
    if (
      legacyTimersRef.current.size === 0 &&
      activeRequestsRef.current.size === 0
    ) {
      setIsGlobalLoading(false);
      setLoadingMessage("");
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    const legacyTimers = legacyTimersRef.current;
    const gracePeriodTimer = gracePeriodTimerRef.current;
    const minimumDisplayTimer = minimumDisplayTimerRef.current;

    return () => {
      legacyTimers.forEach((timer) => clearTimeout(timer));
      legacyTimers.clear();
      if (gracePeriodTimer) clearTimeout(gracePeriodTimer);
      if (minimumDisplayTimer) clearTimeout(minimumDisplayTimer);
    };
  }, []);

  return (
    <LoadingContext.Provider
      value={{
        isGlobalLoading,
        startRequest,
        endRequest,
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
