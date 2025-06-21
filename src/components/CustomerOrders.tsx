"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";
import {
  ShopifyAuthConfig,
  getTokensUnified,
  CustomerAccountApiClient,
  autoRefreshTokens,
  type TokenStorage,
  type GraphQLResponse,
} from "@/lib/shopify-auth";

interface OrderNode {
  id: string;
  name: string;
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
        name: string;
        quantity: number;
        variantTitle: string;
        image: {
          url: string;
          altText: string;
        };
      };
    }>;
  };
}

interface CustomerOrdersResponse {
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
  tokens?: TokenStorage | null;
}

export default function CustomerOrders({
  config,
  tokens,
}: CustomerOrdersProps) {
  const [orders, setOrders] = useState<OrderNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(
    null
  );
  const hasFetchedRef = useRef(false);

  // Memoize config to prevent unnecessary re-renders
  const memoizedConfig = useMemo(
    () => config,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.shopId, config.clientId, config.redirectUri]
  );

  // Internal function to fetch customer orders
  const fetchCustomerOrdersInternal = useCallback(
    async (client: CustomerAccountApiClient, tokenData: TokenStorage) => {
      if (hasFetchedRef.current) return;

      try {
        hasFetchedRef.current = true;
        setLoading(true);
        setError(null);

        // First, ensure tokens are fresh
        const refreshedTokens = await autoRefreshTokens(memoizedConfig);
        if (
          refreshedTokens &&
          refreshedTokens.accessToken !== tokenData.accessToken
        ) {
          client.updateAccessToken(refreshedTokens.accessToken);
        }

        // Fetch customer orders with line items
        const ordersQuery = {
          query: `
            query GetCustomerOrders($first: Int!) {
              customer {
                orders(first: $first) {
                  edges {
                    node {
                      id
                      name
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
                            name
                            quantity
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
                  pageInfo {
                    hasNextPage
                    hasPreviousPage
                    startCursor
                    endCursor
                  }
                }
              }
            }
          `,
          variables: {
            first: 10,
          },
        };

        const response = (await client.query(
          ordersQuery
        )) as GraphQLResponse<CustomerOrdersResponse>;

        console.log("📊 Full GraphQL response:", response);

        if (response.errors && response.errors.length > 0) {
          console.error("❌ GraphQL Errors:", response.errors);
          throw new Error(`GraphQL Error: ${response.errors[0].message}`);
        }

        if (response.data) {
          const orderNodes = response.data.customer.orders.edges.map(
            (edge) => edge.node
          );
          setOrders(orderNodes);
          console.log("✅ Customer orders loaded successfully:", orderNodes);
        } else {
          throw new Error("No customer orders data returned");
        }
      } catch (err) {
        console.error("Error fetching customer orders:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch customer orders"
        );
        hasFetchedRef.current = false; // Allow retry on error
      } finally {
        setLoading(false);
      }
    },
    [memoizedConfig]
  );

  // Load stored tokens on component mount
  useEffect(() => {
    if (hasFetchedRef.current) return;

    const loadTokensAndFetchOrders = async () => {
      console.log("🔍 CustomerOrders: Checking for stored tokens...");

      // Use passed tokens first, fallback to unified token retrieval
      const storedTokens = tokens || (await getTokensUnified());

      if (storedTokens) {
        // Create API client with the access token
        const client = new CustomerAccountApiClient({
          shopId: memoizedConfig.shopId,
          accessToken: storedTokens.accessToken,
        });

        // Fetch customer orders immediately
        console.log("🚀 Fetching customer orders...");
        fetchCustomerOrdersInternal(client, storedTokens);
      } else {
        console.log("❌ No stored tokens found");
      }
    };

    loadTokensAndFetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoizedConfig.shopId, tokens]);

  // Format price function
  const formatPrice = (amount: string, currencyCode: string): string => {
    const price = parseFloat(amount);
    if (currencyCode === "INR") {
      return `₹ ${price.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    return `${currencyCode} ${price.toFixed(2)}`;
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

  // Cancel order function
  const cancelOrder = async (orderId: string) => {
    try {
      setCancellingOrderId(orderId);

      const response = await fetch("/api/customer/cancel-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: orderId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to cancel order");
      }

      // Show success message and refresh orders
      console.log("✅ Order cancelled successfully:", result);

      // Refresh the orders list by resetting the fetch flag and calling the fetch function
      hasFetchedRef.current = false;
      const storedTokens = tokens || (await getTokensUnified());
      if (storedTokens) {
        const client = new CustomerAccountApiClient({
          shopId: memoizedConfig.shopId,
          accessToken: storedTokens.accessToken,
        });
        fetchCustomerOrdersInternal(client, storedTokens);
      }
    } catch (err) {
      console.error("Error cancelling order:", err);
      setError(err instanceof Error ? err.message : "Failed to cancel order");
    } finally {
      setCancellingOrderId(null);
    }
  };

  // Check if order can be cancelled (not fulfilled)
  const canCancelOrder = (order: OrderNode) => {
    return order.fulfillmentStatus !== "FULFILLED";
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-white border-gray-300 animate-pulse">
            <CardHeader className="pb-4">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4 mt-2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-16 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600 lowercase tracking-wider">Error: {error}</p>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600 lowercase tracking-wider">
          no orders found
        </p>
      </div>
    );
  }

  // Separate current and past orders
  const currentOrders = orders.filter(
    (order) =>
      order.fulfillmentStatus !== "FULFILLED" ||
      order.financialStatus !== "PAID"
  );
  const pastOrders = orders.filter(
    (order) =>
      order.fulfillmentStatus === "FULFILLED" &&
      order.financialStatus === "PAID"
  );

  return (
    <div className="space-y-8">
      {/* Current Orders */}
      {currentOrders.length > 0 && (
        <div>
          <h3 className="text-xl font-serif lowercase tracking-widest text-black mb-4">
            current orders
          </h3>
          <div className="space-y-4">
            {currentOrders.map((order) => (
              <Card key={order.id} className="bg-white border-gray-300">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg lowercase tracking-wider text-black">
                        {order.name}
                      </CardTitle>
                      <CardDescription className="lowercase tracking-wider">
                        placed on {formatDate(order.processedAt)}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="flex flex-col items-end space-y-2">
                        <div>
                          <p
                            className={`text-sm lowercase tracking-wider ${getStatusColor(
                              order.fulfillmentStatus
                            )}`}
                          >
                            {order.fulfillmentStatus
                              .toLowerCase()
                              .replace("_", " ")}
                          </p>
                          <p
                            className={`text-sm lowercase tracking-wider ${getStatusColor(
                              order.financialStatus
                            )}`}
                          >
                            {order.financialStatus.toLowerCase()}
                          </p>
                        </div>
                        {canCancelOrder(order) && (
                          <Button
                            onClick={() => cancelOrder(order.id)}
                            disabled={cancellingOrderId === order.id}
                            variant="outline"
                            size="sm"
                            className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 text-xs lowercase tracking-wider"
                          >
                            {cancellingOrderId === order.id ? (
                              <>
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                cancelling...
                              </>
                            ) : (
                              <>
                                <X className="mr-1 h-3 w-3" />
                                cancel order
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Line Items */}
                    {order.lineItems.edges.map(({ node: item }) => (
                      <div
                        key={item.id}
                        className="flex items-center space-x-4"
                      >
                        <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                          {item.image ? (
                            <Image
                              src={item.image.url}
                              alt={item.image.altText || item.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-gray-400 text-xs">
                              No Image
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium lowercase tracking-wider text-black">
                            {item.name}
                          </h4>
                          {item.variantTitle && (
                            <p className="text-sm text-gray-500 lowercase tracking-wider">
                              {item.variantTitle}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 lowercase tracking-wider">
                            qty: {item.quantity}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Order Summary */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
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
      )}

      {/* Past Orders */}
      {pastOrders.length > 0 && (
        <div>
          <h3 className="text-xl font-serif lowercase tracking-widest text-black mb-4">
            past orders
          </h3>
          <div className="space-y-4">
            {pastOrders.map((order) => (
              <Card key={order.id} className="bg-white border-gray-300">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg lowercase tracking-wider text-black">
                        {order.name}
                      </CardTitle>
                      <CardDescription className="lowercase tracking-wider">
                        delivered on {formatDate(order.processedAt)}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Line Items */}
                    {order.lineItems.edges.map(({ node: item }) => (
                      <div
                        key={item.id}
                        className="flex items-center space-x-4"
                      >
                        <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                          {item.image ? (
                            <Image
                              src={item.image.url}
                              alt={item.image.altText || item.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-gray-400 text-xs">
                              No Image
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium lowercase tracking-wider text-black">
                            {item.name}
                          </h4>
                          {item.variantTitle && (
                            <p className="text-sm text-gray-500 lowercase tracking-wider">
                              {item.variantTitle}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 lowercase tracking-wider">
                            qty: {item.quantity}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Order Summary */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
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
      )}
    </div>
  );
}
