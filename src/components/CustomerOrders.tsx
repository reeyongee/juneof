"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  getStoredTokens,
  autoRefreshTokens,
  CustomerAccountApiClient,
  type ShopifyAuthConfig,
  type TokenStorage,
  type GraphQLResponse,
} from "@/lib/shopify-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface OrderNode {
  id: string;
  name: string;
  orderNumber: number;
  processedAt: string;
  totalPrice: {
    amount: string;
    currencyCode: string;
  };
  fulfillmentStatus: string;
  financialStatus: string;
  lineItems: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        quantity: number;
        variant?: {
          id: string;
          title: string;
          image?: {
            url: string;
            altText?: string;
          };
        };
        currentQuantity: number;
      };
    }>;
  };
}

interface CustomerOrders {
  customer: {
    orders: {
      edges: Array<{
        node: OrderNode;
      }>;
    };
  };
}

interface CustomerOrdersProps {
  config: ShopifyAuthConfig;
}

export default function CustomerOrders({ config }: CustomerOrdersProps) {
  const [tokens, setTokens] = useState<TokenStorage | null>(null);
  const [orders, setOrders] = useState<OrderNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiClient, setApiClient] = useState<CustomerAccountApiClient | null>(
    null
  );

  // Load stored tokens and create API client
  useEffect(() => {
    const storedTokens = getStoredTokens();
    if (storedTokens) {
      setTokens(storedTokens);

      const client = new CustomerAccountApiClient({
        shopId: config.shopId,
        accessToken: storedTokens.accessToken,
      });
      setApiClient(client);
    }
  }, [config.shopId]);

  // Fetch customer orders
  const fetchCustomerOrders = useCallback(
    async (client: CustomerAccountApiClient, tokenData: TokenStorage) => {
      try {
        setLoading(true);
        setError(null);

        // Ensure tokens are fresh
        const refreshedTokens = await autoRefreshTokens(config);
        if (
          refreshedTokens &&
          refreshedTokens.accessToken !== tokenData.accessToken
        ) {
          setTokens(refreshedTokens);
          client.updateAccessToken(refreshedTokens.accessToken);
        }

        // Fetch customer orders
        const ordersQuery = {
          query: `
            query GetCustomerOrders($first: Int!) {
              customer {
                orders(first: $first) {
                  edges {
                    node {
                      id
                      name
                      orderNumber
                      processedAt
                      totalPrice {
                        amount
                        currencyCode
                      }
                      fulfillmentStatus
                      financialStatus
                      lineItems(first: 10) {
                        edges {
                          node {
                            id
                            title
                            quantity
                            currentQuantity
                            variant {
                              id
                              title
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
          `,
          variables: {
            first: 20,
          },
        };

        const response = (await client.query(
          ordersQuery
        )) as GraphQLResponse<CustomerOrders>;

        if (response.errors && response.errors.length > 0) {
          throw new Error(`GraphQL Error: ${response.errors[0].message}`);
        }

        if (response.data?.customer?.orders?.edges) {
          const orderNodes = response.data.customer.orders.edges.map(
            (edge) => edge.node
          );
          setOrders(orderNodes);
        } else {
          setOrders([]);
        }
      } catch (err) {
        console.error("Error fetching customer orders:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch orders");
      } finally {
        setLoading(false);
      }
    },
    [config]
  );

  // Auto-fetch orders when API client is ready
  useEffect(() => {
    if (apiClient && tokens) {
      fetchCustomerOrders(apiClient, tokens);
    }
  }, [apiClient, tokens, fetchCustomerOrders]);

  // Format price function
  const formatPrice = (amount: string, currencyCode: string): string => {
    const numAmount = parseFloat(amount);
    if (currencyCode === "INR") {
      return `₹ ${numAmount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    return `${currencyCode} ${numAmount.toFixed(2)}`;
  };

  // Format date function
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "fulfilled":
      case "paid":
        return "text-green-600";
      case "pending":
      case "partially_fulfilled":
        return "text-yellow-600";
      case "unfulfilled":
      case "unpaid":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-serif lowercase tracking-widest text-black mb-4">
          loading orders...
        </h3>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-white border-gray-300">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/6 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-serif lowercase tracking-widest text-black mb-4">
          orders
        </h3>
        <Card className="bg-white border-red-300">
          <CardContent className="p-6">
            <p className="text-red-600 lowercase tracking-wider">
              error loading orders: {error}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-serif lowercase tracking-widest text-black mb-4">
          orders
        </h3>
        <Card className="bg-white border-gray-300">
          <CardContent className="p-6">
            <p className="text-gray-600 lowercase tracking-wider text-center">
              no orders found
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h3 className="text-xl font-serif lowercase tracking-widest text-black mb-4">
        your orders
      </h3>
      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id} className="bg-white border-gray-300">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg lowercase tracking-wider text-black">
                    order {order.name}
                  </CardTitle>
                  <CardDescription className="lowercase tracking-wider">
                    placed on {formatDate(order.processedAt)}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div
                    className={`text-sm lowercase tracking-wider ${getStatusColor(
                      order.fulfillmentStatus
                    )}`}
                  >
                    {order.fulfillmentStatus.replace("_", " ")}
                  </div>
                  <div
                    className={`text-sm lowercase tracking-wider ${getStatusColor(
                      order.financialStatus
                    )}`}
                  >
                    {order.financialStatus.replace("_", " ")}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Order Items */}
                {order.lineItems.edges.map((lineItem) => (
                  <div
                    key={lineItem.node.id}
                    className="flex items-center space-x-4"
                  >
                    <div className="w-16 h-16 relative bg-gray-100">
                      {lineItem.node.variant?.image?.url ? (
                        <Image
                          src={lineItem.node.variant.image.url}
                          alt={
                            lineItem.node.variant.image.altText ||
                            lineItem.node.title
                          }
                          fill
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-medium lowercase tracking-wider text-black">
                        {lineItem.node.title}
                      </h4>
                      <p className="text-sm text-gray-600 lowercase tracking-wider">
                        {lineItem.node.variant?.title &&
                          `variant: ${lineItem.node.variant.title} • `}
                        qty: {lineItem.node.quantity}
                      </p>
                    </div>
                  </div>
                ))}

                <Separator />

                {/* Order Total */}
                <div className="flex justify-between items-center">
                  <span className="font-medium lowercase tracking-wider text-black">
                    total
                  </span>
                  <span className="font-medium text-black">
                    {formatPrice(
                      order.totalPrice.amount,
                      order.totalPrice.currencyCode
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
