"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  validateCallback,
  completeAuthentication,
  storeTokens,
  type ShopifyAuthConfig,
} from "@/lib/shopify-auth";

function CallbackHandler() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get parameters from URL
        const code = searchParams.get("code");
        const state = searchParams.get("state");

        if (!code || !state) {
          setError("Missing authorization code or state parameter");
          setStatus("error");
          return;
        }

        // Validate the callback
        const validation = validateCallback(window.location.href);

        if (!validation.isValid || !validation.code) {
          setError(validation.error || "Invalid callback");
          setStatus("error");
          return;
        }

        // Get stored code verifier from localStorage
        const codeVerifier =
          typeof window !== "undefined"
            ? localStorage.getItem("shopify-auth-code-verifier")
            : null;

        if (!codeVerifier) {
          setError(
            "Code verifier not found. Please try the authentication process again."
          );
          setStatus("error");
          return;
        }

        // Create config
        const config: ShopifyAuthConfig = {
          shopId: process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_SHOP_ID || "",
          clientId:
            process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID || "",
          redirectUri: window.location.origin + "/api/auth/shopify/callback",
        };

        // Complete authentication and get tokens
        const tokens = await completeAuthentication(config, validation.code);

        // Store tokens in localStorage for persistence
        storeTokens(tokens);

        console.log("✅ Authentication successful! Tokens stored:", {
          tokenType: tokens.token_type,
          expiresIn: tokens.expires_in,
          scope: tokens.scope,
          hasRefreshToken: !!tokens.refresh_token,
        });

        setStatus("success");

        // Redirect to dashboard to see the customer data
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 2000);
      } catch (err) {
        console.error("Callback handler error:", err);
        setError(err instanceof Error ? err.message : "Authentication failed");
        setStatus("error");
      }
    };

    handleCallback();
  }, [searchParams]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Completing Authentication
          </h2>
          <p className="text-gray-600">
            Exchanging authorization code for access tokens...
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-red-600 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Failed
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-y-2">
              <Link
                href="/auth-test"
                className="block w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
              >
                Try Again
              </Link>
              <Link
                href="/"
                className="block w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 text-green-600 mb-4">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Authentication Successful!
        </h2>
        <p className="text-gray-600 mb-4">
          Redirecting back to test page to view customer data...
        </p>
      </div>
    </div>
  );
}

export default function CallbackHandlerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Loading...
            </h2>
          </div>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
