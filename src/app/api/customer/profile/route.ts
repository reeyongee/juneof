import { NextRequest, NextResponse } from "next/server";
import {
  makeCustomerAccountRequest,
  refreshAccessToken,
} from "@/lib/shopify-customer-auth";

const GET_CUSTOMER_QUERY = `
  query GetCustomer {
    customer {
      id
      firstName
      lastName
      emailAddress {
        emailAddress
      }
      phoneNumber {
        phoneNumber
      }
      defaultAddress {
        id
        firstName
        lastName
        address1
        address2
        city
        province
        country
        zip
      }
    }
  }
`;

export async function GET(request: NextRequest) {
  try {
    const shopId = process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_SHOP_ID;
    const clientId = process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID;
    const clientSecret = process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET;

    if (!shopId || !clientId) {
      return NextResponse.json(
        { error: "Missing required environment variables" },
        { status: 500 }
      );
    }

    let accessToken = request.cookies.get("access_token")?.value;
    const refreshToken = request.cookies.get("refresh_token")?.value;

    if (!accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    try {
      // Try to make the request with the current access token
      const result = await makeCustomerAccountRequest(
        shopId,
        accessToken,
        GET_CUSTOMER_QUERY
      );

      if (result.errors) {
        // If we get an authentication error, try to refresh the token
        const authError = result.errors.find(
          (error: { extensions?: { code?: string } }) =>
            error.extensions?.code === "UNAUTHENTICATED"
        );

        if (authError && refreshToken) {
          // Refresh the access token
          const config = {
            clientId,
            shopId,
            redirectUri: "", // Not needed for refresh
          };

          const newTokens = await refreshAccessToken(
            config,
            refreshToken,
            clientSecret
          );
          accessToken = newTokens.access_token;

          // Retry the request with the new token
          const retryResult = await makeCustomerAccountRequest(
            shopId,
            accessToken,
            GET_CUSTOMER_QUERY
          );

          // Update the access token cookie
          const response = NextResponse.json(retryResult);
          response.cookies.set("access_token", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: newTokens.expires_in,
          });

          return response;
        } else {
          return NextResponse.json(
            { error: "Authentication failed" },
            { status: 401 }
          );
        }
      }

      return NextResponse.json(result);
    } catch (error) {
      console.error("Customer API request error:", error);
      return NextResponse.json(
        { error: "Failed to fetch customer data" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Customer profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
