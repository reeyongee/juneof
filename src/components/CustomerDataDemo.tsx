"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getStoredTokens,
  autoRefreshTokens,
  CustomerAccountApiClient,
  type ShopifyAuthConfig,
  type TokenStorage,
  type GraphQLResponse,
} from "@/lib/shopify-auth";

interface CustomerProfile {
  customer: {
    id: string;
    displayName: string;
    firstName?: string;
    lastName?: string;
    emailAddress?: {
      emailAddress: string;
    };
    phoneNumber?: {
      phoneNumber: string;
    };
    defaultAddress?: {
      address1?: string;
      address2?: string;
      city?: string;
      province?: string;
      country?: string;
      zip?: string;
    };
  };
}

interface CustomerDataDemoProps {
  config: ShopifyAuthConfig;
}

export default function CustomerDataDemo({ config }: CustomerDataDemoProps) {
  const [tokens, setTokens] = useState<TokenStorage | null>(null);
  const [customerData, setCustomerData] = useState<CustomerProfile | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiClient, setApiClient] = useState<CustomerAccountApiClient | null>(
    null
  );

  // Internal function to fetch customer profile
  const fetchCustomerProfileInternal = useCallback(
    async (client: CustomerAccountApiClient, tokenData: TokenStorage) => {
      try {
        setLoading(true);
        setError(null);

        // First, ensure tokens are fresh
        const refreshedTokens = await autoRefreshTokens(config);
        if (
          refreshedTokens &&
          refreshedTokens.accessToken !== tokenData.accessToken
        ) {
          setTokens(refreshedTokens);
          client.updateAccessToken(refreshedTokens.accessToken);
        }

        // Fetch customer profile using the built-in method
        const response =
          (await client.getCustomerProfile()) as GraphQLResponse<CustomerProfile>;

        if (response.errors && response.errors.length > 0) {
          throw new Error(`GraphQL Error: ${response.errors[0].message}`);
        }

        if (response.data) {
          setCustomerData(response.data);
          console.log("✅ Customer data loaded successfully:", response.data);
        } else {
          throw new Error("No customer data returned");
        }
      } catch (err) {
        console.error("Error fetching customer data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch customer data"
        );
      } finally {
        setLoading(false);
      }
    },
    [config]
  );

  // Load stored tokens on component mount
  useEffect(() => {
    const storedTokens = getStoredTokens();
    if (storedTokens) {
      setTokens(storedTokens);

      // Create API client with the access token
      const client = new CustomerAccountApiClient({
        shopId: config.shopId,
        accessToken: storedTokens.accessToken,
      });
      setApiClient(client);

      // Automatically fetch customer profile if we have tokens
      setTimeout(() => {
        fetchCustomerProfileInternal(client, storedTokens);
      }, 1000);
    }
  }, [config.shopId, fetchCustomerProfileInternal]);

  // Function to refresh tokens if needed
  const handleRefreshTokens = async () => {
    setLoading(true);
    setError(null);

    try {
      const refreshedTokens = await autoRefreshTokens(config, true);
      if (refreshedTokens) {
        setTokens(refreshedTokens);

        // Update API client with new token
        if (apiClient) {
          apiClient.updateAccessToken(refreshedTokens.accessToken);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh tokens");
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch customer profile data
  const fetchCustomerProfile = async () => {
    if (!apiClient || !tokens) {
      setError("No API client or tokens available");
      return;
    }

    await fetchCustomerProfileInternal(apiClient, tokens);
  };

  // Function to execute custom GraphQL queries
  const executeCustomQuery = async () => {
    if (!apiClient) {
      setError("No API client available");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Example: Fetch customer orders
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
                  }
                }
              }
            }
          }
        `,
        variables: {
          first: 5,
        },
      };

      const response = await apiClient.query(ordersQuery);

      if (response.errors && response.errors.length > 0) {
        throw new Error(`GraphQL Error: ${response.errors[0].message}`);
      }

      console.log("Customer Orders:", response.data);
      alert("Check console for customer orders data!");
    } catch (err) {
      console.error("Error executing custom query:", err);
      setError(
        err instanceof Error ? err.message : "Failed to execute custom query"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!tokens) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              No Authentication Tokens Found
            </h3>
            <p className="mt-1 text-sm text-yellow-700">
              Please complete the authentication process first to access
              customer data.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isTokenExpired = tokens.issuedAt + tokens.expiresIn * 1000 < Date.now();

  return (
    <div className="space-y-6">
      {/* Token Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🔑 Access Token Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Token Type:</span>
            <span className="ml-2 text-gray-900">{tokens.tokenType}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Scope:</span>
            <span className="ml-2 text-gray-900">{tokens.scope}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Expires In:</span>
            <span className="ml-2 text-gray-900">
              {tokens.expiresIn} seconds
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Status:</span>
            <span
              className={`ml-2 ${
                isTokenExpired ? "text-red-600" : "text-green-600"
              }`}
            >
              {isTokenExpired ? "Expired" : "Valid"}
            </span>
          </div>
        </div>

        <div className="mt-4">
          <span className="font-medium text-gray-700">Access Token:</span>
          <div className="mt-1 p-2 bg-gray-50 rounded text-xs font-mono break-all">
            {tokens.accessToken.substring(0, 50)}...
          </div>
        </div>

        {tokens.refreshToken && (
          <div className="mt-4">
            <span className="font-medium text-gray-700">
              Refresh Token Available:
            </span>
            <span className="ml-2 text-green-600">✓ Yes</span>
          </div>
        )}

        <div className="mt-4">
          <button
            onClick={handleRefreshTokens}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh Tokens"}
          </button>
        </div>
      </div>

      {/* Customer Data Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          👤 Customer Profile Data
          {loading && (
            <span className="ml-2 text-sm text-blue-600">(Loading...)</span>
          )}
        </h3>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={fetchCustomerProfile}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Fetch Customer Profile"}
          </button>

          {customerData && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">
                Customer Information:
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">ID:</span>
                  <span className="ml-2">{customerData.customer.id}</span>
                </div>
                <div>
                  <span className="font-medium">Display Name:</span>
                  <span className="ml-2">
                    {customerData.customer.displayName}
                  </span>
                </div>
                {customerData.customer.firstName && (
                  <div>
                    <span className="font-medium">First Name:</span>
                    <span className="ml-2">
                      {customerData.customer.firstName}
                    </span>
                  </div>
                )}
                {customerData.customer.lastName && (
                  <div>
                    <span className="font-medium">Last Name:</span>
                    <span className="ml-2">
                      {customerData.customer.lastName}
                    </span>
                  </div>
                )}
                {customerData.customer.emailAddress && (
                  <div>
                    <span className="font-medium">Email:</span>
                    <span className="ml-2">
                      {customerData.customer.emailAddress.emailAddress}
                    </span>
                  </div>
                )}
                {customerData.customer.phoneNumber && (
                  <div>
                    <span className="font-medium">Phone:</span>
                    <span className="ml-2">
                      {customerData.customer.phoneNumber.phoneNumber}
                    </span>
                  </div>
                )}
                {customerData.customer.defaultAddress && (
                  <div>
                    <span className="font-medium">Default Address:</span>
                    <div className="ml-2 mt-1">
                      {customerData.customer.defaultAddress.address1 && (
                        <div>
                          {customerData.customer.defaultAddress.address1}
                        </div>
                      )}
                      {customerData.customer.defaultAddress.address2 && (
                        <div>
                          {customerData.customer.defaultAddress.address2}
                        </div>
                      )}
                      <div>
                        {customerData.customer.defaultAddress.city},{" "}
                        {customerData.customer.defaultAddress.province}{" "}
                        {customerData.customer.defaultAddress.zip}
                      </div>
                      <div>{customerData.customer.defaultAddress.country}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Query Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🔍 Custom GraphQL Queries
        </h3>

        <p className="text-sm text-gray-600 mb-4">
          Execute custom GraphQL queries against the Customer Account API. This
          example fetches recent orders.
        </p>

        <button
          onClick={executeCustomQuery}
          disabled={loading}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Fetch Customer Orders"}
        </button>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Example Query:</h4>
          <pre className="text-xs text-gray-700 overflow-x-auto">
            {`query GetCustomerOrders($first: Int!) {
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
        }
      }
    }
  }
}`}
          </pre>
        </div>
      </div>

      {/* API Documentation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          📚 Available API Operations
        </h3>

        <div className="text-sm text-blue-800 space-y-2">
          <p>
            <strong>Customer Profile:</strong> Get basic customer information,
            addresses, and preferences
          </p>
          <p>
            <strong>Orders:</strong> Fetch customer order history with details
          </p>
          <p>
            <strong>Addresses:</strong> Manage customer shipping and billing
            addresses
          </p>
          <p>
            <strong>Payment Methods:</strong> Access saved payment methods
            (where available)
          </p>
          <p>
            <strong>Subscriptions:</strong> Manage subscription products and
            billing
          </p>
        </div>

        <div className="mt-4 p-4 bg-white rounded border">
          <h4 className="font-medium text-blue-900 mb-2">GraphQL Endpoint:</h4>
          <code className="text-xs text-blue-700">
            https://shopify.com/authentication/{config.shopId}
            /customer-account-api/graphql
          </code>
        </div>
      </div>
    </div>
  );
}
