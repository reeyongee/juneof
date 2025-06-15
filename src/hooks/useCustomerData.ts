"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  executeCustomerAccountQuery,
  type GraphQLResponse,
} from "@/lib/shopify-auth";

interface CustomerOrder {
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
        variant: {
          id: string;
          title: string;
          price: {
            amount: string;
            currencyCode: string;
          };
          image?: {
            originalSrc: string;
            altText?: string;
          };
        };
      };
    }>;
  };
}

interface CustomerProfile {
  id: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  emailAddress?: {
    emailAddress: string;
  };
}

interface UseCustomerDataReturn {
  profile: CustomerProfile | null;
  orders: CustomerOrder[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCustomerData(): UseCustomerDataReturn {
  const { isAuthenticated, tokens } = useAuth();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomerProfile = async (accessToken: string) => {
    const config = {
      shopId:
        process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_SHOP_ID || "your-shop-id",
      accessToken,
    };

    const query = {
      query: `
        query GetCustomerProfile {
          customer {
            id
            displayName
            firstName
            lastName
            emailAddress {
              emailAddress
            }
          }
        }
      `,
    };

    const response: GraphQLResponse<{ customer: CustomerProfile }> =
      await executeCustomerAccountQuery(config, query);

    if (response.errors && response.errors.length > 0) {
      throw new Error(`GraphQL Error: ${response.errors[0].message}`);
    }

    return response.data?.customer || null;
  };

  const fetchCustomerOrders = async (accessToken: string) => {
    const config = {
      shopId:
        process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_SHOP_ID || "your-shop-id",
      accessToken,
    };

    const query = {
      query: `
        query GetCustomerOrders($first: Int!) {
          customer {
            orders(first: $first, sortKey: PROCESSED_AT, reverse: true) {
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
                        variant {
                          id
                          title
                          price {
                            amount
                            currencyCode
                          }
                          image {
                            originalSrc
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
        first: 20, // Fetch up to 20 orders
      },
    };

    const response: GraphQLResponse<{
      customer: { orders: { edges: Array<{ node: CustomerOrder }> } };
    }> = await executeCustomerAccountQuery(config, query);

    if (response.errors && response.errors.length > 0) {
      throw new Error(`GraphQL Error: ${response.errors[0].message}`);
    }

    return (
      response.data?.customer?.orders?.edges?.map((edge) => edge.node) || []
    );
  };

  const fetchData = async () => {
    if (!isAuthenticated || !tokens?.accessToken) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [profileData, ordersData] = await Promise.all([
        fetchCustomerProfile(tokens.accessToken),
        fetchCustomerOrders(tokens.accessToken),
      ]);

      setProfile(profileData);
      setOrders(ordersData);
    } catch (err) {
      console.error("Failed to fetch customer data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch customer data"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAuthenticated, tokens?.accessToken]);

  return {
    profile,
    orders,
    isLoading,
    error,
    refetch: fetchData,
  };
}
