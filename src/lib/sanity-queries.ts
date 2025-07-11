import { client } from "@/sanity/lib/client";
import { ShopifyProductDetails } from "./shopify";

// Types for our guide content
export interface WashCareGuide {
  _id: string;
  productId: string;
  productTitle?: string;
  content: string;
}

export interface SizeGuide {
  _id: string;
  productId: string;
  productTitle?: string;
  content: string;
}

// Extended product interface that includes guide content
export interface ProductWithGuides extends ShopifyProductDetails {
  washCareGuide?: WashCareGuide | null;
  sizeGuide?: SizeGuide | null;
}

// Query to fetch wash care guide by product ID
export async function getWashCareByProductId(
  productId: string
): Promise<WashCareGuide | null> {
  try {
    const query = `*[_type == "washCare" && productId == $productId][0] {
      _id,
      productId,
      productTitle,
      content
    }`;

    const result = await client.fetch(query, { productId });
    return result || null;
  } catch (error) {
    console.error("Error fetching wash care guide:", error);
    return null;
  }
}

// Query to fetch size guide by product ID
export async function getSizeGuideByProductId(
  productId: string
): Promise<SizeGuide | null> {
  try {
    const query = `*[_type == "sizeGuide" && productId == $productId][0] {
      _id,
      productId,
      productTitle,
      content
    }`;

    const result = await client.fetch(query, { productId });
    return result || null;
  } catch (error) {
    console.error("Error fetching size guide:", error);
    return null;
  }
}

// Utility function to extract numeric product ID from Shopify GID
export function extractProductId(shopifyId: string): string {
  // Handle both full GID format and plain numeric IDs
  if (shopifyId.includes("gid://shopify/Product/")) {
    return shopifyId.split("/").pop() || "";
  }
  return shopifyId;
}
