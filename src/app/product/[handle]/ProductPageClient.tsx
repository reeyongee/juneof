"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import SizeChart from "../../components/SizeChart";
import WashCareOverlay from "../../components/WashCareOverlay";
import ExpressInterestOverlay from "../../components/ExpressInterestOverlay";
import CartOverlay from "../../components/CartOverlay";
import { ProfileCompletionFlow } from "@/components/ProfileCompletionFlow";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { ShopifyProductDetails } from "@/lib/shopify";
import { Badge } from "@/components/ui/badge";
import { generateProductSchema } from "@/lib/seo";
import * as pixel from "@/lib/meta-pixel"; // Import the pixel helper

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
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const [isWashCareOpen, setIsWashCareOpen] = useState(false);
  const [isExpressInterestOpen, setIsExpressInterestOpen] = useState(false);
  const [expressInterestMessage, setExpressInterestMessage] = useState("");
  const [isExpressInterestLoading, setIsExpressInterestLoading] =
    useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileCompletionOpen, setIsProfileCompletionOpen] = useState(false);

  // Add state for dynamic express interest checking
  const [currentExpressInterest, setCurrentExpressInterest] = useState(
    product.metafield?.value === "true"
  );

  const { addItemToCart } = useCart();
  const { isAuthenticated, customerData } = useAuth();
  const { refreshProfileStatus } = useProfileCompletion();
  const isMobile = useIsMobile();
  const imageGalleryRef = useRef<HTMLDivElement>(null);

  const searchParams = useSearchParams();

  // Track ViewContent event when the product data is available
  useEffect(() => {
    if (product && pixel.PIXEL_ID) {
      pixel.track("ViewContent", {
        content_name: product.title,
        content_ids: [product.id], // Using Shopify's GID
        content_type: "product",
        currency: product.priceRange.minVariantPrice.currencyCode,
        value: parseFloat(product.priceRange.minVariantPrice.amount),
      });
    }
  }, [product]);

  // Add product schema to page
  useEffect(() => {
    if (product) {
      const price = parseFloat(product.priceRange.minVariantPrice.amount);
      const currency = product.priceRange.minVariantPrice.currencyCode;
      const imageUrl = product.images.edges[0]?.node.url || "";

      const productSchema = generateProductSchema({
        name: product.title,
        description:
          product.description ||
          `${product.title} - Sustainable fashion from June Of`,
        price: price,
        currency: currency,
        availability: "InStock",
        condition: "NewCondition",
        brand: "June Of",
        sku: product.id,
        image: imageUrl,
        url: `https://www.juneof.com/product/${product.handle}`,
      });

      // Add or update product schema script
      const existingScript = document.getElementById("product-schema");
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement("script");
      script.id = "product-schema";
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(productSchema);
      document.head.appendChild(script);

      // Cleanup on unmount
      return () => {
        const scriptToRemove = document.getElementById("product-schema");
        if (scriptToRemove) {
          scriptToRemove.remove();
        }
      };
    }
  }, [product]);

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

  // Handle checkout login flows
  useEffect(() => {
    const checkoutLoginComplete =
      searchParams.get("checkout_login_complete") === "true";
    const checkoutLoginIncomplete =
      searchParams.get("checkout_login_incomplete") === "true";
    const openCart = searchParams.get("open_cart") === "true";
    const showProfileCompletion =
      searchParams.get("show_profile_completion") === "true";

    if (checkoutLoginComplete && openCart) {
      // Flow A: Profile complete - show cart overlay
      console.log(
        "ProductPageClient: Checkout login complete, opening cart overlay"
      );
      setIsCartOpen(true);

      // Clean up URL parameters
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("checkout_login_complete");
      newUrl.searchParams.delete("open_cart");
      window.history.replaceState(
        {},
        document.title,
        newUrl.pathname + newUrl.search
      );
    } else if (checkoutLoginIncomplete && showProfileCompletion) {
      // Flow B: Profile incomplete - show profile completion flow
      console.log(
        "ProductPageClient: Checkout login incomplete, showing profile completion"
      );
      setIsProfileCompletionOpen(true);

      // Clean up URL parameters
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("checkout_login_incomplete");
      newUrl.searchParams.delete("show_profile_completion");
      window.history.replaceState(
        {},
        document.title,
        newUrl.pathname + newUrl.search
      );
    }
  }, [searchParams]);

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

    // Track AddToCart event
    if (pixel.PIXEL_ID) {
      pixel.track("AddToCart", {
        content_name: product.title,
        content_ids: [product.id],
        content_type: "product",
        currency: product.priceRange.minVariantPrice.currencyCode,
        value: parseFloat(product.priceRange.minVariantPrice.amount),
      });
    }
  };

  // Handle express interest
  const handleExpressInterest = async () => {
    if (isAuthenticated && customerData) {
      // Handle authenticated users - call API directly with their data
      console.log("Express interest for authenticated user:", product.title);

      const firstName = customerData.customer.firstName || "";
      const lastName = customerData.customer.lastName || "";
      const email = customerData.customer.emailAddress?.emailAddress || "";

      if (!firstName || !lastName || !email) {
        console.warn("Express Interest: Missing user data, showing overlay");
        setIsExpressInterestOpen(true);
        return;
      }

      try {
        setIsExpressInterestLoading(true);
        setExpressInterestMessage("");

        console.log("Express Interest: Submitting for authenticated user", {
          firstName,
          lastName,
          email,
          productId: product.id,
        });

        const response = await fetch("/api/customer/express-interest", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: product.id,
            firstName,
            lastName,
            email,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          console.log("Express Interest: Success for authenticated user", data);
          setExpressInterestMessage(
            data.message ||
              "thank you! you're first in line now! we'll keep you posted."
          );
        } else {
          console.error("Express Interest: Error for authenticated user", data);
          setExpressInterestMessage(
            data.message ||
              data.error ||
              "Something went wrong. Please try again."
          );
        }
      } catch (error) {
        console.error(
          "Express Interest: Network error for authenticated user",
          error
        );
        setExpressInterestMessage(
          "Network error. Please check your connection and try again."
        );
      } finally {
        setIsExpressInterestLoading(false);
        // Clear message after 5 seconds
        setTimeout(() => setExpressInterestMessage(""), 5000);
      }
    } else {
      // Show overlay for non-authenticated users
      setIsExpressInterestOpen(true);
    }
  };

  const price = parseFloat(product.priceRange.minVariantPrice.amount);
  const currencyCode = product.priceRange.minVariantPrice.currencyCode;

  // Use the dynamic express interest value instead of the static one
  const expressInterest = currentExpressInterest;

  // Periodically check for metafield updates (every 30 seconds)
  useEffect(() => {
    const checkMetafieldUpdates = async () => {
      try {
        // Only check if we're currently in express interest mode
        if (currentExpressInterest) {
          const response = await fetch(
            `/api/product/${product.handle}/metafield`
          );
          if (response.ok) {
            const data = await response.json();
            const newExpressInterest = data.expressInterest === "true";

            if (newExpressInterest !== currentExpressInterest) {
              console.log(
                `Express interest status changed for ${product.title}: ${currentExpressInterest} -> ${newExpressInterest}`
              );
              setCurrentExpressInterest(newExpressInterest);

              // Optionally refresh the page to get full updated data
              if (!newExpressInterest) {
                window.location.reload();
              }
            }
          }
        }
      } catch (error) {
        console.warn("Failed to check metafield updates:", error);
      }
    };

    // Check immediately and then every 30 seconds
    checkMetafieldUpdates();
    const interval = setInterval(checkMetafieldUpdates, 30000);

    return () => clearInterval(interval);
  }, [currentExpressInterest, product.handle, product.title]);

  if (isMobile) {
    // Mobile Layout
    return (
      <>
        <main className="min-h-screen bg-[#F8F4EC] text-gray-900">
          {/* Add more spacing from top and make images smaller height-wise */}
          <div className="h-24"></div>
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
                    className="w-full h-auto max-h-[55vh] object-cover"
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
            {/* Product Title and Price - Now below images */}
            <div className="space-y-2">
              <h1 className="text-lg font-medium tracking-widest lowercase">
                {product.title.toLowerCase()}
              </h1>
              {!expressInterest && (
                <span className="text-lg font-medium">
                  {formatPrice(price, currencyCode)}
                </span>
              )}
            </div>
            {!expressInterest && (
              <>
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
              </>
            )}

            {/* Product Details - Always Visible */}
            <div className="space-y-4">
              <div className="space-y-2 text-sm tracking-wider text-gray-700">
                {product.descriptionHtml && (
                  <div
                    className="prose prose-sm lowercase"
                    dangerouslySetInnerHTML={{
                      __html: product.descriptionHtml,
                    }}
                  />
                )}
                {product.tags.length > 0 && (
                  <p className="lowercase">{product.tags.join(" • ")}</p>
                )}
              </div>
            </div>

            {/* Express Interest Banner */}
            {expressInterest && (
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                <div className="mb-3">
                  <Badge className="bg-black text-white hover:bg-black/90 px-3 py-1 text-xs font-semibold tracking-widest lowercase border-0">
                    coming soon!
                  </Badge>
                </div>
                <p className="text-sm text-gray-700 tracking-wide lowercase leading-relaxed text-justify">
                  we&apos;re working on bringing you this product as soon as
                  possible. sign up to be the first to know when it&apos;s
                  available by clicking on the express interest button!
                </p>
              </div>
            )}

            {!expressInterest && (
              <>
                {/* Direct Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={() => setIsSizeChartOpen(true)}
                    className="w-full border border-gray-300 py-3 text-center text-sm tracking-widest hover:bg-gray-50 transition-colors lowercase"
                  >
                    view size chart
                  </button>

                  <button
                    onClick={() => setIsWashCareOpen(true)}
                    className="w-full border border-gray-300 py-3 text-center text-sm tracking-widest hover:bg-gray-50 transition-colors lowercase"
                  >
                    view wash care guide
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Sticky Add to Cart - Mobile */}
          <div className="sticky bottom-0 bg-[#F8F4EC] border-t border-gray-300 p-4">
            <button
              className="w-full border border-gray-900 py-4 text-center text-base tracking-widest hover:bg-gray-100 transition-colors lowercase disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={
                expressInterest ? handleExpressInterest : handleAddToCart
              }
              disabled={isExpressInterestLoading}
            >
              {expressInterest
                ? isExpressInterestLoading
                  ? "submitting..."
                  : "express interest!"
                : "add to cart"}
            </button>

            {expressInterestMessage && (
              <div
                className={`mt-3 p-3 rounded-lg text-sm tracking-wide lowercase ${
                  expressInterestMessage.includes("thank you") &&
                  !expressInterestMessage.includes("oops")
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : "bg-red-50 border border-red-200 text-red-700"
                }`}
              >
                {expressInterestMessage}
              </div>
            )}
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
        <ExpressInterestOverlay
          isOpen={isExpressInterestOpen}
          onClose={() => setIsExpressInterestOpen(false)}
          productName={product.title}
          productId={product.id}
        />
        <CartOverlay isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        <ProfileCompletionFlow
          isOpen={isProfileCompletionOpen}
          onClose={() => setIsProfileCompletionOpen(false)}
          onComplete={() => {
            refreshProfileStatus();
            setIsProfileCompletionOpen(false);
            // After profile completion, show cart overlay
            setIsCartOpen(true);
          }}
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
                {/* Product Title */}
                <h1 className="text-xl font-medium tracking-widest lowercase mb-2">
                  {product.title.toLowerCase()}
                </h1>

                {/* Price - Always show for non-express interest products */}
                {!expressInterest && (
                  <span className="text-lg font-medium mb-6 block">
                    {formatPrice(price, currencyCode)}
                  </span>
                )}

                {/* Product Information */}
                <div className="space-y-2 text-sm tracking-wider text-gray-700">
                  {product.descriptionHtml && (
                    <div
                      className="prose prose-sm lowercase"
                      dangerouslySetInnerHTML={{
                        __html: product.descriptionHtml,
                      }}
                    />
                  )}
                  {product.tags.length > 0 && (
                    <p className="lowercase">{product.tags.join(" • ")}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Wash Care Button - Positioned at the bottom */}
            {!expressInterest && (
              <button
                onClick={() => setIsWashCareOpen(true)}
                className="text-sm tracking-widest lowercase hover:text-gray-600 transition-colors mt-auto pt-4 text-left"
              >
                wash care
              </button>
            )}
          </div>
        </div>

        {/* Middle Column (Now Scrolls with Page) */}
        <div className="flex-grow p-8">
          {/* Add spacing equivalent to navbar height */}
          <div className="h-16"></div>
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
            {!expressInterest && (
              <>
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
              </>
            )}
          </div>

          {/* Add to Cart Button */}
          <div className="mt-auto">
            {/* Express Interest Banner - positioned above button */}
            {expressInterest && (
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-700 tracking-wide lowercase leading-relaxed text-justify">
                  we&apos;re working on bringing you this product as soon as
                  possible. sign up to be the first to know when it&apos;s
                  available by clicking on the express interest button!
                </p>
              </div>
            )}

            <button
              className="w-full border border-gray-900 py-3 text-center text-base tracking-widest hover:bg-gray-100 transition-colors lowercase disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={
                expressInterest ? handleExpressInterest : handleAddToCart
              }
              disabled={isExpressInterestLoading}
            >
              {expressInterest
                ? isExpressInterestLoading
                  ? "submitting..."
                  : "express interest!"
                : "add to cart"}
            </button>

            {expressInterestMessage && (
              <div
                className={`mt-3 p-3 rounded-lg text-sm tracking-wide lowercase ${
                  expressInterestMessage.includes("thank you") &&
                  !expressInterestMessage.includes("oops")
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : "bg-red-50 border border-red-200 text-red-700"
                }`}
              >
                {expressInterestMessage}
              </div>
            )}
          </div>
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
      <ExpressInterestOverlay
        isOpen={isExpressInterestOpen}
        onClose={() => setIsExpressInterestOpen(false)}
        productName={product.title}
        productId={product.id}
      />
      <CartOverlay isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <ProfileCompletionFlow
        isOpen={isProfileCompletionOpen}
        onClose={() => setIsProfileCompletionOpen(false)}
        onComplete={() => {
          refreshProfileStatus();
          setIsProfileCompletionOpen(false);
          // After profile completion, show cart overlay
          setIsCartOpen(true);
        }}
      />
    </>
  );
}
