namespace NodeJS {
  interface ProcessEnv {
    // Shopify Storefront API (already in use)
    NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN: string;
    NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN: string;

    // NextAuth (already in use)
    NEXTAUTH_URL: string;
    NEXTAUTH_SECRET: string;

    // Shopify Customer Account API (used by the new auth provider)
    NEXT_PUBLIC_SHOPIFY_CUSTOMER_CLIENT_ID: string;
    SHOPIFY_CUSTOMER_CLIENT_SECRET: string;
    SHOPIFY_CUSTOMER_ACCOUNT_API_SHOP_ID: string; // This is the numeric Shop ID
  }
}
