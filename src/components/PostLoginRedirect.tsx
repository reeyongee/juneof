"use client";

import { useEffect, useRef, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { useLoading } from "@/context/LoadingContext";
import { useCart } from "@/context/CartContext";

function PostLoginRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading, customerData } = useAuth();
  const { ensureFreshProfileStatus, showCompletionFlow } =
    useProfileCompletion();
  const { completeAuthFlow } = useLoading();
  const { openCartOverlay } = useCart();
  const hasRedirectedRef = useRef(false);
  const isRedirectingRef = useRef(false);
  const hasCalledEnsureFreshRef = useRef(false);
  const [waitStartTime, setWaitStartTime] = useState<number | null>(null);

  useEffect(() => {
    // Only run redirect logic if:
    // 1. User just completed authentication (auth_completed=true in URL)
    // 2. User is authenticated and not loading
    // 3. We have customer data
    // 4. We haven't already redirected
    const authCompleted = searchParams.get("auth_completed") === "true";

    // Debug: Log all URL parameters
    console.log("PostLoginRedirect: Current URL params:", {
      fullSearch: searchParams.toString(),
      authCompleted: searchParams.get("auth_completed"),
      timestamp: searchParams.get("t"),
    });

    // Add detailed logging for debugging
    if (authCompleted) {
      // Start timing if not already started
      if (waitStartTime === null) {
        setWaitStartTime(Date.now());
      }

      const waitTime = waitStartTime ? Date.now() - waitStartTime : 0;
      console.log(
        "PostLoginRedirect: Auth completed detected, checking conditions:",
        {
          authCompleted,
          isAuthenticated,
          authLoading,
          hasCustomerData: !!customerData,
          hasRedirected: hasRedirectedRef.current,
          isRedirecting: isRedirectingRef.current,
          hasCalledEnsureFresh: hasCalledEnsureFreshRef.current,
          waitTimeMs: waitTime,
        }
      );

      // Early fallback - if nothing happens after 3 seconds, complete auth flow and stay on homepage
      if (
        waitTime > 3000 &&
        waitTime <= 3100 && // Only trigger once in this window
        !hasRedirectedRef.current &&
        !isRedirectingRef.current
      ) {
        console.warn(
          "PostLoginRedirect: 3-second fallback triggered - completing auth flow and staying on homepage"
        );
        hasRedirectedRef.current = true;
        completeAuthFlow();
        return;
      }

      // If we've been waiting too long (more than 12 seconds), force complete auth flow
      if (
        waitTime > 12000 &&
        !hasRedirectedRef.current &&
        !isRedirectingRef.current
      ) {
        console.warn(
          "PostLoginRedirect: Timeout waiting for authentication state after 12 seconds, completing auth flow"
        );
        hasRedirectedRef.current = true;
        completeAuthFlow();
        return;
      }

      // If user is authenticated but we're still waiting for customerData after 7 seconds,
      // complete auth flow anyway to prevent getting stuck
      if (
        waitTime > 7000 &&
        isAuthenticated &&
        !authLoading &&
        !customerData &&
        !hasRedirectedRef.current &&
        !isRedirectingRef.current
      ) {
        console.warn(
          "PostLoginRedirect: Authenticated but no customer data after 7s, completing auth flow anyway"
        );
        hasRedirectedRef.current = true;
        completeAuthFlow();
        return;
      }

      // Let AuthContext handle the cookie race condition with its optimized retry logic
      // Just log the waiting state for debugging
      if (
        waitTime > 300 &&
        waitTime < 12000 &&
        !isAuthenticated &&
        !hasRedirectedRef.current &&
        !isRedirectingRef.current
      ) {
        console.log(
          `PostLoginRedirect: Waiting for AuthContext to detect tokens... (${waitTime}ms elapsed)`
        );
      }
    }

    if (
      authCompleted &&
      isAuthenticated &&
      !authLoading &&
      customerData &&
      !hasRedirectedRef.current &&
      !isRedirectingRef.current &&
      !hasCalledEnsureFreshRef.current
    ) {
      console.log(
        "PostLoginRedirect: All conditions met, processing auth completion"
      );
      hasRedirectedRef.current = true;
      isRedirectingRef.current = true;
      hasCalledEnsureFreshRef.current = true; // Prevent multiple calls

      // Parse checkout login context from sessionStorage (matches AuthContext storage)
      const checkoutLoginContext = JSON.parse(
        sessionStorage.getItem("checkout-login-context") || "{}"
      );

      if (checkoutLoginContext.isCheckoutLogin) {
        console.log(
          "PostLoginRedirect: Checkout login detected, staying on homepage and opening cart"
        );

        // Use fresh profile status for accurate flow decision
        ensureFreshProfileStatus().then((freshStatus) => {
          // Complete the auth flow and handle checkout login on homepage
          setTimeout(() => {
            completeAuthFlow();

            if (freshStatus?.isComplete) {
              // Flow A: Profile complete - show cart overlay on homepage
              console.log(
                "PostLoginRedirect: Profile complete, opening cart overlay on homepage"
              );

              // Clean up checkout context since we're handling it completely
              sessionStorage.removeItem("checkout-login-context");
              openCartOverlay();
            } else {
              // Flow B: Profile incomplete - show profile completion flow first
              console.log(
                "PostLoginRedirect: Profile incomplete, showing profile completion on homepage"
              );

              // DON'T clean up checkout context - let ProfileCompletionFlow handle it
              showCompletionFlow();
              // Cart will open after profile completion (handled by ProfileCompletionFlow itself)
            }
          }, 500);
        });
      } else {
        // Regular login (navbar, etc.) - stay on homepage
        console.log(
          "PostLoginRedirect: Regular login, staying on homepage and completing auth flow"
        );

        // Use fresh profile status to determine if we need profile completion
        ensureFreshProfileStatus().then((freshStatus) => {
          setTimeout(() => {
            completeAuthFlow();

            if (!freshStatus?.isComplete) {
              // Show profile completion flow on homepage for incomplete profiles
              console.log(
                "PostLoginRedirect: Profile incomplete, showing profile completion on homepage"
              );
              showCompletionFlow();
            } else {
              console.log(
                "PostLoginRedirect: Profile complete, staying on homepage"
              );
            }
          }, 500);
        });
      }
    }
  }, [
    searchParams,
    isAuthenticated,
    authLoading,
    customerData,
    waitStartTime,
    router,
    completeAuthFlow,
    ensureFreshProfileStatus,
    showCompletionFlow,
    openCartOverlay,
  ]);

  // This component doesn't render anything - loading is handled by LoadingProvider
  return null;
}

export default function PostLoginRedirect() {
  return (
    <Suspense fallback={null}>
      <PostLoginRedirectContent />
    </Suspense>
  );
}
