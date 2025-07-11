"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";

interface FlowStep {
  id: string;
  name: string;
  completed: boolean;
  timeout?: number;
}

interface FlowState {
  id: string;
  name: string;
  steps: FlowStep[];
  currentStep: number;
  message: string;
  timeout: number;
  startTime: number;
}

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
  // Enhanced flow-based loading methods
  startFlow: (flowId: string, steps: FlowStep[], message?: string) => void;
  completeFlowStep: (flowId: string, stepId: string) => void;
  completeFlow: (flowId: string) => void;
  forceCompleteFlow: (flowId: string) => void;
  isFlowActive: (flowId: string) => boolean;
  getFlowState: (flowId: string) => FlowState | null;
  getCurrentFlowMessage: () => string;
  // Fallback mechanisms
  clearAllFlows: () => void;
  emergencyReset: () => void;
  getActiveFlows: () => string[];
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
  const flowsRef = useRef<Map<string, FlowState>>(new Map());
  const flowTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const startLoading = useCallback((source: string, minDuration = 1000) => {
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
      activeLoadersRef.current.delete(source);
      timersRef.current.delete(source);

      // Only stop global loading if no active loaders
      if (activeLoadersRef.current.size === 0) {
        setIsGlobalLoading(false);
        setLoadingMessage("");
      }
    }, paddedMinDuration);

    timersRef.current.set(source, timer);
  }, []);

  const stopLoading = useCallback(
    (source: string) => {
      // Clear timer and remove from active loaders
      const timer = timersRef.current.get(source);
      if (timer) {
        clearTimeout(timer);
      }

      activeLoadersRef.current.delete(source);
      timersRef.current.delete(source);

      // Only stop global loading if no active loaders AND auth flow is not active
      if (
        activeLoadersRef.current.size === 0 &&
        !isAuthFlowActive &&
        flowsRef.current.size === 0
      ) {
        setIsGlobalLoading(false);
        setLoadingMessage("");
      }
    },
    [isAuthFlowActive]
  );

  const startAuthFlow = useCallback(() => {
    setIsAuthFlowActive(true);
    setIsGlobalLoading(true);
    setLoadingMessage("");

    // Persist auth flow state across page navigation
    if (typeof window !== "undefined") {
      sessionStorage.setItem("auth-flow-active", "true");
    }
  }, []);

  const completeAuthFlow = useCallback(() => {
    setIsAuthFlowActive(false);

    // Clear auth flow state from sessionStorage
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("auth-flow-active");
    }

    // Dispatch event to notify other components (like AuthContext) that auth flow is completed/abandoned
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("auth-flow-completed", {
          detail: { reason: "completed" },
        })
      );
    }

    // Only stop global loading if no other active loaders or flows
    if (activeLoadersRef.current.size === 0 && flowsRef.current.size === 0) {
      // Add a small delay for smooth transition
      setTimeout(() => {
        setIsGlobalLoading(false);
        setLoadingMessage("");
      }, 300);
    }
  }, []);

  const forceCompleteAuthFlow = useCallback(() => {
    setIsAuthFlowActive(false);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("auth-flow-active");
    }

    // Dispatch event to notify other components that auth flow was force-completed/abandoned
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("auth-flow-completed", {
          detail: { reason: "abandoned" },
        })
      );
    }
  }, []);

  // Enhanced flow-based loading methods
  const forceCompleteFlow = useCallback(
    (flowId: string) => {
      console.log(`LoadingContext: Force completing flow "${flowId}"`);

      const flowTimer = flowTimersRef.current.get(flowId);
      if (flowTimer) {
        clearTimeout(flowTimer);
        flowTimersRef.current.delete(flowId);
      }

      flowsRef.current.delete(flowId);

      // Clear persisted state
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(`flow-${flowId}`);
      }

      // Dispatch abandoned event
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("flow-completed", {
            detail: { flowId, reason: "abandoned" },
          })
        );
      }

      // Stop global loading if no other active loaders, flows, or auth flow
      if (
        activeLoadersRef.current.size === 0 &&
        flowsRef.current.size === 0 &&
        !isAuthFlowActive
      ) {
        setIsGlobalLoading(false);
        setLoadingMessage("");
      }
    },
    [isAuthFlowActive]
  );

  const startFlow = useCallback(
    (flowId: string, steps: FlowStep[], message?: string) => {
      console.log(
        `LoadingContext: Starting flow "${flowId}" with ${steps.length} steps`
      );

      const flowState: FlowState = {
        id: flowId,
        name: flowId,
        steps: steps.map((step) => ({ ...step, completed: false })),
        currentStep: 0,
        message: message || `processing ${flowId}...`,
        timeout: 20000, // 20 second default timeout
        startTime: Date.now(),
      };

      flowsRef.current.set(flowId, flowState);
      setIsGlobalLoading(true);
      setLoadingMessage(flowState.message);

      // Persist flow state
      if (typeof window !== "undefined") {
        sessionStorage.setItem(`flow-${flowId}`, JSON.stringify(flowState));
      }

      // Set timeout for the flow
      const timeoutId = setTimeout(() => {
        console.warn(
          `LoadingContext: Flow "${flowId}" timed out, force completing`
        );
        forceCompleteFlow(flowId);
      }, flowState.timeout);

      flowTimersRef.current.set(flowId, timeoutId);
    },
    [forceCompleteFlow]
  );

  const completeFlow = useCallback(
    (flowId: string) => {
      console.log(`LoadingContext: Completing flow "${flowId}"`);

      const flowTimer = flowTimersRef.current.get(flowId);
      if (flowTimer) {
        clearTimeout(flowTimer);
        flowTimersRef.current.delete(flowId);
      }

      flowsRef.current.delete(flowId);

      // Clear persisted state
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(`flow-${flowId}`);
      }

      // Dispatch completion event
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("flow-completed", {
            detail: { flowId, reason: "completed" },
          })
        );
      }

      // Stop global loading if no other active loaders, flows, or auth flow
      if (
        activeLoadersRef.current.size === 0 &&
        flowsRef.current.size === 0 &&
        !isAuthFlowActive
      ) {
        setTimeout(() => {
          setIsGlobalLoading(false);
          setLoadingMessage("");
        }, 300);
      }
    },
    [isAuthFlowActive]
  );

  const completeFlowStep = useCallback(
    (flowId: string, stepId: string) => {
      const flowState = flowsRef.current.get(flowId);
      if (!flowState) {
        console.warn(
          `LoadingContext: Flow "${flowId}" not found for step completion`
        );
        return;
      }

      const stepIndex = flowState.steps.findIndex((step) => step.id === stepId);
      if (stepIndex === -1) {
        console.warn(
          `LoadingContext: Step "${stepId}" not found in flow "${flowId}"`
        );
        return;
      }

      flowState.steps[stepIndex].completed = true;
      flowState.currentStep = Math.max(flowState.currentStep, stepIndex + 1);

      // Update message based on current step
      const nextIncompleteStep = flowState.steps.find(
        (step) => !step.completed
      );
      if (nextIncompleteStep) {
        flowState.message = `processing ${nextIncompleteStep.name}...`;
        setLoadingMessage(flowState.message);
      }

      // Update persisted state
      if (typeof window !== "undefined") {
        sessionStorage.setItem(`flow-${flowId}`, JSON.stringify(flowState));
      }

      // Check if all steps are completed
      const allStepsCompleted = flowState.steps.every((step) => step.completed);
      if (allStepsCompleted) {
        console.log(
          `LoadingContext: All steps completed for flow "${flowId}", completing flow`
        );
        completeFlow(flowId);
      }
    },
    [completeFlow]
  );

  const isFlowActive = useCallback((flowId: string) => {
    return flowsRef.current.has(flowId);
  }, []);

  const getFlowState = useCallback((flowId: string) => {
    return flowsRef.current.get(flowId) || null;
  }, []);

  const getCurrentFlowMessage = useCallback(() => {
    if (flowsRef.current.size > 0) {
      const activeFlow = Array.from(flowsRef.current.values())[0];
      return activeFlow.message;
    }
    return loadingMessage;
  }, [loadingMessage]);

  // Enhanced fallback mechanisms
  const clearAllFlows = useCallback(() => {
    console.log("LoadingContext: Clearing all active flows");

    // Clear all flow timers
    flowTimersRef.current.forEach((timer) => clearTimeout(timer));
    flowTimersRef.current.clear();

    // Clear all flows
    const activeFlowIds = Array.from(flowsRef.current.keys());
    flowsRef.current.clear();

    // Clear persisted flow states
    if (typeof window !== "undefined") {
      activeFlowIds.forEach((flowId) => {
        sessionStorage.removeItem(`flow-${flowId}`);
      });
    }

    // Dispatch events for each cleared flow
    if (typeof window !== "undefined") {
      activeFlowIds.forEach((flowId) => {
        window.dispatchEvent(
          new CustomEvent("flow-completed", {
            detail: { flowId, reason: "cleared" },
          })
        );
      });
    }

    // Stop global loading if no other active loaders or auth flow
    if (activeLoadersRef.current.size === 0 && !isAuthFlowActive) {
      setIsGlobalLoading(false);
      setLoadingMessage("");
    }
  }, [isAuthFlowActive]);

  const emergencyReset = useCallback(() => {
    console.warn("LoadingContext: Emergency reset triggered");

    // Clear all loaders
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
    activeLoadersRef.current.clear();

    // Clear all flows
    clearAllFlows();

    // Force complete auth flow
    forceCompleteAuthFlow();

    // Reset all loading states
    setIsGlobalLoading(false);
    setLoadingMessage("");
    setIsAuthFlowActive(false);

    // Clear all persisted states
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("auth-flow-active");
      const flowKeys = Object.keys(sessionStorage).filter((key) =>
        key.startsWith("flow-")
      );
      flowKeys.forEach((key) => sessionStorage.removeItem(key));
    }

    console.log("LoadingContext: Emergency reset completed");
  }, [clearAllFlows, forceCompleteAuthFlow]);

  const getActiveFlows = useCallback(() => {
    return Array.from(flowsRef.current.keys());
  }, []);

  // Initialize flow states from sessionStorage on mount with enhanced fallbacks
  useEffect(() => {
    if (typeof window !== "undefined") {
      const flowKeys = Object.keys(sessionStorage).filter((key) =>
        key.startsWith("flow-")
      );

      let recoveredFlows = 0;
      let cleanedFlows = 0;

      flowKeys.forEach((key) => {
        try {
          const flowState = JSON.parse(sessionStorage.getItem(key) || "{}");
          const flowId = key.replace("flow-", "");

          // Enhanced flow age checking with multiple time thresholds
          const flowAge = Date.now() - flowState.startTime;

          // If flow is extremely old (>5 minutes), definitely remove
          if (flowAge > 300000) {
            console.log(
              `LoadingContext: Flow "${flowId}" is extremely old (${Math.round(flowAge / 1000)}s), removing`
            );
            sessionStorage.removeItem(key);
            cleanedFlows++;
            return;
          }

          // If flow is old (>2 minutes) but not extremely old, check if it's critical
          if (flowAge > 120000) {
            const criticalFlows = [
              "auth-initialization",
              "login-flow",
              "dashboard-initialization",
            ];
            if (!criticalFlows.includes(flowId)) {
              console.log(
                `LoadingContext: Non-critical flow "${flowId}" is old (${Math.round(flowAge / 1000)}s), removing`
              );
              sessionStorage.removeItem(key);
              cleanedFlows++;
              return;
            } else {
              console.warn(
                `LoadingContext: Critical flow "${flowId}" is old (${Math.round(flowAge / 1000)}s), but recovering with short timeout`
              );
            }
          }

          // Validate flow state structure
          if (
            !flowState.id ||
            !flowState.steps ||
            !Array.isArray(flowState.steps)
          ) {
            console.error(
              `LoadingContext: Invalid flow state structure for "${flowId}", removing`
            );
            sessionStorage.removeItem(key);
            cleanedFlows++;
            return;
          }

          flowsRef.current.set(flowId, flowState);
          setIsGlobalLoading(true);
          setLoadingMessage(flowState.message || `recovering ${flowId}...`);
          recoveredFlows++;

          // Set timeout for resumed flow with adaptive timing
          const baseTimeout = Math.max(1000, flowState.timeout - flowAge);
          const adaptiveTimeout =
            flowAge > 120000 ? Math.min(baseTimeout, 10000) : baseTimeout; // Shorter timeout for old flows

          const timeoutId = setTimeout(() => {
            console.warn(
              `LoadingContext: Resumed flow "${flowId}" timed out after ${adaptiveTimeout}ms, force completing`
            );
            forceCompleteFlow(flowId);
          }, adaptiveTimeout);

          flowTimersRef.current.set(flowId, timeoutId);
        } catch (error) {
          console.error(
            `LoadingContext: Error parsing flow state for ${key}:`,
            error
          );
          sessionStorage.removeItem(key);
          cleanedFlows++;
        }
      });

      // Log recovery summary
      if (recoveredFlows > 0 || cleanedFlows > 0) {
        console.log(
          `LoadingContext: Flow recovery complete - recovered: ${recoveredFlows}, cleaned: ${cleanedFlows}`
        );
      }

      // If we recovered too many flows (possible bug), provide emergency reset
      if (recoveredFlows > 3) {
        console.warn(
          `LoadingContext: Recovered ${recoveredFlows} flows, this might indicate a problem. Emergency reset available via window.emergencyLoadingReset()`
        );
        (
          window as typeof window & { emergencyLoadingReset?: () => void }
        ).emergencyLoadingReset = emergencyReset;
      }
    }
  }, [forceCompleteFlow, emergencyReset]);

  // Initialize loading state based on persisted auth flow
  useEffect(() => {
    if (isAuthFlowActive) {
      setIsGlobalLoading(true);
      setLoadingMessage("");

      // Check if we're in an abandoned auth flow state on mount
      if (typeof window !== "undefined") {
        const currentUrl = window.location.href;
        const isAuthPage =
          currentUrl.includes("/auth/") ||
          currentUrl.includes("auth_completed=true");

        // If we're not on an auth page but auth flow is active, it's likely abandoned
        if (!isAuthPage) {
          console.log(
            "LoadingContext: Detected abandoned auth flow on mount, clearing..."
          );
          // Dispatch abandoned event before completing auth flow
          window.dispatchEvent(
            new CustomEvent("auth-flow-completed", {
              detail: { reason: "abandoned" },
            })
          );
          completeAuthFlow();
        }
      }
    }
  }, [isAuthFlowActive, completeAuthFlow]);

  // Enhanced timeout mechanism for auth flow
  useEffect(() => {
    if (isAuthFlowActive) {
      // Set a 15-second global failsafe timeout (reduced from 20s for better UX)
      const timeoutId = setTimeout(() => {
        console.warn(
          "LoadingManager: Auth flow timeout after 15 seconds, force completing"
        );
        forceCompleteAuthFlow();
      }, 15000);

      // Add a shorter timeout to check for abandoned flows
      const abandonedCheckId = setTimeout(() => {
        if (typeof window !== "undefined") {
          const currentUrl = window.location.href;
          const isAuthPage =
            currentUrl.includes("/auth/") ||
            currentUrl.includes("auth_completed=true");

          if (!isAuthPage) {
            console.log(
              "LoadingManager: Detected abandoned auth flow after 5 seconds, clearing..."
            );
            // Dispatch abandoned event before completing auth flow
            window.dispatchEvent(
              new CustomEvent("auth-flow-completed", {
                detail: { reason: "abandoned" },
              })
            );
            completeAuthFlow();
          }
        }
      }, 5000);

      // Add enhanced manual recovery functions to window for debugging
      if (typeof window !== "undefined") {
        const windowObj = window as typeof window & {
          clearAuthFlow?: () => void;
          debugLoading?: () => void;
          clearAllLoadingFlows?: () => void;
        };

        windowObj.clearAuthFlow = () => {
          clearTimeout(timeoutId);
          clearTimeout(abandonedCheckId);
          forceCompleteAuthFlow();
        };

        windowObj.debugLoading = () => {
          console.log("LoadingContext Debug Info:", {
            isGlobalLoading,
            isAuthFlowActive,
            activeLoaders: Array.from(activeLoadersRef.current),
            activeFlows: getActiveFlows(),
            flowStates: Array.from(flowsRef.current.entries()),
          });
        };

        windowObj.clearAllLoadingFlows = () => {
          console.log("Manual clear all flows triggered");
          clearAllFlows();
        };
      }

      return () => {
        clearTimeout(timeoutId);
        clearTimeout(abandonedCheckId);
        if (typeof window !== "undefined") {
          delete (window as typeof window & { clearAuthFlow?: () => void })
            .clearAuthFlow;
        }
      };
    }
  }, [isAuthFlowActive, forceCompleteAuthFlow, completeAuthFlow]);

  // Detect abandoned auth flows when users navigate back or return to the page
  useEffect(() => {
    if (!isAuthFlowActive || typeof window === "undefined") return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const currentUrl = window.location.href;
        const isAuthPage =
          currentUrl.includes("/auth/") ||
          currentUrl.includes("auth_completed=true");

        // If user returned to a non-auth page, clear the auth flow
        if (!isAuthPage) {
          console.log(
            "LoadingContext: User returned to non-auth page, clearing auth flow"
          );
          // Dispatch abandoned event before completing auth flow
          window.dispatchEvent(
            new CustomEvent("auth-flow-completed", {
              detail: { reason: "abandoned" },
            })
          );
          completeAuthFlow();
        }
      }
    };

    const handlePopState = () => {
      const currentUrl = window.location.href;
      const isAuthPage =
        currentUrl.includes("/auth/") ||
        currentUrl.includes("auth_completed=true");

      if (!isAuthPage) {
        console.log(
          "LoadingContext: Navigation detected to non-auth page, clearing auth flow"
        );
        // Dispatch abandoned event before completing auth flow
        window.dispatchEvent(
          new CustomEvent("auth-flow-completed", {
            detail: { reason: "abandoned" },
          })
        );
        completeAuthFlow();
      }
    };

    const handleBeforeUnload = () => {
      // Clear auth flow when user navigates away or closes tab
      console.log("LoadingContext: Page unload detected, clearing auth flow");
      // Dispatch abandoned event before completing auth flow
      window.dispatchEvent(
        new CustomEvent("auth-flow-completed", {
          detail: { reason: "abandoned" },
        })
      );
      completeAuthFlow();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isAuthFlowActive, completeAuthFlow]);

  // Monitor for stuck flows and provide additional safety mechanisms
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkInterval = setInterval(() => {
      const currentTime = Date.now();
      const stuckFlows: string[] = [];

      // Check for flows that have been running for more than 30 seconds
      flowsRef.current.forEach((flowState, flowId) => {
        const runtime = currentTime - flowState.startTime;
        if (runtime > 30000) {
          stuckFlows.push(flowId);
          console.warn(
            `LoadingContext: Flow "${flowId}" has been running for ${Math.round(runtime / 1000)}s, marking as stuck`
          );
        }
      });

      // If we have stuck flows, force complete them
      if (stuckFlows.length > 0) {
        console.warn(
          `LoadingContext: Force completing ${stuckFlows.length} stuck flows:`,
          stuckFlows
        );
        stuckFlows.forEach((flowId) => forceCompleteFlow(flowId));
      }

      // If global loading has been active for more than 45 seconds, emergency reset
      if (
        isGlobalLoading &&
        activeLoadersRef.current.size === 0 &&
        flowsRef.current.size === 0
      ) {
        console.error(
          "LoadingContext: Global loading is stuck with no active flows or loaders, performing emergency reset"
        );
        emergencyReset();
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(checkInterval);
  }, [isGlobalLoading, forceCompleteFlow, emergencyReset]);

  // Cleanup on unmount
  useEffect(() => {
    const timers = timersRef.current;
    const flowTimers = flowTimersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
      flowTimers.forEach((timer) => clearTimeout(timer));
      flowTimers.clear();
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
        startFlow,
        completeFlowStep,
        completeFlow,
        forceCompleteFlow,
        isFlowActive,
        getFlowState,
        getCurrentFlowMessage,
        clearAllFlows,
        emergencyReset,
        getActiveFlows,
      }}
    >
      {children}
      {isGlobalLoading && (
        <div className="fixed inset-0 bg-[#F8F4EC] flex flex-col items-center justify-center z-50 transition-opacity duration-300">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
          {(getCurrentFlowMessage() || loadingMessage) && (
            <p className="text-black text-lg font-medium tracking-wide lowercase">
              {getCurrentFlowMessage() || loadingMessage}
            </p>
          )}
        </div>
      )}
    </LoadingContext.Provider>
  );
};
