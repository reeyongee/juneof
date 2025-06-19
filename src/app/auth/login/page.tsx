"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLoading } from "@/context/LoadingContext";
import {
  initiateShopifyAuth,
  type ShopifyAuthConfig,
} from "@/lib/shopify-auth";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { startLoading, stopLoading } = useLoading();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Get error details from URL if redirected from error page
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("description");

  const handleLogin = useCallback(async () => {
    if (isLoggingIn) return;

    setIsLoggingIn(true);
    startLoading("shopify-auth", 3000);

    try {
      const config: ShopifyAuthConfig = {
        clientId: process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID!,
        shopId: process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_SHOP_ID!,
        redirectUri: `${window.location.origin}/api/auth/shopify/callback`,
        scope: "openid email customer-account-api:full",
      };

      console.log("🔐 Initiating Shopify Customer Account authentication...");

      // This will redirect to Shopify's login page
      await initiateShopifyAuth(config);
    } catch (error) {
      console.error("❌ Login initiation failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      router.push(
        `/auth/error?error=login_failed&description=${encodeURIComponent(
          errorMessage
        )}`
      );
    } finally {
      setIsLoggingIn(false);
      stopLoading("shopify-auth");
    }
  }, [isLoggingIn, startLoading, stopLoading, router]);

  useEffect(() => {
    // Auto-retry login if coming from an error page (optional)
    if (
      error === "authentication_failed" &&
      errorDescription?.includes("Load failed")
    ) {
      console.log("🔄 Auto-retrying login after Safari CORS error...");
      // Small delay to let user see the page, then auto-retry
      setTimeout(() => {
        if (!isLoggingIn) {
          handleLogin();
        }
      }, 2000);
    }
  }, [error, errorDescription, isLoggingIn, handleLogin]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Welcome to Juneof
          </CardTitle>
          <CardDescription>
            Sign in to your customer account to view orders, manage your
            profile, and more.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Show error message if present */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Authentication Error
                  </h3>
                  {errorDescription && (
                    <div className="mt-2 text-sm text-red-700">
                      {decodeURIComponent(errorDescription)}
                    </div>
                  )}
                  {error === "authentication_failed" &&
                    errorDescription?.includes("Load failed") && (
                      <div className="mt-2 text-sm text-red-700">
                        <p className="font-medium">
                          Safari detected - using improved authentication method
                        </p>
                        <p>
                          We&apos;ll automatically retry your login in a
                          moment...
                        </p>
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full"
            size="lg"
          >
            {isLoggingIn ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Connecting to Shopify...
              </>
            ) : (
              "Sign In with Shopify"
            )}
          </Button>

          <div className="text-center text-sm text-gray-600">
            <p>You&apos;ll be redirected to Shopify to securely sign in</p>
            <p className="mt-1 text-xs text-gray-500">
              By signing in, you agree to our terms of service and privacy
              policy
            </p>
          </div>

          {/* Browser compatibility notice for Safari users */}
          <div className="text-center">
            <details className="text-xs text-gray-500">
              <summary className="cursor-pointer hover:text-gray-700">
                Having trouble signing in?
              </summary>
              <div className="mt-2 text-left space-y-1">
                <p>• Make sure you have a stable internet connection</p>
                <p>• Try refreshing the page</p>
                <p>
                  • Safari users: We&apos;ve implemented special compatibility
                  measures
                </p>
                <p>• If issues persist, try using Chrome or Firefox</p>
              </div>
            </details>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LoginLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
          </div>
          <CardTitle className="text-2xl font-bold">Loading...</CardTitle>
          <CardDescription>Preparing your login experience</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoadingFallback />}>
      <LoginContent />
    </Suspense>
  );
}
