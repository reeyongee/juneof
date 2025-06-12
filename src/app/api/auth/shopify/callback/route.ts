import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/shopify-customer-auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Check for OAuth errors
    if (error) {
      console.error("OAuth error:", error);
      return NextResponse.redirect(
        new URL("/login?error=oauth_error", request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/login?error=missing_params", request.url)
      );
    }

    // Get stored OAuth state from cookies
    const storedState = request.cookies.get("oauth_state")?.value;
    const codeVerifier = request.cookies.get("oauth_code_verifier")?.value;
    const nonce = request.cookies.get("oauth_nonce")?.value;

    if (!storedState || !codeVerifier || !nonce) {
      return NextResponse.redirect(
        new URL("/login?error=missing_state", request.url)
      );
    }

    // Verify state parameter to prevent CSRF attacks
    if (state !== storedState) {
      return NextResponse.redirect(
        new URL("/login?error=invalid_state", request.url)
      );
    }

    const clientId = process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID;
    const clientSecret = process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET;
    const shopId = process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_SHOP_ID;
    const appUrl = process.env.NEXTAUTH_URL;

    if (!clientId || !shopId || !appUrl) {
      return NextResponse.redirect(
        new URL("/login?error=config_error", request.url)
      );
    }

    const config = {
      clientId,
      shopId,
      redirectUri: `${appUrl}/api/auth/shopify/callback`,
    };

    // Exchange authorization code for tokens
    const tokens = await exchangeCodeForTokens(
      config,
      code,
      codeVerifier,
      clientSecret
    );

    // Create response and set secure cookies for tokens
    const response = NextResponse.redirect(new URL("/account", request.url));

    // Store tokens in secure cookies
    response.cookies.set("access_token", tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokens.expires_in,
    });

    response.cookies.set("refresh_token", tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    response.cookies.set("id_token", tokens.id_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokens.expires_in,
    });

    // Clear OAuth state cookies
    response.cookies.delete("oauth_code_verifier");
    response.cookies.delete("oauth_state");
    response.cookies.delete("oauth_nonce");

    return response;
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/login?error=token_exchange_failed", request.url)
    );
  }
}
