import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, getCustomerOrders } from "@/lib/api-auth-helpers";

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
    const authResult = await authenticateRequest(request);

    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || "Authentication failed" },
        { status: authResult.statusCode || 401 }
      );
    }

    const { apiClient } = authResult.user;
    const { orderIds } = await request.json();

    if (!orderIds || !Array.isArray(orderIds)) {
      return NextResponse.json(
        { error: "Order IDs array is required" },
        { status: 400 }
      );
    }

    // Use the secure helper to fetch orders for the authenticated customer
    const ordersResult = await getCustomerOrders(apiClient, orderIds);

    if (!ordersResult.success || !ordersResult.orders) {
      return NextResponse.json(
        { error: ordersResult.error || "Failed to fetch orders" },
        { status: 500 }
      );
    }

    // Transform the response to the required format
    const orderStatuses = ordersResult.orders.reduce(
      (acc: Record<string, OrderStatus>, order) => {
        acc[order.id] = {
          id: order.id,
          cancelledAt: order.cancelledAt || null,
          cancelReason: order.cancelReason || null,
          fulfillmentStatus: order.fulfillmentStatus,
          financialStatus: order.financialStatus,
          isCancelled: order.cancelledAt !== null,
        };
        return acc;
      },
      {}
    );

    return NextResponse.json({
      success: true,
      orderStatuses,
    });
  } catch (error) {
    console.error("Order Status API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
