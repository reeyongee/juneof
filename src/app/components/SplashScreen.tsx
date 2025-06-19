"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { preloadShopifyProducts } from "@/lib/shopify";
import { useProducts } from "@/context/ProductContext";

interface SplashScreenProps {
  onLoadComplete: () => void;
}

export default function SplashScreen({ onLoadComplete }: SplashScreenProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  const { setPreloadedProducts, setIsProductsLoaded } = useProducts();

  // Hide cursor during splash screen
  useEffect(() => {
    document.body.classList.add("splash-screen-active");

    return () => {
      document.body.classList.remove("splash-screen-active");
    };
  }, []);

  useEffect(() => {
    // Function to check if page is fully loaded
    const checkPageLoad = () => {
      return new Promise<void>((resolve) => {
        const checkComplete = async () => {
          // Check document ready state
          if (document.readyState !== "complete") {
            setTimeout(checkComplete, 100);
            return;
          }

          setLoadingProgress(10); // Document ready

          // Wait for all images to load
          const images = Array.from(document.images);
          const imagePromises = images.map((img) => {
            if (img.complete && img.naturalHeight !== 0) {
              return Promise.resolve();
            }
            return new Promise<void>((resolve) => {
              const timeout = setTimeout(() => resolve(), 3000); // 3s timeout per image
              img.onload = () => {
                clearTimeout(timeout);
                // Update progress as images load
                setLoadingProgress((prev) =>
                  Math.min(prev + 30 / images.length, 40)
                );
                resolve();
              };
              img.onerror = () => {
                clearTimeout(timeout);
                resolve(); // Continue even if image fails
              };
            });
          });

          // Wait for all DOM images first
          await Promise.all(imagePromises);
          setLoadingProgress(40); // DOM images loaded

          // Preload Shopify products and their images
          const shopifyPromise = preloadShopifyProducts()
            .then(({ products, imageUrls }) => {
              console.log(
                `Preloading ${products.length} Shopify products with ${imageUrls.length} images...`
              );

              // Store products in context for later use
              setPreloadedProducts(products);
              setIsProductsLoaded(true);
              setLoadingProgress(50); // Products fetched

              // Create image elements to preload Shopify images
              const shopifyImagePromises = imageUrls.map((url) => {
                return new Promise<void>((resolve) => {
                  const img = new window.Image();
                  const timeout = setTimeout(() => resolve(), 4000); // 4s timeout per Shopify image

                  img.onload = () => {
                    clearTimeout(timeout);
                    // Update progress as Shopify images load
                    setLoadingProgress((prev) =>
                      Math.min(prev + 30 / imageUrls.length, 80)
                    );
                    resolve();
                  };
                  img.onerror = () => {
                    clearTimeout(timeout);
                    resolve(); // Continue even if image fails
                  };

                  img.src = url;
                });
              });

              return Promise.all(shopifyImagePromises);
            })
            .catch((error) => {
              console.error("Failed to preload Shopify products:", error);
              return Promise.resolve(); // Continue even if Shopify preload fails
            });

          await shopifyPromise;
          setLoadingProgress(80); // Shopify images loaded

          // Wait for fonts to load
          const fontPromise = document.fonts
            ? document.fonts.ready
            : Promise.resolve();

          await fontPromise;
          setLoadingProgress(90); // Fonts loaded

          // Wait for any pending network requests to complete
          const networkPromise = new Promise<void>((resolve) => {
            // Give some time for any pending requests
            setTimeout(resolve, 500);
          });

          await networkPromise;
          setLoadingProgress(100); // Everything loaded

          // Small delay before fading out
          setTimeout(resolve, 300);
        };

        checkComplete();
      });
    };

    // Start loading immediately
    checkPageLoad().then(() => {
      setIsLoading(false);
      // Start fade out transition
      setFadeOut(true);

      // Complete the transition after fade duration
      setTimeout(() => {
        onLoadComplete();
      }, 200); // 200ms fade duration
    });

    // Fallback timeout to prevent infinite loading
    const fallbackTimer = setTimeout(() => {
      setLoadingProgress(100);
      setIsLoading(false);
      setFadeOut(true);

      setTimeout(() => {
        onLoadComplete();
      }, 200);
    }, 12000); // 12 second maximum

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, [setPreloadedProducts, setIsProductsLoaded, onLoadComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-white transition-opacity duration-200 ease-out ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Logo - Top Left Corner, Large but Balanced */}
      <div className="absolute top-6 left-6 md:top-8 md:left-8 lg:top-12 lg:left-12">
        <div className="relative w-96 h-96 md:w-[28rem] md:h-[28rem] lg:w-[32rem] lg:h-[32rem] xl:w-[36rem] xl:h-[36rem] 2xl:w-[40rem] 2xl:h-[40rem] splash-logo">
          <Image
            src="/juneof-logo.svg"
            alt="Juneof Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Progress Bar - Bottom Center */}
      {isLoading && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2">
          <div className="w-80 md:w-96 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gray-500 to-gray-700 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(loadingProgress, 100)}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}
