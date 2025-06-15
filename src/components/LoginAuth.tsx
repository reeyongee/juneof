"use client";

import { useRouter } from "next/navigation";
import ShopifyAuth from "@/components/ShopifyAuth";
import { useAuth } from "@/context/AuthContext";
import type {
  ShopifyAuthConfig,
  AccessTokenResponse,
} from "@/lib/shopify-auth";

export function LoginAuth() {
  const router = useRouter();
  const { fetchCustomerData } = useAuth();

  // Construct redirect URI
  const getRedirectUri = () => {
    if (typeof window !== "undefined") {
      return window.location.origin + "/api/auth/shopify/callback";
    }
    return "https://dev.juneof.com/api/auth/shopify/callback";
  };

  const authConfig: ShopifyAuthConfig = {
    shopId: process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_SHOP_ID || "",
    clientId: process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID || "",
    redirectUri: getRedirectUri(),
    scope: "openid email customer-account-api:full",
    locale: "en",
  };

  const handleAuthSuccess = async (data: {
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

      // Fetch customer data to update the auth context
      try {
        await fetchCustomerData();
      } catch (error) {
        console.error("Failed to fetch customer data:", error);
      }

      // Redirect to dashboard
      router.push("/dashboard");
    }
  };

  const handleAuthError = (error: {
    error: string;
    errorDescription?: string;
  }) => {
    console.error("Authentication failed:", error);
    // Could show a toast notification here
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Sign in with Shopify
        </h2>
        <p className="text-gray-600">
          Connect your Shopify account to access your orders and profile
        </p>
      </div>

      <ShopifyAuth
        config={authConfig}
        onAuthSuccess={handleAuthSuccess}
        onAuthError={handleAuthError}
        autoExchangeTokens={true}
      />
    </div>
  );
}
