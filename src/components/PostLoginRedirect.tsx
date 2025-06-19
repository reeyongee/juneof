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

      // Always redirect to dashboard after successful login
      console.log(
        "PostLoginRedirect: Authentication successful, redirecting to dashboard",
        {
          isProfileComplete,
          completionPercentage: profileStatus.completionPercentage,
          missingFields: profileStatus.missingFields,
        }
      );
      startLoading("post-login-redirect", 800);
      setTimeout(() => {
        stopLoading("post-login-redirect");
        router.replace("/dashboard");
      }, 800);
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
