import { NextRequest, NextResponse } from "next/server";

const SHOPIFY_CLIENT_ID =
  process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID;
const SHOPIFY_SHOP_ID = process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_SHOP_ID;

export async function POST(request: NextRequest) {
  try {
    const { code, codeVerifier, redirectUri } = await request.json();

    if (!code || !codeVerifier || !redirectUri) {
      return NextResponse.json(
        {
          error:
            "Missing required parameters: code, codeVerifier, or redirectUri",
        },
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

    // Prepare the token exchange request
    const tokenUrl = `https://shopify.com/authentication/${SHOPIFY_SHOP_ID}/oauth/token`;

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: SHOPIFY_CLIENT_ID,
      code: code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    });

    // Make the token exchange request to Shopify
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "ShopifyCustomerAuth/1.0",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Shopify token exchange failed:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });

      return NextResponse.json(
        {
          error: "Token exchange failed",
          details: `Shopify returned ${response.status}: ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    const tokenData = await response.json();

    // Return the token data to the client
    return NextResponse.json(tokenData);
  } catch (error) {
    console.error("Token exchange API error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}
