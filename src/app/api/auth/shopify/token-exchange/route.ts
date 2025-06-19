import { NextRequest, NextResponse } from "next/server";

interface AccessTokenResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token?: string;
  scope: string;
  id_token?: string;
}

interface TokenErrorResponse {
  error: string;
  error_description?: string;
}

const SHOPIFY_CLIENT_ID =
  process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID;
const SHOPIFY_SHOP_ID = process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_SHOP_ID;

export async function POST(request: NextRequest) {
  try {
    const { code, codeVerifier, config, useCookies } = await request.json();

    if (!code || !codeVerifier || !config) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Validate environment variables only if config doesn't provide the values
    const clientId = config.clientId || SHOPIFY_CLIENT_ID;
    const shopId = config.shopId || SHOPIFY_SHOP_ID;

    if (!clientId || !shopId) {
      console.error("Missing Shopify configuration", {
        configProvided: !!config,
        clientIdFromConfig: !!config.clientId,
        shopIdFromConfig: !!config.shopId,
        clientIdFromEnv: !!SHOPIFY_CLIENT_ID,
        shopIdFromEnv: !!SHOPIFY_SHOP_ID,
      });
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Prepare token exchange request
    const tokenRequest = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      code,
      redirect_uri: config.redirectUri,
      code_verifier: codeVerifier,
    });

    // Exchange code for tokens with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(
        `https://shopify.com/authentication/${shopId}/oauth/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
          body: tokenRequest.toString(),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData: TokenErrorResponse = await response.json();
        return NextResponse.json(
          {
            error: errorData.error || "Token exchange failed",
            error_description: errorData.error_description || "Unknown error",
          },
          { status: response.status }
        );
      }

      const tokens: AccessTokenResponse = await response.json();

      // If useCookies is true, set httpOnly cookies
      if (useCookies) {
        const issuedAt = Date.now();
        const expirationDate = new Date(issuedAt + tokens.expires_in * 1000);

        const response = NextResponse.json(tokens);

        // Set httpOnly cookies for better security
        response.cookies.set("shopify-access-token", tokens.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          expires: expirationDate,
          path: "/",
        });

        if (tokens.refresh_token) {
          response.cookies.set("shopify-refresh-token", tokens.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            expires: expirationDate,
            path: "/",
          });
        }

        // Store id_token for logout functionality
        if (tokens.id_token) {
          response.cookies.set("shopify-id-token", tokens.id_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            expires: expirationDate,
            path: "/",
          });
        }

        // Store token metadata in a separate cookie (not httpOnly so client can read expiration)
        const tokenMetadata = {
          tokenType: tokens.token_type,
          expiresIn: tokens.expires_in,
          issuedAt,
          scope: tokens.scope,
          hasRefreshToken: !!tokens.refresh_token,
          hasIdToken: !!tokens.id_token,
        };

        response.cookies.set(
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

        return response;
      }

      return NextResponse.json(tokens);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        return NextResponse.json(
          {
            error: "Request timeout",
            error_description: "Token exchange request timed out",
          },
          { status: 408 }
        );
      }
      throw fetchError;
    }
  } catch (error) {
    console.error("Server-side token exchange error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
