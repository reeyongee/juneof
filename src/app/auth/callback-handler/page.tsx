"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  validateCallback,
  completeAuthentication,
  storeTokens,
  type ShopifyAuthConfig,
} from "@/lib/shopify-auth";

function CallbackHandlerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState(
    "Processing Shopify authentication..."
  ); // User-facing message

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");

      // --- Parameter Validation ---
      if (!code || !state) {
        const errorMsg =
          "Essential authentication parameters (code or state) are missing from Shopify's callback.";
        console.error("ClientCallbackHandler:", errorMsg);
        router.push(
          `/auth/error?error=missing_parameters&description=${encodeURIComponent(
            errorMsg
          )}`
        );
        return;
      }

      // --- State Validation ---
      setMessage("Validating authentication state...");
      const validation = validateCallback(window.location.href);
      if (!validation.isValid || !validation.code) {
        const errorMsg =
          validation.errorDescription ||
          "Invalid authentication state or callback parameters.";
        console.error(
          "ClientCallbackHandler: State validation failed -",
          errorMsg
        );
        router.push(
          `/auth/error?error=${
            validation.error || "invalid_state"
          }&description=${encodeURIComponent(errorMsg)}`
        );
        return;
      }

      // --- Configuration Check ---
      setMessage("Configuration check...");
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
        setMessage("Exchanging authorization code for tokens...");
        // `completeAuthentication` internally retrieves 'shopify-auth-code-verifier' from localStorage
        const tokens = await completeAuthentication(
          authConfig,
          validation.code
        );
        storeTokens(tokens); // Securely store tokens

        console.log(
          "✅ ClientCallbackHandler: Token exchange successful. Tokens stored."
        );
        setMessage(
          "Authentication successful! Redirecting to your dashboard..."
        );

        // Add a signal to the dashboard URL to help AuthContext retry if needed
        const dashboardUrl = new URL("/dashboard", window.location.origin);
        dashboardUrl.searchParams.set("auth_completed", "true"); // Our signal

        // Clean the current URL of auth code/state before pushing new history state
        const cleanCurrentUrl = new URL(window.location.href);
        cleanCurrentUrl.searchParams.delete("code");
        cleanCurrentUrl.searchParams.delete("state");
        window.history.replaceState(
          {},
          document.title,
          cleanCurrentUrl.pathname
        ); // Clean current URL

        // Redirect to dashboard with the signal
        router.push(dashboardUrl.pathname + dashboardUrl.search); // Pushes /dashboard?auth_completed=true
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "An unexpected error occurred during token exchange.";
        console.error(
          "ClientCallbackHandler: Token exchange failed -",
          errorMessage
        );
        router.push(
          `/auth/error?error=invalid_grant&description=${encodeURIComponent(
            errorMessage
          )}`
        );
      }
    };

    processCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#F8F4EC] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
        <h2 className="text-xl font-serif lowercase tracking-widest text-black mb-2">
          completing authentication
        </h2>
        <p className="text-lg lowercase tracking-wider text-gray-600">
          {message}
        </p>
      </div>
    </div>
  );
}

export default function CallbackHandlerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F4EC] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <h2 className="text-xl font-serif lowercase tracking-widest text-black mb-2">
              loading authentication callback...
            </h2>
          </div>
        </div>
      }
    >
      <CallbackHandlerContent />
    </Suspense>
  );
}
