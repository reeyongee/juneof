"use client";

import { useState, useEffect, useCallback } from "react";
import {
  initiateShopifyAuth,
  validateCallback,
  clearAuthStorage,
  completeAuthentication,
  refreshAccessToken,
  storeTokens,
  getStoredTokens,
  clearStoredTokens,
  isTokenExpired,
  autoRefreshTokens,
  type ShopifyAuthConfig,
  type AccessTokenResponse,
  type TokenStorage,
} from "@/lib/shopify-auth";

interface ShopifyAuthProps {
  config: ShopifyAuthConfig;
  onAuthSuccess?: (data: {
    code: string;
    tokens?: AccessTokenResponse;
  }) => void;
  onAuthError?: (error: { error: string; errorDescription?: string }) => void;
  autoExchangeTokens?: boolean; // Whether to automatically exchange code for tokens
}

export default function ShopifyAuth({
  config,
  onAuthSuccess,
  onAuthError,
  autoExchangeTokens = false,
}: ShopifyAuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<
    "idle" | "authenticating" | "success" | "error" | "exchanging_tokens"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [tokens, setTokens] = useState<AccessTokenResponse | null>(null);
  const [storedTokens, setStoredTokens] = useState<TokenStorage | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check for stored tokens on component mount
  useEffect(() => {
    const stored = getStoredTokens();
    if (stored) {
      setStoredTokens(stored);
      setAuthStatus("success");
    }
  }, []);

  // Check for callback parameters on component mount
  const checkCallback = useCallback(() => {
    const currentUrl = window.location.href;
    const urlParams = new URLSearchParams(window.location.search);

    // Check if this is a callback from Shopify
    if (urlParams.has("code") || urlParams.has("error")) {
      const validation = validateCallback(currentUrl);

      if (validation.isValid && validation.code) {
        const authCode = validation.code; // Extract to ensure type safety

        if (autoExchangeTokens) {
          // Automatically exchange code for tokens
          setAuthStatus("exchanging_tokens");

          completeAuthentication(config, authCode)
            .then((tokenResponse) => {
              setAuthStatus("success");
              setTokens(tokenResponse);

              // Store tokens for future use
              storeTokens(tokenResponse);
              setStoredTokens(getStoredTokens());

              onAuthSuccess?.({
                code: authCode,
                tokens: tokenResponse,
              });
            })
            .catch((tokenError) => {
              setAuthStatus("error");
              setError(tokenError.message);
              onAuthError?.({
                error: "token_exchange_failed",
                errorDescription: tokenError.message,
              });
            });
        } else {
          // Just return the code without exchanging
          setAuthStatus("success");
          onAuthSuccess?.({ code: authCode });
        }

        // Clean up URL parameters
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("code");
        cleanUrl.searchParams.delete("state");
        window.history.replaceState({}, document.title, cleanUrl.toString());

        // Clear stored auth parameters (only if not auto-exchanging, as completeAuthentication handles this)
        if (!autoExchangeTokens) {
          clearAuthStorage();
        }
      } else {
        setAuthStatus("error");
        setError(
          validation.errorDescription ||
            validation.error ||
            "Authentication failed"
        );
        onAuthError?.({
          error: validation.error || "unknown_error",
          errorDescription: validation.errorDescription,
        });
      }
    }
  }, [config, autoExchangeTokens, onAuthSuccess, onAuthError]);

  useEffect(() => {
    checkCallback();
  }, [checkCallback]);

  const handleLogin = async (options?: {
    prompt?: "none";
    locale?: string;
  }) => {
    try {
      setIsLoading(true);
      setAuthStatus("authenticating");
      setError(null);

      await initiateShopifyAuth(config, options);
    } catch (err) {
      setIsLoading(false);
      setAuthStatus("error");
      setError(err instanceof Error ? err.message : "Authentication failed");
      onAuthError?.({
        error: "auth_initiation_failed",
        errorDescription:
          err instanceof Error
            ? err.message
            : "Failed to initiate authentication",
      });
    }
  };

  const handleSilentLogin = () => {
    handleLogin({ prompt: "none" });
  };

  const handleLogout = () => {
    clearAuthStorage();
    clearStoredTokens();
    setAuthStatus("idle");
    setError(null);
    setTokens(null);
    setStoredTokens(null);
  };

  const handleRefreshToken = async () => {
    if (!storedTokens?.refreshToken) {
      setError("No refresh token available");
      return;
    }

    setIsRefreshing(true);
    setError(null);

    try {
      const refreshedTokens = await refreshAccessToken(
        config,
        storedTokens.refreshToken
      );

      // Store the new tokens
      storeTokens(refreshedTokens);
      const newStoredTokens = getStoredTokens();
      setStoredTokens(newStoredTokens);

      console.log("Tokens refreshed successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Token refresh failed";
      setError(errorMessage);
      console.error("Token refresh failed:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAutoRefresh = async () => {
    if (!storedTokens) {
      setError("No stored tokens available");
      return;
    }

    setIsRefreshing(true);
    setError(null);

    try {
      const refreshedTokens = await autoRefreshTokens(config);
      if (refreshedTokens) {
        setStoredTokens(refreshedTokens);
        console.log("Tokens auto-refreshed successfully");
      } else {
        setError("Auto refresh failed - no refresh token available");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Auto refresh failed";
      setError(errorMessage);
      console.error("Auto refresh failed:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusMessage = () => {
    switch (authStatus) {
      case "authenticating":
        return "Redirecting to Shopify...";
      case "exchanging_tokens":
        return "Exchanging authorization code for tokens...";
      case "success":
        return tokens
          ? "Authentication successful! Tokens received."
          : "Authentication successful! Authorization code received.";
      case "error":
        return `Authentication failed: ${error}`;
      default:
        return "Ready to authenticate";
    }
  };

  const getStatusColor = () => {
    switch (authStatus) {
      case "authenticating":
      case "exchanging_tokens":
        return "text-blue-600";
      case "success":
        return "text-green-600";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center">
        Shopify Customer Authentication
      </h2>

      <div className="mb-4">
        <div className="text-sm text-gray-500 mb-2">Configuration:</div>
        <div className="bg-gray-50 p-3 rounded text-xs">
          <div>
            <strong>Shop ID:</strong> {config.shopId}
          </div>
          <div>
            <strong>Client ID:</strong> {config.clientId.substring(0, 8)}...
          </div>
          <div>
            <strong>Redirect URI:</strong> {config.redirectUri}
          </div>
          <div>
            <strong>Scope:</strong>{" "}
            {config.scope || "openid email customer-account-api:full"}
          </div>
        </div>
      </div>

      <div className={`mb-4 p-3 rounded ${getStatusColor()} bg-gray-50`}>
        <div className="font-medium">Status: {authStatus}</div>
        <div className="text-sm">{getStatusMessage()}</div>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => handleLogin()}
          disabled={
            isLoading ||
            authStatus === "authenticating" ||
            authStatus === "exchanging_tokens"
          }
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Redirecting..." : "Login with Shopify"}
        </button>

        <button
          onClick={handleSilentLogin}
          disabled={
            isLoading ||
            authStatus === "authenticating" ||
            authStatus === "exchanging_tokens"
          }
          className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Silent Login (No Prompt)
        </button>

        {authStatus === "success" && (
          <>
            {storedTokens?.refreshToken && (
              <>
                <button
                  onClick={handleRefreshToken}
                  disabled={isRefreshing}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRefreshing ? "Refreshing..." : "Refresh Token"}
                </button>

                <button
                  onClick={handleAutoRefresh}
                  disabled={isRefreshing}
                  className="w-full bg-yellow-600 text-white py-2 px-4 rounded hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRefreshing ? "Refreshing..." : "Auto Refresh (if needed)"}
                </button>
              </>
            )}

            <button
              onClick={handleLogout}
              className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
            >
              Clear Authentication
            </button>
          </>
        )}
      </div>

      {tokens && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
          <h3 className="text-sm font-medium text-green-800 mb-2">
            🎉 Access Tokens Received
          </h3>
          <div className="text-xs text-green-700 space-y-1">
            <div>
              <strong>Token Type:</strong> {tokens.token_type}
            </div>
            <div>
              <strong>Expires In:</strong> {tokens.expires_in} seconds
            </div>
            <div>
              <strong>Scope:</strong> {tokens.scope}
            </div>
            <div>
              <strong>Access Token:</strong>{" "}
              {tokens.access_token.substring(0, 20)}...
            </div>
            {tokens.refresh_token && (
              <div>
                <strong>Refresh Token:</strong>{" "}
                {tokens.refresh_token.substring(0, 20)}...
              </div>
            )}
            {tokens.id_token && (
              <div>
                <strong>ID Token:</strong> {tokens.id_token.substring(0, 20)}...
              </div>
            )}
          </div>
        </div>
      )}

      {storedTokens && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="text-sm font-medium text-blue-800 mb-2">
            💾 Stored Tokens
          </h3>
          <div className="text-xs text-blue-700 space-y-1">
            <div>
              <strong>Token Type:</strong> {storedTokens.tokenType}
            </div>
            <div>
              <strong>Expires In:</strong> {storedTokens.expiresIn} seconds
            </div>
            <div>
              <strong>Issued At:</strong>{" "}
              {new Date(storedTokens.issuedAt).toLocaleString()}
            </div>
            <div>
              <strong>Expires At:</strong>{" "}
              {new Date(
                storedTokens.issuedAt + storedTokens.expiresIn * 1000
              ).toLocaleString()}
            </div>
            <div>
              <strong>Is Expired:</strong>{" "}
              {isTokenExpired(storedTokens.expiresIn, storedTokens.issuedAt)
                ? "🔴 Yes (or expires soon)"
                : "🟢 No"}
            </div>
            <div>
              <strong>Scope:</strong> {storedTokens.scope}
            </div>
            <div>
              <strong>Access Token:</strong>{" "}
              {storedTokens.accessToken.substring(0, 20)}...
            </div>
            {storedTokens.refreshToken && (
              <div>
                <strong>Refresh Token:</strong>{" "}
                {storedTokens.refreshToken.substring(0, 20)}...
              </div>
            )}
            {storedTokens.idToken && (
              <div>
                <strong>ID Token:</strong>{" "}
                {storedTokens.idToken.substring(0, 20)}...
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 text-xs text-gray-500">
        <div className="font-medium mb-2">How it works:</div>
        <ol className="list-decimal list-inside space-y-1">
          <li>Click &quot;Login with Shopify&quot; to start OAuth flow</li>
          <li>You&apos;ll be redirected to Shopify&apos;s login page</li>
          <li>
            After login, you&apos;ll be redirected back with an authorization
            code
          </li>
          <li>The code can be exchanged for access tokens</li>
        </ol>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <div className="font-medium mb-1">Security Features:</div>
        <ul className="list-disc list-inside space-y-1">
          <li>PKCE (Proof Key for Code Exchange) for public clients</li>
          <li>State parameter for CSRF protection</li>
          <li>Nonce parameter for replay attack prevention</li>
          <li>Secure random parameter generation</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Example usage component
 */
export function ShopifyAuthExample() {
  const authConfig: ShopifyAuthConfig = {
    shopId: process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_SHOP_ID || "your-shop-id",
    clientId:
      process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID ||
      "shp_your-client-id",
    redirectUri:
      process.env.NEXTAUTH_URL + "/api/auth/shopify/callback" ||
      "http://localhost:3000/api/auth/shopify/callback",
    scope: "openid email customer-account-api:full",
    locale: "en",
  };

  const handleAuthSuccess = (data: {
    code: string;
    tokens?: AccessTokenResponse;
  }) => {
    console.log("Authentication successful! Authorization code:", data.code);

    if (data.tokens) {
      console.log("Tokens received:", {
        tokenType: data.tokens.token_type,
        expiresIn: data.tokens.expires_in,
        scope: data.tokens.scope,
        hasRefreshToken: !!data.tokens.refresh_token,
        hasIdToken: !!data.tokens.id_token,
      });

      // In a real app, you would now:
      // 1. Store tokens securely (encrypted, HTTP-only cookies)
      // 2. Set up automatic token refresh
      // 3. Make authenticated requests to Customer Account API
    } else {
      // Manual token exchange example:
      /*
      fetch('/api/auth/shopify/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: data.code,
          state: 'your-state-value',
          codeVerifier: 'your-stored-code-verifier'
        }),
      })
      .then(response => response.json())
      .then(tokenData => {
        console.log('Tokens received:', tokenData);
        // Handle successful token exchange
      })
      .catch(error => {
        console.error('Token exchange failed:', error);
      });
      */
    }
  };

  const handleAuthError = (error: {
    error: string;
    errorDescription?: string;
  }) => {
    console.error("Authentication failed:", error);
    // Handle authentication error
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">
          Mode 1: Manual Token Exchange
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Receives authorization code only. You handle token exchange manually
          (recommended for production).
        </p>
        <ShopifyAuth
          config={authConfig}
          onAuthSuccess={handleAuthSuccess}
          onAuthError={handleAuthError}
          autoExchangeTokens={false}
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">
          Mode 2: Automatic Token Exchange
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Automatically exchanges authorization code for tokens client-side (for
          testing/demo purposes).
        </p>
        <ShopifyAuth
          config={authConfig}
          onAuthSuccess={handleAuthSuccess}
          onAuthError={handleAuthError}
          autoExchangeTokens={true}
        />
      </div>
    </div>
  );
}
