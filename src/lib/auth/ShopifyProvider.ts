import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers/oauth";
import { cookies } from "next/headers";

// Use your main app's environment variable for the Shop ID
const CUSTOMER_SHOP_ID = process.env.SHOPIFY_CUSTOMER_ACCOUNT_API_SHOP_ID;
const CUSTOMER_API_VERSION = "2024-07"; // Or your desired API version

// cookies name to store access token
const CUSTOMER_ACCOUNT_ACCESS_TOKEN_COOKIE = "customer-access-token";

interface ShopifyCustomer {
  id: string;
  displayName: string;
  emailAddress: {
    emailAddress: string;
  };
}

const getCustomerGql = `#graphql
  query getCustomerForSession {
    customer {
      id
      displayName
      emailAddress {
          emailAddress
      }
    }
  }
`;

const ShopifyProvider = (
  options: OAuthUserConfig<ShopifyCustomer>
): OAuthConfig<ShopifyCustomer> => {
  if (!CUSTOMER_SHOP_ID) {
    throw new Error(
      "SHOPIFY_CUSTOMER_ACCOUNT_API_SHOP_ID is not defined in environment variables."
    );
  }
  if (!options.clientId) {
    throw new Error("ShopifyProvider: clientId is missing in options.");
  }
  if (!options.clientSecret) {
    throw new Error("ShopifyProvider: clientSecret is missing in options.");
  }

  return {
    id: "shopify",
    name: "Shopify",
    type: "oauth",
    checks: ["state", "nonce"],
    authorization: {
      url: `https://shopify.com/authentication/${CUSTOMER_SHOP_ID}/oauth/authorize`,
      params: {
        scope: "openid email https://api.shopify.com/auth/customer.readonly", // Updated scope for Customer Account API
        client_id: options.clientId, // Will be process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_CLIENT_ID
        response_type: "code",
      },
    },
    token: {
      request: async ({ params, checks, provider }: any) => {
        if (!params.code) {
          throw new Error("Authorization code is missing");
        }

        if (!checks.code_verifier) {
          throw new Error("Code verifier is missing");
        }

        const credentials = btoa(
          `${provider.clientId}:${provider.clientSecret}`
        );

        const tokenResponse = await fetch(
          `https://shopify.com/authentication/${CUSTOMER_SHOP_ID}/oauth/token`,
          {
            method: "POST",
            headers: {
              "content-type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${credentials}`,
            },
            body: new URLSearchParams({
              grant_type: "authorization_code",
              client_id: provider.clientId!,
              redirect_uri: provider.callbackUrl,
              code: params.code,
              code_verifier: checks.code_verifier,
            }),
          }
        );

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error(
            "Shopify Token Error:",
            errorText,
            "Request ID:",
            tokenResponse.headers.get("x-request-id")
          );
          throw new Error(
            `${tokenResponse.status} (RequestID ${tokenResponse.headers.get(
              "x-request-id"
            )}): ${errorText}`
          );
        }

        interface AccessTokenResponse {
          access_token: string;
          expires_in: number; // in seconds
          id_token: string;
          refresh_token: string;
          scope: string; // Shopify also returns scope
        }
        const data = (await tokenResponse.json()) as AccessTokenResponse;

        (await cookies()).set(
          CUSTOMER_ACCOUNT_ACCESS_TOKEN_COOKIE,
          data.access_token,
          {
            expires: Date.now() + data.expires_in * 1000,
            path: "/",
            secure: process.env.NODE_ENV === "production",
            httpOnly: true, // Recommended for security
            sameSite: "lax",
          }
        );

        return {
          tokens: {
            access_token: data.access_token,
            id_token: data.id_token,
            refresh_token: data.refresh_token,
            expires_at: Math.floor(Date.now() / 1000) + data.expires_in, // Add expires_at for NextAuth JWT
            scope: data.scope,
          },
        };
      },
    },
    userinfo: {
      // @ts-expect-error - NextAuth v4 type compatibility issue
      request: async ({ tokens }: any) => {
        if (!tokens.access_token) {
          throw new Error("Access token is missing for userinfo request");
        }

        const response = await fetch(
          `https://shopify.com/${CUSTOMER_SHOP_ID}/account/customer/api/${CUSTOMER_API_VERSION}/graphql`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: tokens.access_token,
            },
            body: JSON.stringify({
              operationName: "GetCustomerForSession",
              query: getCustomerGql,
              variables: {},
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            "Shopify UserInfo Error:",
            errorText,
            "Request ID:",
            response.headers.get("x-request-id")
          );
          throw new Error(
            `${response.status} (RequestID ${response.headers.get(
              "x-request-id"
            )}): ${errorText}`
          );
        }

        interface GraphQLResponse {
          data?: { customer: ShopifyCustomer };
          errors?: Array<{ message: string; [key: string]: unknown }>;
        }
        const { data, errors } = (await response.json()) as GraphQLResponse;

        if (errors || !data || !data.customer) {
          console.error("Shopify UserInfo GraphQL Error:", errors);
          throw new Error(
            `Failed to fetch customer data: ${JSON.stringify(errors)}`
          );
        }
        return data.customer;
      },
    },
    profile: async (profile: ShopifyCustomer) => {
      return {
        id: profile.id, // Shopify Customer ID like "gid://shopify/Customer/12345"
        name: profile.displayName,
        email: profile.emailAddress?.emailAddress,
        image: null, // Shopify Customer API doesn't provide an image URL by default
      };
    },
    options,
  };
};

export default ShopifyProvider;
