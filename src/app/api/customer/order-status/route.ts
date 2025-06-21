import { NextRequest, NextResponse } from "next/server";
import { GraphQLClient } from "graphql-request";

interface OrderStatusResponse {
  orders: {
    edges: Array<{
      node: {
        id: string;
        cancelledAt: string | null;
        cancelReason: string | null;
        fulfillmentStatus: string;
        financialStatus: string;
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
    const { orderIds } = await request.json();

    if (!orderIds || !Array.isArray(orderIds)) {
      return NextResponse.json(
        { error: "Order IDs array is required" },
        { status: 400 }
      );
    }

    // Get environment variables
    const adminApiToken = process.env.SHOPIFY_ADMIN_API_TOKEN;
    const shopDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;

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
    const client = new GraphQLClient(
      `https://${shopDomain}/admin/api/2024-10/graphql.json`,
      {
        headers: {
          "X-Shopify-Access-Token": adminApiToken,
          "Content-Type": "application/json",
        },
      }
    );

    // Build the query with order IDs
    const orderIdsString = orderIds.map((id) => `"${id}"`).join(", ");

    const ordersQuery = `
      query GetOrdersStatus {
        orders(first: 50, query: "id:${orderIdsString}") {
          edges {
            node {
              id
              cancelledAt
              cancelReason
              fulfillmentStatus
              financialStatus
            }
          }
        }
      }
    `;

    const response = await client.request<OrderStatusResponse>(ordersQuery);

    // Transform the response to a more usable format
    const orderStatuses = response.orders.edges.reduce((acc, { node }) => {
      acc[node.id] = {
        id: node.id,
        cancelledAt: node.cancelledAt,
        cancelReason: node.cancelReason,
        fulfillmentStatus: node.fulfillmentStatus,
        financialStatus: node.financialStatus,
        isCancelled: node.cancelledAt !== null,
      };
      return acc;
    }, {} as Record<string, OrderStatus>);

    return NextResponse.json({
      success: true,
      orderStatuses,
    });
  } catch (error) {
    console.error("Error fetching order statuses:", error);
    return NextResponse.json(
      { error: "Failed to fetch order statuses" },
      { status: 500 }
    );
  }
}
