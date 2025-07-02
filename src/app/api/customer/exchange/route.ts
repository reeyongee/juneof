import { NextRequest, NextResponse } from "next/server";
import { GraphQLClient } from "graphql-request";
import { authenticateRequest } from "@/lib/api-auth-helpers";

interface CreateReturnResponse {
  returnCreate: {
    return: {
      id: string;
      name: string;
      status: string;
      exchangeLineItems: {
        edges: Array<{
          node: {
            id: string;
            variantId: string;
            quantity: number;
          };
        }>;
      };
    } | null;
    userErrors: Array<{
      field: string[];
      message: string;
    }>;
  };
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

    const { customerId } = authResult.user;
    const {
      orderId,
      fulfillmentLineItemId,
      returnQuantity,
      returnReason,
      returnReasonNote,
      exchangeVariantId,
      exchangeQuantity,
    } = await request.json();

    if (
      !orderId ||
      !fulfillmentLineItemId ||
      !returnQuantity ||
      !returnReason ||
      !exchangeVariantId ||
      !exchangeQuantity
    ) {
      return NextResponse.json(
        { error: "Missing required fields for exchange" },
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

    // Create a GraphQL client for the Admin API
    const adminApiUrl = `https://${shopDomain}/admin/api/2025-07/graphql.json`;
    const adminClient = new GraphQLClient(adminApiUrl, {
      headers: {
        "X-Shopify-Access-Token": adminApiToken,
        "Content-Type": "application/json",
      },
    });

    // First verify order ownership
    const orderOwnershipQuery = `
      query VerifyOrderOwnership($id: ID!) {
        order(id: $id) {
          id
          customer {
            id
          }
        }
      }
    `;

    const orderResponse = await adminClient.request<{
      order: {
        id: string;
        customer: {
          id: string;
        } | null;
      } | null;
    }>(orderOwnershipQuery, {
      id: orderId,
    });

    if (
      !orderResponse.order ||
      orderResponse.order.customer?.id !== customerId
    ) {
      return NextResponse.json(
        { error: "Order not found or access denied" },
        { status: 403 }
      );
    }

    // Create the return with exchange
    const returnCreateMutation = `
      mutation CreateReturnWithExchange($returnInput: ReturnInput!) {
        returnCreate(returnInput: $returnInput) {
          return {
            id
            name
            status
            exchangeLineItems(first: 10) {
              edges {
                node {
                  id
                  variantId
                  quantity
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const returnInput = {
      orderId: orderId,
      returnLineItems: [
        {
          fulfillmentLineItemId: fulfillmentLineItemId,
          quantity: parseInt(returnQuantity.toString()),
          returnReason: returnReason,
          returnReasonNote:
            returnReasonNote || "Customer requested size exchange",
        },
      ],
      exchangeLineItems: [
        {
          variantId: exchangeVariantId,
          quantity: parseInt(exchangeQuantity.toString()),
        },
      ],
      notifyCustomer: true,
      requestedAt: new Date().toISOString(),
    };

    const createReturnResponse =
      await adminClient.request<CreateReturnResponse>(returnCreateMutation, {
        returnInput,
      });

    if (createReturnResponse.returnCreate.userErrors.length > 0) {
      return NextResponse.json(
        {
          error: "Failed to create exchange",
          details: createReturnResponse.returnCreate.userErrors,
        },
        { status: 400 }
      );
    }

    if (!createReturnResponse.returnCreate.return) {
      return NextResponse.json(
        { error: "Failed to create exchange - no return created" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      exchange: {
        returnId: createReturnResponse.returnCreate.return.id,
        returnName: createReturnResponse.returnCreate.return.name,
        status: createReturnResponse.returnCreate.return.status,
        exchangeItems:
          createReturnResponse.returnCreate.return.exchangeLineItems.edges.map(
            (edge) => ({
              id: edge.node.id,
              variantId: edge.node.variantId,
              quantity: edge.node.quantity,
            })
          ),
      },
    });
  } catch (error) {
    console.error("Exchange API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
