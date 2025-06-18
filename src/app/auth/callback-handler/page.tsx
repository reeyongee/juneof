"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLoading } from "@/context/LoadingContext";
import {
  validateCallback,
  completeAuthentication,
  storeTokens,
  type ShopifyAuthConfig,
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

      // --- Parameter Validation ---
      if (!code || !state) {
        const errorMsg =
          "Essential authentication parameters (code or state) are missing from Shopify's callback.";
        console.error("ClientCallbackHandler:", errorMsg);
        stopLoading("callback-handler");
        router.push(
          `/auth/error?error=missing_parameters&description=${encodeURIComponent(
            errorMsg
          )}`
        );
        return;
      }

      // --- State Validation ---
      const validation = validateCallback(window.location.href);
      if (!validation.isValid || !validation.code) {
        const errorMsg =
          validation.errorDescription ||
          "Invalid authentication state or callback parameters.";
        console.error(
          "ClientCallbackHandler: State validation failed -",
          errorMsg
        );
        stopLoading("callback-handler");
        router.push(
          `/auth/error?error=${
            validation.error || "invalid_state"
          }&description=${encodeURIComponent(errorMsg)}`
        );
        return;
      }

      // --- Configuration Check ---
      // On Vercel, NEXTAUTH_URL might not be available on client side since it's not NEXT_PUBLIC_
      // Use window.location.origin as fallback for client-side operations
      const appBaseUrl =
        process.env.NEXTAUTH_URL ||
        (typeof window !== "undefined"
          ? window.location.origin
          : "https://dev.juneof.com");
      const shopId = process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_SHOP_ID;
      const clientId =
        process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID;

      console.log("CallbackHandler: Environment check", {
        appBaseUrl: appBaseUrl ? "✓" : "✗",
        shopId: shopId ? "✓" : "✗",
        clientId: clientId ? "✓" : "✗",
        isClient: typeof window !== "undefined",
      });

      if (!appBaseUrl || !shopId || !clientId) {
        const errorMsg =
          "Client-side application configuration error: NEXTAUTH_URL, Shopify Shop ID, or Client ID is missing.";
        console.error("ClientCallbackHandler:", errorMsg, {
          appBaseUrl: appBaseUrl ? "✓" : "✗",
          shopId: shopId ? "✓" : "✗",
          clientId: clientId ? "✓" : "✗",
        });
        stopLoading("callback-handler");
        router.push(
          `/auth/error?error=server_configuration&description=${encodeURIComponent(
            errorMsg
          )}`
        );
        return;
      }

      const authConfig: ShopifyAuthConfig = {
        shopId,
        clientId,
        redirectUri: `${appBaseUrl}/api/auth/shopify/callback`, // This MUST match exactly what's in Shopify app config
      };

      // --- Token Exchange ---
      try {
        // `completeAuthentication` internally retrieves 'shopify-auth-code-verifier' from localStorage
        const tokens = await completeAuthentication(
          authConfig,
          validation.code
        );
        storeTokens(tokens); // Securely store tokens

        console.log(
          "✅ ClientCallbackHandler: Token exchange successful. Tokens stored."
        );

        // Dispatch custom event to notify AuthContext immediately
        window.dispatchEvent(new CustomEvent("shopify-auth-complete"));
        console.log(
          "ClientCallbackHandler: Dispatched shopify-auth-complete event"
        );

        // Add a small delay to ensure tokens are fully stored before redirect
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Add a signal and timestamp to the dashboard URL to help AuthContext retry if needed
        const dashboardUrl = new URL("/dashboard", window.location.origin);
        dashboardUrl.searchParams.set("auth_completed", "true"); // Our signal
        dashboardUrl.searchParams.set("t", Date.now().toString()); // Timestamp for freshness

        // Clean the current URL of auth code/state before pushing new history state
        const cleanCurrentUrl = new URL(window.location.href);
        cleanCurrentUrl.searchParams.delete("code");
        cleanCurrentUrl.searchParams.delete("state");
        window.history.replaceState(
          {},
          document.title,
          cleanCurrentUrl.pathname
        ); // Clean current URL

        // Stop loading and redirect to dashboard with the signal and timestamp
        stopLoading("callback-handler");
        router.push(dashboardUrl.pathname + dashboardUrl.search); // Pushes /dashboard?auth_completed=true&t=timestamp
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "An unexpected error occurred during token exchange.";
        console.error(
          "ClientCallbackHandler: Token exchange failed -",
          errorMessage
        );
        stopLoading("callback-handler");
        router.push(
          `/auth/error?error=invalid_grant&description=${encodeURIComponent(
            errorMessage
          )}`
        );
      }
    };

    processCallback();
  }, [searchParams, router, startLoading, stopLoading]);

  // This component doesn't render anything - loading is handled by LoadingProvider
  return null;
}

export default function CallbackHandlerPage() {
  return (
    <Suspense fallback={null}>
      <CallbackHandlerContent />
    </Suspense>
  );
}
