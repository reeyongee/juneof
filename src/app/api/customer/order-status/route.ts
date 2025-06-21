import { NextRequest, NextResponse } from "next/server";
import { GraphQLClient } from "graphql-request";

interface OrderStatusResponse {
  orders: {
    edges: Array<{
      node: {
        id: string;
        cancelledAt: string | null;
        cancelReason: string | null;
        displayFulfillmentStatus: string;
        displayFinancialStatus: string;
      };
    }>;
  };
}

interface OrderStatus {
  id: string;
  cancelledAt: string | null;
  cancelReason: string | null;
  fulfillmentStatus: string;
  financialStatus: string;
  isCancelled: boolean;
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== Order Status API Called ===");

    const { orderIds } = await request.json();
    console.log("Received orderIds:", orderIds);

    if (!orderIds || !Array.isArray(orderIds)) {
      console.error("Invalid orderIds:", orderIds);
      return NextResponse.json(
        { error: "Order IDs array is required" },
        { status: 400 }
      );
    }

    // Get environment variables
    const adminApiToken = process.env.SHOPIFY_ADMIN_API_TOKEN;
    const shopDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;

    console.log("Environment check:", {
      hasAdminToken: !!adminApiToken,
      hasShopDomain: !!shopDomain,
      shopDomain: shopDomain
        ? `${shopDomain.substring(0, 10)}...`
        : "undefined",
      tokenLength: adminApiToken ? adminApiToken.length : 0,
    });

    if (!adminApiToken || !shopDomain) {
      console.error("Missing environment variables:", {
        hasAdminToken: !!adminApiToken,
        hasShopDomain: !!shopDomain,
      });
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Create GraphQL client for Admin API
    const graphqlEndpoint = `https://${shopDomain}/admin/api/2025-04/graphql.json`;
    console.log("GraphQL endpoint:", graphqlEndpoint);

    const client = new GraphQLClient(graphqlEndpoint, {
      headers: {
        "X-Shopify-Access-Token": adminApiToken,
        "Content-Type": "application/json",
      },
    });

    // Build the query with order IDs using OR operator for multiple IDs
    const orderIdsQuery = orderIds.map((id) => `id:${id}`).join(" OR ");
    console.log("Order IDs query for GraphQL:", orderIdsQuery);

    const ordersQuery = `
      query GetOrdersStatus {
        orders(first: 50, query: "${orderIdsQuery}") {
          edges {
            node {
              id
              cancelledAt
              cancelReason
              displayFulfillmentStatus
              displayFinancialStatus
            }
          }
        }
      }
    `;

    console.log("Executing GraphQL query:", ordersQuery);

    const response = await client.request<OrderStatusResponse>(ordersQuery);
    console.log(
      "GraphQL response received:",
      JSON.stringify(response, null, 2)
    );

    // Transform the response to a more usable format
    const orderStatuses = response.orders.edges.reduce((acc, { node }) => {
      acc[node.id] = {
        id: node.id,
        cancelledAt: node.cancelledAt,
        cancelReason: node.cancelReason,
        fulfillmentStatus: node.displayFulfillmentStatus,
        financialStatus: node.displayFinancialStatus,
        isCancelled: node.cancelledAt !== null,
      };
      return acc;
    }, {} as Record<string, OrderStatus>);

    console.log("Transformed order statuses:", orderStatuses);

    return NextResponse.json({
      success: true,
      orderStatuses,
    });
  } catch (error: unknown) {
    console.error("=== ORDER STATUS API ERROR ===");
    console.error("Error:", error);

    let errorMessage = "Unknown error";
    let errorDetails = {};

    if (error instanceof Error) {
      errorMessage = error.message;
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    // Check if it's a GraphQL error (has response property)
    if (error && typeof error === "object" && "response" in error) {
      console.error("GraphQL response error detected");
      const graphqlError = error as { response: unknown };
      console.error("Response:", graphqlError.response);
      errorDetails = { type: "GraphQL", response: graphqlError.response };
    }

    // Check if it's a network error (has request property)
    if (error && typeof error === "object" && "request" in error) {
      console.error("Network request error detected");
      const networkError = error as { request: unknown };
      console.error("Request:", networkError.request);
      errorDetails = { type: "Network", request: networkError.request };
    }

    return NextResponse.json(
      {
        error: "Failed to fetch order statuses",
        details: errorMessage,
        errorInfo: errorDetails,
      },
      { status: 500 }
    );
  }
}
