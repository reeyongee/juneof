import { NextRequest, NextResponse } from "next/server";
import { GraphQLClient } from "graphql-request";
import { authenticateRequest } from "@/lib/api-auth-helpers";

interface ReturnLineItemNode {
  __typename: string;
  id: string;
  quantity: number;
  returnReason: string;
  returnReasonNote: string;
  fulfillmentLineItem?: {
    lineItem: {
      id: string;
      name: string;
      variantTitle: string | null;
      image: {
        url: string;
        altText: string;
      } | null;
    };
  };
}

interface ExchangeLineItemNode {
  id: string;
  lineItem: {
    id: string;
    name: string;
    variantTitle: string;
    image: {
      url: string;
      altText: string;
    } | null;
  };
}

interface BasicReturn {
  id: string;
  name: string;
  status: string;
  totalQuantity: number;
}

interface DetailedReturn {
  id: string;
  name: string;
  status: string;
  totalQuantity: number;
  returnLineItems: {
    nodes: ReturnLineItemNode[];
  };
  exchangeLineItems: {
    nodes: ExchangeLineItemNode[];
  };
  reverseFulfillmentOrders: {
    nodes: Array<{
      id: string;
      status: string;
      lineItems: {
        nodes: Array<{
          id: string;
          fulfillmentLineItem: {
            lineItem: {
              id: string;
            };
          };
        }>;
      };
      reverseDeliveries: {
        nodes: Array<{
          id: string;
          trackingInfo: {
            number: string;
          }[];
        }>;
      };
    }>;
  };
}

interface OrderReturnsResponse {
  order: {
    id: string;
    customer: {
      id: string;
    } | null;
    lineItems: {
      nodes: Array<{
        id: string;
        name: string;
        variantTitle: string;
        quantity: number;
        image: {
          url: string;
          altText: string;
        } | null;
      }>;
    };
    returns: {
      edges: Array<{
        node: BasicReturn;
      }>;
    };
    fulfillmentOrders: {
      nodes: Array<{
        id: string;
        status: string;
        fulfillmentHolds: Array<{
          id: string;
          reason: string;
        }>;
      }>;
    };
  } | null;
}

interface ReturnDetailsResponse {
  return: DetailedReturn | null;
}

interface OrderExchangeData {
  orderId: string;
  exchangedLineItemIds: string[];
  activeExchanges: Array<{
    returnId: string;
    returnName: string;
    status: string;
    trackingNumbers: string[];
    returnedItems: Array<{
      id: string;
      originalLineItemId: string;
      name: string;
      variantTitle: string;
      quantity: number;
      image: {
        url: string;
        altText: string;
      } | null;
    }>;
    exchangeItems: Array<{
      id: string;
      name: string;
      variantTitle: string;
      quantity: number;
      image: {
        url: string;
        altText: string;
      } | null;
      fulfilled: boolean;
      trackingNumbers: string[];
    }>;
  }>;
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
      return NextResponse.json({
        success: true,
        exchanges: [],
      });
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

    const exchanges: OrderExchangeData[] = [];

    // Process each order ID
    for (const orderId of orderIds) {
      try {
        // Query returns and exchanges for this order
        const orderReturnsQuery = `
          query GetOrderReturns($orderId: ID!) {
            order(id: $orderId) {
              id
              customer {
                id
              }
              lineItems(first: 50) {
                nodes {
                  id
                  name
                  variantTitle
                  quantity
                  image {
                    url
                    altText
                  }
                }
              }
              returns(first: 10) {
                edges {
                  node {
                    id
                    name
                    status
                    totalQuantity
                  }
                }
              }
              fulfillmentOrders(first: 10) {
                nodes {
                  id
                  status
                  fulfillmentHolds {
                    id
                    reason
                  }
                }
              }
            }
          }
        `;

        // Step 1: Get basic return information for the order
        const orderResponse = await adminClient.request<OrderReturnsResponse>(
          orderReturnsQuery,
          { orderId }
        );

        // Verify order ownership
        if (
          !orderResponse.order ||
          orderResponse.order.customer?.id !== customerId
        ) {
          console.warn(`Order ${orderId} not found or access denied`);
          continue;
        }

        const returnIds = orderResponse.order.returns.edges.map(
          (edge) => edge.node.id
        );
        console.log(
          `📋 Found ${returnIds.length} returns for order ${orderId}:`,
          orderResponse.order.returns.edges.map((edge) => ({
            id: edge.node.id,
            name: edge.node.name,
            status: edge.node.status,
            totalQuantity: edge.node.totalQuantity,
          }))
        );

        // Also log fulfillment orders to see if there are any exchange-related fulfillment orders
        console.log(
          `🚚 Found ${orderResponse.order.fulfillmentOrders.nodes.length} fulfillment orders for order ${orderId}:`,
          orderResponse.order.fulfillmentOrders.nodes.map((node) => ({
            id: node.id,
            status: node.status,
            holds: node.fulfillmentHolds.map((hold) => ({
              id: hold.id,
              reason: hold.reason,
            })),
          }))
        );

        if (returnIds.length === 0) {
          continue;
        }

        // Step 2: Get detailed return information for each return
        const returnDetails = await Promise.all(
          returnIds.map(async (returnId) => {
            try {
              console.log(`🔍 Fetching details for return: ${returnId}`);

              const returnQuery = `
                query GetReturnDetails($returnId: ID!) {
                  return(id: $returnId) {
                    id
                    name
                    status
                    totalQuantity
                    returnLineItems(first: 10) {
                      nodes {
                        __typename
                        ... on ReturnLineItem {
                          id
                          quantity
                          returnReason
                          returnReasonNote
                          fulfillmentLineItem {
                            lineItem {
                              id
                              name
                              variantTitle
                              image {
                                url
                                altText
                              }
                            }
                          }
                        }
                      }
                    }
                    exchangeLineItems(first: 10) {
                      nodes {
                        id
                        lineItem {
                          id
                          name
                          variantTitle
                          image {
                            url
                            altText
                          }
                        }
                      }
                    }
                    reverseFulfillmentOrders(first: 10) {
                      nodes {
                        id
                        status
                        lineItems(first: 10) {
                          nodes {
                            id
                            fulfillmentLineItem {
                              lineItem {
                                id
                              }
                            }
                          }
                        }
                        reverseDeliveries(first: 10) {
                          nodes {
                            id
                            trackingInfo {
                              number
                            }
                          }
                        }
                      }
                    }
                  }
                }
              `;

              const returnResponse =
                await adminClient.request<ReturnDetailsResponse>(returnQuery, {
                  returnId,
                });

              return returnResponse.return;
            } catch (error) {
              console.error(
                `Error fetching details for return ${returnId}:`,
                error
              );
              return null;
            }
          })
        );

        // Filter out null returns and process valid ones
        const validReturns = returnDetails.filter(
          (returnData) => returnData !== null
        );

        if (validReturns.length > 0) {
          const exchangedLineItemIds = validReturns
            .flatMap((returnData) =>
              returnData.returnLineItems.nodes.map(
                (node) => node.fulfillmentLineItem?.lineItem.id
              )
            )
            .filter((id): id is string => !!id);

          exchanges.push({
            orderId: orderResponse.order.id,
            exchangedLineItemIds: exchangedLineItemIds,
            activeExchanges: validReturns.map((returnData) => {
              // Check fulfillment status for exchange items
              const fulfilledExchangeLineItemIds = new Set(
                returnData.reverseFulfillmentOrders.nodes
                  .filter((rfo) => rfo.status === "CLOSED")
                  .flatMap((rfo) =>
                    rfo.lineItems.nodes.map(
                      (li) => li.fulfillmentLineItem.lineItem.id
                    )
                  )
              );

              // Extract tracking numbers for this return
              const returnTrackingNumbers: string[] = [];
              returnData.reverseFulfillmentOrders.nodes.forEach((rfo) => {
                if (rfo.reverseDeliveries) {
                  rfo.reverseDeliveries.nodes.forEach((delivery) => {
                    if (delivery.trackingInfo) {
                      delivery.trackingInfo.forEach((tracking) => {
                        if (tracking.number) {
                          returnTrackingNumbers.push(tracking.number);
                        }
                      });
                    }
                  });
                }
              });

              return {
                returnId: returnData.id,
                returnName: returnData.name,
                status: returnData.status,
                trackingNumbers: returnTrackingNumbers,
                returnedItems: returnData.returnLineItems.nodes.map((node) => {
                  const originalItem = node.fulfillmentLineItem?.lineItem;
                  return {
                    id: node.id,
                    originalLineItemId: originalItem?.id || "unknown",
                    name:
                      originalItem?.name ||
                      `Returned Item (${node.returnReason})`,
                    variantTitle:
                      originalItem?.variantTitle || node.returnReason,
                    quantity: node.quantity,
                    image: originalItem?.image || null,
                  };
                }),
                exchangeItems: returnData.exchangeLineItems.nodes.map(
                  (node) => ({
                    id: node.lineItem.id,
                    name: node.lineItem.name,
                    variantTitle: node.lineItem.variantTitle,
                    quantity: 1, // Default quantity since it's not available in the API
                    image: node.lineItem.image,
                    fulfilled: fulfilledExchangeLineItemIds.has(
                      node.lineItem.id
                    ),
                    trackingNumbers: returnTrackingNumbers, // Add tracking numbers to each exchange item
                  })
                ),
              };
            }),
          });
        }
      } catch (error) {
        console.error(`Error fetching exchanges for order ${orderId}:`, error);
        // Continue processing other orders even if one fails
      }
    }

    return NextResponse.json({
      success: true,
      exchanges,
    });
  } catch (error) {
    console.error("Order Exchanges API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
