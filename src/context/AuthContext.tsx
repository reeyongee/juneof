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

  // Internal function to fetch data and handle token refresh
  const _internalFetchAndSetCustomerData = useCallback(
    async (currentClient: CustomerAccountApiClient) => {
      setIsLoading(true);
      setError(null);
      try {
        console.log(
          "AuthContext: Attempting to refresh tokens before data fetch..."
        );
        const refreshedTokens = await autoRefreshTokens(shopifyAuthConfig);

        if (refreshedTokens) {
          console.log("AuthContext: Tokens refreshed successfully");
          setTokens(refreshedTokens);
          currentClient.updateAccessToken(refreshedTokens.accessToken);
        }

        console.log("AuthContext: Fetching customer profile...");
        const response =
          (await currentClient.getCustomerProfile()) as GraphQLResponse<CustomerProfileData>;

        if (response.errors && response.errors.length > 0) {
          throw new Error(`GraphQL Error: ${response.errors[0].message}`);
        }
        if (response.data) {
          setCustomerData(response.data);
          console.log(
            "AuthContext: Customer data successfully fetched/refreshed."
          );
        } else {
          setCustomerData(null);
          console.warn(
            "AuthContext: No customer data returned from API, though query was successful."
          );
        }
      } catch (err) {
        console.error(
          "AuthContext: Error fetching/refreshing customer data:",
          err
        );
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch customer data.";
        setError(errorMessage);

        // If token is invalid (common error messages), log out the user
        if (
          errorMessage.includes("invalid_grant") ||
          errorMessage.includes("invalid_token") ||
          errorMessage.includes("expired")
        ) {
          console.warn(
            "AuthContext: Invalid or expired token detected. Logging out."
          );
          logout();
        }
      } finally {
        setIsLoading(false);
      }
    },
    [shopifyAuthConfig]
  );

  const initializeAuth = useCallback(async () => {
    setIsLoading(true);
    console.log("AuthContext: Initializing auth state...");
    const storedTokens = getStoredTokens();

    if (storedTokens) {
      console.log(
        "AuthContext: Stored tokens found. Validating and fetching user data...",
        {
          tokenType: storedTokens.tokenType,
          expiresIn: storedTokens.expiresIn,
          scope: storedTokens.scope,
          issuedAt: new Date(storedTokens.issuedAt).toISOString(),
          hasRefreshToken: !!storedTokens.refreshToken,
        }
      );

      setTokens(storedTokens);
      const client = new CustomerAccountApiClient({
        shopId: shopifyAuthConfig.shopId,
        accessToken: storedTokens.accessToken,
      });
      setApiClient(client);
      setIsAuthenticated(true); // Tentatively set, will be confirmed by data fetch
      await _internalFetchAndSetCustomerData(client);
    } else {
      console.log(
        "AuthContext: No stored tokens found. User is not authenticated."
      );
      setIsAuthenticated(false);
      setCustomerData(null);
      setTokens(null);
      setApiClient(null);
      setIsLoading(false);
    }
  }, [shopifyAuthConfig, _internalFetchAndSetCustomerData]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = async () => {
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
      console.log("AuthContext: Initiating Shopify login...");
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

  const logout = () => {
    console.log("AuthContext: Logging out...");
    clearAuthStorage(); // Clears PKCE-related items from localStorage
    clearStoredTokens(); // Clears 'shopify-tokens' from localStorage
    setIsAuthenticated(false);
    setCustomerData(null);
    setTokens(null);
    setApiClient(null);
    setError(null);
    setIsLoading(false); // Ensure loading is false after logout
    // Consider redirecting to home or login page:
    // if (typeof window !== 'undefined') window.location.href = '/';
  };

  // Public function to allow components to trigger a data refresh
  const fetchCustomerData = useCallback(async () => {
    if (!apiClient || !tokens) {
      console.warn(
        "AuthContext: fetchCustomerData called but not authenticated or client/tokens not ready."
      );
      // If not authenticated, try to re-initialize auth, which might pick up fresh tokens from callback
      if (!isAuthenticated && !isLoading) await initializeAuth();
      return;
    }
    await _internalFetchAndSetCustomerData(apiClient);
  }, [
    apiClient,
    tokens,
    _internalFetchAndSetCustomerData,
    isAuthenticated,
    isLoading,
    initializeAuth,
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
