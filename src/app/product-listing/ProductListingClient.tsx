"use client";

import { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";
import { useProducts } from "@/context/ProductContext";
import { ShopifyProductNode } from "@/lib/shopify";
import { Loader2 } from "lucide-react";

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

  // Check if express interest is enabled for this product
  const expressInterest = product.metafield?.value === "true";

  return {
    imageUrl: primaryImage,
    hoverImageUrl: hoverImage,
    name: product.title.toUpperCase(),
    price: price,
    productUrl: `/product/${product.handle}`,
    currencyCode: currencyCode,
    expressInterest: expressInterest,
  };
}

export default function ProductListingClient() {
  const { preloadedProducts, isProductsLoaded } = useProducts();
  const [displayProducts, setDisplayProducts] = useState<
    Array<{
      imageUrl: string;
      hoverImageUrl: string;
      name: string;
      price: number;
      productUrl: string;
      currencyCode: string;
      expressInterest: boolean;
    }>
  >([]);

  useEffect(() => {
    if (isProductsLoaded && preloadedProducts.length > 0) {
      // Use preloaded products if available
      const transformedProducts = preloadedProducts.map(
        transformShopifyProduct
      );
      setDisplayProducts(transformedProducts);
    }
  }, [isProductsLoaded, preloadedProducts]);

  // Show loading spinner if products are not loaded yet
  if (!isProductsLoaded) {
    return (
      <main className="min-h-screen bg-[#F8F4EC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
          <p className="text-gray-600 text-sm tracking-wider lowercase">
            loading products...
          </p>
        </div>
      </main>
    );
  }

  // Show loading spinner if no products found (could be a configuration issue)
  if (isProductsLoaded && preloadedProducts.length === 0) {
    return (
      <main className="min-h-screen bg-[#F8F4EC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
          <p className="text-gray-600 text-sm tracking-wider lowercase">
            loading products...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F4EC] p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 lowercase tracking-widest opacity-0">
          &nbsp;
        </h1>
        <p className="text-gray-600 mt-2 opacity-0">&nbsp;</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {displayProducts.map((product) => (
          <ProductCard
            key={`shopify-${product.productUrl}`}
            imageUrl={product.imageUrl}
            hoverImageUrl={product.hoverImageUrl}
            name={product.name}
            price={product.price}
            productUrl={product.productUrl}
            currencyCode={product.currencyCode}
            expressInterest={product.expressInterest}
          />
        ))}
      </div>
    </main>
  );
}
