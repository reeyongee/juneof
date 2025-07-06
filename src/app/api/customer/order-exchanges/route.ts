import { NextRequest, NextResponse } from "next/server";
import { GraphQLClient } from "graphql-request";
import { authenticateRequest } from "@/lib/api-auth-helpers";

interface ReturnLineItemNode {
  id: string;
  quantity: number;
  fulfillmentLineItem: {
    lineItem: {
      id: string;
      name: string;
      variantTitle: string;
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
}

interface OrderReturnsResponse {
  order: {
    id: string;
    customer: {
      id: string;
    } | null;
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
  activeExchanges: Array<{
    returnId: string;
    returnName: string;
    status: string;
    returnedItems: Array<{
      id: string;
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
    const adminApiUrl = `https://${shopDomain}/admin/api/2024-10/graphql.json`;
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

        const returnDetailsQuery = `
          query GetReturnDetails($returnId: ID!) {
            return(id: $returnId) {
              id
              name
              status
              totalQuantity
              returnLineItems(first: 10) {
                nodes {
                  id
                  quantity
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

        // Step 2: Fetch detailed return information for each return
        const activeExchanges: Array<{
          returnId: string;
          returnName: string;
          status: string;
          returnedItems: Array<{
            id: string;
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
          }>;
        }> = [];

        for (const returnId of returnIds) {
          try {
            console.log(`🔍 Fetching details for return: ${returnId}`);

            const returnResponse =
              await adminClient.request<ReturnDetailsResponse>(
                returnDetailsQuery,
                { returnId }
              );

            if (!returnResponse.return) {
              console.warn(`Return ${returnId} not found`);
              continue;
            }

            const returnData = returnResponse.return;

            console.log(`📊 Return ${returnId} analysis:`, {
              returnLineItems: returnData.returnLineItems.nodes.length,
              exchangeLineItems: returnData.exchangeLineItems.nodes.length,
              status: returnData.status,
            });

            // Only process returns that have both return and exchange line items
            if (
              returnData.returnLineItems.nodes.length > 0 &&
              returnData.exchangeLineItems.nodes.length > 0
            ) {
              console.log(`✅ Processing return ${returnId} with exchanges`);
              console.log(`📦 Exchange details:`, {
                returnItems: returnData.returnLineItems.nodes.length,
                exchangeItems: returnData.exchangeLineItems.nodes.length,
                status: returnData.status,
              });
              const activeExchange = {
                returnId: returnData.id,
                returnName: returnData.name,
                status: returnData.status,
                returnedItems: returnData.returnLineItems.nodes.map((node) => ({
                  id: node.fulfillmentLineItem.lineItem.id,
                  name: node.fulfillmentLineItem.lineItem.name,
                  variantTitle: node.fulfillmentLineItem.lineItem.variantTitle,
                  quantity: node.quantity,
                  image: node.fulfillmentLineItem.lineItem.image,
                })),
                exchangeItems: returnData.exchangeLineItems.nodes.map(
                  (node) => ({
                    id: node.lineItem.id,
                    name: node.lineItem.name,
                    variantTitle: node.lineItem.variantTitle,
                    quantity: 1, // Default quantity since it's not available in the API
                    image: node.lineItem.image,
                  })
                ),
              };

              activeExchanges.push(activeExchange);
            }
          } catch (error) {
            console.error(
              `Error fetching details for return ${returnId}:`,
              error
            );
          }
        }

        if (activeExchanges.length > 0) {
          exchanges.push({
            orderId: orderResponse.order.id,
            activeExchanges,
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
