import NextAuth, { type NextAuthOptions } from "next-auth";
// Remove Supabase and bcryptjs imports if they are no longer needed elsewhere
// import { createClient } from "@supabase/supabase-js";
// import bcrypt from "bcryptjs";

// Helper function to decode JWT payload (basic, consider a library for production robustness)
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payloadBase64Url = token.split(".")[1];
    if (!payloadBase64Url) return null;
    const payloadBase64 = payloadBase64Url
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const decodedJson = Buffer.from(payloadBase64, "base64").toString();
    return JSON.parse(decodedJson) as Record<string, unknown>;
  } catch (e) {
    console.error("Failed to decode JWT payload:", e);
    return null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "shopify-customer", // This ID MUST match the last part of your Callback URI in Shopify
      name: "Shopify",
      type: "oauth",
      // These endpoints come from the Shopify Custom App settings you found
      // The `<shop-id>` placeholder in Shopify's docs is your numerical Shop ID
      authorization: {
        // Use the numerical Shop ID here
        url: `https://shopify.com/authentication/${process.env.SHOPIFY_CUSTOMER_ACCOUNT_API_SHOP_ID}/oauth/authorize`,
        params: {
          scope: "openid email customer-account-api:full",
        },
      },
      token: {
        // Use the numerical Shop ID here
        url: `https://shopify.com/authentication/${process.env.SHOPIFY_CUSTOMER_ACCOUNT_API_SHOP_ID}/oauth/token`,
      },
      userinfo: {
        // Shopify Customer Account API provides user info within the ID token.
        // This request function will parse it.
        request: async ({ tokens }) => {
          if (!tokens.id_token) {
            throw new Error(
              "ID token not received from Shopify. Ensure 'openid' scope is requested."
            );
          }
          const profilePayload = decodeJwtPayload(tokens.id_token);
          if (!profilePayload) {
            throw new Error("Failed to parse ID token from Shopify.");
          }
          return profilePayload; // This payload is passed to the `profile` callback
        },
      },
      clientId: process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_CLIENT_ID!,
      clientSecret: process.env.SHOPIFY_CUSTOMER_CLIENT_SECRET!,
      checks: ["pkce", "state", "nonce"], // NextAuth handles these important security checks
      profile(profile: Record<string, unknown>, tokens) {
        // `profile` is the decoded ID token payload
        // `tokens` contains access_token, id_token, refresh_token, expires_at from Shopify
        return {
          id: profile.sub as string, // 'sub' (subject) is the standard unique ID for the user from Shopify
          name:
            (profile.name as string) ||
            `${(profile.given_name as string) || ""} ${
              (profile.family_name as string) || ""
            }`.trim() ||
            (profile.email as string)?.split("@")[0] ||
            "Shopify User",
          email: profile.email as string,
          // Store Shopify-specific tokens to be saved in the JWT and then session
          shopifyAccessToken: tokens.access_token,
          shopifyRefreshToken: tokens.refresh_token,
          shopifyIdToken: tokens.id_token,
          shopifyExpiresAt: tokens.expires_at, // Unix timestamp (seconds since epoch)
        };
      },
    },
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // `user` is what the `profile` callback returned when a new user signs in.
      // `account` contains tokens from the OAuth provider (Shopify).
      if (account && user) {
        // Persist Shopify tokens from the account object into the JWT
        token.shopifyAccessToken = account.access_token;
        token.shopifyRefreshToken = account.refresh_token;
        token.shopifyIdToken = account.id_token;
        token.shopifyExpiresAt = account.expires_at; // From provider

        // Standard claims
        token.sub = user.id; // User's unique Shopify ID (was profile.sub)
        token.email = user.email;
        token.name = user.name;
      }
      // TODO: Implement token refresh logic here if token.shopifyExpiresAt is approaching expiry.
      // This is crucial for long-lived sessions.
      return token;
    },
    async session({ session, token: jwtToken }) {
      // Pass data from the JWT token to the client-side session object
      if (session.user) {
        session.user.id = jwtToken.sub as string; // Shopify customer ID
        session.user.email = jwtToken.email;
        session.user.name = jwtToken.name;
      }
      // Add Shopify tokens to the session so they can be accessed for API calls
      (
        session as { shopifyAccessToken?: string; shopifyIdToken?: string }
      ).shopifyAccessToken = jwtToken.shopifyAccessToken;
      (
        session as { shopifyAccessToken?: string; shopifyIdToken?: string }
      ).shopifyIdToken = jwtToken.shopifyIdToken;
      // You might also want to pass shopifyExpiresAt or a flag if the token is expiring soon
      return session;
    },
  },
  pages: {
    signIn: "/signin", // Your custom Next.js sign-in page
    // error: '/auth/error', // Optional: custom error page for auth errors
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
