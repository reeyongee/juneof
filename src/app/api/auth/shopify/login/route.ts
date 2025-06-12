import { NextResponse } from "next/server";
import { buildAuthorizationUrl } from "@/lib/shopify-customer-auth";

export async function GET() {
  try {
    const clientId = process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID;
    const shopId = process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_SHOP_ID;
    const appUrl = process.env.NEXTAUTH_URL;

    if (!clientId || !shopId || !appUrl) {
      return NextResponse.json(
        { error: "Missing required environment variables" },
        { status: 500 }
      );
    }

    const config = {
      clientId,
      shopId,
      redirectUri: `${appUrl}/api/auth/shopify/callback`,
    };

    const clientSecret = process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET;
    const isConfidentialClient = !!clientSecret;

    const { url, codeVerifier, state, nonce } = await buildAuthorizationUrl(
      config,
      isConfidentialClient
    );

    // Store the code verifier, state, and nonce in a secure way
    // For this example, we'll use cookies (in production, consider using a secure session store)
    const response = NextResponse.redirect(url);

    // Set secure cookies to store OAuth state
    response.cookies.set("oauth_code_verifier", codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
    });

    response.cookies.set("oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
    });

    response.cookies.set("oauth_nonce", nonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
    });

    return response;
  } catch (error) {
    console.error("Login initiation error:", error);
    return NextResponse.json(
      { error: "Failed to initiate login" },
      { status: 500 }
    );
  }
}
