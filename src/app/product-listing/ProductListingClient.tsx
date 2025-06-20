"use client";

import { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";
import { useProducts } from "@/context/ProductContext";
import { ShopifyProductNode } from "@/lib/shopify";

// Function to transform Shopify product data to ProductCard props
function transformShopifyProduct(product: ShopifyProductNode) {
  // Get the first image, or use a placeholder if no images
  const primaryImage =
    product.images.edges[0]?.node?.url || "https://picsum.photos/300/450";

  // For hover image, try to use the second image, or use a slightly different placeholder
  const hoverImage =
    product.images.edges[1]?.node?.url ||
    product.images.edges[0]?.node?.url ||
    "https://picsum.photos/id/238/300/450";

  // Convert price from string to number (Shopify returns price as string)
  const price = parseFloat(product.priceRange.minVariantPrice.amount);
  const currencyCode = product.priceRange.minVariantPrice.currencyCode;

  return {
    imageUrl: primaryImage,
    hoverImageUrl: hoverImage,
    name: product.title.toUpperCase(),
    price: price,
    productUrl: `/product/${product.handle}`,
    currencyCode: currencyCode,
  };
}

interface ProductListingClientProps {
  fallbackProducts: Array<{
    imageUrl: string;
    hoverImageUrl: string;
    name: string;
    price: number;
    productUrl: string;
    currencyCode: string;
  }>;
}

export default function ProductListingClient({
  fallbackProducts,
}: ProductListingClientProps) {
  const { preloadedProducts, isProductsLoaded } = useProducts();
  const [displayProducts, setDisplayProducts] = useState(fallbackProducts);

  useEffect(() => {
    if (isProductsLoaded && preloadedProducts.length > 0) {
      // Use preloaded products if available
      const transformedProducts = preloadedProducts.map(
        transformShopifyProduct
      );
      setDisplayProducts(transformedProducts);
    }
  }, [isProductsLoaded, preloadedProducts]);

  const showFallbackMessage =
    !isProductsLoaded || preloadedProducts.length === 0;

  return (
    <main className="min-h-screen bg-[#F8F4EC] p-8">
      {showFallbackMessage && (
        <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400">
          <p className="text-yellow-800">
            {!isProductsLoaded
              ? "Loading Shopify products..."
              : "No Shopify products found. Displaying mock data. Check your Shopify configuration."}
          </p>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 lowercase tracking-widest opacity-0">
          &nbsp;
        </h1>
        <p className="text-gray-600 mt-2 opacity-0">&nbsp;</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {displayProducts.map((product, index) => (
          <ProductCard
            key={
              isProductsLoaded && preloadedProducts.length > 0
                ? `shopify-${product.productUrl}`
                : `fallback-${index}`
            }
            imageUrl={product.imageUrl}
            hoverImageUrl={product.hoverImageUrl}
            name={product.name}
            price={product.price}
            productUrl={product.productUrl}
            currencyCode={product.currencyCode}
          />
        ))}
      </div>
    </main>
  );
}
