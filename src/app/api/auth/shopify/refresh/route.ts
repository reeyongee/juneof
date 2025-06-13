import { NextRequest, NextResponse } from "next/server";
import {
  refreshAccessToken,
  type ShopifyAuthConfig,
  type RefreshTokenResponse,
} from "@/lib/shopify-auth";

/**
 * Handles refresh token requests
 * POST /api/auth/shopify/refresh
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        {
          error: "missing_refresh_token",
          message: "Refresh token is required",
        },
        { status: 400 }
      );
    }

    // Get environment variables
    const shopId = process.env.SHOPIFY_SHOP_ID;
    const clientId = process.env.SHOPIFY_CLIENT_ID;
    const redirectUri = process.env.SHOPIFY_REDIRECT_URI;

    if (!shopId || !clientId || !redirectUri) {
      return NextResponse.json(
        {
          error: "server_configuration",
          message: "Server configuration error",
        },
        { status: 500 }
      );
    }

    // Create config object for token refresh
    const config: ShopifyAuthConfig = {
      shopId,
      clientId,
      redirectUri,
    };

    // Refresh the access token
    const refreshedTokens = await refreshAccessToken(config, refreshToken);

    // Return the new tokens (in production, handle tokens securely)
    return NextResponse.json({
      success: true,
      access_token: refreshedTokens.access_token,
      token_type: refreshedTokens.token_type,
      expires_in: refreshedTokens.expires_in,
      refresh_token: refreshedTokens.refresh_token,
      scope: refreshedTokens.scope,
      issued_at: Date.now(),
    });
  } catch (error) {
    console.error("Token refresh error:", error);

    // Handle specific refresh token errors
    const errorMessage =
      error instanceof Error ? error.message : "Token refresh failed";

    // Check for specific error types
    if (errorMessage.includes("invalid_grant")) {
      return NextResponse.json(
        {
          error: "invalid_refresh_token",
          message: "The refresh token is invalid, expired, or revoked",
        },
        { status: 400 }
      );
    }

    if (errorMessage.includes("invalid_client")) {
      return NextResponse.json(
        {
          error: "invalid_client",
          message: "Invalid client configuration",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "refresh_failed",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * Handles GET requests to check refresh token endpoint
 */
export async function GET() {
  return NextResponse.json({
    message: "Shopify Customer Account API Token Refresh Endpoint",
    usage: "POST with { refreshToken: 'your_refresh_token' }",
    endpoints: {
      refresh: "POST /api/auth/shopify/refresh",
      callback: "GET/POST /api/auth/shopify/callback",
    },
  });
}
