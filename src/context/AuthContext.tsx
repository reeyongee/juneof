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
    console.log(
      "AuthContext: initializeAuth - START. Current URL:",
      typeof window !== "undefined" ? window.location.href : "SSR"
    );
    setIsLoading(true); // Set loading true at the very beginning

    const urlParams =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : null;
    const justCompletedAuth = urlParams?.get("auth_completed") === "true";
    console.log(
      "AuthContext: initializeAuth - justCompletedAuth signal:",
      justCompletedAuth
    );

    let tokensFound = false;
    let attempts = 0;
    const maxAttempts = 4; // Try once, then 3 retries
    const retryDelay = 200; // ms

    while (attempts < maxAttempts && !tokensFound) {
      console.log(
        `AuthContext: initializeAuth - Attempt ${attempts + 1} to get tokens.`
      );
      const storedTokens = getStoredTokens();
      console.log(
        `AuthContext: initializeAuth - Attempt ${
          attempts + 1
        } - getStoredTokens() result:`,
        storedTokens
      );

      if (storedTokens) {
        console.log(
          "AuthContext: initializeAuth - Stored tokens FOUND.",
          storedTokens
        );
        setTokens(storedTokens);
        const client = new CustomerAccountApiClient({
          shopId: shopifyAuthConfig.shopId,
          accessToken: storedTokens.accessToken,
        });
        setApiClient(client);
        setIsAuthenticated(true);
        console.log(
          "AuthContext: initializeAuth - Set isAuthenticated=true, apiClient created."
        );
        try {
          await _internalFetchAndSetCustomerData(client, storedTokens); // Pass storedTokens
          console.log(
            "AuthContext: initializeAuth - _internalFetchAndSetCustomerData COMPLETED."
          );
        } catch (fetchError) {
          console.error(
            "AuthContext: initializeAuth - Error from _internalFetch:",
            fetchError
          );
          // If _internalFetchAndSetCustomerData calls logout, isAuthenticated will be set to false there.
          // Error state is also set there.
        }
        tokensFound = true; // Exit loop
      } else if (justCompletedAuth && attempts < maxAttempts - 1) {
        // Only retry if signal is present and more attempts left
        console.warn(
          `AuthContext: initializeAuth - No tokens yet (Attempt ${
            attempts + 1
          }), auth_completed=true. Retrying in ${retryDelay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      } else {
        // No tokens, and either no signal or max attempts reached
        break; // Exit loop
      }
      attempts++;
    }

    if (!tokensFound) {
      console.log(
        "AuthContext: initializeAuth - No stored tokens after all attempts or no signal. Setting unauthenticated state."
      );
      setIsAuthenticated(false);
      setCustomerData(null);
      setTokens(null);
      setApiClient(null);
      setError(null); // Clear any previous error
    }

    // Clean up the URL parameter if it exists
    if (justCompletedAuth && urlParams && typeof window !== "undefined") {
      console.log(
        "AuthContext: initializeAuth - Cleaning up auth_completed URL param."
      );
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("auth_completed");
      window.history.replaceState({}, document.title, cleanUrl.toString());
    }

    setIsLoading(false); // Set loading to false AFTER all logic is done.
    console.log(
      "AuthContext: initializeAuth - END. Final isLoading:",
      false,
      "isAuthenticated:",
      isAuthenticated
    ); // Log final isAuthenticated
  }, [shopifyAuthConfig, _internalFetchAndSetCustomerData]);

  useEffect(() => {
    console.log("AuthContext: AuthProvider MOUNTED. Calling initializeAuth.");
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
