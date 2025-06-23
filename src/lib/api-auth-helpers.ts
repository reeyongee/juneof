import { NextRequest } from "next/server";
import { CustomerAccountApiClient } from "./shopify-auth";

interface AuthenticatedUser {
  customerId: string;
  accessToken: string;
  apiClient: CustomerAccountApiClient;
}

interface CustomerData {
  customer: {
    id: string;
    displayName: string;
    firstName?: string;
    lastName?: string;
  };
}

interface OrderData {
  order: {
    id: string;
    name: string;
    processedAt: string;
    fulfillmentStatus: string;
    financialStatus: string;
    currentTotalPrice: {
      amount: string;
      currencyCode: string;
    };
    lineItems: {
      nodes: Array<{
        id: string;
        title: string;
        quantity: number;
        currentQuantity: number;
      }>;
    };
  };
}

interface OrdersData {
  orders: {
    nodes: Array<{
      id: string;
      name: string;
      processedAt: string;
      fulfillmentStatus: string;
      financialStatus: string;
      cancelledAt?: string;
      cancelReason?: string;
      currentTotalPrice: {
        amount: string;
        currencyCode: string;
      };
    }>;
  };
}

interface AuthenticationResult {
  success: boolean;
  user?: AuthenticatedUser;
  error?: string;
  statusCode?: number;
}

/**
 * Authenticates a request and returns the authenticated customer information
 * This function validates the user's session and extracts their customer ID securely
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<AuthenticationResult> {
  try {
    // Try to get access token from Authorization header first (Bearer token)
    let accessToken = request.headers
      .get("authorization")
      ?.replace("Bearer ", "");

    // If no Authorization header, try to get from secure cookies
    if (!accessToken) {
      accessToken = request.cookies.get("shopify-access-token")?.value;
    }

    if (!accessToken) {
      return {
        success: false,
        error: "Missing authentication token",
        statusCode: 401,
      };
    }

    // Get environment variables
    const shopId = process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_SHOP_ID;
    if (!shopId) {
      return {
        success: false,
        error: "Server configuration error",
        statusCode: 500,
      };
    }

    // Create API client with the authenticated token
    const apiClient = new CustomerAccountApiClient({
      shopId,
      accessToken,
    });

    // Fetch customer profile to validate token and get customer ID
    const customerQuery = `
      query GetAuthenticatedCustomer {
        customer {
          id
          displayName
          firstName
          lastName
        }
      }
    `;

    const response = await apiClient.query<CustomerData>({
      query: customerQuery,
      operationName: "GetAuthenticatedCustomer",
    });

    if (response.errors && response.errors.length > 0) {
      console.error("Authentication error:", response.errors);
      return {
        success: false,
        error: "Invalid or expired authentication token",
        statusCode: 401,
      };
    }

    const customer = response.data?.customer;
    if (!customer || !customer.id) {
      return {
        success: false,
        error: "Unable to retrieve customer information",
        statusCode: 401,
      };
    }

    return {
      success: true,
      user: {
        customerId: customer.id,
        accessToken,
        apiClient,
      },
    };
  } catch (error) {
    console.error("Request authentication error:", error);
    return {
      success: false,
      error: "Authentication failed",
      statusCode: 500,
    };
  }
}

/**
 * Validates that a customer owns a specific order using the Customer Account API
 * This is more secure than using the Admin API
 */
export async function validateOrderOwnership(
  apiClient: CustomerAccountApiClient,
  orderId: string
): Promise<{ isOwner: boolean; order?: OrderData["order"]; error?: string }> {
  try {
    // Use Customer Account API to get orders - this automatically filters to authenticated customer
    const orderQuery = `
      query GetCustomerOrder($orderId: ID!) {
        order(id: $orderId) {
          id
          name
          processedAt
          fulfillmentStatus
          financialStatus
          currentTotalPrice {
            amount
            currencyCode
          }
          lineItems(first: 10) {
            nodes {
              id
              title
              quantity
              currentQuantity
            }
          }
        }
      }
    `;

    const response = await apiClient.query<OrderData>({
      query: orderQuery,
      variables: { orderId },
      operationName: "GetCustomerOrder",
    });

    if (response.errors && response.errors.length > 0) {
      console.error("Order validation error:", response.errors);
      return {
        isOwner: false,
        error: "Unable to validate order ownership",
      };
    }

    const order = response.data?.order;
    if (!order) {
      return {
        isOwner: false,
        error: "Order not found or not owned by customer",
      };
    }

    return {
      isOwner: true,
      order,
    };
  } catch (error) {
    console.error("Order ownership validation error:", error);
    return {
      isOwner: false,
      error: "Failed to validate order ownership",
    };
  }
}

/**
 * Gets multiple orders for the authenticated customer
 */
export async function getCustomerOrders(
  apiClient: CustomerAccountApiClient,
  orderIds: string[]
): Promise<{
  success: boolean;
  orders?: OrdersData["orders"]["nodes"];
  error?: string;
}> {
  try {
    const ordersQuery = `
      query GetCustomerOrders($first: Int!) {
        orders(first: $first) {
          nodes {
            id
            name
            processedAt
            fulfillmentStatus
            financialStatus
            cancelledAt
            cancelReason
            currentTotalPrice {
              amount
              currencyCode
            }
          }
        }
      }
    `;

    const response = await apiClient.query<OrdersData>({
      query: ordersQuery,
      variables: { first: 50 }, // Adjust as needed
      operationName: "GetCustomerOrders",
    });

    if (response.errors && response.errors.length > 0) {
      console.error("Customer orders fetch error:", response.errors);
      return {
        success: false,
        error: "Unable to fetch orders",
      };
    }

    const orders = response.data?.orders?.nodes || [];

    // Filter to only the requested order IDs if provided
    const filteredOrders =
      orderIds.length > 0
        ? orders.filter((order) => orderIds.includes(order.id))
        : orders;

    return {
      success: true,
      orders: filteredOrders,
    };
  } catch (error) {
    console.error("Get customer orders error:", error);
    return {
      success: false,
      error: "Failed to fetch customer orders",
    };
  }
}
