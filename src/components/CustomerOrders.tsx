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
import { X, Loader2, RotateCcw } from "lucide-react";

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

interface OrderStatus {
  id: string;
  cancelledAt: string | null;
  cancelReason: string | null;
  displayFulfillmentStatus: string;
  displayFinancialStatus: string;
  isCancelled: boolean;
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
  const [reorderingOrderId, setReorderingOrderId] = useState<string | null>(
    null
  );
  const [orderStatuses, setOrderStatuses] = useState<
    Record<string, OrderStatus>
  >({});
  const [statusLoading, setStatusLoading] = useState(false);
  const hasFetchedRef = useRef(false);
  // Note: Cart functions removed since reorder functionality is temporarily disabled
  // const { addItemToCart, proceedToCheckout } = useCart();

  // Memoize config to prevent unnecessary re-renders
  const memoizedConfig = useMemo(
    () => config,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.shopId, config.clientId, config.redirectUri]
  );

  // Fetch order statuses from Admin API
  const fetchOrderStatuses = useCallback(async (orderIds: string[]) => {
    if (orderIds.length === 0) return;

    console.log("🔍 About to call order status API with IDs:", orderIds);

    try {
      setStatusLoading(true);
      const response = await fetch("/api/customer/order-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderIds }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch order statuses: ${response.statusText}`
        );
      }

      const data = await response.json();
      if (data.success) {
        setOrderStatuses(data.orderStatuses);
      } else {
        console.error("Failed to fetch order statuses:", data.error);
      }
    } catch (error) {
      console.error("Error fetching order statuses:", error);
    } finally {
      setStatusLoading(false);
    }
  }, []);

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

          // Fetch detailed order statuses from Admin API
          const orderIds = orderNodes.map((order) => order.id);
          console.log("🎯 Extracted order IDs for status check:", orderIds);
          await fetchOrderStatuses(orderIds);
        } else {
          console.warn("⚠️ No data received from GraphQL query");
          setOrders([]);
        }
      } catch (error) {
        console.error("❌ Error fetching customer orders:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load orders"
        );
      } finally {
        setLoading(false);
      }
    },
    [memoizedConfig, fetchOrderStatuses]
  );

  // Public function to load tokens and fetch orders
  const loadTokensAndFetchOrders = useCallback(async () => {
    try {
      const tokenData = await getTokensUnified();
      if (!tokenData) {
        console.log("⚠️ No tokens available");
        setError("Please log in to view your orders");
        return;
      }

      const client = new CustomerAccountApiClient({
        shopId: memoizedConfig.shopId,
        accessToken: tokenData.accessToken,
      });
      await fetchCustomerOrdersInternal(client, tokenData);
    } catch (error) {
      console.error("❌ Error in loadTokensAndFetchOrders:", error);
      setError("Failed to load orders. Please try again.");
    }
  }, [memoizedConfig, fetchCustomerOrdersInternal]);

  // Effect to load orders when component mounts or tokens change
  useEffect(() => {
    if (tokens) {
      hasFetchedRef.current = false;
      loadTokensAndFetchOrders();
    }
  }, [tokens, loadTokensAndFetchOrders]);

  // Helper functions
  const formatPrice = (amount: string, currencyCode: string): string => {
    const numericAmount = parseFloat(amount);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
    }).format(numericAmount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
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
      case "cancelled":
      case "canceled":
        return "text-gray-600";
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
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log("✅ Order cancelled successfully");

        // Refresh orders to show updated status
        hasFetchedRef.current = false;
        await loadTokensAndFetchOrders();
      } else {
        console.error("❌ Failed to cancel order:", data.error);
        setError(data.error || "Failed to cancel order");
      }
    } catch (error) {
      console.error("❌ Error cancelling order:", error);
      setError("Failed to cancel order. Please try again.");
    } finally {
      setCancellingOrderId(null);
    }
  };

  // Check if order can be cancelled (not fulfilled and not already cancelled)
  const canCancelOrder = (order: OrderNode) => {
    const status = orderStatuses[order.id];
    return (
      order.fulfillmentStatus !== "FULFILLED" &&
      (!status || !status.isCancelled)
    );
  };

  // Check if order is cancelled
  const isCancelledOrder = (order: OrderNode) => {
    const status = orderStatuses[order.id];
    return status?.isCancelled || false;
  };

  // Reorder function
  const reorderItems = async (order: OrderNode) => {
    try {
      setReorderingOrderId(order.id);

      // Note: Customer Account API doesn't provide variant IDs or product handles
      // We'll need to implement a different approach for reordering
      // For now, show a message directing users to browse the store
      setError(
        "Reordering is currently not available. Please browse our store to add items to your cart."
      );

      // Alternative: Could redirect to a specific collection page or search
      // window.location.href = "/collections/all";
    } catch (error) {
      console.error("❌ Error reordering items:", error);
      setError("Failed to reorder items. Please try again.");
    } finally {
      setReorderingOrderId(null);
    }
  };

  // Separate current, past, and cancelled orders
  const currentOrders = orders.filter(
    (order) =>
      !isCancelledOrder(order) &&
      (order.fulfillmentStatus !== "FULFILLED" ||
        order.financialStatus !== "PAID")
  );

  const pastOrders = orders.filter(
    (order) =>
      !isCancelledOrder(order) &&
      order.fulfillmentStatus === "FULFILLED" &&
      order.financialStatus === "PAID"
  );

  const cancelledOrders = orders.filter((order) => isCancelledOrder(order));

  if (loading && orders.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
        <span className="ml-2 text-gray-600 lowercase tracking-wider">
          loading orders...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 lowercase tracking-wider">{error}</p>
        <Button
          onClick={() => {
            setError(null);
            hasFetchedRef.current = false;
            loadTokensAndFetchOrders();
          }}
          variant="outline"
          className="mt-4 lowercase tracking-wider"
        >
          try again
        </Button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 lowercase tracking-wider">
          no orders found
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {statusLoading && (
        <div className="flex justify-center items-center py-2">
          <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
          <span className="ml-2 text-sm text-gray-600 lowercase tracking-wider">
            checking order statuses...
          </span>
        </div>
      )}

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
                                cancel
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
                        completed on {formatDate(order.processedAt)}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm lowercase tracking-wider text-green-600">
                        completed
                      </p>
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

      {/* Cancelled Orders */}
      {cancelledOrders.length > 0 && (
        <div>
          <h3 className="text-xl font-serif lowercase tracking-widest text-black mb-4">
            cancelled orders
          </h3>
          <div className="space-y-4">
            {cancelledOrders.map((order) => {
              const status = orderStatuses[order.id];
              return (
                <Card key={order.id} className="bg-white border-gray-300">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg lowercase tracking-wider text-black">
                          {order.name}
                        </CardTitle>
                        <CardDescription className="lowercase tracking-wider">
                          cancelled on{" "}
                          {formatDate(status?.cancelledAt || order.processedAt)}
                        </CardDescription>
                        {status?.cancelReason && (
                          <p className="text-sm text-gray-500 lowercase tracking-wider mt-1">
                            reason:{" "}
                            {status.cancelReason
                              .toLowerCase()
                              .replace("_", " ")}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="flex flex-col items-end space-y-2">
                          <div>
                            <p className="text-sm lowercase tracking-wider text-gray-600">
                              cancelled
                            </p>
                          </div>
                          <Button
                            onClick={() => reorderItems(order)}
                            disabled={reorderingOrderId === order.id}
                            variant="outline"
                            size="sm"
                            className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 text-xs lowercase tracking-wider"
                          >
                            {reorderingOrderId === order.id ? (
                              <>
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                reordering...
                              </>
                            ) : (
                              <>
                                <RotateCcw className="mr-1 h-3 w-3" />
                                reorder
                              </>
                            )}
                          </Button>
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
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
