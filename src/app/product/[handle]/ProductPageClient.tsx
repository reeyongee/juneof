"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import SizeChart from "../../components/SizeChart";
import WashCareOverlay from "../../components/WashCareOverlay";
import ExpressInterestOverlay from "../../components/ExpressInterestOverlay";
import { ProfileCompletionFlow } from "@/components/ProfileCompletionFlow";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { ProductWithGuides } from "@/lib/sanity-queries";
import { generateProductSchema } from "@/lib/seo";
import * as pixel from "@/lib/meta-pixel"; // Import the pixel helper
import { toast } from "sonner";
// NEW 2025-07 API imports
import {
  getAvailableSizeOptions,
  findVariantBySize,
  getSizeAvailabilityStatus,
  type ShopifyProductVariant,
} from "@/lib/shopify";

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
  product: ProductWithGuides;
}

// Format price helper
function formatPrice(amount: number, currencyCode: string = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currencyCode,
  }).format(amount);
}

export default function ProductPageClient({ product }: ProductPageClientProps) {
  // NEW: Dynamic size options from Shopify variants
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedVariant, setSelectedVariant] =
    useState<ShopifyProductVariant | null>(null);

  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const [isWashCareOpen, setIsWashCareOpen] = useState(false);
  const [isExpressInterestOpen, setIsExpressInterestOpen] = useState(false);
  const [expressInterestMessage, setExpressInterestMessage] = useState("");
  const [isExpressInterestLoading, setIsExpressInterestLoading] =
    useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isProfileCompletionOpen, setIsProfileCompletionOpen] = useState(false);

  // Add state for dynamic express interest checking
  const [currentExpressInterest, setCurrentExpressInterest] = useState(
    product.metafield?.value === "true"
  );

  // Guards to prevent multiple cart overlay opens
  const hasOpenedCartFromUrl = useRef(false);
  const hasOpenedCartFromCompletion = useRef(false);
  const isProcessingCompletion = useRef(false);

  const { addItemToCart, openCartOverlay } = useCart();
  const { isAuthenticated, customerData } = useAuth();
  const { refreshProfileStatus } = useProfileCompletion();
  const isMobile = useIsMobile();
  const imageGalleryRef = useRef<HTMLDivElement>(null);

  const searchParams = useSearchParams();

  // NEW: Initialize available sizes from Shopify variants
  useEffect(() => {
    if (product) {
      const sizes = getAvailableSizeOptions(product);
      setAvailableSizes(sizes);

      // Set default size to first available or from URL
      const sizeFromUrl = searchParams.get("size");
      if (sizeFromUrl && sizes.includes(sizeFromUrl)) {
        setSelectedSize(sizeFromUrl);
      } else if (sizes.length > 0) {
        // Default to first available size
        setSelectedSize(sizes[0]);
      }
    }
  }, [product, searchParams]);

  // NEW: Update selected variant when size changes
  useEffect(() => {
    if (product && selectedSize) {
      const variant = findVariantBySize(product, selectedSize);
      setSelectedVariant(variant);
      console.log("Selected variant:", variant);
    }
  }, [product, selectedSize]);

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

  // Handle checkout login flows
  useEffect(() => {
    const checkoutLoginComplete =
      searchParams.get("checkout_login_complete") === "true";
    const checkoutLoginIncomplete =
      searchParams.get("checkout_login_incomplete") === "true";
    const openCart = searchParams.get("open_cart") === "true";
    const showProfileCompletion =
      searchParams.get("show_profile_completion") === "true";

    if (checkoutLoginComplete && openCart && !hasOpenedCartFromUrl.current) {
      // Flow A: Profile complete - show cart overlay
      console.log(
        "ProductPageClient: Checkout login complete, opening cart overlay"
      );
      hasOpenedCartFromUrl.current = true;
      openCartOverlay();

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
  }, [searchParams, openCartOverlay]);

  // Reset guards when component unmounts
  useEffect(() => {
    return () => {
      hasOpenedCartFromUrl.current = false;
      hasOpenedCartFromCompletion.current = false;
      isProcessingCompletion.current = false;
    };
  }, []);

  // NEW: Handle size selection with availability checking
  const handleSizeSelect = (size: string) => {
    const availabilityStatus = getSizeAvailabilityStatus(product, size);

    if (!availabilityStatus.available) {
      toast.error("Size not available", {
        description: `${size} is currently out of stock`,
        duration: 3000,
      });
      return;
    }

    setSelectedSize(size);

    // Update URL without page reload
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("size", size);
    window.history.replaceState({}, document.title, newUrl.toString());
  };

  // Get pricing info - use selected variant price if available
  const price = selectedVariant
    ? parseFloat(selectedVariant.price.amount)
    : parseFloat(product.priceRange.minVariantPrice.amount);
  const currencyCode = selectedVariant
    ? selectedVariant.price.currencyCode
    : product.priceRange.minVariantPrice.currencyCode;

  // Check if express interest mode
  const expressInterest = currentExpressInterest;

  // NEW: Proper add to cart with correct variant
  const handleAddToCart = () => {
    // Validate that a size is selected
    if (!selectedSize || selectedSize.trim() === "") {
      toast.error("Please select a size", {
        description: "You must select a size before adding to cart",
        duration: 3000,
      });
      return;
    }

    // Validate that we have a valid variant
    if (!selectedVariant) {
      toast.error("Invalid size selection", {
        description: "Please select a valid size",
        duration: 3000,
      });
      return;
    }

    // Check availability one more time
    if (!selectedVariant.availableForSale) {
      toast.error("Size not available", {
        description: `${selectedSize} is currently out of stock`,
        duration: 3000,
      });
      return;
    }

    const productToAdd = {
      name: product.title.toLowerCase(),
      price: parseFloat(selectedVariant.price.amount),
      size: selectedSize,
      imageUrl:
        product.images.edges[0]?.node?.url ||
        "https://picsum.photos/id/11/100/150",
      variantId: selectedVariant.id, // NOW USING CORRECT VARIANT ID!
      productHandle: product.handle,
    };

    addItemToCart(productToAdd);
    console.log("Added to cart with correct variant:", productToAdd);

    // Track AddToCart event
    if (pixel.PIXEL_ID) {
      pixel.track("AddToCart", {
        content_name: product.title,
        content_ids: [product.id],
        content_type: "product",
        currency: selectedVariant.price.currencyCode,
        value: parseFloat(selectedVariant.price.amount),
      });
    }

    toast.success("Added to cart!", {
      description: `${product.title} (${selectedSize}) added to your cart`,
      duration: 3000,
    });
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
        console.error("Express Interest: Network error", error);
        setExpressInterestMessage(
          "Network error. Please check your connection and try again."
        );
      } finally {
        setIsExpressInterestLoading(false);
      }
    } else {
      // Handle unauthenticated users - show overlay for data collection
      console.log("Express interest for unauthenticated user:", product.title);
      setIsExpressInterestOpen(true);
    }
  };

  // Periodically check for metafield updates (every 30 seconds)
  useEffect(() => {
    if (!product?.handle) return;

    const checkMetafieldUpdates = async () => {
      try {
        const response = await fetch(
          `/api/product/${product.handle}/metafield`
        );
        if (response.ok) {
          const data = await response.json();
          const newExpressInterest = data.expressInterest === "true";
          if (newExpressInterest !== currentExpressInterest) {
            console.log(
              `Express interest updated for ${product.handle}:`,
              newExpressInterest
            );
            setCurrentExpressInterest(newExpressInterest);
          }
        }
      } catch (error) {
        console.error("Failed to check metafield updates:", error);
      }
    };

    // Check immediately and then every 30 seconds
    checkMetafieldUpdates();
    const interval = setInterval(checkMetafieldUpdates, 30000);

    return () => clearInterval(interval);
  }, [product?.handle, currentExpressInterest]);

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
                  <h3 className="text-sm tracking-widest lowercase mb-3 text-gray-700 text-center">
                    select size
                  </h3>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {availableSizes.map((size) => {
                      const availabilityStatus = getSizeAvailabilityStatus(
                        product,
                        size
                      );
                      return (
                        <button
                          key={size}
                          onClick={() => handleSizeSelect(size)}
                          disabled={!availabilityStatus.available}
                          className={`px-4 py-2 border rounded-full text-sm tracking-wide lowercase transition-colors ${
                            selectedSize === size
                              ? "bg-gray-900 text-white border-gray-900"
                              : availabilityStatus.available
                                ? "bg-white text-gray-700 border-gray-300 hover:border-gray-500"
                                : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                          }`}
                        >
                          {size}
                          {!availabilityStatus.available && (
                            <span className="ml-1 text-xs">(out of stock)</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {availableSizes.length === 0 && (
                    <p className="text-sm text-gray-500 italic">
                      No sizes available for this product
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Product Details - Always Visible */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm tracking-widest lowercase mb-2 text-gray-700">
                  description
                </h3>
                <div
                  className="text-sm text-gray-600 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: product.descriptionHtml || product.description,
                  }}
                />
              </div>

              {/* Express Interest Banner - Mobile */}
              {expressInterest && (
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 tracking-wide lowercase leading-relaxed text-justify">
                    we&apos;re working on bringing you this product as soon as
                    possible. sign up to be the first to know when it&apos;s
                    available by clicking on the express interest button!
                  </p>
                </div>
              )}

              {/* Direct Action Buttons - Always show if content exists */}
              <div className="space-y-3">
                {product.sizeGuide?.content && (
                  <button
                    onClick={() => setIsSizeChartOpen(true)}
                    className="w-full border border-gray-300 py-3 text-center text-sm tracking-widest hover:bg-gray-50 transition-colors lowercase"
                  >
                    view size chart
                  </button>
                )}

                {product.washCareGuide?.content && !expressInterest && (
                  <button
                    onClick={() => setIsWashCareOpen(true)}
                    className="w-full border border-gray-300 py-3 text-center text-sm tracking-widest hover:bg-gray-50 transition-colors lowercase"
                  >
                    fabrics & wash care
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sticky Add to Cart - Mobile */}
          <div className="sticky bottom-0 bg-[#F8F4EC] border-t border-gray-300 p-4">
            <button
              className="w-full border border-gray-900 py-4 text-center text-base tracking-widest hover:bg-gray-100 transition-colors lowercase disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={
                expressInterest ? handleExpressInterest : handleAddToCart
              }
              disabled={
                isExpressInterestLoading ||
                (!expressInterest &&
                  (!selectedSize ||
                    selectedSize.trim() === "" ||
                    !selectedVariant?.availableForSale))
              }
            >
              {expressInterest
                ? isExpressInterestLoading
                  ? "submitting..."
                  : "express interest!"
                : selectedVariant?.availableForSale === false
                  ? "out of stock"
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
          content={product.sizeGuide?.content}
        />
        <WashCareOverlay
          isOpen={isWashCareOpen}
          onClose={() => setIsWashCareOpen(false)}
          content={product.washCareGuide?.content}
        />
        <ExpressInterestOverlay
          isOpen={isExpressInterestOpen}
          onClose={() => setIsExpressInterestOpen(false)}
          productName={product.title}
          productId={product.id}
        />

        <ProfileCompletionFlow
          isOpen={isProfileCompletionOpen}
          onClose={() => setIsProfileCompletionOpen(false)}
          onComplete={() => {
            // Enhanced protection against multiple completion callbacks
            if (
              isProcessingCompletion.current ||
              hasOpenedCartFromCompletion.current
            ) {
              console.log(
                "ProductPageClient: Profile completion already processed, skipping"
              );
              return;
            }

            isProcessingCompletion.current = true;
            hasOpenedCartFromCompletion.current = true;

            console.log(
              "ProductPageClient: Processing profile completion (mobile)"
            );
            refreshProfileStatus();
            setIsProfileCompletionOpen(false);

            toast.success("profile completed!", {
              description:
                "your profile has been successfully updated. you'll now get personalized recommendations and faster checkout.",
              duration: 4000,
            });
            isProcessingCompletion.current = false;
          }}
        />
      </>
    );
  }

  // Desktop Layout
  return (
    <>
      <main className="flex min-h-screen bg-[#F8F4EC] text-gray-900">
        {/* Left Column - Product Title, Description and Price */}
        <div className="sticky top-0 flex h-screen w-1/4 flex-col p-8">
          {/* Main content centered */}
          <div className="flex-1 flex flex-col justify-center space-y-4">
            <h1 className="text-2xl font-medium tracking-widest lowercase">
              {product.title.toLowerCase()}
            </h1>

            {/* Product Description - Always Visible */}
            <div
              className="text-sm text-gray-600 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: product.descriptionHtml || product.description,
              }}
            />

            {!expressInterest && (
              <span className="text-xl font-medium">
                {formatPrice(price, currencyCode)}
              </span>
            )}
          </div>

          {/* Fabric & Wash Care Button - At the bottom */}
          {product.washCareGuide?.content && !expressInterest && (
            <div className="mt-auto">
              <button
                onClick={() => setIsWashCareOpen(true)}
                className="text-sm tracking-widest lowercase hover:text-gray-600 transition-colors text-left"
              >
                fabrics & wash care
              </button>
            </div>
          )}
        </div>

        {/* Middle Column (Now Scrolls with Page) */}
        <div className="flex-grow p-8">
          {/* Add spacing equivalent to navbar height */}
          <div className="h-16"></div>
          <div className="space-y-8">
            {product.images.edges.length > 0
              ? product.images.edges.map((imageEdge, index) => {
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
              : // Fallback placeholder images with different sizes
                [
                  { width: 600, height: 1000 },
                  { width: 900, height: 600 },
                  { width: 700, height: 800 },
                  { width: 850, height: 1200 },
                ].map((size, index) => (
                  <Image
                    key={`placeholder-image-${index}`}
                    src={`https://picsum.photos/id/${11 + index * 11}/${size.width}/${size.height}`}
                    alt={`${product.title} - Placeholder ${index + 1}`}
                    width={size.width}
                    height={size.height}
                    className="w-full h-auto select-none pointer-events-none"
                    priority={index === 0}
                    draggable={false}
                  />
                ))}
          </div>
        </div>

        {/* Right Column - Size Selection and Actions */}
        <div className="sticky top-0 flex h-screen w-1/4 flex-col p-8 border-l border-gray-300">
          <div className="flex-1 flex flex-col justify-center space-y-6">
            {/* Size Chart Button - Always show if content exists */}
            {product.sizeGuide?.content && (
              <button
                onClick={() => setIsSizeChartOpen(true)}
                className="text-sm tracking-widest lowercase hover:text-gray-600 transition-colors"
              >
                size chart
              </button>
            )}

            {!expressInterest && (
              <>
                {/* Divider */}
                <div className="h-px bg-gray-300 w-full"></div>

                {/* Sizes */}
                <div className="flex flex-col space-y-3 text-base tracking-widest">
                  {availableSizes.map((size) => {
                    const availabilityStatus = getSizeAvailabilityStatus(
                      product,
                      size
                    );
                    return (
                      <button
                        key={size}
                        onClick={() => handleSizeSelect(size)}
                        disabled={!availabilityStatus.available}
                        className={`hover:text-gray-600 transition-colors lowercase text-center ${
                          selectedSize === size
                            ? "underline font-medium"
                            : availabilityStatus.available
                              ? "text-gray-700"
                              : "text-gray-400 cursor-not-allowed line-through"
                        }`}
                      >
                        {size}
                        {!availabilityStatus.available && (
                          <span className="ml-2 text-xs">(out of stock)</span>
                        )}
                      </button>
                    );
                  })}
                  {availableSizes.length === 0 && (
                    <p className="text-sm text-gray-500 italic">
                      No sizes available for this product
                    </p>
                  )}
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
              disabled={
                isExpressInterestLoading ||
                (!expressInterest &&
                  (!selectedSize ||
                    selectedSize.trim() === "" ||
                    !selectedVariant?.availableForSale))
              }
            >
              {expressInterest
                ? isExpressInterestLoading
                  ? "submitting..."
                  : "express interest!"
                : selectedVariant?.availableForSale === false
                  ? "out of stock"
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
        content={product.sizeGuide?.content}
      />
      <WashCareOverlay
        isOpen={isWashCareOpen}
        onClose={() => setIsWashCareOpen(false)}
        content={product.washCareGuide?.content}
      />
      <ExpressInterestOverlay
        isOpen={isExpressInterestOpen}
        onClose={() => setIsExpressInterestOpen(false)}
        productName={product.title}
        productId={product.id}
      />

      <ProfileCompletionFlow
        isOpen={isProfileCompletionOpen}
        onClose={() => setIsProfileCompletionOpen(false)}
        onComplete={() => {
          // Enhanced protection against multiple completion callbacks
          if (
            isProcessingCompletion.current ||
            hasOpenedCartFromCompletion.current
          ) {
            console.log(
              "ProductPageClient: Profile completion already processed, skipping"
            );
            return;
          }

          isProcessingCompletion.current = true;
          hasOpenedCartFromCompletion.current = true;

          console.log(
            "ProductPageClient: Processing profile completion (desktop)"
          );
          refreshProfileStatus();
          setIsProfileCompletionOpen(false);

          // ProfileCompletionFlow now handles cart opening for checkout logins automatically
          toast.success("profile completed!", {
            description:
              "your profile has been successfully updated. you'll now get personalized recommendations and faster checkout.",
            duration: 4000,
          });
          isProcessingCompletion.current = false;
        }}
      />
    </>
  );
}
