import { NextRequest, NextResponse } from "next/server";
import { CustomerAccountApiClient } from "@/lib/shopify-auth";

/**
 * Server-side API endpoint to fetch customer profile data
 * This demonstrates how to use stored tokens on the server side
 */
export async function GET(request: NextRequest) {
  try {
    // In a real application, you would:
    // 1. Get the access token from the user's session/cookies
    // 2. Validate the token and check expiration
    // 3. Refresh the token if needed

    // For this demo, we expect the token to be passed as a header
    const accessToken = request.headers
      .get("authorization")
      ?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json(
        { error: "Missing access token" },
        { status: 401 }
      );
    }

    // Get environment variables
    const shopId = process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_SHOP_ID;

    if (!shopId) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Create API client
    const apiClient = new CustomerAccountApiClient({
      shopId,
      accessToken,
    });

    // Fetch customer profile
    const response = await apiClient.getCustomerProfile();

    if (response.errors && response.errors.length > 0) {
      return NextResponse.json(
        {
          error: "GraphQL Error",
          details: response.errors[0].message,
        },
        { status: 400 }
      );
    }

    // Return customer data
    return NextResponse.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error("Customer profile API error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint to fetch customer data with custom queries
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, variables, accessToken } = body;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Missing access token" },
        { status: 401 }
      );
    }

    if (!query) {
      return NextResponse.json(
        { error: "Missing GraphQL query" },
        { status: 400 }
      );
    }

    // Get environment variables
    const shopId = process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_SHOP_ID;

    if (!shopId) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Create API client
    const apiClient = new CustomerAccountApiClient({
      shopId,
      accessToken,
    });

    // Execute custom query
    const response = await apiClient.query({
      query,
      variables,
    });

    if (response.errors && response.errors.length > 0) {
      return NextResponse.json(
        {
          error: "GraphQL Error",
          details: response.errors,
        },
        { status: 400 }
      );
    }

    // Return query results
    return NextResponse.json({
      success: true,
      data: response.data,
      extensions: response.extensions,
    });
  } catch (error) {
    console.error("Custom query API error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
