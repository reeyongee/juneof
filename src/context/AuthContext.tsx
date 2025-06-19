"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import { useLoading } from "@/context/LoadingContext";

import {
  getTokensUnified,
  autoRefreshTokens,
  CustomerAccountApiClient,
  initiateShopifyAuth,
  clearStoredTokens,
  clearTokenCookiesServer,
  clearAuthStorage,
  type ShopifyAuthConfig,
  type TokenStorage,
  type GraphQLResponse,
} from "@/lib/shopify-auth";

// Define a clear structure for the customer profile data
interface CustomerProfileData {
  customer: {
    id: string;
    displayName: string;
    firstName?: string;
    lastName?: string;
    emailAddress?: { emailAddress: string };
    phoneNumber?: {
      phoneNumber: string;
    };
    defaultAddress?: {
      address1?: string;
      address2?: string;
      city?: string;
      territoryCode?: string;
      zoneCode?: string;
      zip?: string;
      phoneNumber?: string;
    };
  };
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean; // True during initial auth check, login, or data fetch
  customerData: CustomerProfileData | null;
  tokens: TokenStorage | null;
  apiClient: CustomerAccountApiClient | null;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  fetchCustomerData: () => Promise<void>; // Allows manual refresh/fetch
  refreshCustomerData: () => Promise<void>; // Alias for backward compatibility
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const router = useRouter();
  const { startAuthFlow, completeAuthFlow } = useLoading();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Key: Start true
  const [customerData, setCustomerData] = useState<CustomerProfileData | null>(
    null
  );
  const [tokens, setTokens] = useState<TokenStorage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiClient, setApiClient] = useState<CustomerAccountApiClient | null>(
    null
  );

  const shopifyAuthConfig: ShopifyAuthConfig = useMemo(() => {
    // On Vercel, NEXTAUTH_URL might not be available on client side since it's not NEXT_PUBLIC_
    // Use window.location.origin as fallback for client-side operations
    const appBaseUrl =
      process.env.NEXTAUTH_URL ||
      (typeof window !== "undefined"
        ? window.location.origin
        : "https://dev.juneof.com");
    const shopId = process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_SHOP_ID;
    const clientId = process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID;

    console.log("AuthContext: Environment check", {
      appBaseUrl: appBaseUrl ? "✓" : "✗",
      shopId: shopId ? "✓" : "✗",
      clientId: clientId ? "✓" : "✗",
      isClient: typeof window !== "undefined",
    });

    if (!appBaseUrl || !shopId || !clientId) {
      console.error(
        "AuthContext FATAL: Critical environment variables (NEXTAUTH_URL, Shopify IDs) are missing. Authentication will fail.",
        {
          appBaseUrl: appBaseUrl ? "✓" : "✗",
          shopId: shopId ? "✓" : "✗",
          clientId: clientId ? "✓" : "✗",
        }
      );
    }

    // Use window.location.origin when available (client-side), fallback for SSR
    const getRedirectUri = () => {
      if (typeof window !== "undefined") {
        return window.location.origin + "/api/auth/shopify/callback";
      }
      // Fallback for server-side rendering
      return appBaseUrl + "/api/auth/shopify/callback";
    };

    return {
      shopId: shopId || "error-shop-id-not-set",
      clientId: clientId || "error-client-id-not-set",
      redirectUri: getRedirectUri(),
      scope: "openid email customer-account-api:full", // Define required scopes
    };
  }, []);

  // Store appBaseUrl separately for validation - use same logic as above
  const appBaseUrl =
    process.env.NEXTAUTH_URL ||
    (typeof window !== "undefined"
      ? window.location.origin
      : "https://dev.juneof.com");

  const logout = useCallback(async () => {
    console.log("AuthContext: LOGOUT called");

    // Get current tokens BEFORE clearing them to check if we have an id_token for Shopify logout
    const currentTokens = await getTokensUnified();
    console.log(
      "AuthContext: LOGOUT - Current tokens:",
      currentTokens ? "FOUND" : "NULL",
      currentTokens?.idToken ? "with id_token" : "no id_token"
    );

    // If we have an id_token, redirect to Shopify's logout endpoint first
    // This will clear Shopify's session completely
    if (currentTokens?.idToken) {
      console.log(
        "AuthContext: LOGOUT - Redirecting to Shopify logout endpoint"
      );

      // Clear local storage and cookies BEFORE redirecting
      clearAuthStorage();
      clearStoredTokens();

      // Clear cookies in production
      if (process.env.NODE_ENV === "production") {
        await clearTokenCookiesServer();
      }

      // Clear local state
      setIsAuthenticated(false);
      setCustomerData(null);
      setTokens(null);
      setApiClient(null);
      setError(null);
      setIsLoading(false);

      // Create Shopify logout URL
      const logoutUrl = new URL(
        `https://shopify.com/authentication/${shopifyAuthConfig.shopId}/logout`
      );

      // Add required id_token_hint parameter
      logoutUrl.searchParams.append("id_token_hint", currentTokens.idToken);

      // Add post_logout_redirect_uri to come back to our app
      const postLogoutRedirectUri = `${appBaseUrl}/?shopify_logout=true`;
      logoutUrl.searchParams.append(
        "post_logout_redirect_uri",
        postLogoutRedirectUri
      );

      console.log(
        "AuthContext: LOGOUT - Shopify logout URL:",
        logoutUrl.toString()
      );

      // Redirect to Shopify logout endpoint
      window.location.href = logoutUrl.toString();
      return; // Don't redirect to homepage yet, let Shopify handle the redirect
    } else {
      console.log(
        "AuthContext: LOGOUT - No id_token found, performing local logout only"
      );

      // Clear local storage and cookies
      clearAuthStorage();
      clearStoredTokens();

      // Clear cookies in production
      if (process.env.NODE_ENV === "production") {
        await clearTokenCookiesServer();
      }

      // Clear local state
      setIsAuthenticated(false);
      setCustomerData(null);
      setTokens(null);
      setApiClient(null);
      setError(null);
      setIsLoading(false);

      // If no id_token, just redirect to homepage
      router.push("/");
    }
  }, [router, shopifyAuthConfig.shopId, appBaseUrl]);

  // Internal function to fetch data and handle token refresh
  const _internalFetchAndSetCustomerData = useCallback(
    async (
      currentClient: CustomerAccountApiClient, // Expect client to be passed
      currentTokensPassed: TokenStorage // Expect tokens to be passed
    ) => {
      console.log("AuthContext: _internalFetchAndSetCustomerData - START");
      // setIsLoading(true); // isLoading should be managed by the caller (initializeAuth or fetchCustomerData)
      setError(null);
      try {
        const refreshedTokens = await autoRefreshTokens(
          shopifyAuthConfig,
          false,
          process.env.NODE_ENV === "production"
        );

        if (refreshedTokens) {
          console.log(
            "AuthContext: _internal - Tokens refreshed successfully",
            refreshedTokens
          );
          setTokens(refreshedTokens);
          currentClient.updateAccessToken(refreshedTokens.accessToken);
        } else {
          console.log(
            "AuthContext: _internal - Using existing tokens",
            currentTokensPassed
          );
        }

        const response =
          (await currentClient.getCustomerProfile()) as GraphQLResponse<CustomerProfileData>;
        console.log(
          "AuthContext: _internal - Customer profile API response",
          response
        );

        if (response.errors && response.errors.length > 0) {
          throw new Error(
            `GraphQL Error in _internalFetch: ${response.errors[0].message}`
          );
        }
        if (response.data) {
          setCustomerData(response.data);
          console.log(
            "AuthContext: _internal - Customer data set",
            response.data
          );
        } else {
          setCustomerData(null);
          console.warn(
            "AuthContext: _internal - No customer data in response."
          );
        }
      } catch (err) {
        console.error(
          "AuthContext: _internal - Error fetching/refreshing customer data:",
          err
        );
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch customer data.";
        setError(errorMessage);
        if (
          errorMessage.includes("invalid_grant") ||
          errorMessage.includes("invalid_token") ||
          errorMessage.includes("expired")
        ) {
          console.warn(
            "AuthContext: _internal - Invalid/expired token detected. Logging out."
          );
          logout();
        }
        throw err; // Re-throw so caller knows about the error
      } finally {
        // setIsLoading(false); // isLoading should be managed by the caller
        console.log("AuthContext: _internalFetchAndSetCustomerData - END");
      }
    },
    [shopifyAuthConfig, logout]
  );

  const initializeAuth = useCallback(async () => {
    // Always get the freshest URL params when this function is called
    const currentRawSearchParams =
      typeof window !== "undefined" ? window.location.search : "";
    const localUrlParams = new URLSearchParams(currentRawSearchParams);
    const justCompletedAuthSignal =
      localUrlParams.get("auth_completed") === "true";
    const authTimestamp = localUrlParams.get("t");
    const shopifyLogoutSignal = localUrlParams.get("shopify_logout") === "true";

    console.log(
      `AuthContext: initializeAuth - START. URL Search: "${currentRawSearchParams}", Signal: ${justCompletedAuthSignal}, Timestamp: ${authTimestamp}, Shopify Logout: ${shopifyLogoutSignal}`
    );
    setIsLoading(true); // Set loading to true at the beginning of this entire process

    // If user is returning from Shopify logout, clean up URL and ensure clean state
    if (shopifyLogoutSignal) {
      console.log(
        "AuthContext: initializeAuth - User returned from Shopify logout"
      );

      // Ensure all auth data is cleared
      clearAuthStorage();
      clearStoredTokens();
      if (process.env.NODE_ENV === "production") {
        await clearTokenCookiesServer();
      }

      // Set clean unauthenticated state
      setIsAuthenticated(false);
      setCustomerData(null);
      setTokens(null);
      setApiClient(null);
      setError(null);

      // Clean up URL parameter
      if (typeof window !== "undefined") {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.delete("shopify_logout");
        window.history.replaceState(
          {},
          document.title,
          currentUrl.pathname + currentUrl.search
        );
        console.log(
          "AuthContext: initializeAuth - Cleaned up shopify_logout URL param"
        );
      }

      setIsLoading(false);
      console.log(
        "AuthContext: initializeAuth - Shopify logout cleanup complete"
      );
      return; // Exit early, user is logged out
    }

    let tokensFoundAndValid = false;
    let attempts = 0;
    const maxAttempts = justCompletedAuthSignal ? 15 : 1; // More attempts if signal is present (increased from 10 to 15)
    let currentRetryDelay = 50; // Start with 50ms for faster initial checks
    const maxTotalWaitTime = justCompletedAuthSignal ? 8000 : 5000; // Longer wait time for auth completion
    const startTime = Date.now();

    while (attempts < maxAttempts && !tokensFoundAndValid) {
      console.log(
        `AuthContext: initializeAuth - Attempt ${attempts + 1}/${maxAttempts}`
      );
      const storedTokens = await getTokensUnified();
      console.log(
        `AuthContext: initializeAuth - Attempt ${
          attempts + 1
        } - getTokensUnified():`,
        storedTokens ? "FOUND" : "NULL"
      );

      if (storedTokens) {
        console.log(
          "AuthContext: initializeAuth - Tokens FOUND.",
          storedTokens
        );
        setTokens(storedTokens); // Set tokens state
        const client = new CustomerAccountApiClient({
          shopId: shopifyAuthConfig.shopId,
          accessToken: storedTokens.accessToken,
        });
        setApiClient(client);
        // Assume authenticated for now, _internalFetch will confirm or call logout
        setIsAuthenticated(true);
        await _internalFetchAndSetCustomerData(client, storedTokens);

        // IMPORTANT: After _internalFetchAndSetCustomerData, check if still authenticated
        // because _internalFetchAndSetCustomerData might call logout() if tokens are bad.
        const tokensAfterFetch = await getTokensUnified();
        if (tokensAfterFetch) {
          // If tokens still exist, assume fetch was fine or error didn't invalidate tokens
          tokensFoundAndValid = true; // Mark as successful
        } else {
          // Tokens were cleared, likely by logout() in _internalFetch
          console.log(
            "AuthContext: initializeAuth - Tokens were cleared during/after data fetch. Assuming logout."
          );
          setIsAuthenticated(false); // Ensure this is set to false
          tokensFoundAndValid = false; // Mark as unsuccessful
        }
        break; // Exit loop whether successful or token became invalid
      } else if (justCompletedAuthSignal && attempts < maxAttempts - 1) {
        // Check if we've exceeded maximum total wait time
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime >= maxTotalWaitTime) {
          console.warn(
            `AuthContext: initializeAuth - Maximum wait time (${maxTotalWaitTime}ms) exceeded. Stopping retries.`
          );
          break;
        }

        console.warn(
          `AuthContext: initializeAuth - No tokens (Attempt ${
            attempts + 1
          }), signal=true. Retrying in ${currentRetryDelay}ms... (Total elapsed: ${elapsedTime}ms)`
        );
        await new Promise((resolve) => setTimeout(resolve, currentRetryDelay));

        // Exponential backoff: double the delay for next attempt, max 1000ms
        currentRetryDelay = Math.min(currentRetryDelay * 2, 1000);
      } else {
        // No tokens, and either no signal or max attempts reached for signaled auth
        break; // Exit loop
      }
      attempts++;
    }

    if (!tokensFoundAndValid) {
      console.log(
        "AuthContext: initializeAuth - No valid tokens after all attempts. Setting unauthenticated."
      );
      setIsAuthenticated(false);
      setCustomerData(null);
      setTokens(null);
      setApiClient(null);
      setError(null);
    }

    // Clean up the URL parameters only if the signal was processed and we are on the client
    if (justCompletedAuthSignal && typeof window !== "undefined") {
      const currentUrl = new URL(window.location.href);
      let paramsRemoved = false;
      if (currentUrl.searchParams.has("auth_completed")) {
        currentUrl.searchParams.delete("auth_completed");
        paramsRemoved = true;
      }
      if (currentUrl.searchParams.has("t")) {
        currentUrl.searchParams.delete("t");
        paramsRemoved = true;
      }
      // Also clean up shopify_logout if it exists (shouldn't normally be here with auth_completed, but just in case)
      if (currentUrl.searchParams.has("shopify_logout")) {
        currentUrl.searchParams.delete("shopify_logout");
        paramsRemoved = true;
      }
      if (paramsRemoved) {
        window.history.replaceState(
          {},
          document.title,
          currentUrl.pathname + currentUrl.search
        );
        console.log(
          "AuthContext: initializeAuth - Cleaned up auth_completed, timestamp, and shopify_logout URL params."
        );
      }
    }

    setIsLoading(false); // Set loading to false only AFTER all processing (including retries) is done
    console.log(
      "AuthContext: initializeAuth - END. Final State -> isLoading:",
      false,
      "isAuthenticated:",
      tokensFoundAndValid
    );
  }, [shopifyAuthConfig, _internalFetchAndSetCustomerData]); // `logout` is included via _internalFetch

  // This useEffect will run on initial mount and when initializeAuth changes
  useEffect(() => {
    console.log(
      "AuthContext: useEffect - Component mounted or initializeAuth changed. Calling initializeAuth. Current path:",
      typeof window !== "undefined" ? window.location.pathname : "SSR"
    );
    initializeAuth();
  }, [initializeAuth]);

  // Additional useEffect to handle URL changes and storage events for auth completion
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const hasAuthCompleted = urlParams.get("auth_completed") === "true";
      if (hasAuthCompleted) {
        console.log(
          "AuthContext: URL changed with auth_completed=true, re-running initializeAuth"
        );
        initializeAuth();
      }
    };

    // Storage event listener to detect when tokens are stored from callback handler
    const handleStorageChange = (event: StorageEvent) => {
      // Check if Shopify auth tokens were added/updated
      if (event.key === "shopify-tokens") {
        console.log(
          `AuthContext: Storage event detected - ${event.key} was ${
            event.oldValue ? "updated" : "added"
          }. Re-running initializeAuth.`
        );
        // Small delay to ensure all tokens are stored
        setTimeout(() => initializeAuth(), 100);
      }
    };

    // Custom event listener for direct auth completion signals
    const handleAuthComplete = () => {
      console.log(
        "AuthContext: Custom auth-complete event received. Re-running initializeAuth."
      );
      // Run multiple times to ensure we catch the tokens
      initializeAuth();
      setTimeout(() => initializeAuth(), 50);
      setTimeout(() => initializeAuth(), 200);
    };

    // Listen for browser navigation events
    window.addEventListener("popstate", handlePopState);

    // Listen for storage changes (tokens being stored)
    window.addEventListener("storage", handleStorageChange);

    // Listen for custom auth completion events
    window.addEventListener("shopify-auth-complete", handleAuthComplete);

    // Also check immediately if we're on a page with auth_completed
    const urlParams = new URLSearchParams(window.location.search);
    const hasAuthCompleted = urlParams.get("auth_completed") === "true";
    if (hasAuthCompleted) {
      console.log(
        "AuthContext: Initial mount detected auth_completed=true, ensuring initializeAuth runs"
      );
      // Run immediately and also with small delays to ensure it catches the tokens
      initializeAuth();
      setTimeout(() => initializeAuth(), 50);
      setTimeout(() => initializeAuth(), 200);
      setTimeout(() => initializeAuth(), 500);
    }

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("shopify-auth-complete", handleAuthComplete);
    };
  }, [initializeAuth]);

  const login = async () => {
    console.log("AuthContext: login - START");

    // Check current state before login
    const currentTokens = await getTokensUnified();
    console.log(
      "AuthContext: login - Current tokens before login:",
      currentTokens ? "FOUND" : "NULL"
    );

    if (
      !shopifyAuthConfig.shopId ||
      shopifyAuthConfig.shopId.startsWith("error-") ||
      !shopifyAuthConfig.clientId ||
      shopifyAuthConfig.clientId.startsWith("error-") ||
      !appBaseUrl
    ) {
      const errorMsg =
        "Critical Shopify authentication configuration is missing in environment variables (Shop ID, Client ID, or NEXTAUTH_URL).";
      setError(errorMsg);
      console.error("AuthContext: " + errorMsg, {
        shopId: shopifyAuthConfig.shopId,
        clientId: shopifyAuthConfig.clientId ? "✓" : "✗",
        appBaseUrl: appBaseUrl ? "✓" : "✗",
      });
      alert(
        "Application Error: Shopify authentication is not configured correctly. Please contact support."
      );
      return;
    }
    setIsLoading(true);
    setError(null);

    // Start the persistent auth flow loading
    startAuthFlow();

    try {
      console.log(
        "AuthContext: login - Initiating Shopify auth with config:",
        shopifyAuthConfig
      );
      await initiateShopifyAuth(shopifyAuthConfig);
      // Browser will redirect; isLoading will remain true until the callback completes or an error occurs.
    } catch (err) {
      console.error("AuthContext: Error initiating login flow:", err);
      setError(
        err instanceof Error ? err.message : "Failed to start login process."
      );
      setIsLoading(false);
      completeAuthFlow(); // Complete auth flow on error
    }
  };

  // Public function to allow components to trigger a data refresh
  const fetchCustomerData = useCallback(async () => {
    console.log(
      "AuthContext: fetchCustomerData - START. isAuthenticated:",
      isAuthenticated,
      "apiClient:",
      !!apiClient,
      "tokens:",
      !!tokens
    );
    if (!isAuthenticated || !apiClient || !tokens) {
      console.warn(
        "AuthContext: fetchCustomerData - Not ready or not authenticated. Attempting initializeAuth."
      );
      await initializeAuth(); // Re-check everything
      // After initializeAuth, if tokens were found, data would have been fetched.
      // If still not ready, the subsequent check will prevent API call.
      // Need to re-check state after initializeAuth finishes.
      if (!apiClient || !tokens) {
        // Check again after initializeAuth
        console.warn(
          "AuthContext: fetchCustomerData - Still not ready after re-init. Aborting fetch."
        );
        return;
      }
    }

    setIsLoading(true); // Set loading for this specific fetch operation
    try {
      await _internalFetchAndSetCustomerData(apiClient!, tokens!); // Use non-null assertion if confident from above check
    } catch (e) {
      // Error is logged and handled in _internalFetchAndSetCustomerData
      console.error(
        "AuthContext: fetchCustomerData - Error caught from _internalFetch:",
        e
      );
    } finally {
      setIsLoading(false);
      console.log("AuthContext: fetchCustomerData - END");
    }
  }, [
    isAuthenticated,
    apiClient,
    tokens,
    initializeAuth,
    _internalFetchAndSetCustomerData,
  ]);

  // Alias for backward compatibility
  const refreshCustomerData = fetchCustomerData;

  const value = {
    isAuthenticated,
    isLoading,
    customerData,
    tokens,
    apiClient,
    error,
    login,
    logout,
    fetchCustomerData,
    refreshCustomerData,
  };

  useEffect(() => {
    console.log("AuthContext: PROVIDER VALUE CHANGED ->", {
      isAuthenticated,
      isLoading,
      hasTokens: !!tokens,
      error: error,
    });
  }, [isAuthenticated, isLoading, tokens, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
