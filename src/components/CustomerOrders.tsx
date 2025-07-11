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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

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
  fulfillments: {
    trackingInfo: Array<{
      number: string;
    }>;
  }[];
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

interface ExchangeVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  inventoryQuantity: number;
  inStock: boolean;
}

interface ExchangeOptions {
  fulfillmentLineItemId: string;
  fulfillmentId: string;
  originalItem: {
    id: string;
    name: string;
    variantTitle: string;
  };
  product: {
    id: string;
    handle: string;
    title: string;
  };
  availableVariants: ExchangeVariant[];
  maxQuantity: number;
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

interface ExchangeItem {
  id: string;
  name: string;
  variantTitle: string;
  quantity: number;
  image: {
    url: string;
    altText: string;
  } | null;
  fulfilled?: boolean; // Only for exchange items
}

interface ActiveExchange {
  returnId: string;
  returnName: string;
  status: string;
  returnedItems: ExchangeItem[];
  exchangeItems: ExchangeItem[];
}

interface OrderExchangeData {
  orderId: string;
  exchangedLineItemIds: string[];
  activeExchanges: ActiveExchange[];
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
  const [orderStatuses, setOrderStatuses] = useState<
    Record<string, OrderStatus>
  >({});
  const [statusLoading, setStatusLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<OrderNode | null>(null);
  const [showExchangeDialog, setShowExchangeDialog] = useState(false);
  const [exchangeOptions, setExchangeOptions] =
    useState<ExchangeOptions | null>(null);
  const [exchangeLoading, setExchangeLoading] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [exchangeQuantity, setExchangeQuantity] = useState(1);
  const [exchangeReason, setExchangeReason] = useState("SIZE_TOO_SMALL");
  const [exchangingItemId, setExchangingItemId] = useState<string | null>(null);
  const [orderExchanges, setOrderExchanges] = useState<OrderExchangeData[]>([]);
  const [exchangesLoading, setExchangesLoading] = useState(false);
  const hasFetchedRef = useRef(false);

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

  // Fetch exchange data for orders
  const fetchOrderExchanges = useCallback(async (orderIds: string[]) => {
    if (orderIds.length === 0) return;

    console.log("🔄 About to call order exchanges API with IDs:", orderIds);

    try {
      setExchangesLoading(true);
      const response = await fetch("/api/customer/order-exchanges", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderIds }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch order exchanges: ${response.statusText}`
        );
      }

      const data = await response.json();
      if (data.success) {
        setOrderExchanges(data.exchanges);
        console.log("✅ Order exchanges loaded successfully:", data.exchanges);
      } else {
        console.error("Failed to fetch order exchanges:", data.error);
      }
    } catch (error) {
      console.error("Error fetching order exchanges:", error);
    } finally {
      setExchangesLoading(false);
    }
  }, []);

  // Helper function to get tracking numbers from an order
  const getTrackingNumbers = (order: OrderNode): string[] => {
    const trackingNumbers: string[] = [];
    if (order.fulfillments) {
      order.fulfillments.forEach((fulfillment) => {
        if (fulfillment.trackingInfo) {
          fulfillment.trackingInfo.forEach((tracking) => {
            if (tracking.number) {
              trackingNumbers.push(tracking.number);
            }
          });
        }
      });
    }
    return trackingNumbers;
  };

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

        // Fetch customer orders with line items and tracking info
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
                      fulfillments(first: 50) {
                        trackingInfo(first: 50) {
                          number
                        }
                      }
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
            first: 50,
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

          // Only fetch additional data if we have orders
          if (orderNodes.length > 0) {
            // Fetch detailed order statuses from Admin API
            const orderIds = orderNodes.map((order) => order.id);
            console.log("🎯 Extracted order IDs for status check:", orderIds);
            await fetchOrderStatuses(orderIds);

            // Fetch exchange data for orders
            await fetchOrderExchanges(orderIds);
          }
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
    [memoizedConfig, fetchOrderStatuses, fetchOrderExchanges]
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
  }, [memoizedConfig.shopId, fetchCustomerOrdersInternal]);

  // Effect to load orders when component mounts or tokens change
  useEffect(() => {
    if (tokens) {
      // Only fetch if we haven't fetched yet or if we have no orders
      if (!hasFetchedRef.current && orders.length === 0) {
        console.log("CustomerOrders: Fetching orders for the first time");
        loadTokensAndFetchOrders();
      }
    } else {
      // Reset when no tokens (user logged out)
      hasFetchedRef.current = false;
      setOrders([]);
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
    // To be safe, if status is not loaded yet, assume it's NOT cancellable.
    if (!status) {
      return false;
    }

    // Orders with active exchanges cannot be cancelled
    if (hasActiveExchanges(order.id)) {
      return false;
    }

    return order.fulfillmentStatus !== "FULFILLED" && !status.isCancelled;
  };

  // Check if order is cancelled
  const isCancelledOrder = (order: OrderNode) => {
    const status = orderStatuses[order.id];
    return status?.isCancelled || false;
  };

  // Get active exchanges for a specific order
  const getOrderExchanges = (orderId: string): ActiveExchange[] => {
    const orderExchangeData = orderExchanges.find(
      (exchange) => exchange.orderId === orderId
    );
    return orderExchangeData?.activeExchanges || [];
  };

  // Check if a line item is part of an exchange
  const isLineItemExchanged = (
    orderId: string,
    lineItemId: string
  ): boolean => {
    const orderExchangeData = orderExchanges.find(
      (exchange) => exchange.orderId === orderId
    );
    return (
      orderExchangeData?.exchangedLineItemIds.includes(lineItemId) || false
    );
  };

  // Check if an order has active exchanges
  const hasActiveExchanges = (orderId: string): boolean => {
    return getOrderExchanges(orderId).length > 0;
  };

  // Check if a line item is a replacement item from an exchange
  const isReplacementItem = (orderId: string, lineItemId: string): boolean => {
    const exchangesForOrder = getOrderExchanges(orderId);
    if (exchangesForOrder.length === 0) {
      return false;
    }
    return exchangesForOrder.some((exchange) =>
      exchange.exchangeItems.some((item) => item.id === lineItemId)
    );
  };

  // Check if a specific line item can be exchanged
  const canExchangeItem = (order: OrderNode, itemNode: { id: string }) => {
    const isShipped =
      order.fulfillmentStatus === "FULFILLED" ||
      order.fulfillmentStatus === "PARTIALLY_FULFILLED";

    if (!isShipped || isCancelledOrder(order)) {
      return false;
    }

    // Replacement items cannot be exchanged
    if (isReplacementItem(order.id, itemNode.id)) {
      return false;
    }

    return true;
  };

  // Filter line items to exclude those that are part of exchanges
  const getFilteredLineItems = (order: OrderNode) => {
    return order.lineItems.edges.filter(
      (edge) => !isLineItemExchanged(order.id, edge.node.id)
    );
  };

  // Open exchange dialog
  const openExchangeDialog = async (orderId: string, lineItemId: string) => {
    try {
      setExchangeLoading(true);
      setExchangingItemId(lineItemId);

      const response = await fetch("/api/customer/exchange-options", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId, lineItemId }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setExchangeOptions(data.exchangeOptions);
        setSelectedVariant("");
        setExchangeQuantity(1);
        setExchangeReason("SIZE_TOO_SMALL");
        setShowExchangeDialog(true);
      } else {
        console.error("Failed to fetch exchange options:", data.error);
        setError(data.error || "Failed to fetch exchange options");
      }
    } catch (error) {
      console.error("Error fetching exchange options:", error);
      setError("Failed to fetch exchange options. Please try again.");
    } finally {
      setExchangeLoading(false);
      setExchangingItemId(null);
    }
  };

  // Submit exchange
  const submitExchange = async () => {
    if (!exchangeOptions || !selectedVariant) {
      setError("Please select a size for exchange");
      return;
    }

    try {
      setExchangeLoading(true);

      const response = await fetch("/api/customer/exchange", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId:
            orders.find((o) =>
              o.lineItems.edges.some(
                (e) => e.node.id === exchangeOptions.originalItem.id
              )
            )?.id || "",
          fulfillmentLineItemId: exchangeOptions.fulfillmentLineItemId,
          returnQuantity: exchangeQuantity,
          returnReason: exchangeReason,
          returnReasonNote: "Customer requested size exchange",
          exchangeVariantId: selectedVariant,
          exchangeQuantity: exchangeQuantity,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log("✅ Exchange created successfully:", data.exchange);
        setShowExchangeDialog(false);
        setExchangeOptions(null);
        setSelectedVariant("");

        // Refresh orders to show updated status
        hasFetchedRef.current = false;
        await loadTokensAndFetchOrders();
      } else {
        console.error("❌ Failed to create exchange:", data.error);
        setError(data.error || "Failed to create exchange");
      }
    } catch (error) {
      console.error("❌ Error creating exchange:", error);
      setError("Failed to create exchange. Please try again.");
    } finally {
      setExchangeLoading(false);
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
      {(statusLoading || exchangesLoading) && (
        <div className="flex justify-center items-center py-2">
          <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
          <span className="ml-2 text-sm text-gray-600 lowercase tracking-wider">
            {statusLoading && exchangesLoading
              ? "loading order data..."
              : statusLoading
                ? "checking order statuses..."
                : "loading exchange data..."}
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
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Line Items */}
                    {getFilteredLineItems(order).map(({ node: item }) => (
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
                        <div className="flex flex-col gap-2 w-24 text-right">
                          {canExchangeItem(order, item) && (
                            <Button
                              onClick={() =>
                                openExchangeDialog(order.id, item.id)
                              }
                              disabled={exchangingItemId === item.id}
                              variant="outline"
                              size="sm"
                              className="lowercase tracking-wider text-xs"
                            >
                              {exchangingItemId === item.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "exchange"
                              )}
                            </Button>
                          )}
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

                    {/* Tracking Numbers */}
                    {getTrackingNumbers(order).length > 0 && (
                      <div className="pt-4 border-t border-gray-200">
                        <div className="space-y-2">
                          {getTrackingNumbers(order).map(
                            (trackingNumber, index) => (
                              <div
                                key={index}
                                className="text-sm lowercase tracking-wider text-gray-700"
                              >
                                tracking number: {trackingNumber}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Active Exchanges */}
                    {getOrderExchanges(order.id).length > 0 && (
                      <div className="pt-4 border-t border-gray-200">
                        <h4 className="font-medium lowercase tracking-wider text-black mb-3">
                          active exchanges
                        </h4>
                        <div className="space-y-4">
                          {getOrderExchanges(order.id).map((exchange) => (
                            <div
                              key={exchange.returnId}
                              className="bg-gray-50 p-3 rounded-lg"
                            >
                              <p className="text-sm lowercase tracking-wider text-gray-600 mb-3">
                                return #{exchange.returnName} -{" "}
                                {exchange.status.toLowerCase()}
                              </p>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Returned Items */}
                                <div>
                                  <h5 className="text-sm font-medium lowercase tracking-wider text-gray-700 mb-2">
                                    returned items
                                  </h5>
                                  <div className="space-y-2">
                                    {exchange.returnedItems.map((item) => (
                                      <div
                                        key={item.id}
                                        className="relative flex items-center space-x-3 p-2 bg-white rounded opacity-60"
                                      >
                                        <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                                          {item.image ? (
                                            <Image
                                              src={item.image.url}
                                              alt={
                                                item.image.altText || item.name
                                              }
                                              width={40}
                                              height={40}
                                              className="w-full h-full object-cover grayscale"
                                            />
                                          ) : (
                                            <div className="text-gray-400 text-xs">
                                              No Image
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex-1">
                                          <h6 className="text-sm font-medium lowercase tracking-wider text-gray-500">
                                            {item.name}
                                          </h6>
                                          {item.variantTitle &&
                                            item.variantTitle !== "N/A" && (
                                              <p className="text-xs text-gray-400 lowercase tracking-wider">
                                                reason: {item.variantTitle}
                                              </p>
                                            )}
                                          <p className="text-xs text-gray-400 lowercase tracking-wider">
                                            qty: {item.quantity}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Exchange Items */}
                                <div>
                                  <h5 className="text-sm font-medium lowercase tracking-wider text-gray-700 mb-2">
                                    replacement items
                                  </h5>
                                  <div className="space-y-2">
                                    {exchange.exchangeItems.map((item) => (
                                      <div key={item.id}>
                                        <div className="flex items-center space-x-3 p-2 bg-green-50 rounded border border-green-200">
                                          <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                                            {item.image ? (
                                              <Image
                                                src={item.image.url}
                                                alt={
                                                  item.image.altText ||
                                                  item.name
                                                }
                                                width={40}
                                                height={40}
                                                className="w-full h-full object-cover"
                                              />
                                            ) : (
                                              <div className="text-gray-400 text-xs">
                                                No Image
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex-1">
                                            <h6 className="text-sm font-medium lowercase tracking-wider text-black">
                                              {item.name}
                                            </h6>
                                            {item.variantTitle && (
                                              <p className="text-xs text-gray-600 lowercase tracking-wider">
                                                {item.variantTitle}
                                              </p>
                                            )}
                                            <p className="text-xs text-gray-600 lowercase tracking-wider">
                                              qty: {item.quantity}
                                            </p>
                                          </div>
                                        </div>
                                        {item.fulfilled !== true &&
                                          exchange.status === "OPEN" && (
                                            <p className="text-xs text-orange-600 lowercase tracking-wider mt-1 ml-2">
                                              we&apos;re working on fulfilling
                                              your replacement soon
                                            </p>
                                          )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Order Status and Actions */}
                    <div className="flex justify-between items-start pt-4 border-t border-gray-200">
                      <div className="flex-1">
                        {canCancelOrder(order) ? (
                          <p className="text-sm lowercase tracking-wider text-gray-600">
                            we&apos;re working on shipping your product soon.
                            you may cancel the order now. cancellation is not
                            possible once the order is shipped out.
                          </p>
                        ) : order.fulfillmentStatus === "FULFILLED" ? (
                          <p className="text-sm lowercase tracking-wider text-green-600">
                            order shipped!
                          </p>
                        ) : (
                          <p className="text-sm lowercase tracking-wider text-gray-600">
                            we&apos;re working on shipping your product soon.
                          </p>
                        )}
                      </div>
                      {canCancelOrder(order) && (
                        <Button
                          onClick={() => {
                            setOrderToCancel(order);
                            setShowCancelDialog(true);
                          }}
                          disabled={cancellingOrderId === order.id}
                          className="ml-4 lowercase tracking-wider"
                        >
                          {cancellingOrderId === order.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "cancel order"
                          )}
                        </Button>
                      )}
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
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Line Items */}
                    {getFilteredLineItems(order).map(({ node: item }) => (
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
                        <div className="flex flex-col gap-2">
                          {canExchangeItem(order, item) && (
                            <Button
                              onClick={() =>
                                openExchangeDialog(order.id, item.id)
                              }
                              disabled={exchangingItemId === item.id}
                              variant="outline"
                              size="sm"
                              className="lowercase tracking-wider text-xs"
                            >
                              {exchangingItemId === item.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "exchange"
                              )}
                            </Button>
                          )}
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

                    {/* Tracking Numbers */}
                    {getTrackingNumbers(order).length > 0 && (
                      <div className="pt-4 border-t border-gray-200">
                        <div className="space-y-2">
                          {getTrackingNumbers(order).map(
                            (trackingNumber, index) => (
                              <div
                                key={index}
                                className="text-sm lowercase tracking-wider text-gray-700"
                              >
                                tracking number: {trackingNumber}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Active Exchanges */}
                    {getOrderExchanges(order.id).length > 0 && (
                      <div className="pt-4 border-t border-gray-200">
                        <h4 className="font-medium lowercase tracking-wider text-black mb-3">
                          active exchanges
                        </h4>
                        <div className="space-y-4">
                          {getOrderExchanges(order.id).map((exchange) => (
                            <div
                              key={exchange.returnId}
                              className="bg-gray-50 p-3 rounded-lg"
                            >
                              <p className="text-sm lowercase tracking-wider text-gray-600 mb-3">
                                return #{exchange.returnName} -{" "}
                                {exchange.status.toLowerCase()}
                              </p>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Returned Items */}
                                <div>
                                  <h5 className="text-sm font-medium lowercase tracking-wider text-gray-700 mb-2">
                                    returned items
                                  </h5>
                                  <div className="space-y-2">
                                    {exchange.returnedItems.map((item) => (
                                      <div
                                        key={item.id}
                                        className="relative flex items-center space-x-3 p-2 bg-white rounded opacity-60"
                                      >
                                        <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                                          {item.image ? (
                                            <Image
                                              src={item.image.url}
                                              alt={
                                                item.image.altText || item.name
                                              }
                                              width={40}
                                              height={40}
                                              className="w-full h-full object-cover grayscale"
                                            />
                                          ) : (
                                            <div className="text-gray-400 text-xs">
                                              No Image
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex-1">
                                          <h6 className="text-sm font-medium lowercase tracking-wider text-gray-500">
                                            {item.name}
                                          </h6>
                                          {item.variantTitle &&
                                            item.variantTitle !== "N/A" && (
                                              <p className="text-xs text-gray-400 lowercase tracking-wider">
                                                reason: {item.variantTitle}
                                              </p>
                                            )}
                                          <p className="text-xs text-gray-400 lowercase tracking-wider">
                                            qty: {item.quantity}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Exchange Items */}
                                <div>
                                  <h5 className="text-sm font-medium lowercase tracking-wider text-gray-700 mb-2">
                                    replacement items
                                  </h5>
                                  <div className="space-y-2">
                                    {exchange.exchangeItems.map((item) => (
                                      <div key={item.id}>
                                        <div className="flex items-center space-x-3 p-2 bg-green-50 rounded border border-green-200">
                                          <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                                            {item.image ? (
                                              <Image
                                                src={item.image.url}
                                                alt={
                                                  item.image.altText ||
                                                  item.name
                                                }
                                                width={40}
                                                height={40}
                                                className="w-full h-full object-cover"
                                              />
                                            ) : (
                                              <div className="text-gray-400 text-xs">
                                                No Image
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex-1">
                                            <h6 className="text-sm font-medium lowercase tracking-wider text-black">
                                              {item.name}
                                            </h6>
                                            {item.variantTitle && (
                                              <p className="text-xs text-gray-600 lowercase tracking-wider">
                                                {item.variantTitle}
                                              </p>
                                            )}
                                            <p className="text-xs text-gray-600 lowercase tracking-wider">
                                              qty: {item.quantity}
                                            </p>
                                          </div>
                                        </div>
                                        {item.fulfilled !== true &&
                                          exchange.status === "OPEN" && (
                                            <p className="text-xs text-orange-600 lowercase tracking-wider mt-1 ml-2">
                                              we&apos;re working on fulfilling
                                              your replacement soon
                                            </p>
                                          )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Order Status */}
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm lowercase tracking-wider text-green-600">
                        order shipped!
                      </p>
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
                        <p className="text-sm lowercase tracking-wider text-gray-600">
                          cancelled
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Line Items */}
                      {getFilteredLineItems(order).map(({ node: item }) => (
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

                      {/* Tracking Numbers */}
                      {getTrackingNumbers(order).length > 0 && (
                        <div className="pt-4 border-t border-gray-200">
                          <div className="space-y-2">
                            {getTrackingNumbers(order).map(
                              (trackingNumber, index) => (
                                <div
                                  key={index}
                                  className="text-sm lowercase tracking-wider text-gray-700"
                                >
                                  tracking number: {trackingNumber}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Cancel Order Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="lowercase tracking-wider text-black">
              cancel order {orderToCancel?.name}?
            </DialogTitle>
            <DialogDescription className="lowercase tracking-wider text-gray-600">
              are you sure? you will receive a refund in 2-3 days.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelDialog(false);
                setOrderToCancel(null);
              }}
              className="lowercase tracking-wider border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
            >
              close
            </Button>
            <Button
              onClick={async () => {
                if (orderToCancel) {
                  setShowCancelDialog(false);
                  await cancelOrder(orderToCancel.id);
                  setOrderToCancel(null);
                }
              }}
              disabled={cancellingOrderId === orderToCancel?.id}
              className="lowercase tracking-wider border border-red-500 text-red-500 bg-transparent hover:bg-red-500 hover:text-white transition-colors duration-200"
            >
              {cancellingOrderId === orderToCancel?.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  cancelling...
                </>
              ) : (
                "confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exchange Dialog */}
      <Dialog open={showExchangeDialog} onOpenChange={setShowExchangeDialog}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="lowercase tracking-wider text-black">
              exchange {exchangeOptions?.originalItem.name}
            </DialogTitle>
            <DialogDescription className="lowercase tracking-wider text-gray-600">
              select a new size for exchange. current size:{" "}
              {exchangeOptions?.originalItem.variantTitle}
            </DialogDescription>
          </DialogHeader>

          {exchangeOptions && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium lowercase tracking-wider text-gray-700">
                  new size
                </label>
                <Select
                  value={selectedVariant}
                  onValueChange={setSelectedVariant}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {exchangeOptions.availableVariants.map((variant) => (
                      <SelectItem
                        key={variant.id}
                        value={variant.id}
                        disabled={!variant.inStock}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="lowercase tracking-wider">
                            {variant.title}
                          </span>
                          <span
                            className={`text-xs ml-2 ${
                              variant.inStock
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {variant.inStock ? "in stock" : "out of stock"}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium lowercase tracking-wider text-gray-700">
                  reason for exchange
                </label>
                <Select
                  value={exchangeReason}
                  onValueChange={setExchangeReason}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SIZE_TOO_SMALL">
                      size too small
                    </SelectItem>
                    <SelectItem value="SIZE_TOO_LARGE">
                      size too large
                    </SelectItem>
                    <SelectItem value="STYLE">style preference</SelectItem>
                    <SelectItem value="OTHER">other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowExchangeDialog(false);
                setExchangeOptions(null);
                setSelectedVariant("");
              }}
              className="lowercase tracking-wider border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
            >
              cancel
            </Button>
            <Button
              onClick={submitExchange}
              disabled={!selectedVariant || exchangeLoading}
              className="lowercase tracking-wider bg-black text-white hover:bg-gray-800"
            >
              {exchangeLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  creating exchange...
                </>
              ) : (
                "create exchange"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
