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
