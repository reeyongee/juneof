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
  startAuthFlow: () => void;
  completeAuthFlow: () => void;
  forceCompleteAuthFlow: () => void;
  isAuthFlowActive: boolean;
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
  const [isAuthFlowActive, setIsAuthFlowActive] = useState(() => {
    // Check if auth flow is active from sessionStorage to persist across page navigation
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("auth-flow-active") === "true";
    }
    return false;
  });
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

  const stopLoading = useCallback(
    (source: string) => {
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

      // Only stop global loading if no active loaders AND auth flow is not active
      if (activeLoadersRef.current.size === 0 && !isAuthFlowActive) {
        console.log(
          "LoadingManager: All loaders stopped, hiding global loading"
        );
        setIsGlobalLoading(false);
        setLoadingMessage("");
      }
    },
    [isAuthFlowActive]
  );

  const startAuthFlow = useCallback(() => {
    console.log("LoadingManager: Starting authentication flow");
    setIsAuthFlowActive(true);
    setIsGlobalLoading(true);
    setLoadingMessage("");

    // Persist auth flow state across page navigation
    if (typeof window !== "undefined") {
      sessionStorage.setItem("auth-flow-active", "true");
    }
  }, []);

  const completeAuthFlow = useCallback(() => {
    console.log("LoadingManager: Completing authentication flow");
    setIsAuthFlowActive(false);

    // Clear auth flow state from sessionStorage
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("auth-flow-active");
    }

    // Only stop global loading if no other active loaders
    if (activeLoadersRef.current.size === 0) {
      // Add a small delay for smooth transition
      setTimeout(() => {
        setIsGlobalLoading(false);
        setLoadingMessage("");
      }, 300);
    }
  }, []);

  const forceCompleteAuthFlow = useCallback(() => {
    console.log("LoadingManager: Force completing auth flow");
    setIsAuthFlowActive(false);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("juneof-auth-flow-active");
    }
  }, []);

  // Initialize loading state based on persisted auth flow
  useEffect(() => {
    if (isAuthFlowActive) {
      setIsGlobalLoading(true);
      setLoadingMessage("");
    }
  }, [isAuthFlowActive]);

  // Enhanced timeout mechanism for auth flow
  useEffect(() => {
    if (isAuthFlowActive) {
      // Set a 20-second global failsafe timeout
      const timeoutId = setTimeout(() => {
        console.warn(
          "LoadingManager: Auth flow timeout after 20 seconds, force completing"
        );
        forceCompleteAuthFlow();
      }, 20000);

      // Add a manual recovery function to window for debugging
      if (typeof window !== "undefined") {
        (
          window as typeof window & { clearAuthFlow?: () => void }
        ).clearAuthFlow = () => {
          console.log("Manual auth flow clear triggered");
          clearTimeout(timeoutId);
          forceCompleteAuthFlow();
        };
      }

      return () => {
        clearTimeout(timeoutId);
        if (typeof window !== "undefined") {
          delete (window as typeof window & { clearAuthFlow?: () => void })
            .clearAuthFlow;
        }
      };
    }
  }, [isAuthFlowActive, forceCompleteAuthFlow]);

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
        startAuthFlow,
        completeAuthFlow,
        forceCompleteAuthFlow,
        isAuthFlowActive,
      }}
    >
      {children}
      {isGlobalLoading && (
        <div className="fixed inset-0 bg-[#F8F4EC] flex flex-col items-center justify-center z-50 transition-opacity duration-300">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
          {loadingMessage && (
            <p className="text-black text-lg font-medium tracking-wide lowercase">
              {loadingMessage}
            </p>
          )}
        </div>
      )}
    </LoadingContext.Provider>
  );
};
