"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLoading } from "@/context/LoadingContext";
import {
  validateCallback,
  storeTokens,
  exchangeCodeForTokensServer,
  exchangeCodeForTokensServerWithCookies,
  getStoredCodeVerifier,
  type ShopifyAuthConfig,
  clearAuthStorage,
} from "@/lib/shopify-auth";

function CallbackHandlerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { startLoading, stopLoading } = useLoading();

  useEffect(() => {
    const processCallback = async () => {
      // Start global loading for the entire callback process
      startLoading("callback-handler", 2000);

      const code = searchParams.get("code");
      const state = searchParams.get("state");

      if (!code || !state) {
        console.error("Missing authorization code or state parameter");
        router.push(
          "/auth/error?error=missing_parameters&description=Authorization code or state parameter is missing"
        );
        stopLoading("callback-handler");
        return;
      }

      try {
        // Validate the callback parameters
        const isValid = validateCallback(
          `${window.location.origin}/auth/callback-handler?code=${code}&state=${state}`
        );
        if (!isValid.isValid) {
          router.push(
            "/auth/error?error=invalid_state&description=State parameter validation failed"
          );
          stopLoading("callback-handler");
          return;
        }

        // Get the stored code verifier for PKCE
        const codeVerifier = getStoredCodeVerifier();
        if (!codeVerifier) {
          console.error("Code verifier not found in storage");
          router.push(
            "/auth/error?error=missing_verifier&description=Code verifier not found"
          );
          stopLoading("callback-handler");
          return;
        }

        const config: ShopifyAuthConfig = {
          clientId: process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID!,
          shopId: process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_SHOP_ID!,
          redirectUri: `${window.location.origin}/api/auth/shopify/callback`,
          scope: "openid email customer-account-api:full",
        };

        console.log("🔄 Exchanging authorization code for tokens...");

        const useSecureCookies = process.env.NODE_ENV === "production";

        if (useSecureCookies) {
          // Use secure httpOnly cookies for production
          console.log("🍪 Using secure cookie-based authentication");
          await exchangeCodeForTokensServerWithCookies(
            code,
            codeVerifier,
            config,
            true
          );
        } else {
          // Use localStorage for development
          console.log("💾 Using localStorage-based authentication");
          const tokenResponse = await exchangeCodeForTokensServer(
            code,
            codeVerifier,
            config
          );
          storeTokens(tokenResponse);
        }

        console.log("✅ Token exchange successful");

        // Clear stored authentication parameters after successful exchange
        clearAuthStorage();

        console.log("🎉 Authentication completed successfully");

        // Dispatch custom event to notify AuthContext immediately
        if (typeof window !== "undefined") {
          console.log("🔔 Dispatching auth completion events...");
          window.dispatchEvent(new CustomEvent("shopify-auth-complete"));
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent("shopify-auth-complete"));
          }, 100);
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent("shopify-auth-complete"));
          }, 300);
        }

        // Extended delay to ensure cookies are fully processed by the browser
        // This is critical for preventing cookie race conditions with AuthContext
        setTimeout(() => {
          console.log("🔄 Cookies should be fully processed, redirecting...");
          // Redirect to homepage with auth_completed flag to trigger PostLoginRedirect
          // PostLoginRedirect component will handle the appropriate redirection based on profile completion
          router.push("/?auth_completed=true&t=" + Date.now());
        }, 500); // Increased delay to handle cookie race condition
      } catch (error) {
        console.error("❌ Authentication failed:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        router.push(
          `/auth/error?error=authentication_failed&description=${encodeURIComponent(
            errorMessage
          )}`
        );
      } finally {
        stopLoading("callback-handler");
      }
    };

    processCallback();
  }, [searchParams, router, startLoading, stopLoading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F4EC]">
      {/* The global loading overlay will handle the spinner, so we just need a minimal placeholder */}
      <div className="text-center">
        <p className="text-black text-sm opacity-50">Processing...</p>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading authentication handler...</p>
      </div>
    </div>
  );
}

export default function CallbackHandlerPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CallbackHandlerContent />
    </Suspense>
  );
}
