import { NextRequest, NextResponse } from "next/server";
import {
  validateCallback,
  completeAuthentication,
  type ShopifyAuthConfig,
} from "@/lib/shopify-auth";

/**
 * Handles the OAuth callback from Shopify Customer Account API
 *
 * FLOW EXPLANATION:
 * 1. Shopify redirects here with authorization code
 * 2. Server checks for code verifier (stored in client localStorage)
 * 3. Since server can't access localStorage, redirects to client-side handler
 * 4. Client-side handler completes token exchange with stored code verifier
 *
 * This is the expected flow for client-side PKCE authentication.
 */

// Shopify auth configuration
const getAuthConfig = (): ShopifyAuthConfig => ({
  shopId: process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_SHOP_ID || "your-shop-id",
  clientId:
    process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID ||
    "shp_your-client-id",
  redirectUri: process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/shopify/callback`
    : "https://dev.juneof.com/api/auth/shopify/callback",
  scope: "openid email customer-account-api:full",
  locale: "en",
});

export async function GET(request: NextRequest) {
  try {
    const url = request.url;
    const { searchParams } = new URL(url);

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    // Handle OAuth errors
    if (error) {
      console.error("OAuth error:", error, errorDescription);
      const errorUrl = new URL("/auth/error", request.url);
      errorUrl.searchParams.set("error", error);
      if (errorDescription) {
        errorUrl.searchParams.set("description", errorDescription);
      }
      return NextResponse.redirect(errorUrl);
    }

    // Validate required parameters
    if (!code || !state) {
      console.error("Missing required parameters:", {
        code: !!code,
        state: !!state,
      });
      const errorUrl = new URL("/auth/error", request.url);
      errorUrl.searchParams.set("error", "missing_parameters");
      errorUrl.searchParams.set(
        "description",
        "Missing authorization code or state parameter"
      );
      return NextResponse.redirect(errorUrl);
    }

    // Validate the callback
    const validation = validateCallback(url);
    if (!validation.isValid || !validation.code) {
      console.error("Invalid callback:", validation);
      const errorUrl = new URL("/auth/error", request.url);
      errorUrl.searchParams.set(
        "error",
        validation.error || "invalid_callback"
      );
      errorUrl.searchParams.set(
        "description",
        validation.errorDescription || "Invalid callback parameters"
      );
      return NextResponse.redirect(errorUrl);
    }

    // Complete authentication (this will handle token exchange internally)
    const config = getAuthConfig();
    const tokens = await completeAuthentication(config, validation.code);

    console.log("✅ Authentication successful! Tokens received:", {
      tokenType: tokens.token_type,
      expiresIn: tokens.expires_in,
      scope: tokens.scope,
      hasRefreshToken: !!tokens.refresh_token,
      hasIdToken: !!tokens.id_token,
    });

    // Store tokens in localStorage via a script that will run on the client
    // We'll create a temporary page that handles this
    const callbackHandlerUrl = new URL("/auth/callback-handler", request.url);
    callbackHandlerUrl.searchParams.set("success", "true");

    return NextResponse.redirect(callbackHandlerUrl);
  } catch (error) {
    console.error("Callback handler error:", error);

    const errorUrl = new URL("/auth/error", request.url);
    errorUrl.searchParams.set("error", "server_error");
    errorUrl.searchParams.set(
      "description",
      error instanceof Error ? error.message : "Authentication failed"
    );

    return NextResponse.redirect(errorUrl);
  }
}

/**
 * Handle POST requests for token exchange (alternative method)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, state, codeVerifier } = body;

    if (!code || !state || !codeVerifier) {
      return NextResponse.json(
        {
          error: "missing_parameters",
          error_description: "Missing required parameters",
        },
        { status: 400 }
      );
    }

    // Validate the callback
    const validation = validateCallback(
      `${request.url}?code=${code}&state=${state}`
    );
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: validation.error || "invalid_request",
          error_description:
            validation.errorDescription || "Invalid callback parameters",
        },
        { status: 400 }
      );
    }

    // Complete authentication
    const config = getAuthConfig();
    const tokens = await completeAuthentication(config, code);

    return NextResponse.json({
      success: true,
      tokens: {
        access_token: tokens.access_token,
        token_type: tokens.token_type,
        expires_in: tokens.expires_in,
        refresh_token: tokens.refresh_token,
        scope: tokens.scope,
        id_token: tokens.id_token,
      },
    });
  } catch (error) {
    console.error("Token exchange error:", error);

    return NextResponse.json(
      {
        error: "server_error",
        error_description:
          error instanceof Error ? error.message : "Token exchange failed",
      },
      { status: 500 }
    );
  }
}
