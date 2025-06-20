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
  `https://${domain}/api/2025-04/graphql.json`, // Using API version 2025-04. Updated for latest compatibility.
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
                url
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
                url
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
            url
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

// --- Modern Cart API Mutations ---

// Create a new cart
export const CART_CREATE_MUTATION = gql`
  mutation CartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        cost {
          totalAmount {
            amount
            currencyCode
          }
          subtotalAmount {
            amount
            currencyCode
          }
          totalTaxAmount {
            amount
            currencyCode
          }
        }
        lines(first: 250) {
          edges {
            node {
              id
              quantity
              cost {
                totalAmount {
                  amount
                  currencyCode
                }
              }
              merchandise {
                ... on ProductVariant {
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
        buyerIdentity {
          email
          customer {
            id
            firstName
            lastName
          }
          deliveryAddressPreferences {
            ... on MailingAddress {
              id
              firstName
              lastName
              company
              address1
              address2
              city
              province
              country
              zip
              phone
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Add lines to existing cart
export const CART_LINES_ADD_MUTATION = gql`
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        id
        checkoutUrl
        cost {
          totalAmount {
            amount
            currencyCode
          }
          subtotalAmount {
            amount
            currencyCode
          }
          totalTaxAmount {
            amount
            currencyCode
          }
        }
        lines(first: 250) {
          edges {
            node {
              id
              quantity
              cost {
                totalAmount {
                  amount
                  currencyCode
                }
              }
              merchandise {
                ... on ProductVariant {
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
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Update cart lines
export const CART_LINES_UPDATE_MUTATION = gql`
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        id
        checkoutUrl
        cost {
          totalAmount {
            amount
            currencyCode
          }
          subtotalAmount {
            amount
            currencyCode
          }
          totalTaxAmount {
            amount
            currencyCode
          }
        }
        lines(first: 250) {
          edges {
            node {
              id
              quantity
              cost {
                totalAmount {
                  amount
                  currencyCode
                }
              }
              merchandise {
                ... on ProductVariant {
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
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Remove lines from cart
export const CART_LINES_REMOVE_MUTATION = gql`
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        id
        checkoutUrl
        cost {
          totalAmount {
            amount
            currencyCode
          }
          subtotalAmount {
            amount
            currencyCode
          }
          totalTaxAmount {
            amount
            currencyCode
          }
        }
        lines(first: 250) {
          edges {
            node {
              id
              quantity
              cost {
                totalAmount {
                  amount
                  currencyCode
                }
              }
              merchandise {
                ... on ProductVariant {
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
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Update cart buyer identity (for customer authentication and preferences)
export const CART_BUYER_IDENTITY_UPDATE_MUTATION = gql`
  mutation CartBuyerIdentityUpdate(
    $cartId: ID!
    $buyerIdentity: CartBuyerIdentityInput!
  ) {
    cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
      cart {
        id
        checkoutUrl
        cost {
          totalAmount {
            amount
            currencyCode
          }
          subtotalAmount {
            amount
            currencyCode
          }
          totalTaxAmount {
            amount
            currencyCode
          }
        }
        buyerIdentity {
          email
          customer {
            id
            firstName
            lastName
          }
          deliveryAddressPreferences {
            ... on MailingAddress {
              id
              firstName
              lastName
              company
              address1
              address2
              city
              province
              country
              zip
              phone
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Query to retrieve cart by ID
export const GET_CART_QUERY = gql`
  query GetCart($cartId: ID!) {
    cart(id: $cartId) {
      id
      checkoutUrl
      cost {
        totalAmount {
          amount
          currencyCode
        }
        subtotalAmount {
          amount
          currencyCode
        }
        totalTaxAmount {
          amount
          currencyCode
        }
      }
      lines(first: 250) {
        edges {
          node {
            id
            quantity
            cost {
              totalAmount {
                amount
                currencyCode
              }
            }
            merchandise {
              ... on ProductVariant {
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
      buyerIdentity {
        email
        customer {
          id
          firstName
          lastName
        }
        deliveryAddressPreferences {
          ... on MailingAddress {
            id
            firstName
            lastName
            company
            address1
            address2
            city
            province
            country
            zip
            phone
          }
        }
      }
    }
  }
`;

// --- Define a basic type for the product data you expect from the query ---
// This helps with TypeScript type safety.
export interface ShopifyProductImage {
  url: string;
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

// --- Define types for modern Cart API functionality ---
export interface ShopifyCartLine {
  id: string;
  quantity: number;
  cost: {
    totalAmount: ShopifyMoney;
  };
  merchandise: {
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

export interface ShopifyCartCost {
  totalAmount: ShopifyMoney;
  subtotalAmount: ShopifyMoney;
  totalTaxAmount: ShopifyMoney;
}

export interface ShopifyCartBuyerIdentity {
  email?: string;
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  deliveryAddressPreferences?: Array<{
    id: string;
    firstName: string;
    lastName: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    province: string;
    country: string;
    zip: string;
    phone?: string;
  }>;
}

export interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  cost: ShopifyCartCost;
  lines: {
    edges: {
      node: ShopifyCartLine;
    }[];
  };
  buyerIdentity?: ShopifyCartBuyerIdentity;
}

export interface ShopifyCartUserError {
  field: string[];
  message: string;
}

export interface ShopifyCartCreateData {
  cartCreate: {
    cart: ShopifyCart | null;
    userErrors: ShopifyCartUserError[];
  };
}

export interface ShopifyCartLinesAddData {
  cartLinesAdd: {
    cart: ShopifyCart | null;
    userErrors: ShopifyCartUserError[];
  };
}

export interface ShopifyCartLinesUpdateData {
  cartLinesUpdate: {
    cart: ShopifyCart | null;
    userErrors: ShopifyCartUserError[];
  };
}

export interface ShopifyCartLinesRemoveData {
  cartLinesRemove: {
    cart: ShopifyCart | null;
    userErrors: ShopifyCartUserError[];
  };
}

export interface ShopifyCartBuyerIdentityUpdateData {
  cartBuyerIdentityUpdate: {
    cart: ShopifyCart | null;
    userErrors: ShopifyCartUserError[];
  };
}

export interface ShopifyGetCartData {
  cart: ShopifyCart | null;
}

export interface CartLineInput {
  merchandiseId: string;
  quantity: number;
  attributes?: {
    key: string;
    value: string;
  }[];
}

export interface CartLineUpdateInput {
  id: string;
  quantity: number;
  attributes?: {
    key: string;
    value: string;
  }[];
}

export interface CartBuyerIdentityInput {
  email?: string;
  customerAccessToken?: string;
  countryCode?: string;
  deliveryAddressPreferences?: Array<{
    customerAddressId?: string;
    deliveryAddress?: {
      firstName?: string;
      lastName?: string;
      company?: string;
      address1?: string;
      address2?: string;
      city?: string;
      province?: string;
      country?: string;
      zip?: string;
      phone?: string;
    };
    deliveryAddressValidationStrategy?: string;
  }>;
}

export interface CartInput {
  lines?: CartLineInput[];
  buyerIdentity?: CartBuyerIdentityInput;
  attributes?: {
    key: string;
    value: string;
  }[];
}

// --- Helper functions for modern Cart API functionality ---

/**
 * Create a new Shopify cart with line items and buyer identity
 */
export async function createCart(
  lines: CartLineInput[],
  buyerIdentity?: CartBuyerIdentityInput
): Promise<ShopifyCart> {
  try {
    const input: CartInput = {
      lines,
      buyerIdentity,
    };

    const data = await storefrontApiRequest<ShopifyCartCreateData>(
      CART_CREATE_MUTATION,
      { input }
    );

    if (data.cartCreate.userErrors.length > 0) {
      throw new Error(
        `Cart creation failed: ${data.cartCreate.userErrors
          .map((error) => error.message)
          .join(", ")}`
      );
    }

    if (!data.cartCreate.cart) {
      throw new Error("Cart creation failed: No cart returned");
    }

    return data.cartCreate.cart;
  } catch (error: unknown) {
    console.error("Failed to create cart:", error);
    throw error;
  }
}

/**
 * Add lines to an existing cart
 */
export async function addLinesToCart(
  cartId: string,
  lines: CartLineInput[]
): Promise<ShopifyCart> {
  try {
    const data = await storefrontApiRequest<ShopifyCartLinesAddData>(
      CART_LINES_ADD_MUTATION,
      { cartId, lines }
    );

    if (data.cartLinesAdd.userErrors.length > 0) {
      throw new Error(
        `Adding lines to cart failed: ${data.cartLinesAdd.userErrors
          .map((error) => error.message)
          .join(", ")}`
      );
    }

    if (!data.cartLinesAdd.cart) {
      throw new Error("Adding lines to cart failed: No cart returned");
    }

    return data.cartLinesAdd.cart;
  } catch (error: unknown) {
    console.error("Failed to add lines to cart:", error);
    throw error;
  }
}

/**
 * Update lines in an existing cart
 */
export async function updateCartLines(
  cartId: string,
  lines: CartLineUpdateInput[]
): Promise<ShopifyCart> {
  try {
    const data = await storefrontApiRequest<ShopifyCartLinesUpdateData>(
      CART_LINES_UPDATE_MUTATION,
      { cartId, lines }
    );

    if (data.cartLinesUpdate.userErrors.length > 0) {
      throw new Error(
        `Updating cart lines failed: ${data.cartLinesUpdate.userErrors
          .map((error) => error.message)
          .join(", ")}`
      );
    }

    if (!data.cartLinesUpdate.cart) {
      throw new Error("Updating cart lines failed: No cart returned");
    }

    return data.cartLinesUpdate.cart;
  } catch (error: unknown) {
    console.error("Failed to update cart lines:", error);
    throw error;
  }
}

/**
 * Remove lines from an existing cart
 */
export async function removeCartLines(
  cartId: string,
  lineIds: string[]
): Promise<ShopifyCart> {
  try {
    const data = await storefrontApiRequest<ShopifyCartLinesRemoveData>(
      CART_LINES_REMOVE_MUTATION,
      { cartId, lineIds }
    );

    if (data.cartLinesRemove.userErrors.length > 0) {
      throw new Error(
        `Removing cart lines failed: ${data.cartLinesRemove.userErrors
          .map((error) => error.message)
          .join(", ")}`
      );
    }

    if (!data.cartLinesRemove.cart) {
      throw new Error("Removing cart lines failed: No cart returned");
    }

    return data.cartLinesRemove.cart;
  } catch (error: unknown) {
    console.error("Failed to remove cart lines:", error);
    throw error;
  }
}

/**
 * Update cart buyer identity for customer authentication and preferences
 */
export async function updateCartBuyerIdentity(
  cartId: string,
  buyerIdentity: CartBuyerIdentityInput
): Promise<ShopifyCart> {
  try {
    const data = await storefrontApiRequest<ShopifyCartBuyerIdentityUpdateData>(
      CART_BUYER_IDENTITY_UPDATE_MUTATION,
      { cartId, buyerIdentity }
    );

    if (data.cartBuyerIdentityUpdate.userErrors.length > 0) {
      throw new Error(
        `Updating cart buyer identity failed: ${data.cartBuyerIdentityUpdate.userErrors
          .map((error) => error.message)
          .join(", ")}`
      );
    }

    if (!data.cartBuyerIdentityUpdate.cart) {
      throw new Error("Updating cart buyer identity failed: No cart returned");
    }

    return data.cartBuyerIdentityUpdate.cart;
  } catch (error: unknown) {
    console.error("Failed to update cart buyer identity:", error);
    throw error;
  }
}

/**
 * Retrieve a cart by ID
 */
export async function getCart(cartId: string): Promise<ShopifyCart | null> {
  try {
    const data = await storefrontApiRequest<ShopifyGetCartData>(
      GET_CART_QUERY,
      { cartId }
    );

    return data.cart;
  } catch (error: unknown) {
    console.error("Failed to get cart:", error);
    throw error;
  }
}

/**
 * Convert cart items to Shopify cart line inputs
 * Note: This requires mapping cart items to actual Shopify variant IDs
 */
export function convertCartItemsToCartLines(
  cartItems: Array<{
    name: string;
    size: string;
    quantity: number;
    variantId?: string;
  }>
): CartLineInput[] {
  return cartItems
    .filter((item) => item.variantId) // Only include items with variant IDs
    .map((item) => ({
      merchandiseId: item.variantId!,
      quantity: item.quantity,
      attributes: [
        {
          key: "Size",
          value: item.size,
        },
      ],
    }));
}

/**
 * Create cart with customer authentication and redirect to checkout
 */
export async function createCartAndRedirect(
  cartItems: Array<{
    name: string;
    size: string;
    quantity: number;
    variantId?: string;
  }>,
  customerAccessToken?: string,
  email?: string,
  deliveryAddress?: {
    firstName?: string;
    lastName?: string;
    company?: string;
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    country?: string;
    zip?: string;
    phone?: string;
  }
): Promise<void> {
  try {
    const lines = convertCartItemsToCartLines(cartItems);

    if (lines.length === 0) {
      throw new Error(
        "No valid items to checkout. Please ensure products have variant IDs."
      );
    }

    // Prepare buyer identity
    const buyerIdentity: CartBuyerIdentityInput = {};

    if (customerAccessToken) {
      buyerIdentity.customerAccessToken = customerAccessToken;
    }

    if (email) {
      buyerIdentity.email = email;
    }

    if (deliveryAddress) {
      buyerIdentity.deliveryAddressPreferences = [
        {
          deliveryAddress: deliveryAddress,
          deliveryAddressValidationStrategy: "COUNTRY_CODE_ONLY",
        },
      ];
    }

    const cart = await createCart(lines, buyerIdentity);

    // Redirect to Shopify checkout page
    window.location.href = cart.checkoutUrl;
  } catch (error: unknown) {
    console.error("Checkout failed:", error);
    throw error;
  }
}

// --- Client-side preload function for splash screen ---
export async function preloadShopifyProducts(): Promise<{
  products: ShopifyProductNode[];
  imageUrls: string[];
}> {
  try {
    const data = await storefrontApiRequest<ShopifyProductsData>(
      GET_PRODUCTS_FOR_LISTING_QUERY,
      { first: 20 } // Preload first 20 products
    );

    const products = data.products.edges.map((edge) => edge.node);

    // Extract all image URLs for preloading
    const imageUrls: string[] = [];
    products.forEach((product) => {
      product.images.edges.forEach((imageEdge) => {
        if (imageEdge.node.url) {
          imageUrls.push(imageEdge.node.url);
        }
      });
    });

    return { products, imageUrls };
  } catch (error) {
    console.error("Failed to preload Shopify products:", error);
    return { products: [], imageUrls: [] };
  }
}
