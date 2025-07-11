import { NextRequest, NextResponse } from "next/server";
import { GraphQLClient } from "graphql-request";
import { authenticateRequest } from "@/lib/api-auth-helpers";

interface OrderStatus {
  id: string;
  cancelledAt: string | null;
  cancelReason: string | null;
  displayFulfillmentStatus: string;
  displayFinancialStatus: string;
  isCancelled: boolean;
  trackingNumbers: string[];
  exchangeTrackingNumbers?: Record<string, string[]>; // returnId -> tracking numbers
}

interface Node {
  id: string;
  cancelledAt: string | null;
  cancelReason: string | null;
  displayFulfillmentStatus: string;
  displayFinancialStatus: string;
  customer?: {
    id: string;
  };
  fulfillments: {
    trackingInfo: {
      number: string;
    }[];
  }[];
  returns: {
    edges: Array<{
      node: {
        id: string;
        status: string;
        reverseFulfillmentOrders: {
          nodes: Array<{
            id: string;
            status: string;
            fulfillments: {
              nodes: Array<{
                id: string;
                trackingInfo: {
                  number: string;
                }[];
              }>;
            };
          }>;
        };
      };
    }>;
  };
}

interface NodesResponse {
  nodes: (Node | null)[];
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
    const { orderIds } = await request.json();

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ orderStatuses: {} });
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

    // Use a 'nodes' query for efficient fetching of multiple orders
    const nodesQuery = `
      query GetOrdersByIds($ids: [ID!]!) {
        nodes(ids: $ids) {
          ... on Order {
            id
            cancelledAt
            cancelReason
            displayFulfillmentStatus
            displayFinancialStatus
            customer {
              id
            }
            fulfillments(first: 50) {
              trackingInfo(first: 50) {
                number
              }
            }
            returns(first: 50) {
              edges {
                node {
                  id
                  status
                  reverseFulfillmentOrders(first: 50) {
                    nodes {
                      id
                      status
                      fulfillments(first: 50) {
                        nodes {
                          id
                          trackingInfo(first: 50) {
                            number
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const nodesResponse = await adminClient.request<NodesResponse>(nodesQuery, {
      ids: orderIds,
    });

    const orderStatuses = (nodesResponse.nodes || []).reduce(
      (acc: Record<string, OrderStatus>, node) => {
        // Important: Check ownership and ensure node is not null
        if (node && node.customer?.id === customerId) {
          // Extract tracking numbers from fulfillments
          const trackingNumbers: string[] = [];
          if (node.fulfillments) {
            node.fulfillments.forEach((fulfillment) => {
              if (fulfillment.trackingInfo) {
                fulfillment.trackingInfo.forEach((tracking) => {
                  if (tracking.number) {
                    trackingNumbers.push(tracking.number);
                  }
                });
              }
            });
          }

          // Extract tracking numbers from returns
          const exchangeTrackingNumbers: Record<string, string[]> = {};
          if (node.returns) {
            node.returns.edges.forEach((edge) => {
              const returnNode = edge.node;
              if (
                returnNode.status === "OPEN" &&
                returnNode.reverseFulfillmentOrders
              ) {
                returnNode.reverseFulfillmentOrders.nodes.forEach(
                  (reverseFulfillmentOrder) => {
                    if (
                      reverseFulfillmentOrder.status === "OPEN" &&
                      reverseFulfillmentOrder.fulfillments
                    ) {
                      reverseFulfillmentOrder.fulfillments.nodes.forEach(
                        (fulfillment) => {
                          if (fulfillment.trackingInfo) {
                            fulfillment.trackingInfo.forEach((tracking) => {
                              if (tracking.number) {
                                exchangeTrackingNumbers[returnNode.id] =
                                  exchangeTrackingNumbers[returnNode.id] || [];
                                exchangeTrackingNumbers[returnNode.id].push(
                                  tracking.number
                                );
                              }
                            });
                          }
                        }
                      );
                    }
                  }
                );
              }
            });
          }

          acc[node.id] = {
            id: node.id,
            cancelledAt: node.cancelledAt,
            cancelReason: node.cancelReason,
            displayFulfillmentStatus: node.displayFulfillmentStatus,
            displayFinancialStatus: node.displayFinancialStatus,
            isCancelled: node.cancelledAt !== null,
            trackingNumbers,
            exchangeTrackingNumbers,
          };
        }
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
