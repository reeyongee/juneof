"use client";

import { useEffect, useRef, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { useLoading } from "@/context/LoadingContext";
import { useCart } from "@/context/CartContext";

function PostLoginRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authIsLoading, customerData } = useAuth();
  const { ensureFreshProfileStatus, showCompletionFlow, isCompletionFlowOpen } =
    useProfileCompletion();
  const { completeAuthFlow } = useLoading();
  const { openCartOverlay, isCartOverlayOpen } = useCart();
  const processingRef = useRef(false);

  const processPostLogin = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;

    console.log("PostLoginRedirect: Starting post-login processing...");

    // 1. Get fresh profile status
    const freshStatus = await ensureFreshProfileStatus();

    // 2. Check for checkout login context
    const checkoutLoginContext = JSON.parse(
      sessionStorage.getItem("checkout-login-context") || "{}"
    );

    // 3. Decide the next step
    if (freshStatus && !freshStatus.isComplete) {
      console.log(
        "PostLoginRedirect: Profile is incomplete. Showing completion flow."
      );
      showCompletionFlow();
      // The useEffect below will handle what happens after the flow closes.
    } else {
      console.log(
        "PostLoginRedirect: Profile is complete. Checking for checkout context."
      );
      if (checkoutLoginContext.isCheckoutLogin) {
        if (!isCartOverlayOpen) {
          console.log(
            "PostLoginRedirect: Checkout login detected, opening cart overlay."
          );
          openCartOverlay();
        }
      }

      // Cleanup and finish
      completeAuthFlow();
      sessionStorage.removeItem("checkout-login-context");
      const url = new URL(window.location.href);
      url.searchParams.delete("auth_completed");
      url.searchParams.delete("t");
      router.replace(url.toString());
      processingRef.current = false;
    }
  }, [
    ensureFreshProfileStatus,
    showCompletionFlow,
    isCartOverlayOpen,
    openCartOverlay,
    completeAuthFlow,
    router,
  ]);

  // Main effect to trigger the post-login sequence
  useEffect(() => {
    const authCompleted = searchParams.get("auth_completed") === "true";

    if (
      authCompleted &&
      isAuthenticated &&
      !authIsLoading &&
      customerData &&
      !processingRef.current
    ) {
      processPostLogin();
    }
  }, [
    searchParams,
    isAuthenticated,
    authIsLoading,
    customerData,
    processPostLogin,
  ]);

  // Effect to handle the completion of the profile flow
  useEffect(() => {
    // This effect triggers when the completion flow is closed.
    if (processingRef.current && !isCompletionFlowOpen) {
      console.log(
        "PostLoginRedirect: Profile completion flow closed. Resuming post-login sequence."
      );

      const checkoutLoginContext = JSON.parse(
        sessionStorage.getItem("checkout-login-context") || "{}"
      );

      if (checkoutLoginContext.isCheckoutLogin) {
        if (!isCartOverlayOpen) {
          console.log(
            "PostLoginRedirect: Checkout login detected after completion, opening cart overlay."
          );
          openCartOverlay();
        }
      }

      // Final cleanup
      completeAuthFlow();
      sessionStorage.removeItem("checkout-login-context");
      const url = new URL(window.location.href);
      url.searchParams.delete("auth_completed");
      url.searchParams.delete("t");
      router.replace(url.toString());
      processingRef.current = false;
    }
  }, [
    isCompletionFlowOpen,
    openCartOverlay,
    isCartOverlayOpen,
    completeAuthFlow,
    router,
  ]);

  return null;
}

export default function PostLoginRedirect() {
  return (
    <Suspense fallback={null}>
      <PostLoginRedirectContent />
    </Suspense>
  );
}
