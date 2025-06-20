import { NextRequest, NextResponse } from "next/server";
import { GraphQLClient } from "graphql-request";

interface OrderResponse {
  order: {
    id: string;
    name: string;
    displayFulfillmentStatus: string;
    fulfillmentStatus: string;
    financialStatus: string;
    customer?: {
      id: string;
    };
    fulfillments: Array<{
      status: string;
    }>;
  } | null;
}

interface CancelResponse {
  orderCancel: {
    job: {
      id: string;
      done: boolean;
    } | null;
    orderCancelUserErrors: Array<{
      code: string;
      message: string;
      field: string[];
    }>;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { orderId, customerId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
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
    const adminApiUrl = `https://${shopDomain}/admin/api/2024-10/graphql.json`;
    const client = new GraphQLClient(adminApiUrl, {
      headers: {
        "X-Shopify-Access-Token": adminApiToken,
        "Content-Type": "application/json",
      },
    });

    // First, check if the order exists and get its fulfillment status
    const orderQuery = `
      query GetOrder($id: ID!) {
        order(id: $id) {
          id
          name
          displayFulfillmentStatus
          fulfillmentStatus
          financialStatus
          customer {
            id
          }
          fulfillments {
            status
          }
        }
      }
    `;

    const orderResponse = await client.request<OrderResponse>(orderQuery, {
      id: orderId,
    });

    if (!orderResponse.order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orderResponse.order;

    // Check if the order belongs to the customer (if customerId is provided)
    if (customerId && order.customer?.id !== customerId) {
      return NextResponse.json(
        { error: "Unauthorized to cancel this order" },
        { status: 403 }
      );
    }

    // Check if the order can be cancelled (not fulfilled)
    if (order.displayFulfillmentStatus === "FULFILLED") {
      return NextResponse.json(
        { error: "Cannot cancel a fulfilled order" },
        { status: 400 }
      );
    }

    // Cancel the order
    const cancelMutation = `
      mutation OrderCancel($orderId: ID!, $reason: OrderCancelReason!) {
        orderCancel(
          orderId: $orderId
          reason: $reason
          refund: true
          restock: true
          notifyCustomer: true
        ) {
          job {
            id
            done
          }
          orderCancelUserErrors {
            code
            message
            field
          }
        }
      }
    `;

    const cancelResponse = await client.request<CancelResponse>(
      cancelMutation,
      {
        orderId: orderId,
        reason: "CUSTOMER",
      }
    );

    if (cancelResponse.orderCancel.orderCancelUserErrors?.length > 0) {
      const errors = cancelResponse.orderCancel.orderCancelUserErrors;
      return NextResponse.json(
        {
          error: "Failed to cancel order",
          details: errors.map((err) => err.message).join(", "),
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Order cancellation initiated successfully",
      job: cancelResponse.orderCancel.job,
    });
  } catch (error) {
    console.error("Cancel order API error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
