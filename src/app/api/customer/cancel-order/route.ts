import { NextRequest, NextResponse } from "next/server";
import { GraphQLClient } from "graphql-request";
import { authenticateRequest } from "@/lib/api-auth-helpers";

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
    const authResult = await authenticateRequest(request);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.statusCode }
      );
    }

    const { user } = authResult;
    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Get environment variables for Admin API
    const adminApiToken = process.env.SHOPIFY_ADMIN_API_TOKEN;
    const shopDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;

    if (!adminApiToken || !shopDomain) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Create a GraphQL client for the Admin API to check order details
    const adminApiUrl = `https://${shopDomain}/admin/api/2024-10/graphql.json`;
    const adminClient = new GraphQLClient(adminApiUrl, {
      headers: {
        "X-Shopify-Access-Token": adminApiToken,
        "Content-Type": "application/json",
      },
    });

    // First, check if the order exists and get its customer and fulfillment status
    const orderQuery = `
      query GetOrder($id: ID!) {
        order(id: $id) {
          id
          displayFulfillmentStatus
          customer {
            id
          }
        }
      }
    `;

    interface OrderResponse {
      order: {
        id: string;
        displayFulfillmentStatus: string;
        customer?: {
          id: string;
        };
      } | null;
    }

    const orderResponse = await adminClient.request<OrderResponse>(orderQuery, {
      id: orderId,
    });

    if (!orderResponse.order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orderResponse.order;

    // Securely cross-reference the order's customer ID with the authenticated user's ID
    if (!order.customer || order.customer.id !== user.customerId) {
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

    // Cancel the order using the Admin API
    const cancelMutation = `
      mutation OrderCancel($orderId: ID!) {
        orderCancel(orderId: $orderId, reason: CUSTOMER, refund: true, restock: true, notifyCustomer: true) {
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

    const cancelResponse = await adminClient.request<CancelResponse>(
      cancelMutation,
      {
        orderId: orderId,
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
