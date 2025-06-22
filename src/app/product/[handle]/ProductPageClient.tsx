"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import SizeChart from "../../components/SizeChart";
import WashCareOverlay from "../../components/WashCareOverlay";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { ShopifyProductDetails } from "@/lib/shopify";

// Mobile detection hook
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const userAgent =
        navigator.userAgent ||
        navigator.vendor ||
        (window as unknown as { opera?: string }).opera ||
        "";
      const mobileRegex =
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
      const isMobileDevice = mobileRegex.test(userAgent.toLowerCase());
      const isSmallScreen = window.innerWidth <= 768;

      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    return () => {
      window.removeEventListener("resize", checkDevice);
    };
  }, []);

  return isMobile;
};

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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [expandedSections, setExpandedSections] = useState({
    details: false,
    sizing: false,
    care: false,
  });
  const { addItemToCart } = useCart();
  const isMobile = useIsMobile();
  const imageGalleryRef = useRef<HTMLDivElement>(null);

  const searchParams = useSearchParams();

  const sizes = [
    "extra petite",
    "petite",
    "in between",
    "curvy",
    "extra curvy",
  ];

  // Get images for rendering
  const images =
    product.images.edges.length > 0
      ? product.images.edges.map((edge) => edge.node)
      : [
          {
            url: "https://picsum.photos/id/11/600/1000",
            altText: "Product image 1",
          },
          {
            url: "https://picsum.photos/id/22/900/600",
            altText: "Product image 2",
          },
          {
            url: "https://picsum.photos/id/33/700/800",
            altText: "Product image 3",
          },
          {
            url: "https://picsum.photos/id/44/850/1200",
            altText: "Product image 4",
          },
        ];

  // Initialize size from URL parameter on mount only
  useEffect(() => {
    const sizeFromUrl = searchParams.get("size");
    if (sizeFromUrl) {
      setSelectedSize(sizeFromUrl);
    }
  }, [searchParams]); // Include searchParams in dependency array

  // Track scroll position for mobile image gallery with looping
  useEffect(() => {
    if (!isMobile || !imageGalleryRef.current) return;

    const gallery = imageGalleryRef.current;
    const imageCount = images.length;
    let touchStartX = 0;
    let touchEndX = 0;

    const handleScroll = () => {
      const scrollLeft = gallery.scrollLeft;
      const itemWidth = gallery.offsetWidth;
      const currentIndex = Math.round(scrollLeft / itemWidth);
      setCurrentImageIndex(Math.max(0, Math.min(currentIndex, imageCount - 1)));
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipeGesture();
    };

    const handleSwipeGesture = () => {
      const swipeThreshold = 50; // Minimum distance for a swipe
      const swipeDistance = touchStartX - touchEndX;

      if (Math.abs(swipeDistance) > swipeThreshold) {
        if (swipeDistance > 0) {
          // Swiped left, go to next image
          const newIndex =
            currentImageIndex === imageCount - 1 ? 0 : currentImageIndex + 1;
          setCurrentImageIndex(newIndex);
          gallery.scrollTo({
            left: newIndex * gallery.offsetWidth,
            behavior: "smooth",
          });
        } else {
          // Swiped right, go to previous image
          const newIndex =
            currentImageIndex === 0 ? imageCount - 1 : currentImageIndex - 1;
          setCurrentImageIndex(newIndex);
          gallery.scrollTo({
            left: newIndex * gallery.offsetWidth,
            behavior: "smooth",
          });
        }
      }
    };

    gallery.addEventListener("scroll", handleScroll);
    gallery.addEventListener("touchstart", handleTouchStart);
    gallery.addEventListener("touchend", handleTouchEnd);

    return () => {
      gallery.removeEventListener("scroll", handleScroll);
      gallery.removeEventListener("touchstart", handleTouchStart);
      gallery.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isMobile, images.length, currentImageIndex]);

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
        product.images.edges[0]?.node?.url ||
        "https://picsum.photos/id/11/100/150",
      variantId: variantId,
      productHandle: product.handle,
    };
    addItemToCart(productToAdd);
    console.log("Added to cart:", productToAdd);
  };

  // Handle section expansion for mobile
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const price = parseFloat(product.priceRange.minVariantPrice.amount);
  const currencyCode = product.priceRange.minVariantPrice.currencyCode;

  if (isMobile) {
    // Mobile Layout
    return (
      <>
        <main className="min-h-screen bg-[#F8F4EC] text-gray-900">
          {/* Mobile Header */}
          <div className="sticky top-0 bg-[#F8F4EC] z-10 border-b border-gray-300 p-4">
            <div className="flex justify-between items-center">
              <h1 className="text-lg font-medium tracking-widest lowercase">
                {product.title.toLowerCase()}
              </h1>
              <span className="text-lg font-medium">
                {formatPrice(price, currencyCode)}
              </span>
            </div>
          </div>

          {/* Mobile Image Gallery */}
          <div>
            {/* Image Gallery */}
            <div
              ref={imageGalleryRef}
              className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
              style={{ scrollBehavior: "smooth" }}
            >
              {images.map((image, index) => (
                <div key={index} className="flex-shrink-0 w-full snap-center">
                  <Image
                    src={image.url}
                    alt={
                      image.altText || `${product.title} - Image ${index + 1}`
                    }
                    width={400}
                    height={600}
                    className="w-full h-auto max-h-[70vh] object-cover"
                    priority={index === 0}
                    draggable={false}
                  />
                </div>
              ))}
            </div>

            {/* Image Navigation Dots */}
            <div className="flex justify-center space-x-2 py-4">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentImageIndex(index);
                    if (imageGalleryRef.current) {
                      imageGalleryRef.current.scrollTo({
                        left: index * imageGalleryRef.current.offsetWidth,
                        behavior: "smooth",
                      });
                    }
                  }}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentImageIndex ? "bg-gray-900" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Mobile Product Info */}
          <div className="p-4 space-y-6">
            {/* Size Selection */}
            <div>
              <h3 className="text-sm tracking-widest lowercase mb-3 text-gray-700">
                select size
              </h3>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => handleSizeSelect(size)}
                    className={`px-4 py-2 border rounded-full text-sm tracking-wide lowercase transition-colors ${
                      selectedSize === size
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-700 border-gray-300 hover:border-gray-500"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Expandable Sections */}
            <div className="space-y-4">
              {/* Product Details */}
              <div className="border-b border-gray-200">
                <button
                  onClick={() => toggleSection("details")}
                  className="w-full flex justify-between items-center py-3 text-left"
                >
                  <span className="text-sm tracking-widest lowercase">
                    product details
                  </span>
                  <span className="text-lg">
                    {expandedSections.details ? "−" : "+"}
                  </span>
                </button>
                {expandedSections.details && (
                  <div className="pb-4 space-y-2 text-sm tracking-wider text-gray-700">
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
                )}
              </div>

              {/* Size & Fit */}
              <div className="border-b border-gray-200">
                <button
                  onClick={() => toggleSection("sizing")}
                  className="w-full flex justify-between items-center py-3 text-left"
                >
                  <span className="text-sm tracking-widest lowercase">
                    size & fit
                  </span>
                  <span className="text-lg">
                    {expandedSections.sizing ? "−" : "+"}
                  </span>
                </button>
                {expandedSections.sizing && (
                  <div className="pb-4">
                    <button
                      onClick={() => setIsSizeChartOpen(true)}
                      className="text-sm tracking-widest lowercase hover:text-gray-600 transition-colors underline"
                    >
                      view size chart
                    </button>
                  </div>
                )}
              </div>

              {/* Care Instructions */}
              <div className="border-b border-gray-200">
                <button
                  onClick={() => toggleSection("care")}
                  className="w-full flex justify-between items-center py-3 text-left"
                >
                  <span className="text-sm tracking-widest lowercase">
                    care instructions
                  </span>
                  <span className="text-lg">
                    {expandedSections.care ? "−" : "+"}
                  </span>
                </button>
                {expandedSections.care && (
                  <div className="pb-4">
                    <button
                      onClick={() => setIsWashCareOpen(true)}
                      className="text-sm tracking-widest lowercase hover:text-gray-600 transition-colors underline"
                    >
                      view wash care guide
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sticky Add to Cart - Mobile */}
          <div className="sticky bottom-0 bg-[#F8F4EC] border-t border-gray-300 p-4">
            <button
              className="w-full border border-gray-900 py-4 text-center text-base tracking-widest hover:bg-gray-100 transition-colors lowercase"
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

  // Desktop Layout (Original)
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
                    src={imageEdge.node.url}
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
