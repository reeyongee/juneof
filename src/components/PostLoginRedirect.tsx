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
  const { ensureFreshProfileStatus, showCompletionFlow } =
    useProfileCompletion();
  const { completeAuthFlow } = useLoading();
  const { openCartOverlay } = useCart();
  const processingRef = useRef(false);

  // This is the core logic that orchestrates the entire post-login sequence
  const processPostLogin = useCallback(async () => {
    // 1. Gatekeeper: Ensure this complex logic runs only once per login.
    if (processingRef.current) return;
    processingRef.current = true;

    console.log("PostLoginRedirect: Starting post-login processing...");

    // 2. Consume the Trigger: Immediately read and clear the checkout context.
    // This is the most critical step to prevent re-triggering.
    const checkoutContextString = sessionStorage.getItem(
      "checkout-login-context"
    );
    const checkoutContext = checkoutContextString
      ? JSON.parse(checkoutContextString)
      : {};
    sessionStorage.removeItem("checkout-login-context");
    console.log(
      "PostLoginRedirect: Consumed and cleared checkout context:",
      checkoutContext
    );

    // 3. Get Fresh Data: Ensure we have the latest profile status.
    const freshStatus = await ensureFreshProfileStatus();

    // 4. Decision Point
    if (freshStatus && !freshStatus.isComplete) {
      // Flow A: Profile is incomplete.
      console.log(
        "PostLoginRedirect: Profile incomplete. Showing completion flow."
      );
      // Pass the consumed context to the flow via a new session storage item
      // that the completion flow itself will manage and clean up.
      sessionStorage.setItem(
        "post-login-context",
        JSON.stringify(checkoutContext)
      );
      showCompletionFlow();
      // This component's job is done for now. The ProfileCompletionFlow will take over.
    } else {
      // Flow B: Profile is complete.
      console.log(
        "PostLoginRedirect: Profile is complete. Checking for checkout context."
      );
      if (checkoutContext.isCheckoutLogin) {
        console.log(
          "PostLoginRedirect: Checkout login detected, opening cart overlay."
        );
        openCartOverlay();
      }
      // Finalize the process.
      completeAuthFlow();
      const url = new URL(window.location.href);
      url.searchParams.delete("auth_completed");
      url.searchParams.delete("t");
      router.replace(url.toString());
      processingRef.current = false; // Reset for any future logins.
    }
  }, [
    ensureFreshProfileStatus,
    showCompletionFlow,
    openCartOverlay,
    completeAuthFlow,
    router,
  ]);

  // Main effect to trigger the sequence
  useEffect(() => {
    const authCompleted = searchParams.get("auth_completed") === "true";
    if (authCompleted && isAuthenticated && !authIsLoading && customerData) {
      processPostLogin();
    }
  }, [
    searchParams,
    isAuthenticated,
    authIsLoading,
    customerData,
    processPostLogin,
  ]);

  // This component renders nothing itself.
  return null;
}

export default function PostLoginRedirect() {
  return (
    <Suspense fallback={null}>
      <PostLoginRedirectContent />
    </Suspense>
  );
}
