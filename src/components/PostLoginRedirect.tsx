"use client";

import { useEffect, useRef, useState, Suspense } from "react";
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
  const [isInRedirectPhase, setIsInRedirectPhase] = useState(false);

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
      setIsInRedirectPhase(true);

      console.log("PostLoginRedirect: Determining redirect destination", {
        isProfileComplete,
        completionPercentage: profileStatus.completionPercentage,
        missingFields: profileStatus.missingFields,
      });

      // Add a 1.2 second loading phase so users never see dashboard flash
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
      }, 1200);
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

  // Show loading screen during redirect phase to prevent dashboard flash
  if (isInRedirectPhase) {
    return (
      <div className="min-h-screen bg-[#F8F4EC] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-lg lowercase tracking-wider">
            setting up your account...
          </p>
        </div>
      </div>
    );
  }

  // This component doesn't render anything when not in redirect phase
  return null;
}

export default function PostLoginRedirect() {
  return (
    <Suspense fallback={null}>
      <PostLoginRedirectContent />
    </Suspense>
  );
}
