"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  getStoredTokens,
  clearStoredTokens,
  autoRefreshTokens,
  isTokenExpired,
  initiateShopifyAuth,
  logoutCustomer,
  executeCustomerAccountQuery,
  type ShopifyAuthConfig,
  type TokenStorage,
  type GraphQLResponse,
} from "@/lib/shopify-auth";

interface CustomerData {
  id: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  emailAddress?: {
    emailAddress: string;
  };
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  customerData: CustomerData | null;
  tokens: TokenStorage | null;
  login: () => Promise<void>;
  logout: () => void;
  refreshTokens: () => Promise<void>;
  fetchCustomerData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Shopify auth configuration
const getAuthConfig = (): ShopifyAuthConfig => {
  const getRedirectUri = () => {
    if (typeof window !== "undefined") {
      return window.location.origin + "/api/auth/shopify/callback";
    }
    return "https://dev.juneof.com/api/auth/shopify/callback";
  };

  return {
    shopId: process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_SHOP_ID || "your-shop-id",
    clientId:
      process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID ||
      "shp_your-client-id",
    redirectUri: getRedirectUri(),
    scope: "openid email customer-account-api:full",
    locale: "en",
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [tokens, setTokens] = useState<TokenStorage | null>(null);

  // Check for existing authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedTokens = getStoredTokens();

        if (storedTokens) {
          // Check if tokens are expired
          if (isTokenExpired(storedTokens.expiresIn, storedTokens.issuedAt)) {
            // Try to refresh tokens
            try {
              const refreshedTokens = await autoRefreshTokens(getAuthConfig());
              if (refreshedTokens) {
                setTokens(refreshedTokens);
                setIsAuthenticated(true);
                // Fetch customer data with refreshed tokens
                await fetchCustomerDataInternal(refreshedTokens.accessToken);
              } else {
                // Refresh failed, clear tokens
                clearStoredTokens();
                setIsAuthenticated(false);
              }
            } catch (error) {
              console.error("Token refresh failed:", error);
              clearStoredTokens();
              setIsAuthenticated(false);
            }
          } else {
            // Tokens are valid
            setTokens(storedTokens);
            setIsAuthenticated(true);
            // Fetch customer data
            await fetchCustomerDataInternal(storedTokens.accessToken);
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const fetchCustomerDataInternal = async (accessToken: string) => {
    try {
      const config = {
        shopId: getAuthConfig().shopId,
        accessToken,
      };

      const query = {
        query: `
          query GetCustomer {
            customer {
              id
              displayName
              firstName
              lastName
              emailAddress {
                emailAddress
              }
            }
          }
        `,
      };

      const response: GraphQLResponse<{ customer: CustomerData }> =
        await executeCustomerAccountQuery(config, query);

      if (response.data?.customer) {
        setCustomerData(response.data.customer);
      }
    } catch (error) {
      console.error("Failed to fetch customer data:", error);
    }
  };

  const login = async () => {
    try {
      setIsLoading(true);
      await initiateShopifyAuth(getAuthConfig());
    } catch (error) {
      console.error("Login failed:", error);
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
      // If we have tokens with id_token, use proper logout
      if (tokens?.idToken) {
        logoutCustomer({
          shopId: getAuthConfig().shopId,
          idToken: tokens.idToken,
          postLogoutRedirectUri: window.location.origin,
        });
      }

      // Clear local state
      clearStoredTokens();
      setIsAuthenticated(false);
      setCustomerData(null);
      setTokens(null);
    } catch (error) {
      console.error("Logout failed:", error);
      // Still clear local state even if logout call fails
      clearStoredTokens();
      setIsAuthenticated(false);
      setCustomerData(null);
      setTokens(null);
    }
  };

  const refreshTokens = async () => {
    try {
      const refreshedTokens = await autoRefreshTokens(getAuthConfig());
      if (refreshedTokens) {
        setTokens(refreshedTokens);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      logout();
    }
  };

  const fetchCustomerData = async () => {
    if (tokens?.accessToken) {
      await fetchCustomerDataInternal(tokens.accessToken);
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    customerData,
    tokens,
    login,
    logout,
    refreshTokens,
    fetchCustomerData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
