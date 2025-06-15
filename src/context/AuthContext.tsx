"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
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
  isLoading: boolean;
  customerData: CustomerProfile | null;
  tokens: TokenStorage | null;
  error: string | null;
  login: () => Promise<void>;
  logout: () => void;
  refreshCustomerData: () => Promise<void>;
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
  const [isLoading, setIsLoading] = useState(false);
  const [customerData, setCustomerData] = useState<CustomerProfile | null>(
    null
  );
  const [tokens, setTokens] = useState<TokenStorage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiClient, setApiClient] = useState<CustomerAccountApiClient | null>(
    null
  );

  // Shopify auth configuration
  const config: ShopifyAuthConfig = {
    shopId: process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_SHOP_ID || "",
    clientId: process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID || "",
    redirectUri:
      (process.env.NEXTAUTH_URL || "http://localhost:3000") +
      "/api/auth/shopify/callback",
  };

  // Function to fetch customer profile
  const fetchCustomerProfile = useCallback(
    async (client: CustomerAccountApiClient, tokenData: TokenStorage) => {
      try {
        setIsLoading(true);
        setError(null);

        // First, ensure tokens are fresh
        const refreshedTokens = await autoRefreshTokens(config);
        if (
          refreshedTokens &&
          refreshedTokens.accessToken !== tokenData.accessToken
        ) {
          setTokens(refreshedTokens);
          client.updateAccessToken(refreshedTokens.accessToken);
        }

        // Fetch customer profile using the built-in method
        const response =
          (await client.getCustomerProfile()) as GraphQLResponse<CustomerProfile>;

        if (response.errors && response.errors.length > 0) {
          throw new Error(`GraphQL Error: ${response.errors[0].message}`);
        }

        if (response.data) {
          setCustomerData(response.data);
          console.log("✅ Customer data loaded successfully:", response.data);
        } else {
          throw new Error("No customer data returned");
        }
      } catch (err) {
        console.error("Error fetching customer data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch customer data"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [config]
  );

  // Load stored tokens on component mount
  useEffect(() => {
    console.log("🔍 AuthContext: Checking for stored tokens...");
    const storedTokens = getStoredTokens();

    if (storedTokens) {
      console.log("✅ Found stored tokens:", {
        tokenType: storedTokens.tokenType,
        expiresIn: storedTokens.expiresIn,
        scope: storedTokens.scope,
        issuedAt: new Date(storedTokens.issuedAt).toISOString(),
        hasRefreshToken: !!storedTokens.refreshToken,
      });

      setTokens(storedTokens);
      setIsAuthenticated(true);

      // Create API client with the access token
      const client = new CustomerAccountApiClient({
        shopId: config.shopId,
        accessToken: storedTokens.accessToken,
      });
      setApiClient(client);

      // Automatically fetch customer profile if we have tokens
      setTimeout(() => {
        console.log("🚀 Auto-fetching customer profile...");
        fetchCustomerProfile(client, storedTokens);
      }, 1000);
    } else {
      console.log("❌ No stored tokens found");
    }
  }, [fetchCustomerProfile, config.shopId]);

  const login = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await initiateShopifyAuth(config);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearAuthStorage();
    clearStoredTokens();
    setIsAuthenticated(false);
    setCustomerData(null);
    setTokens(null);
    setApiClient(null);
    setError(null);
  };

  const refreshCustomerData = async () => {
    if (!apiClient || !tokens) {
      setError("No API client or tokens available");
      return;
    }
    await fetchCustomerProfile(apiClient, tokens);
  };

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    customerData,
    tokens,
    error,
    login,
    logout,
    refreshCustomerData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
