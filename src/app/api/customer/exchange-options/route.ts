import { NextRequest, NextResponse } from "next/server";
import { GraphQLClient } from "graphql-request";
import { authenticateRequest } from "@/lib/api-auth-helpers";

interface ReturnableFulfillmentLineItem {
  fulfillmentLineItem: {
    id: string;
    lineItem: {
      id: string;
      name: string;
      variantTitle: string;
      product: {
        id: string;
        handle: string;
        title: string;
        variants: {
          edges: Array<{
            node: {
              id: string;
              title: string;
              availableForSale: boolean;
              inventoryQuantity: number;
              inventoryPolicy: string;
            };
          }>;
        };
      };
    };
  };
  quantity: number;
}

interface ReturnableFulfillment {
  id: string;
  returnableFulfillmentLineItems: {
    edges: Array<{
      node: ReturnableFulfillmentLineItem;
    }>;
  };
}

interface ReturnableFulfillmentsResponse {
  returnableFulfillments: {
    edges: Array<{
      node: ReturnableFulfillment;
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
    const { orderId, lineItemId } = await request.json();

    if (!orderId || !lineItemId) {
      return NextResponse.json(
        { error: "Order ID and Line Item ID are required" },
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

    // Get returnable fulfillments for the order
    const returnableFulfillmentsQuery = `
      query GetReturnableFulfillments($orderId: ID!) {
        returnableFulfillments(orderId: $orderId, first: 10) {
          edges {
            node {
              id
              returnableFulfillmentLineItems(first: 20) {
                edges {
                  node {
                    fulfillmentLineItem {
                      id
                      lineItem {
                        id
                        name
                        variantTitle
                        product {
                          id
                          handle
                          title
                          variants(first: 50) {
                            edges {
                              node {
                                id
                                title
                                availableForSale
                                inventoryQuantity
                                inventoryPolicy
                              }
                            }
                          }
                        }
                      }
                    }
                    quantity
                  }
                }
              }
            }
          }
        }
      }
    `;

    const returnableFulfillmentsResponse =
      await adminClient.request<ReturnableFulfillmentsResponse>(
        returnableFulfillmentsQuery,
        { orderId }
      );

    // Find the specific line item
    let targetFulfillmentLineItem: ReturnableFulfillmentLineItem | null = null;
    let targetFulfillmentId: string | null = null;

    for (const fulfillmentEdge of returnableFulfillmentsResponse
      .returnableFulfillments.edges) {
      for (const lineItemEdge of fulfillmentEdge.node
        .returnableFulfillmentLineItems.edges) {
        if (lineItemEdge.node.fulfillmentLineItem.lineItem.id === lineItemId) {
          targetFulfillmentLineItem = lineItemEdge.node;
          targetFulfillmentId = fulfillmentEdge.node.id;
          break;
        }
      }
      if (targetFulfillmentLineItem) break;
    }

    if (!targetFulfillmentLineItem || !targetFulfillmentId) {
      return NextResponse.json(
        { error: "Line item not eligible for return" },
        { status: 400 }
      );
    }

    // Format the response with available variants
    const availableVariants =
      targetFulfillmentLineItem.fulfillmentLineItem.lineItem.product.variants.edges.map(
        (variantEdge) => ({
          id: variantEdge.node.id,
          title: variantEdge.node.title,
          availableForSale: variantEdge.node.availableForSale,
          inventoryQuantity: variantEdge.node.inventoryQuantity,
          inStock:
            variantEdge.node.availableForSale &&
            (variantEdge.node.inventoryPolicy === "CONTINUE" ||
              variantEdge.node.inventoryQuantity > 0),
        })
      );

    return NextResponse.json({
      success: true,
      exchangeOptions: {
        fulfillmentLineItemId: targetFulfillmentLineItem.fulfillmentLineItem.id,
        fulfillmentId: targetFulfillmentId,
        originalItem: {
          id: targetFulfillmentLineItem.fulfillmentLineItem.lineItem.id,
          name: targetFulfillmentLineItem.fulfillmentLineItem.lineItem.name,
          variantTitle:
            targetFulfillmentLineItem.fulfillmentLineItem.lineItem.variantTitle,
        },
        product: {
          id: targetFulfillmentLineItem.fulfillmentLineItem.lineItem.product.id,
          handle:
            targetFulfillmentLineItem.fulfillmentLineItem.lineItem.product
              .handle,
          title:
            targetFulfillmentLineItem.fulfillmentLineItem.lineItem.product
              .title,
        },
        availableVariants,
        maxQuantity: targetFulfillmentLineItem.quantity,
      },
    });
  } catch (error) {
    console.error("Exchange Options API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
