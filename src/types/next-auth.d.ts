import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string; // This will be the Shopify Customer ID (from `sub` claim)
      email?: string | null;
      name?: string | null;
    };
    shopifyAccessToken?: string; // To store Shopify's access token
    shopifyIdToken?: string; // To store Shopify's ID token
    error?: string; // Optional: for handling refresh token errors etc.
  }

  // The User object shape returned by your Shopify provider's `profile` callback
  interface User {
    id: string;
    email?: string | null;
    name?: string | null;
    // These are added by the profile callback to be available to the jwt callback
    shopifyAccessToken?: string;
    shopifyRefreshToken?: string;
    shopifyIdToken?: string;
    shopifyExpiresAt?: number; // Unix timestamp
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    // These tokens will be stored in the JWT
    shopifyAccessToken?: string;
    shopifyRefreshToken?: string;
    shopifyIdToken?: string;
    shopifyExpiresAt?: number; // Unix timestamp for expiry
    // `sub`, `name`, `email` are standard JWT claims NextAuth often populates from the User object
  }
}
