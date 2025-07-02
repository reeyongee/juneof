import { NextRequest, NextResponse } from "next/server";
import { GraphQLClient } from "graphql-request";
import { authenticateRequest } from "@/lib/api-auth-helpers";

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error || "authentication failed" },
        { status: auth.statusCode || 401 }
      );
    }

    const { orderId, lineItemId, newVariantId } = await request.json();

    if (!orderId || !lineItemId || !newVariantId) {
      return NextResponse.json(
        { error: "orderId, lineItemId and newVariantId are required" },
        { status: 400 }
      );
    }

    const adminApiToken = process.env.SHOPIFY_ADMIN_API_TOKEN;
    const shopDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;

    if (!adminApiToken || !shopDomain) {
      return NextResponse.json(
        { error: "server configuration error" },
        { status: 500 }
      );
    }

    const adminClient = new GraphQLClient(
      `https://${shopDomain}/admin/api/2024-10/graphql.json`,
      {
        headers: {
          "X-Shopify-Access-Token": adminApiToken,
          "Content-Type": "application/json",
        },
      }
    );

    // Step 1: Fetch returnable fulfillment line item ID
    const fulfillQuery = `
      query ReturnableFulfillments($orderId: ID!) {
        returnableFulfillments(orderId: $orderId, first: 10) {
          edges {
            node {
              id
              returnableFulfillmentLineItems(first: 30) {
                edges {
                  node {
                    fulfillmentLineItem {
                      id
                      lineItem {
                        id
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

    interface FulfillmentLineItemEdge {
      node: {
        fulfillmentLineItem: {
          id: string;
          lineItem: {
            id: string;
          };
        };
        quantity: number;
      };
    }

    interface FulfillData {
      returnableFulfillments: {
        edges: Array<{
          node: {
            id: string;
            returnableFulfillmentLineItems: {
              edges: FulfillmentLineItemEdge[];
            };
          };
        }>;
      };
    }

    const fulfillData = await adminClient.request<FulfillData>(fulfillQuery, {
      orderId,
    });

    let fulfillmentLineItemId: string | null = null;

    for (const fulfillmentEdge of fulfillData.returnableFulfillments.edges) {
      for (const lineEdge of fulfillmentEdge.node.returnableFulfillmentLineItems
        .edges) {
        if (lineEdge.node.fulfillmentLineItem.lineItem.id === lineItemId) {
          fulfillmentLineItemId = lineEdge.node.fulfillmentLineItem.id;
          break;
        }
      }
      if (fulfillmentLineItemId) break;
    }

    if (!fulfillmentLineItemId) {
      return NextResponse.json(
        { error: "unable to locate fulfillment line item" },
        { status: 400 }
      );
    }

    // Step 2: Create return with exchange line item
    const returnCreateMutation = `
      mutation ReturnCreate($input: ReturnInput!) {
        returnCreate(returnInput: $input) {
          return {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const returnInput = {
      orderId,
      returnLineItems: [
        {
          fulfillmentLineItemId: fulfillmentLineItemId,
          quantity: 1,
          returnReason: "SIZE_TOO_SMALL",
          returnReasonNote: "Customer requested size exchange",
        },
      ],
      exchangeLineItems: [
        {
          variantId: newVariantId,
          quantity: 1,
        },
      ],
      notifyCustomer: true,
      requestedAt: new Date().toISOString(),
    };

    interface ReturnCreateResponse {
      returnCreate: {
        return: {
          id: string;
        } | null;
        userErrors: Array<{ field: string[]; message: string }>;
      };
    }

    const createResp = await adminClient.request<ReturnCreateResponse>(
      returnCreateMutation,
      { input: returnInput }
    );

    if (createResp.returnCreate.userErrors.length > 0) {
      return NextResponse.json(
        { error: createResp.returnCreate.userErrors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      returnId: createResp.returnCreate.return?.id,
    });
  } catch (error) {
    console.error("Exchange API error", error);
    return NextResponse.json(
      {
        error: "internal server error",
        message: error instanceof Error ? error.message : "unknown error",
      },
      { status: 500 }
    );
  }
}
