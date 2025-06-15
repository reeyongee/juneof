"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  getStoredTokens,
  clearStoredTokens,
  autoRefreshTokens,
  CustomerAccountApiClient,
  type TokenStorage,
  type ShopifyAuthConfig,
  type GraphQLResponse,
} from "@/lib/shopify-auth";

interface CustomerProfile {
  customer: {
    id: string;
    displayName: string;
    firstName?: string;
    lastName?: string;
    emailAddress?: {
      emailAddress: string;
    };
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
  tokens: TokenStorage | null;
  customerData: CustomerProfile | null;
  loading: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => void;
  refreshTokens: () => Promise<void>;
  fetchCustomerData: () => Promise<void>;
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
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tokens, setTokens] = useState<TokenStorage | null>(null);
  const [customerData, setCustomerData] = useState<CustomerProfile | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiClient, setApiClient] = useState<CustomerAccountApiClient | null>(
    null
  );

  // Shopify auth config
  const config: ShopifyAuthConfig = {
    shopId: process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_SHOP_ID || "",
    clientId: process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID || "",
    redirectUri:
      (process.env.NEXTAUTH_URL || "http://localhost:3000") +
      "/api/auth/shopify/callback",
  };

  const fetchCustomerDataInternal = useCallback(
    async (client: CustomerAccountApiClient, tokenData: TokenStorage) => {
      try {
        setLoading(true);
        setError(null);

        // Ensure tokens are fresh
        const refreshedTokens = await autoRefreshTokens(config);
        if (
          refreshedTokens &&
          refreshedTokens.accessToken !== tokenData.accessToken
        ) {
          setTokens(refreshedTokens);
          client.updateAccessToken(refreshedTokens.accessToken);
        }

        // Fetch customer profile
        const response =
          (await client.getCustomerProfile()) as GraphQLResponse<CustomerProfile>;

        if (response.errors && response.errors.length > 0) {
          throw new Error(`GraphQL Error: ${response.errors[0].message}`);
        }

        if (response.data) {
          setCustomerData(response.data);
        } else {
          throw new Error("No customer data returned");
        }
      } catch (err) {
        console.error("Error fetching customer data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch customer data"
        );
      } finally {
        setLoading(false);
      }
    },
    [config]
  );

  // Check for stored tokens on mount and listen for storage changes
  useEffect(() => {
    const checkTokens = () => {
      const storedTokens = getStoredTokens();
      if (storedTokens) {
        setTokens(storedTokens);
        setIsAuthenticated(true);

        // Create API client
        const client = new CustomerAccountApiClient({
          shopId: config.shopId,
          accessToken: storedTokens.accessToken,
        });
        setApiClient(client);

        // Auto-fetch customer data
        fetchCustomerDataInternal(client, storedTokens);
      } else {
        setIsAuthenticated(false);
        setTokens(null);
        setCustomerData(null);
        setApiClient(null);
      }
    };

    // Check tokens on mount
    checkTokens();

    // Listen for storage changes (when tokens are stored by callback handler)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "shopify-auth-tokens" || e.key === null) {
        checkTokens();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Also listen for custom events (for same-tab updates)
    const handleTokenUpdate = () => {
      checkTokens();
    };

    window.addEventListener("shopify-auth-updated", handleTokenUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("shopify-auth-updated", handleTokenUpdate);
    };
  }, [config.shopId, fetchCustomerDataInternal]);

  const login = async () => {
    try {
      // Import the auth function
      const { initiateShopifyAuth } = await import("@/lib/shopify-auth");

      // Directly initiate Shopify auth
      await initiateShopifyAuth(config);
    } catch (error) {
      console.error("Failed to initiate Shopify auth:", error);
      // Fallback to login page if direct auth fails
      window.location.href = `/login`;
    }
  };

  const logout = () => {
    clearStoredTokens();
    setIsAuthenticated(false);
    setTokens(null);
    setCustomerData(null);
    setApiClient(null);
    setError(null);

    // Dispatch custom event to notify other tabs/components
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("shopify-auth-updated"));
    }
  };

  const refreshTokens = async () => {
    if (!tokens?.refreshToken) {
      setError("No refresh token available");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const refreshedTokens = await autoRefreshTokens(config, true);
      if (refreshedTokens) {
        setTokens(refreshedTokens);

        if (apiClient) {
          apiClient.updateAccessToken(refreshedTokens.accessToken);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh tokens");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerData = async () => {
    if (!apiClient || !tokens) {
      setError("No API client or tokens available");
      return;
    }

    await fetchCustomerDataInternal(apiClient, tokens);
  };

  const value: AuthContextType = {
    isAuthenticated,
    tokens,
    customerData,
    loading,
    error,
    login,
    logout,
    refreshTokens,
    fetchCustomerData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
