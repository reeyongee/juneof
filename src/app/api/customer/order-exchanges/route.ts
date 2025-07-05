import { NextRequest, NextResponse } from "next/server";
import { GraphQLClient } from "graphql-request";
import { authenticateRequest } from "@/lib/api-auth-helpers";

interface ReturnLineItem {
  id: string;
  quantity: number;
  fulfillmentLineItem: {
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
  };
}

interface ExchangeLineItem {
  id: string;
  quantity: number;
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

interface Return {
  id: string;
  name: string;
  status: string;
  totalQuantity: number;
  returnLineItems: {
    edges: Array<{
      node: ReturnLineItem;
    }>;
  };
  exchangeLineItems: {
    edges: Array<{
      node: ExchangeLineItem;
    }>;
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
        node: Return;
      }>;
    };
  } | null;
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
          query GetOrderReturnsAndExchanges($orderId: ID!) {
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
                    returnLineItems(first: 10) {
                      edges {
                        node {
                          id
                          quantity
                          fulfillmentLineItem {
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
                    exchangeLineItems(first: 10) {
                      edges {
                        node {
                          id
                          quantity
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
                }
              }
            }
          }
        `;

        const response = await adminClient.request<OrderReturnsResponse>(
          orderReturnsQuery,
          { orderId }
        );

        console.log(
          `📋 Order ${orderId} response:`,
          JSON.stringify(response, null, 2)
        );

        // Verify order ownership
        if (!response.order || response.order.customer?.id !== customerId) {
          console.warn(`Order ${orderId} not found or access denied`);
          continue;
        }

        console.log(`✅ Order ${orderId} verified for customer ${customerId}`);
        console.log(`📦 Returns found:`, response.order.returns.edges.length);

        // Process returns that have both return and exchange line items
        console.log(`🔍 Processing returns for order ${orderId}:`);
        response.order.returns.edges.forEach((edge, index) => {
          console.log(`  Return ${index + 1}:`, {
            id: edge.node.id,
            name: edge.node.name,
            status: edge.node.status,
            returnLineItems: edge.node.returnLineItems.edges.length,
            exchangeLineItems: edge.node.exchangeLineItems.edges.length,
          });
        });

        const activeExchanges = response.order.returns.edges
          .map((edge) => edge.node)
          .filter(
            (returnData) =>
              returnData.returnLineItems.edges.length > 0 &&
              returnData.exchangeLineItems.edges.length > 0
          )
          .map((returnData) => ({
            returnId: returnData.id,
            returnName: returnData.name,
            status: returnData.status,
            returnedItems: returnData.returnLineItems.edges.map((edge) => ({
              id: edge.node.fulfillmentLineItem.lineItem.id,
              name: edge.node.fulfillmentLineItem.lineItem.name,
              variantTitle: edge.node.fulfillmentLineItem.lineItem.variantTitle,
              quantity: edge.node.quantity,
              image: edge.node.fulfillmentLineItem.lineItem.image,
            })),
            exchangeItems: returnData.exchangeLineItems.edges.map((edge) => ({
              id: edge.node.lineItem.id,
              name: edge.node.lineItem.name,
              variantTitle: edge.node.lineItem.variantTitle,
              quantity: edge.node.quantity,
              image: edge.node.lineItem.image,
            })),
          }));

        console.log(
          `✨ Active exchanges found for order ${orderId}:`,
          activeExchanges.length
        );

        if (activeExchanges.length > 0) {
          exchanges.push({
            orderId: response.order.id,
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
