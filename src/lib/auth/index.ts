import { getServerSession, type AuthOptions } from "next-auth";
import ShopifyProvider from "./ShopifyProvider"; // Adjusted import path

// Use your main app's environment variable for the Shop ID
const CUSTOMER_SHOP_ID = process.env.SHOPIFY_CUSTOMER_ACCOUNT_API_SHOP_ID;

export const authOptions: AuthOptions = {
  providers: [
    ShopifyProvider({
      // Use your main app's environment variables
      clientId: process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_CLIENT_ID!,
      clientSecret: process.env.SHOPIFY_CUSTOMER_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        // Persist the OAuth access_token, refresh_token, and id_token to the JWT
        token.shopifyAccessToken = account.access_token;
        token.shopifyRefreshToken = account.refresh_token;
        token.shopifyIdToken = account.id_token; // From ShopifyProvider's token response
        // account.expires_at is already a Unix timestamp in seconds (from token.request)
        token.shopifyExpiresAt = account.expires_at as number;
        token.id = user.id; // Ensure user.id (Shopify Customer GID) is in the token
        // token.email and token.name are usually populated by NextAuth from the user object
      }

      // TODO: Implement token refresh logic if Shopify supports it for Customer Account API
      // For now, if the token is expired, it will require re-login.
      if (
        token.shopifyExpiresAt &&
        Date.now() / 1000 > token.shopifyExpiresAt
      ) {
        console.warn("Shopify token expired.");
        // Returning a token with an error property can signal the client to handle re-auth
        return { ...token, error: "ShopifyTokenExpired" };
      }

      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token and user ID from the token.
      if (token.sub) {
        // token.sub should be the user's ID from the provider
        session.user.id = token.sub;
      }
      if (token.id) {
        // Fallback or primary source for user ID
        session.user.id = token.id as string;
      }
      session.user.name = token.name;
      session.user.email = token.email;

      session.shopifyAccessToken = token.shopifyAccessToken as
        | string
        | undefined;
      session.shopifyIdToken = token.shopifyIdToken as string | undefined;

      if (token.error) {
        session.error = token.error as string;
      }
      return session;
    },
  },
  events: {
    async signOut({ token }) {
      if (!CUSTOMER_SHOP_ID) {
        console.error(
          "SignOut Event: SHOPIFY_CUSTOMER_ACCOUNT_API_SHOP_ID is not defined."
        );
        return;
      }
      // Trigger sign out on Shopify
      const signOutUrl = new URL(
        `https://shopify.com/authentication/${CUSTOMER_SHOP_ID}/logout`
      );
      if (token.shopifyIdToken) {
        // Use the shopifyIdToken stored in the JWT
        signOutUrl.searchParams.append(
          "id_token_hint",
          token.shopifyIdToken as string
        );
      }

      try {
        const response = await fetch(signOutUrl.toString(), { method: "GET" }); // Shopify logout is GET
        if (!response.ok) {
          console.error(
            `Shopify sign out failed: ${
              response.status
            } ${await response.text()}`
          );
        } else {
          console.log("Successfully signed out from Shopify.");
        }
      } catch (error) {
        console.error("Error during Shopify sign out:", error);
      }
    },
  },
  // You might want to add a pages configuration if you have custom sign-in pages
  // pages: {
  //   signIn: '/auth/signin', // example
  // }
  debug: process.env.NODE_ENV === "development", // Enable debug logs in development
};

/**
 * Get auth session for server components and API routes
 */
export const getAuthSession = () => {
  return getServerSession(authOptions);
};
