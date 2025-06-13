import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForTokens,
  type ShopifyAuthConfig,
} from "@/lib/shopify-auth";

/**
 * Handles the OAuth callback from Shopify Customer Account API
 * Exchanges authorization code for access token
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    // Handle error responses from Shopify
    if (error) {
      console.error("Shopify OAuth error:", error, errorDescription);
      return NextResponse.redirect(
        new URL(
          `/auth/error?error=${error}&description=${encodeURIComponent(
            errorDescription || ""
          )}`,
          request.url
        )
      );
    }

    // Validate required parameters
    if (!code || !state) {
      console.error("Missing required parameters:", {
        code: !!code,
        state: !!state,
      });
      return NextResponse.redirect(
        new URL("/auth/error?error=missing_parameters", request.url)
      );
    }

    // Get environment variables
    const shopId = process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_SHOP_ID;
    const clientId = process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID;
    const redirectUri = process.env.NEXTAUTH_URL + "/api/auth/shopify/callback";

    if (!shopId || !clientId || !redirectUri) {
      console.error("Missing environment variables");
      return NextResponse.redirect(
        new URL("/auth/error?error=server_configuration", request.url)
      );
    }

    // Get code verifier from the request (this would typically come from a secure session store)
    // For now, we'll expect it to be passed as a query parameter or header
    // In production, you should store this securely server-side
    const codeVerifier =
      searchParams.get("code_verifier") ||
      request.headers.get("x-code-verifier");

    if (!codeVerifier) {
      console.error("Missing code verifier");
      return NextResponse.redirect(
        new URL("/auth/error?error=missing_code_verifier", request.url)
      );
    }

    // Create config object for token exchange
    const config: ShopifyAuthConfig = {
      shopId,
      clientId,
      redirectUri,
    };

    // Exchange authorization code for tokens using the library function
    const tokens = await exchangeCodeForTokens(config, code, codeVerifier);

    // In a production app, you would:
    // 1. Validate the ID token if present
    // 2. Store tokens securely (encrypted session, secure database)
    // 3. Set secure HTTP-only cookies
    // 4. Implement proper session management

    // For now, we'll redirect to a success page with basic token info
    // WARNING: Never expose actual tokens in URLs in production
    const successUrl = new URL("/auth/success", request.url);
    successUrl.searchParams.set("token_type", tokens.token_type);
    successUrl.searchParams.set("expires_in", tokens.expires_in.toString());
    successUrl.searchParams.set("scope", tokens.scope);

    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error("Callback handler error:", error);

    // Handle specific token exchange errors
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    const errorParam = encodeURIComponent(errorMessage);

    return NextResponse.redirect(
      new URL(
        `/auth/error?error=token_exchange_failed&description=${errorParam}`,
        request.url
      )
    );
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
          message: "Code, state, and codeVerifier are required",
        },
        { status: 400 }
      );
    }

    // Get environment variables
    const shopId = process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_SHOP_ID;
    const clientId = process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID;
    const redirectUri = process.env.NEXTAUTH_URL + "/api/auth/shopify/callback";

    if (!shopId || !clientId || !redirectUri) {
      return NextResponse.json(
        {
          error: "server_configuration",
          message: "Server configuration error",
        },
        { status: 500 }
      );
    }

    // Create config object for token exchange
    const config: ShopifyAuthConfig = {
      shopId,
      clientId,
      redirectUri,
    };

    // Exchange authorization code for tokens using the library function
    const tokens = await exchangeCodeForTokens(config, code, codeVerifier);

    // Return success response (in production, handle tokens securely)
    return NextResponse.json({
      success: true,
      tokenType: tokens.token_type,
      expiresIn: tokens.expires_in,
      scope: tokens.scope,
      // Note: Never return actual tokens in production without proper security measures
    });
  } catch (error) {
    console.error("Token exchange error:", error);

    // Handle specific token exchange errors
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json(
      { error: "token_exchange_failed", message: errorMessage },
      { status: 500 }
    );
  }
}
