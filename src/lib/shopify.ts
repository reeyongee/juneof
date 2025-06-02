import { GraphQLClient } from "graphql-request";

// Retrieve environment variables
// The '!' (non-null assertion operator) tells TypeScript that these values will definitely be present.
// Ensure they are correctly set in your .env.local file.
const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!;
const storefrontAccessToken =
  process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN!;

// Basic check for environment variables
if (!domain || !storefrontAccessToken) {
  throw new Error(
    "Shopify domain or storefront access token is not defined in environment variables. " +
      "Please check your .env.local file and ensure NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN and " +
      "NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN are set."
  );
}

// Create a new GraphQL client instance
const storefrontClient = new GraphQLClient(
  `https://${domain}/api/2024-04/graphql.json`, // Using API version 2024-04. Adjust if Shopify updates.
  {
    headers: {
      "X-Shopify-Storefront-Access-Token": storefrontAccessToken,
      "Content-Type": "application/json",
    },
  }
);

// Define a more specific GraphQL error type
interface GraphQLError {
  message: string;
  locations?: { line: number; column: number }[];
  path?: (string | number)[];
  extensions?: Record<string, unknown>;
}

// Helper function to make requests
// It takes a GraphQL query string and optional variables
export async function storefrontApiRequest<T = unknown>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  try {
    const data = await storefrontClient.request<T>(query, variables);
    return data;
  } catch (error: unknown) {
    // Log the error for more detailed debugging
    let errorMessage = "An unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error("Shopify Storefront API Error:", errorMessage);

    // Check if error is an object and has response property
    if (typeof error === "object" && error !== null && "response" in error) {
      const responseError = error as {
        response?: { errors?: GraphQLError[]; message?: string };
        request?: { query?: string; variables?: Record<string, unknown> };
        message?: string;
      };
      if (responseError.response && responseError.response.errors) {
        console.error(
          "GraphQL Errors:",
          JSON.stringify(responseError.response.errors, null, 2)
        );
      }
    }

    // Check if error is an object and has request property
    if (typeof error === "object" && error !== null && "request" in error) {
      const requestError = error as {
        request?: { query?: string; variables?: Record<string, unknown> };
      };
      if (requestError.request) {
        console.error("GraphQL Query:", requestError.request.query);
        console.error("GraphQL Variables:", requestError.request.variables);
      }
    }
    // Re-throw a more generic error or a structured error object
    throw new Error(`Shopify API request failed. ${errorMessage}`);
  }
}

// gql tagged template literal (optional, but good for editor syntax highlighting)
export const gql = String.raw;

// --- Example Query to get first 5 products ---
export const GET_FIRST_5_PRODUCTS_QUERY = gql`
  query GetFirst5Products {
    products(first: 5) {
      edges {
        node {
          id
          title
          handle
          description
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 1) {
            edges {
              node {
                originalSrc
                altText
              }
            }
          }
        }
      }
    }
  }
`;

// --- New Query to get more products with multiple images for product listing ---
export const GET_PRODUCTS_FOR_LISTING_QUERY = gql`
  query GetProductsForListing($first: Int = 20) {
    products(first: $first) {
      edges {
        node {
          id
          title
          handle
          description
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 3) {
            edges {
              node {
                originalSrc
                altText
              }
            }
          }
        }
      }
    }
  }
`;

// --- Query to get a single product by handle for dynamic product pages ---
export const GET_PRODUCT_BY_HANDLE_QUERY = gql`
  query GetProductByHandle($handle: String!) {
    productByHandle(handle: $handle) {
      id
      title
      handle
      description
      descriptionHtml
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
        maxVariantPrice {
          amount
          currencyCode
        }
      }
      images(first: 10) {
        edges {
          node {
            originalSrc
            altText
            width
            height
          }
        }
      }
      variants(first: 10) {
        edges {
          node {
            id
            title
            price {
              amount
              currencyCode
            }
            availableForSale
            selectedOptions {
              name
              value
            }
          }
        }
      }
      options {
        id
        name
        values
      }
      tags
      vendor
      productType
    }
  }
`;

// --- Mutation to create a checkout ---
export const CREATE_CHECKOUT_MUTATION = gql`
  mutation CreateCheckout($input: CheckoutCreateInput!) {
    checkoutCreate(input: $input) {
      checkout {
        id
        webUrl
        totalTaxV2 {
          amount
          currencyCode
        }
        totalPriceV2 {
          amount
          currencyCode
        }
        subtotalPriceV2 {
          amount
          currencyCode
        }
        lineItems(first: 250) {
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
                product {
                  id
                  title
                  handle
                }
              }
            }
          }
        }
      }
      checkoutUserErrors {
        field
        message
      }
    }
  }
`;

// --- Mutation to add line items to existing checkout ---
export const CHECKOUT_LINE_ITEMS_ADD_MUTATION = gql`
  mutation CheckoutLineItemsAdd(
    $checkoutId: ID!
    $lineItems: [CheckoutLineItemInput!]!
  ) {
    checkoutLineItemsAdd(checkoutId: $checkoutId, lineItems: $lineItems) {
      checkout {
        id
        webUrl
        totalTaxV2 {
          amount
          currencyCode
        }
        totalPriceV2 {
          amount
          currencyCode
        }
        subtotalPriceV2 {
          amount
          currencyCode
        }
        lineItems(first: 250) {
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
                product {
                  id
                  title
                  handle
                }
              }
            }
          }
        }
      }
      checkoutUserErrors {
        field
        message
      }
    }
  }
`;

// --- Define a basic type for the product data you expect from the query ---
// This helps with TypeScript type safety.
export interface ShopifyProductImage {
  originalSrc: string;
  altText: string | null;
}

export interface ShopifyMoney {
  amount: string;
  currencyCode: string;
}

export interface ShopifyPriceRange {
  minVariantPrice: ShopifyMoney;
}

export interface ShopifyProductNode {
  id: string;
  title: string;
  handle: string;
  description: string;
  priceRange: ShopifyPriceRange;
  images: {
    edges: {
      node: ShopifyProductImage;
    }[];
  };
}

export interface ShopifyProductsData {
  products: {
    edges: {
      node: ShopifyProductNode;
    }[];
  };
}

// --- Define types for single product data ---
export interface ShopifyProductVariant {
  id: string;
  title: string;
  price: ShopifyMoney;
  availableForSale: boolean;
  selectedOptions: {
    name: string;
    value: string;
  }[];
}

export interface ShopifyProductOption {
  id: string;
  name: string;
  values: string[];
}

export interface ShopifyProductDetails {
  id: string;
  title: string;
  handle: string;
  description: string;
  descriptionHtml: string;
  priceRange: {
    minVariantPrice: ShopifyMoney;
    maxVariantPrice: ShopifyMoney;
  };
  images: {
    edges: {
      node: ShopifyProductImage & {
        width: number;
        height: number;
      };
    }[];
  };
  variants: {
    edges: {
      node: ShopifyProductVariant;
    }[];
  };
  options: ShopifyProductOption[];
  tags: string[];
  vendor: string;
  productType: string;
}

export interface ShopifyProductByHandleData {
  productByHandle: ShopifyProductDetails | null;
}

// --- Define types for checkout functionality ---
export interface ShopifyCheckoutLineItem {
  id: string;
  title: string;
  quantity: number;
  variant: {
    id: string;
    title: string;
    price: ShopifyMoney;
    product: {
      id: string;
      title: string;
      handle: string;
    };
  };
}

export interface ShopifyCheckout {
  id: string;
  webUrl: string;
  totalTaxV2: ShopifyMoney;
  totalPriceV2: ShopifyMoney;
  subtotalPriceV2: ShopifyMoney;
  lineItems: {
    edges: {
      node: ShopifyCheckoutLineItem;
    }[];
  };
}

export interface ShopifyCheckoutUserError {
  field: string[];
  message: string;
}

export interface ShopifyCheckoutCreateData {
  checkoutCreate: {
    checkout: ShopifyCheckout | null;
    checkoutUserErrors: ShopifyCheckoutUserError[];
  };
}

export interface ShopifyCheckoutLineItemsAddData {
  checkoutLineItemsAdd: {
    checkout: ShopifyCheckout | null;
    checkoutUserErrors: ShopifyCheckoutUserError[];
  };
}

export interface CheckoutLineItemInput {
  variantId: string;
  quantity: number;
  customAttributes?: {
    key: string;
    value: string;
  }[];
}

export interface CheckoutCreateInput {
  lineItems?: CheckoutLineItemInput[];
  email?: string;
  shippingAddress?: {
    firstName?: string;
    lastName?: string;
    company?: string;
    address1?: string;
    address2?: string;
    city?: string;
    country?: string;
    province?: string;
    zip?: string;
    phone?: string;
  };
}

// --- Helper functions for checkout functionality ---

/**
 * Create a new Shopify checkout with line items
 */
export async function createCheckout(
  lineItems: CheckoutLineItemInput[],
  email?: string
): Promise<ShopifyCheckout> {
  try {
    const input: CheckoutCreateInput = {
      lineItems,
      email,
    };

    const data = await storefrontApiRequest<ShopifyCheckoutCreateData>(
      CREATE_CHECKOUT_MUTATION,
      { input }
    );

    if (data.checkoutCreate.checkoutUserErrors.length > 0) {
      throw new Error(
        `Checkout creation failed: ${data.checkoutCreate.checkoutUserErrors
          .map((error) => error.message)
          .join(", ")}`
      );
    }

    if (!data.checkoutCreate.checkout) {
      throw new Error("Checkout creation failed: No checkout returned");
    }

    return data.checkoutCreate.checkout;
  } catch (error) {
    console.error("Failed to create checkout:", error);
    throw error;
  }
}

/**
 * Convert cart items to Shopify checkout line items
 * Note: This requires mapping cart items to actual Shopify variant IDs
 */
export function convertCartItemsToLineItems(
  cartItems: Array<{
    name: string;
    size: string;
    quantity: number;
    variantId?: string; // We'll need to add this to cart items
  }>
): CheckoutLineItemInput[] {
  return cartItems
    .filter((item) => item.variantId) // Only include items with variant IDs
    .map((item) => ({
      variantId: item.variantId!,
      quantity: item.quantity,
      customAttributes: [
        {
          key: "Size",
          value: item.size,
        },
      ],
    }));
}

/**
 * Create checkout and redirect to Shopify checkout page
 */
export async function createCheckoutAndRedirect(
  cartItems: Array<{
    name: string;
    size: string;
    quantity: number;
    variantId?: string;
  }>,
  email?: string
): Promise<void> {
  try {
    const lineItems = convertCartItemsToLineItems(cartItems);

    if (lineItems.length === 0) {
      throw new Error(
        "No valid items to checkout. Please ensure products have variant IDs."
      );
    }

    const checkout = await createCheckout(lineItems, email);

    // Redirect to Shopify checkout page
    window.location.href = checkout.webUrl;
  } catch (error) {
    console.error("Checkout failed:", error);
    throw error;
  }
}
