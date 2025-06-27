import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  storefrontApiRequest,
  GET_PRODUCT_BY_HANDLE_QUERY,
  GET_PRODUCTS_FOR_LISTING_QUERY,
  ShopifyProductByHandleData,
  ShopifyProductDetails,
  ShopifyProductsData,
} from "@/lib/shopify";
import ProductPageClient from "./ProductPageClient";

// Force dynamic rendering to ensure fresh data
export const dynamic = "force-dynamic";
// Revalidate every 60 seconds
export const revalidate = 60;

interface ProductPageProps {
  params: Promise<{
    handle: string;
  }>;
}

// Generate static params for all products
export async function generateStaticParams() {
  try {
    const data = await storefrontApiRequest<ShopifyProductsData>(
      GET_PRODUCTS_FOR_LISTING_QUERY,
      { first: 50 } // Generate static pages for first 50 products
    );

    return data.products.edges.map((edge) => ({
      handle: edge.node.handle,
    }));
  } catch (error) {
    console.error("Failed to generate static params:", error);
    return [];
  }
}

// Server component to fetch product data
export default async function ProductPage({ params }: ProductPageProps) {
  const { handle } = await params;
  let product: ShopifyProductDetails | null = null;

  try {
    // Force fresh data fetch with cache bypass
    const data = await storefrontApiRequest<ShopifyProductByHandleData>(
      GET_PRODUCT_BY_HANDLE_QUERY,
      { handle },
      { bypassCache: true } // Force fresh data to get latest metafield values
    );

    if (!data.productByHandle) {
      notFound();
    }

    product = data.productByHandle;

    // Log the current metafield value for debugging
    console.log(
      `Product ${handle} express_interest metafield:`,
      product.metafield?.value
    );
  } catch (error) {
    console.error("Failed to fetch product:", error);
    notFound();
  }

  // Pass the product data to the client component wrapped in Suspense
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductPageClient product={product} />
    </Suspense>
  );
}
