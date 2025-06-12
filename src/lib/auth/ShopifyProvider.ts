import { OAuthConfig, OAuthUserConfig } from "next-auth/providers/oauth";

const CUSTOMER_SHOP_ID = process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_SHOP_ID;
const CUSTOMER_API_VERSION = "2024-07";

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
  return {
    id: "shopify",
    name: "Shopify",
    type: "oauth",
    checks: ["state", "nonce", "pkce"],
    authorization: {
      url: `https://shopify.com/authentication/${CUSTOMER_SHOP_ID}/oauth/authorize`,
      params: {
        scope: "openid email customer-account-api:full",
        client_id: options.clientId,
        response_type: "code",
        code_challenge_method: "S256",
      },
    },
    token: `https://shopify.com/authentication/${CUSTOMER_SHOP_ID}/oauth/token`,
    userinfo: {
      request: async ({ tokens }) => {
        if (!tokens.access_token) {
          throw new Error("access token is missing");
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
          throw new Error(
            `${response.status} (RequestID ${response.headers.get(
              "x-request-id"
            )}): ${await response.text()}`
          );
        }

        interface GraphQLResponse {
          data: { customer: ShopifyCustomer };
        }
        const { data } = (await response.json()) as GraphQLResponse;

        // Transform to Profile format expected by NextAuth
        return {
          id: data.customer.id,
          name: data.customer.displayName,
          email: data.customer.emailAddress.emailAddress,
          image: undefined,
        };
      },
    },
    profile: async (profile) => {
      return {
        id: profile.id,
        name: profile.displayName,
        email: profile.emailAddress.emailAddress,
        image: null,
      };
    },
    options,
  };
};

export default ShopifyProvider;
