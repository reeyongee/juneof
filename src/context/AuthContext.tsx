"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { useLoading } from "@/context/LoadingContext";
import type { CheckoutLoginContext } from "@/context/CartContext";

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
  login: (checkoutContext?: CheckoutLoginContext) => Promise<void>;
  logout: () => Promise<void>;
  fetchCustomerData: () => Promise<void>; // Allows manual refresh/fetch
  refreshCustomerData: () => Promise<void>; // Alias for backward compatibility
  checkoutLoginContext: CheckoutLoginContext | null;
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
  const { startAuthFlow, completeAuthFlow, startFlow, completeFlowStep } =
    useLoading();
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
  const [checkoutLoginContext, setCheckoutLoginContext] =
    useState<CheckoutLoginContext | null>(null);

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

    // Log environment check only once per session
    const hasLoggedEnvCheck =
      typeof window !== "undefined" &&
      sessionStorage.getItem("shopify-env-checked");

    if (typeof window !== "undefined" && !hasLoggedEnvCheck) {
      console.log("AuthContext: Environment check", {
        appBaseUrl: appBaseUrl ? "✓" : "✗",
        shopId: shopId ? "✓" : "✗",
        clientId: clientId ? "✓" : "✗",
        isClient: typeof window !== "undefined",
      });
      sessionStorage.setItem("shopify-env-checked", "true");
    }

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
  }, []); // Empty dependency array since environment variables don't change

  // Store appBaseUrl separately for validation - use same logic as above
  const appBaseUrl =
    process.env.NEXTAUTH_URL ||
    (typeof window !== "undefined"
      ? window.location.origin
      : "https://dev.juneof.com");

  const logout = useCallback(async () => {
    console.log("AuthContext: LOGOUT called");

    // Start loading spinner for logout flow
    startAuthFlow();

    // Get current tokens BEFORE clearing them to check if we have an id_token for Shopify logout
    const currentTokens = await getTokensUnified();
    console.log(
      "AuthContext: LOGOUT - Current tokens:",
      currentTokens ? "FOUND" : "NULL",
      currentTokens?.idToken ? "with id_token" : "no id_token"
    );

    // Store id_token for Shopify logout BEFORE clearing tokens
    const idToken = currentTokens?.idToken;

    // Clear local storage and cookies FIRST
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

    // Complete auth flow immediately to prevent infinite loading
    completeAuthFlow();

    // BULLETPROOF: Clear all loading flows to prevent conflicts
    if (typeof window !== "undefined") {
      const windowObj = window as typeof window & {
        clearAllLoadingFlows?: () => void;
        emergencyLoadingReset?: () => void;
      };
      if (windowObj.clearAllLoadingFlows) {
        windowObj.clearAllLoadingFlows();
      }
      if (windowObj.emergencyLoadingReset) {
        windowObj.emergencyLoadingReset();
      }
    }

    // If we have an id_token, redirect to Shopify's logout endpoint
    if (idToken) {
      console.log(
        "AuthContext: LOGOUT - Redirecting to Shopify logout endpoint"
      );

      // Create Shopify logout URL
      const logoutUrl = new URL(
        `https://shopify.com/authentication/${shopifyAuthConfig.shopId}/logout`
      );

      // Add required id_token_hint parameter
      logoutUrl.searchParams.append("id_token_hint", idToken);

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

      // Set fallback timeout in case Shopify logout gets stuck
      setTimeout(() => {
        console.warn(
          "AuthContext: LOGOUT - 5-second fallback, redirecting to homepage"
        );
        window.location.href = "/";
      }, 5000);

      // Redirect to Shopify logout endpoint
      window.location.href = logoutUrl.toString();
      return; // Don't redirect to homepage yet, let Shopify handle the redirect
    } else {
      console.log(
        "AuthContext: LOGOUT - No id_token found, performing local logout only"
      );

      // If no id_token, just redirect to homepage
      router.push("/");
    }
  }, [
    router,
    shopifyAuthConfig.shopId,
    appBaseUrl,
    startAuthFlow,
    completeAuthFlow,
  ]);

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

  // Add a ref to prevent concurrent initializeAuth calls
  const initializeAuthRunningRef = useRef(false);

  const initializeAuth = useCallback(async () => {
    // BULLETPROOF: Prevent concurrent calls
    if (initializeAuthRunningRef.current) {
      console.log("AuthContext: initializeAuth already running, skipping");
      return;
    }

    initializeAuthRunningRef.current = true;

    try {
      // Always get the freshest URL params when this function is called
      const currentRawSearchParams =
        typeof window !== "undefined" ? window.location.search : "";
      const localUrlParams = new URLSearchParams(currentRawSearchParams);
      const justCompletedAuthSignal =
        localUrlParams.get("auth_completed") === "true";
      const authTimestamp = localUrlParams.get("t");
      const shopifyLogoutSignal =
        localUrlParams.get("shopify_logout") === "true";

      console.log(
        `AuthContext: initializeAuth - START. URL Search: "${currentRawSearchParams}", Signal: ${justCompletedAuthSignal}, Timestamp: ${authTimestamp}, Shopify Logout: ${shopifyLogoutSignal}`
      );

      // Start flow-based loading for authentication initialization
      const flowSteps = [
        {
          id: "check-logout",
          name: "checking logout status",
          completed: false,
        },
        { id: "validate-tokens", name: "validating tokens", completed: false },
        {
          id: "fetch-customer-data",
          name: "loading profile",
          completed: false,
        },
        {
          id: "complete-auth",
          name: "finalizing authentication",
          completed: false,
        },
      ];

      startFlow(
        "auth-initialization",
        flowSteps,
        "initializing authentication..."
      );
      setIsLoading(true);

      // If user is returning from Shopify logout, clean up URL and ensure clean state
      if (shopifyLogoutSignal) {
        console.log(
          "AuthContext: initializeAuth - User returned from Shopify logout"
        );

        completeFlowStep("auth-initialization", "check-logout");

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

        // Complete all remaining steps since logout is complete
        completeFlowStep("auth-initialization", "validate-tokens");
        completeFlowStep("auth-initialization", "fetch-customer-data");
        completeFlowStep("auth-initialization", "complete-auth");

        setIsLoading(false);
        console.log(
          "AuthContext: initializeAuth - Shopify logout cleanup complete"
        );
        return; // Exit early, user is logged out
      }

      completeFlowStep("auth-initialization", "check-logout");

      // Check if we're on the callback handler page (where tokens are being set)
      const isCallbackHandler =
        typeof window !== "undefined" &&
        window.location.pathname === "/auth/callback-handler";
      const shouldDoAggressiveRetries =
        justCompletedAuthSignal || isCallbackHandler;

      let attempts = 0;
      const maxAttempts = shouldDoAggressiveRetries ? 5 : 1;
      let tokensFoundAndValid = false;

      while (attempts < maxAttempts && !tokensFoundAndValid) {
        attempts++;
        console.log(
          `AuthContext: initializeAuth - Attempt ${attempts}/${maxAttempts}`
        );

        const storedTokens = await getTokensUnified();

        if (storedTokens) {
          console.log(
            "AuthContext: initializeAuth - Tokens FOUND.",
            storedTokens
          );
          completeFlowStep("auth-initialization", "validate-tokens");

          setTokens(storedTokens); // Set tokens state
          const client = new CustomerAccountApiClient({
            shopId: shopifyAuthConfig.shopId,
            accessToken: storedTokens.accessToken,
          });
          setApiClient(client);
          // Assume authenticated for now, _internalFetch will confirm or call logout
          setIsAuthenticated(true);
          await _internalFetchAndSetCustomerData(client, storedTokens);

          completeFlowStep("auth-initialization", "fetch-customer-data");

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
        }

        // If no tokens found, wait and retry if we're doing aggressive retries
        if (attempts < maxAttempts && !tokensFoundAndValid) {
          console.log(
            `AuthContext: initializeAuth - Tokens not found yet. Waiting before retry ${attempts + 1}/${maxAttempts}`
          );
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      // If no tokens found after all attempts, set unauthenticated state
      if (!tokensFoundAndValid) {
        console.log(
          "AuthContext: initializeAuth - No tokens found. Setting unauthenticated state."
        );
        setIsAuthenticated(false);
        setCustomerData(null);
        setTokens(null);
        setApiClient(null);
        setError(null);
        completeFlowStep("auth-initialization", "validate-tokens");
        completeFlowStep("auth-initialization", "fetch-customer-data");
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

      // Complete the final authentication step
      completeFlowStep("auth-initialization", "complete-auth");

      setIsLoading(false); // Set loading to false only AFTER all processing (including retries) is done
      console.log(
        "AuthContext: initializeAuth - END. Final State -> isLoading:",
        false,
        "isAuthenticated:",
        tokensFoundAndValid
      );
    } finally {
      initializeAuthRunningRef.current = false;
    }
  }, [
    shopifyAuthConfig,
    _internalFetchAndSetCustomerData,
    startFlow,
    completeFlowStep,
  ]);

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

    // FIXED: Prevent redundant calls if already loading or not authenticated
    if (isLoading || !isAuthenticated || !apiClient || !tokens) {
      console.log("AuthContext: fetchCustomerData - Not ready, skipping");
      return;
    }

    // Start customer data fetch flow
    const fetchFlowSteps = [
      {
        id: "validate-auth",
        name: "validating authentication",
        completed: false,
      },
      {
        id: "fetch-profile",
        name: "loading customer profile",
        completed: false,
      },
    ];

    startFlow("customer-data-fetch", fetchFlowSteps, "loading profile...");
    completeFlowStep("customer-data-fetch", "validate-auth");
    setIsLoading(true);

    try {
      await _internalFetchAndSetCustomerData(apiClient, tokens);
      completeFlowStep("customer-data-fetch", "fetch-profile");
    } catch (e) {
      // Error is logged and handled in _internalFetchAndSetCustomerData
      console.error(
        "AuthContext: fetchCustomerData - Error caught from _internalFetch:",
        e
      );
      completeFlowStep("customer-data-fetch", "fetch-profile");
    } finally {
      setIsLoading(false);
      console.log("AuthContext: fetchCustomerData - END");
    }
  }, [
    isAuthenticated,
    apiClient,
    tokens,
    isLoading,
    _internalFetchAndSetCustomerData,
    startFlow,
    completeFlowStep,
  ]);

  // FIXED: Simplified event handling
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleAuthComplete = () => {
      console.log("AuthContext: Auth complete event received");
      // Small delay to ensure all tokens are stored
      setTimeout(() => initializeAuth(), 100);
    };

    const handleStorageChange = (event: StorageEvent) => {
      // Check if Shopify auth tokens were added/updated
      if (event.key === "shopify-tokens" && !isAuthenticated) {
        console.log(
          "AuthContext: Tokens detected in storage, initializing auth"
        );
        setTimeout(() => initializeAuth(), 100);
      }
    };

    const handleAuthFlowCompleted = (event: CustomEvent) => {
      console.log("AuthContext: Auth flow completed event received");
      // Only handle if the flow was abandoned
      if (event.detail.reason === "abandoned") {
        console.log("AuthContext: Auth flow was abandoned, clearing states");
        // Clear any stuck loading states
        setIsLoading(false);
      }
    };

    window.addEventListener("shopify-auth-complete", handleAuthComplete);
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(
      "auth-flow-completed",
      handleAuthFlowCompleted as EventListener
    );

    return () => {
      window.removeEventListener("shopify-auth-complete", handleAuthComplete);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "auth-flow-completed",
        handleAuthFlowCompleted as EventListener
      );
    };
  }, [isAuthenticated, initializeAuth]);

  // FIXED: Simplified login function
  const login = async (checkoutContext?: CheckoutLoginContext) => {
    console.log("AuthContext: login - START", { checkoutContext });

    // Start login flow
    const loginFlowSteps = [
      { id: "prepare-login", name: "preparing login", completed: false },
      {
        id: "validate-config",
        name: "validating configuration",
        completed: false,
      },
      { id: "initiate-auth", name: "connecting to shopify", completed: false },
    ];

    startFlow("login-flow", loginFlowSteps, "starting login...");

    // Store checkout context if provided
    if (checkoutContext) {
      setCheckoutLoginContext(checkoutContext);
      // Store in sessionStorage for retrieval after login
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "checkout-login-context",
          JSON.stringify(checkoutContext)
        );
      }
    }

    completeFlowStep("login-flow", "prepare-login");

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

      completeFlowStep("login-flow", "validate-config");
      completeFlowStep("login-flow", "initiate-auth");
      return;
    }

    completeFlowStep("login-flow", "validate-config");
    setIsLoading(true);
    setError(null);

    // Start the persistent auth flow loading as well
    startAuthFlow();

    try {
      console.log(
        "AuthContext: login - Initiating Shopify auth with config:",
        shopifyAuthConfig
      );
      await initiateShopifyAuth(shopifyAuthConfig);
      completeFlowStep("login-flow", "initiate-auth");
      // Browser will redirect; isLoading will remain true until the callback completes or an error occurs.
    } catch (err) {
      console.error("AuthContext: Error initiating login flow:", err);
      setError(
        err instanceof Error ? err.message : "Failed to start login process."
      );
      setIsLoading(false);

      // Complete remaining steps as failed
      completeFlowStep("login-flow", "initiate-auth");
      completeAuthFlow(); // Complete auth flow on error
    }
  };

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
    checkoutLoginContext,
  };

  useEffect(() => {
    console.log("AuthContext: PROVIDER VALUE CHANGED ->", {
      isAuthenticated,
      isLoading,
      hasTokens: !!tokens,
      error: error,
    });
  }, [isAuthenticated, isLoading, tokens, error]);

  // FIXED: Simplified useEffect for initialization
  useEffect(() => {
    // Only initialize if not already loading and not initialized
    if (!isLoading || !isAuthenticated) {
      console.log(
        "AuthContext: useEffect - Initializing auth. Current path:",
        typeof window !== "undefined" ? window.location.pathname : "SSR"
      );
      initializeAuth();
    }
  }, []); // FIXED: Empty dependency array to prevent re-initialization

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
