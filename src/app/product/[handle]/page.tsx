import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import {
  storefrontApiRequest,
  GET_PRODUCT_BY_HANDLE_QUERY,
  GET_PRODUCTS_FOR_LISTING_QUERY,
  ShopifyProductByHandleData,
  ShopifyProductsData,
} from "@/lib/shopify";
import {
  getWashCareByProductId,
  getSizeGuideByProductId,
  extractProductId,
  ProductWithGuides,
} from "@/lib/sanity-queries";
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

// Generate metadata for product pages
export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { handle } = await params;

  try {
    const data = await storefrontApiRequest<ShopifyProductByHandleData>(
      GET_PRODUCT_BY_HANDLE_QUERY,
      { handle }
    );

    if (!data.productByHandle) {
      return {
        title: "Product Not Found",
        description: "The requested product could not be found.",
      };
    }

    const product = data.productByHandle;
    const price = parseFloat(product.priceRange.minVariantPrice.amount);
    const currency = product.priceRange.minVariantPrice.currencyCode;
    const imageUrl =
      product.images.edges[0]?.node.url || "/landing-images/logo.svg";

    return {
      title: product.title,
      description:
        product.description ||
        `${product.title} - Sustainable fashion from June Of.`,
      openGraph: {
        title: `${product.title} | June Of`,
        description:
          product.description ||
          `${product.title} - Sustainable fashion from June Of`,
        url: `https://www.juneof.com/product/${handle}`,
        images: [
          {
            url: imageUrl,
            width: 800,
            height: 800,
            alt: product.title,
          },
        ],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${product.title} | June Of`,
        description:
          product.description ||
          `${product.title} - Sustainable fashion from June Of`,
        images: [imageUrl],
      },
      alternates: {
        canonical: `https://www.juneof.com/product/${handle}`,
      },
      other: {
        "product:price:amount": price.toString(),
        "product:price:currency": currency,
        "product:availability": "in stock",
        "product:condition": "new",
        "product:brand": "June Of",
      },
    };
  } catch (error) {
    console.error("Failed to generate metadata for product:", error);
    return {
      title: "Product | June Of",
      description: "Sustainable fashion from June Of.",
    };
  }
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
  let productWithGuides: ProductWithGuides | null = null;

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

    const product = data.productByHandle;

    // Log the current metafield value for debugging
    console.log(
      `Product ${handle} express_interest metafield:`,
      product.metafield?.value
    );

    // Extract numeric product ID from Shopify GID
    const numericProductId = extractProductId(product.id);

    // Fetch guide content from Sanity in parallel
    const [washCareGuide, sizeGuide] = await Promise.all([
      getWashCareByProductId(numericProductId),
      getSizeGuideByProductId(numericProductId),
    ]);

    // Combine product data with guide content
    productWithGuides = {
      ...product,
      washCareGuide,
      sizeGuide,
    };

    console.log(
      `Fetched guides for product ${handle}:`,
      `Wash Care: ${washCareGuide ? "✓" : "✗"}`,
      `Size Guide: ${sizeGuide ? "✓" : "✗"}`
    );
  } catch (error) {
    console.error("Failed to fetch product:", error);
    notFound();
  }

  // Pass the product data with guides to the client component wrapped in Suspense
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductPageClient product={productWithGuides} />
    </Suspense>
  );
}
