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
    const data = await storefrontApiRequest<ShopifyProductByHandleData>(
      GET_PRODUCT_BY_HANDLE_QUERY,
      { handle }
    );

    if (!data.productByHandle) {
      notFound();
    }

    product = data.productByHandle;
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
