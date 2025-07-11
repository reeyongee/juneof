"use client";

import { useEffect, useRef, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { useLoading } from "@/context/LoadingContext";

function PostLoginRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading, customerData } = useAuth();
  const { ensureFreshProfileStatus } = useProfileCompletion();
  const { completeAuthFlow } = useLoading();
  const hasRedirectedRef = useRef(false);
  const isRedirectingRef = useRef(false);
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
          waitTimeMs: waitTime,
        }
      );

      // Early fallback - if nothing happens after 3 seconds, redirect to dashboard optimistically
      if (
        waitTime > 3000 &&
        waitTime <= 3100 && // Only trigger once in this window
        !hasRedirectedRef.current &&
        !isRedirectingRef.current
      ) {
        console.warn(
          "PostLoginRedirect: 3-second fallback triggered - redirecting to dashboard optimistically"
        );
        hasRedirectedRef.current = true;
        completeAuthFlow();
        router.replace("/dashboard");
        return;
      }

      // If we've been waiting too long (more than 12 seconds), force redirect to homepage
      if (
        waitTime > 12000 &&
        !hasRedirectedRef.current &&
        !isRedirectingRef.current
      ) {
        console.warn(
          "PostLoginRedirect: Timeout waiting for authentication state after 12 seconds, redirecting to homepage"
        );
        hasRedirectedRef.current = true;
        completeAuthFlow();
        router.replace("/?auth_timeout=true");
        return;
      }

      // If user is authenticated but we're still waiting for customerData after 7 seconds,
      // redirect anyway to prevent getting stuck
      if (
        waitTime > 7000 &&
        isAuthenticated &&
        !authLoading &&
        !customerData &&
        !hasRedirectedRef.current &&
        !isRedirectingRef.current
      ) {
        console.warn(
          "PostLoginRedirect: Authenticated but no customer data after 7s, redirecting to dashboard anyway"
        );
        hasRedirectedRef.current = true;
        completeAuthFlow();
        router.replace("/dashboard");
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
      !isRedirectingRef.current
    ) {
      console.log("PostLoginRedirect: All conditions met, processing redirect");
      hasRedirectedRef.current = true;
      isRedirectingRef.current = true;

      // Parse checkout login context from localStorage
      const checkoutLoginContext = JSON.parse(
        localStorage.getItem("checkoutLoginContext") || "{}"
      );

      if (checkoutLoginContext.isCheckoutLogin) {
        console.log(
          "PostLoginRedirect: Checkout login detected, redirecting to product page"
        );

        // Use fresh profile status for accurate redirect decision
        ensureFreshProfileStatus().then((freshStatus) => {
          // Complete the auth flow and redirect to product page with appropriate context
          setTimeout(() => {
            completeAuthFlow();
            const productUrl = `/product/${checkoutLoginContext.lastAddedProductHandle}`;
            const urlParams = new URLSearchParams();

            if (freshStatus?.isComplete) {
              // Flow A: Profile complete - show cart overlay
              urlParams.append("checkout_login_complete", "true");
              urlParams.append("open_cart", "true");
            } else {
              // Flow B: Profile incomplete - show profile completion flow
              urlParams.append("checkout_login_incomplete", "true");
              urlParams.append("show_profile_completion", "true");
            }

            router.replace(`${productUrl}?${urlParams.toString()}`);
          }, 500);
        });
      } else {
        // Regular login - redirect to dashboard
        console.log(
          "PostLoginRedirect: Regular login, redirecting to dashboard",
          {
            isAuthenticated,
            authLoading,
            hasCustomerData: !!customerData,
            customerName:
              customerData.customer.displayName ||
              customerData.customer.firstName,
          }
        );

        // Complete the auth flow and redirect to dashboard
        setTimeout(() => {
          completeAuthFlow();
          router.replace("/dashboard");
        }, 500);
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
