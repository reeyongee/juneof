"use client";

import { useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";

function PostLoginRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading, customerData } = useAuth();
  const { isProfileComplete, profileStatus } = useProfileCompletion();
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

      // Use replace instead of push to avoid back button issues
      // Add a small delay to ensure all state is settled
      setTimeout(() => {
        if (isProfileComplete) {
          // Profile is complete -> redirect to homepage
          console.log(
            "PostLoginRedirect: Profile complete, redirecting to homepage"
          );
          router.replace("/");
        } else {
          // Profile is incomplete -> redirect to dashboard (completion flow will show)
          console.log(
            "PostLoginRedirect: Profile incomplete, redirecting to dashboard"
          );
          // Redirect to clean dashboard URL without auth_completed params
          router.replace("/dashboard");
        }
      }, 100);
    }
  }, [
    searchParams,
    isAuthenticated,
    authLoading,
    customerData,
    profileStatus,
    isProfileComplete,
    router,
  ]);

  // This component doesn't render anything
  return null;
}

export default function PostLoginRedirect() {
  return (
    <Suspense fallback={null}>
      <PostLoginRedirectContent />
    </Suspense>
  );
}
