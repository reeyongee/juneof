"use client";

import { useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { useLoading } from "@/context/LoadingContext";

function PostLoginRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading, customerData } = useAuth();
  const { isProfileComplete, profileStatus } = useProfileCompletion();
  const { startLoading, stopLoading } = useLoading();
  const hasRedirectedRef = useRef(false);
  const isRedirectingRef = useRef(false);

  useEffect(() => {
    // Only run redirect logic if:
    // 1. User just completed authentication (auth_completed=true in URL)
    // 2. User is authenticated and not loading
    // 3. We have profile status data
    // 4. We haven't already redirected
    const authCompleted = searchParams.get("auth_completed") === "true";

    if (
      authCompleted &&
      isAuthenticated &&
      !authLoading &&
      customerData &&
      profileStatus &&
      !hasRedirectedRef.current &&
      !isRedirectingRef.current
    ) {
      hasRedirectedRef.current = true;
      isRedirectingRef.current = true;

      console.log("PostLoginRedirect: Determining redirect destination", {
        isProfileComplete,
        completionPercentage: profileStatus.completionPercentage,
        missingFields: profileStatus.missingFields,
      });

      if (isProfileComplete) {
        // Profile is complete -> start global loading then redirect to homepage
        console.log(
          "PostLoginRedirect: Profile complete, starting global loading then redirecting to homepage"
        );
        startLoading("post-login-complete", 1200);
        setTimeout(() => {
          stopLoading("post-login-complete");
          router.replace("/");
        }, 1200);
      } else {
        // Profile is incomplete -> start brief loading then redirect to dashboard
        console.log(
          "PostLoginRedirect: Profile incomplete, starting brief loading then redirecting to dashboard"
        );
        startLoading("post-login-incomplete", 800);
        setTimeout(() => {
          stopLoading("post-login-incomplete");
          router.replace("/dashboard");
        }, 800);
      }
    }
  }, [
    searchParams,
    isAuthenticated,
    authLoading,
    customerData,
    profileStatus,
    isProfileComplete,
    router,
    startLoading,
    stopLoading,
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
