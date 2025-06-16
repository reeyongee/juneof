"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  getStoredTokens,
  autoRefreshTokens,
  CustomerAccountApiClient,
  initiateShopifyAuth,
  clearStoredTokens,
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
      province?: string;
      country?: string;
      zip?: string;
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
  logout: () => void;
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start true for initial auth state check
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

  const logout = useCallback(() => {
    console.log("AuthContext: LOGOUT called");
    clearAuthStorage();
    clearStoredTokens();
    setIsAuthenticated(false);
    setCustomerData(null);
    setTokens(null);
    setApiClient(null);
    setError(null);
    setIsLoading(false); // Ensure loading is false after logout
  }, []);

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
        const refreshedTokens = await autoRefreshTokens(shopifyAuthConfig);

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
    console.log("AuthContext: initializeAuth - START");
    setIsLoading(true); // Crucial: set isLoading true at the very start

    const attemptAuthInitialization = async (attempt = 0): Promise<boolean> => {
      console.log(
        `AuthContext: attemptAuthInitialization - Attempt ${attempt + 1}`
      );
      const storedTokens = getStoredTokens();
      console.log(
        `AuthContext: attempt ${attempt + 1} - getStoredTokens() result:`,
        storedTokens
      );

      if (storedTokens) {
        console.log(
          "AuthContext: attempt - Stored tokens FOUND.",
          storedTokens
        );
        setTokens(storedTokens); // Set tokens first
        const client = new CustomerAccountApiClient({
          shopId: shopifyAuthConfig.shopId,
          accessToken: storedTokens.accessToken,
        });
        setApiClient(client);
        setIsAuthenticated(true); // Assume authenticated, _internalFetch will verify
        console.log(
          "AuthContext: attempt - Set isAuthenticated=true, apiClient created."
        );
        try {
          await _internalFetchAndSetCustomerData(client, storedTokens);
          console.log(
            "AuthContext: attempt - _internalFetchAndSetCustomerData COMPLETED."
          );
        } catch (fetchError) {
          console.error(
            "AuthContext: attempt - Error after _internalFetchAndSetCustomerData:",
            fetchError
          );
          // Error state is set within _internalFetchAndSetCustomerData.
          // If logout was called, isAuthenticated will be false.
        }
        return true; // Tokens found and processing initiated
      }

      const urlParams =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search)
          : null;
      const justCompletedAuth = urlParams?.get("auth_completed") === "true";
      console.log(
        `AuthContext: attempt ${attempt + 1} - justCompletedAuth signal:`,
        justCompletedAuth
      );

      if (justCompletedAuth && attempt < 3) {
        // Retry up to 3 times
        const delay = 200 * (attempt + 1);
        console.warn(
          `AuthContext: attempt - No tokens yet (Attempt ${
            attempt + 1
          }), auth_completed=true. Retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return attemptAuthInitialization(attempt + 1); // Recursive call for retry
      }

      console.log(
        "AuthContext: attempt - No stored tokens after all retries or no signal. Setting unauthenticated state."
      );
      setIsAuthenticated(false);
      setCustomerData(null);
      setTokens(null);
      setApiClient(null);
      setError(null);

      if (justCompletedAuth && urlParams && typeof window !== "undefined") {
        console.log(
          "AuthContext: attempt - Cleaning up auth_completed URL param."
        );
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("auth_completed");
        window.history.replaceState({}, document.title, cleanUrl.toString());
      }
      return false; // No tokens found
    };

    await attemptAuthInitialization();
    setIsLoading(false); // Set loading to false AFTER all attempts are done.
    console.log("AuthContext: initializeAuth - END. Final isLoading:", false);
  }, [shopifyAuthConfig, _internalFetchAndSetCustomerData]);

  useEffect(() => {
    console.log("AuthContext: useEffect for initializeAuth - MOUNTING");
    initializeAuth();
  }, [initializeAuth]);

  const login = async () => {
    console.log("AuthContext: login - START");
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

  // Log context value changes for debugging
  useEffect(() => {
    console.log("AuthContext: Value updated ->", {
      isAuthenticated,
      isLoading,
      hasCustomerData: !!customerData,
      error,
      hasTokens: !!tokens,
    });
  }, [isAuthenticated, isLoading, customerData, error, tokens]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
