"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import SizeChart from "../../components/SizeChart";
import WashCareOverlay from "../../components/WashCareOverlay";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { ShopifyProductDetails } from "@/lib/shopify";

interface ProductPageClientProps {
  product: ShopifyProductDetails;
}

// Enhanced price formatter that handles different currencies
const formatPrice = (price: number, currencyCode?: string): string => {
  if (!currencyCode || currencyCode === "INR") {
    return `₹ ${price.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  const currencySymbols: { [key: string]: string } = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    CAD: "C$",
    AUD: "A$",
    JPY: "¥",
  };

  const symbol = currencySymbols[currencyCode] || currencyCode;

  return `${symbol} ${price.toLocaleString("en-US", {
    minimumFractionDigits: currencyCode === "JPY" ? 0 : 2,
    maximumFractionDigits: currencyCode === "JPY" ? 0 : 2,
  })}`;
};

export default function ProductPageClient({ product }: ProductPageClientProps) {
  const [selectedSize, setSelectedSize] = useState("in between");
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const [isWashCareOpen, setIsWashCareOpen] = useState(false);
  const { addItemToCart } = useCart();

  const searchParams = useSearchParams();

  const sizes = [
    "extra petite",
    "petite",
    "in between",
    "curvy",
    "extra curvy",
  ];

  // Initialize size from URL parameter on mount only
  useEffect(() => {
    const sizeFromUrl = searchParams.get("size");
    if (sizeFromUrl) {
      setSelectedSize(sizeFromUrl);
    }
  }, [searchParams]); // Include searchParams in dependency array

  // Handler to update size selection without URL changes
  const handleSizeSelect = useCallback((newSize: string) => {
    setSelectedSize(newSize);
  }, []);

  // Handle add to cart
  const handleAddToCart = () => {
    // Get the first available variant ID (you might want to make this more sophisticated)
    const variantId = product.variants.edges[0]?.node?.id;

    const productToAdd = {
      name: product.title.toLowerCase(),
      price: parseFloat(product.priceRange.minVariantPrice.amount),
      size: selectedSize,
      imageUrl:
        product.images.edges[0]?.node?.originalSrc ||
        "https://picsum.photos/id/11/100/150",
      variantId: variantId,
      productHandle: product.handle,
    };
    addItemToCart(productToAdd);
    console.log("Added to cart:", productToAdd);
  };

  const price = parseFloat(product.priceRange.minVariantPrice.amount);
  const currencyCode = product.priceRange.minVariantPrice.currencyCode;

  return (
    <>
      <main className="flex min-h-screen bg-[#F8F4EC] text-gray-900">
        {/* Left Column (Sticky) */}
        <div className="sticky top-0 flex h-screen w-1/4 flex-col justify-center p-8 border-r border-gray-300">
          <div className="flex flex-col h-full">
            <div className="flex-grow flex flex-col justify-center">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h1 className="text-xl font-medium tracking-widest lowercase">
                    {product.title.toLowerCase()}
                  </h1>
                  <span className="text-lg font-medium">
                    {formatPrice(price, currencyCode)}
                  </span>
                </div>

                {/* Product Information */}
                <div className="space-y-2 text-sm tracking-wider text-gray-700">
                  {product.description && (
                    <p className="lowercase">{product.description}</p>
                  )}
                  {product.tags.length > 0 && (
                    <p className="lowercase">{product.tags.join(" • ")}</p>
                  )}
                  {product.vendor && (
                    <p className="lowercase">by {product.vendor}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Wash Care Button - Positioned at the bottom */}
            <button
              onClick={() => setIsWashCareOpen(true)}
              className="text-sm tracking-widest lowercase hover:text-gray-600 transition-colors mt-auto pt-4 text-left"
            >
              wash care
            </button>
          </div>
        </div>

        {/* Middle Column (Now Scrolls with Page) */}
        <div className="flex-grow p-8">
          <div className="space-y-8">
            {product.images.edges.length > 0 ? (
              product.images.edges.map((imageEdge, index) => {
                // Define specific sizes for each image position to match original design
                const imageSizes = [
                  { width: 600, height: 1000 }, // First image: portrait
                  { width: 900, height: 600 }, // Second image: landscape
                  { width: 700, height: 800 }, // Third image: slightly wider portrait
                  { width: 850, height: 1200 }, // Fourth image: tall portrait
                ];

                // Use predefined size or default for additional images
                const size = imageSizes[index] || { width: 600, height: 800 };

                return (
                  <Image
                    key={`product-image-${index}`}
                    src={imageEdge.node.originalSrc}
                    alt={
                      imageEdge.node.altText ||
                      `${product.title} - Image ${index + 1}`
                    }
                    width={size.width}
                    height={size.height}
                    className="w-full h-auto select-none pointer-events-none"
                    priority={index === 0}
                    draggable={false}
                  />
                );
              })
            ) : (
              // Fallback images with original specific sizes
              <>
                <Image
                  src="https://picsum.photos/id/11/600/1000"
                  alt="Product image 1 (W:600)"
                  width={600}
                  height={1000}
                  className="w-full h-auto select-none pointer-events-none"
                  priority
                  draggable={false}
                />
                <Image
                  src="https://picsum.photos/id/22/900/600"
                  alt="Product image 2 (W:900)"
                  width={900}
                  height={600}
                  className="w-full h-auto select-none pointer-events-none"
                  draggable={false}
                />
                <Image
                  src="https://picsum.photos/id/33/700/800"
                  alt="Product image 3 (W:700)"
                  width={700}
                  height={800}
                  className="w-full h-auto select-none pointer-events-none"
                  draggable={false}
                />
                <Image
                  src="https://picsum.photos/id/44/850/1200"
                  alt="Product image 4 (W:850)"
                  width={850}
                  height={1200}
                  className="w-full h-auto select-none pointer-events-none"
                  draggable={false}
                />
              </>
            )}
          </div>
        </div>

        {/* Right Column (Sticky) */}
        <div className="sticky top-0 flex h-screen w-1/4 flex-col p-8 border-l border-gray-300">
          <div className="flex-1 flex flex-col justify-center space-y-6">
            {/* Size Chart Button */}
            <button
              onClick={() => setIsSizeChartOpen(true)}
              className="text-sm tracking-widest lowercase hover:text-gray-600 transition-colors"
            >
              size chart
            </button>

            {/* Divider */}
            <div className="h-px bg-gray-300 w-full"></div>

            {/* Sizes */}
            <div className="flex flex-col space-y-3 text-base tracking-widest">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => handleSizeSelect(size)}
                  className={`hover:text-gray-600 transition-colors lowercase ${
                    selectedSize === size
                      ? "underline font-medium"
                      : "text-gray-700"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            className="w-full border border-gray-900 py-3 text-center text-base tracking-widest hover:bg-gray-100 transition-colors lowercase mt-auto"
            onClick={handleAddToCart}
          >
            add to cart
          </button>
        </div>
      </main>

      {/* Render Overlays */}
      <SizeChart
        isOpen={isSizeChartOpen}
        onClose={() => setIsSizeChartOpen(false)}
      />
      <WashCareOverlay
        isOpen={isWashCareOpen}
        onClose={() => setIsWashCareOpen(false)}
      />
    </>
  );
}
