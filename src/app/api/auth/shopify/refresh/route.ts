import { NextRequest, NextResponse } from "next/server";

const SHOPIFY_CLIENT_ID =
  process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID;
const SHOPIFY_SHOP_ID = process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_SHOP_ID;

/**
 * Handles refresh token requests
 * POST /api/auth/shopify/refresh
 */
export async function POST(request: NextRequest) {
  try {
    const { refreshToken, config, useCookies } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Missing required parameter: refreshToken" },
        { status: 400 }
      );
    }

    // Use config if provided, otherwise fall back to environment variables
    const clientId = config?.clientId || SHOPIFY_CLIENT_ID;
    const shopId = config?.shopId || SHOPIFY_SHOP_ID;

    if (!clientId || !shopId) {
      console.error("Missing Shopify configuration", {
        configProvided: !!config,
        clientIdFromConfig: !!config?.clientId,
        shopIdFromConfig: !!config?.shopId,
        clientIdFromEnv: !!SHOPIFY_CLIENT_ID,
        shopIdFromEnv: !!SHOPIFY_SHOP_ID,
      });
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Prepare the token refresh request
    const tokenUrl = `https://shopify.com/authentication/${shopId}/oauth/token`;

    const body = new URLSearchParams();
    body.append("grant_type", "refresh_token");
    body.append("client_id", clientId);
    body.append("refresh_token", refreshToken);

    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    };

    console.log("🔄 Server-side token refresh request to Shopify...");

    // Add timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(tokenUrl, {
        method: "POST",
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = {
            error: "unknown_error",
            error_description: `HTTP ${response.status}: ${response.statusText}`,
          };
        }

        console.error("❌ Token refresh failed:", errorData);
        return NextResponse.json(
          {
            error: "token_refresh_failed",
            details: errorData,
          },
          { status: response.status }
        );
      }

      const tokenData = await response.json();
      console.log("✅ Token refresh successful");

      // If useCookies is true, set httpOnly cookies
      if (useCookies) {
        const issuedAt = Date.now();
        const expirationDate = new Date(issuedAt + tokenData.expires_in * 1000);

        const cookieResponse = NextResponse.json(tokenData);

        // Set httpOnly cookies for better security
        cookieResponse.cookies.set(
          "shopify-access-token",
          tokenData.access_token,
          {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            expires: expirationDate,
            path: "/",
          }
        );

        cookieResponse.cookies.set(
          "shopify-refresh-token",
          tokenData.refresh_token,
          {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            expires: expirationDate,
            path: "/",
          }
        );

        // Store token metadata in a separate cookie (not httpOnly so client can read expiration)
        const tokenMetadata = {
          tokenType: tokenData.token_type,
          expiresIn: tokenData.expires_in,
          issuedAt,
          scope: tokenData.scope,
          hasRefreshToken: true,
          hasIdToken: false,
        };

        cookieResponse.cookies.set(
          "shopify-token-metadata",
          JSON.stringify(tokenMetadata),
          {
            httpOnly: false, // Client needs to read this for expiration checks
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            expires: expirationDate,
            path: "/",
          }
        );

        return cookieResponse;
      }

      return NextResponse.json(tokenData);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        return NextResponse.json(
          {
            error: "Request timeout",
            error_description: "Token refresh request timed out",
          },
          { status: 408 }
        );
      }
      throw fetchError;
    }
  } catch (error) {
    console.error("❌ Server error during token refresh:", error);
    return NextResponse.json(
      {
        error: "internal_server_error",
        message: error instanceof Error ? error.message : "Unknown error",
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
