import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const shopId = process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_SHOP_ID;
    const appUrl = process.env.NEXTAUTH_URL;

    if (!shopId || !appUrl) {
      return NextResponse.json(
        { error: "Missing required environment variables" },
        { status: 500 }
      );
    }

    // Get the ID token from cookies
    const idToken = request.cookies.get("id_token")?.value;

    // Create response and clear all auth cookies
    const response = NextResponse.json({ success: true });

    response.cookies.delete("access_token");
    response.cookies.delete("refresh_token");
    response.cookies.delete("id_token");

    // If we have an ID token, we should redirect to Shopify's logout endpoint
    if (idToken) {
      const logoutUrl = new URL(
        `https://shopify.com/authentication/${shopId}/logout`
      );
      logoutUrl.searchParams.append("id_token_hint", idToken);
      logoutUrl.searchParams.append("post_logout_redirect_uri", appUrl);

      return NextResponse.redirect(logoutUrl.toString());
    }

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
