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
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Missing required parameter: refreshToken" },
        { status: 400 }
      );
    }

    if (!SHOPIFY_CLIENT_ID || !SHOPIFY_SHOP_ID) {
      console.error("Missing Shopify configuration");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Prepare the token refresh request
    const tokenUrl = `https://shopify.com/authentication/${SHOPIFY_SHOP_ID}/oauth/token`;

    const body = new URLSearchParams();
    body.append("grant_type", "refresh_token");
    body.append("client_id", SHOPIFY_CLIENT_ID);
    body.append("refresh_token", refreshToken);

    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "User-Agent": "ShopifyCustomerAuth/1.0",
    };

    console.log("🔄 Server-side token refresh request to Shopify...");

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers,
      body,
    });

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

    return NextResponse.json(tokenData);
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
