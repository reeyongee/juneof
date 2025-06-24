import { NextRequest, NextResponse } from "next/server";
import {
  createAuthorizationUrl,
  type ShopifyAuthConfig,
} from "@/lib/shopify-auth";

/**
 * Secure OAuth initiation endpoint that stores state server-side
 * This prevents CSRF attacks by validating state on the server
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { options = {} } = body;

    // Get environment variables
    const shopId = process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_SHOP_ID;
    const clientId = process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID;
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_NEXTAUTH_URL ||
      "https://dev.juneof.com";
    const redirectUri = baseUrl + "/api/auth/shopify/callback";

    // Enhanced logging for debugging
    console.log("🔐 OAuth initiate request:", {
      userAgent: request.headers.get("user-agent"),
      origin: request.headers.get("origin"),
      referer: request.headers.get("referer"),
      baseUrl,
      redirectUri,
      environment: process.env.NODE_ENV,
    });

    if (!shopId || !clientId) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const config: ShopifyAuthConfig = {
      shopId,
      clientId,
      redirectUri,
      scope: "openid email customer-account-api:full",
    };

    // Generate authorization URL with security parameters
    const { url, state, nonce, codeVerifier } = await createAuthorizationUrl(
      config,
      options
    );

    console.log(
      "🔐 OAuth initiate - Generated state:",
      state.substring(0, 8) + "..."
    );

    // Create response with authorization URL
    const response = NextResponse.json({
      authorizationUrl: url,
      state, // Client needs this for localStorage storage (backward compatibility)
      nonce, // Client needs this for localStorage storage
      codeVerifier, // Client needs this for localStorage storage
    });

    // Determine cookie settings based on environment and user agent
    const isProduction = process.env.NODE_ENV === "production";
    const isDevelopment = process.env.NODE_ENV === "development";
    const userAgent = request.headers.get("user-agent") || "";
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);

    // More permissive settings for development and mobile devices
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction, // Only secure in production
      sameSite:
        isDevelopment || isMobile ? ("lax" as const) : ("strict" as const), // More permissive for dev/mobile
      path: "/",
      maxAge: 1800, // 30 minutes - increased for slower mobile flows
      // Add domain for production to ensure cross-subdomain compatibility
      ...(isProduction && { domain: ".juneof.com" }),
    };

    console.log("🍪 Setting OAuth cookies with options:", {
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      maxAge: cookieOptions.maxAge,
      domain: cookieOptions.domain || "default",
      environment: process.env.NODE_ENV,
      isMobile,
      userAgent: userAgent.substring(0, 50) + "...",
    });

    // Store state in secure httpOnly cookie for server-side validation
    response.cookies.set("oauth-state", state, cookieOptions);

    // Also store nonce for ID token validation
    response.cookies.set("oauth-nonce", nonce, cookieOptions);

    // Add additional debugging cookie to track the flow
    response.cookies.set(
      "oauth-debug",
      JSON.stringify({
        timestamp: Date.now(),
        userAgent: isMobile ? "mobile" : "desktop",
        environment: process.env.NODE_ENV,
      }),
      {
        ...cookieOptions,
        httpOnly: false, // Allow client-side access for debugging
      }
    );

    return response;
  } catch (error) {
    console.error("OAuth initiation error:", error);
    return NextResponse.json(
      {
        error: "Failed to initiate OAuth flow",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
