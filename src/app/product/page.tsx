"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import SizeChart from "../components/SizeChart";
import WashCareOverlay from "../components/WashCareOverlay";
import Lenis from "lenis";
import Image from "next/image";
import { useCart } from "@/context/CartContext";

export default function ProductPage() {
  const [selectedSize, setSelectedSize] = useState("in between");
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const [isWashCareOpen, setIsWashCareOpen] = useState(false);
  const lenisRef = useRef<Lenis | null>(null);
  const { addItemToCart } = useCart();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentUrlSize = searchParams.get("size");

  const sizes = [
    "extra petite",
    "petite",
    "in between",
    "curvy",
    "extra curvy",
  ];

  // Effect to initialize Lenis for smooth scrolling
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.1, // Adjust for desired smoothness
      smoothWheel: true, // Enable smooth scroll for wheel events
    });

    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    const rafId = requestAnimationFrame(raf);

    // Cleanup function to destroy Lenis instance on unmount
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // Effect to stop/start Lenis scrolling based on *either* overlay's visibility
  useEffect(() => {
    if (isSizeChartOpen || isWashCareOpen) {
      lenisRef.current?.stop();
    } else {
      lenisRef.current?.start();
    }
  }, [isSizeChartOpen, isWashCareOpen]);

  // Effect to sync local state `selectedSize` with the URL parameter
  useEffect(() => {
    const sizeFromUrl = searchParams.get("size");
    // Update local state if URL parameter exists, otherwise use default
    setSelectedSize(sizeFromUrl || "in between");
  }, [searchParams]); // Rerun when searchParams change

  // Handler to update URL when a size is selected
  // Use useCallback to prevent unnecessary re-creation on renders
  const handleSizeSelect = useCallback(
    (newSize: string) => {
      // Create new search params object based on current params
      const params = new URLSearchParams(searchParams.toString());
      // Set the new size parameter
      params.set("size", newSize);
      // Navigate, replacing the current history entry is often better for filters
      // Use push() if you prefer adding a new history entry for each filter change
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams] // Dependencies for useCallback
  );

  // ADDED handleAddToCart function
  const handleAddToCart = () => {
    const productToAdd = {
      name: "rabari stitch shirt", // Placeholder - make dynamic if needed
      price: 29000, // Placeholder - make dynamic if needed
      size: selectedSize,
      imageUrl: "https://picsum.photos/id/11/100/150", // Placeholder image for cart item
    };
    addItemToCart(productToAdd);
    // If Toast is re-added later, trigger it here:
    // setToastMessage("added to cart");
    // setShowToast(true);
    console.log("Added to cart:", productToAdd); // For debugging, can be removed
  };

  return (
    <>
      <main className="flex min-h-screen bg-[#F8F4EC] text-gray-900">
        {/* Left Column (Sticky) */}
        <div className="sticky top-0 flex h-screen w-1/4 flex-col justify-center p-8 border-r border-gray-300">
          {/* Inner container spanning full height */}
          <div className="flex flex-col h-full">
            {/* Wrapper div for main content: Grows and centers its child */}
            <div className="flex-grow flex flex-col justify-center">
              {/* Original content block */}
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h1 className="text-xl font-medium tracking-widest lowercase">
                    rabari stitch shirt
                  </h1>
                  <span className="text-lg font-medium">₹ 29,000</span>
                </div>

                {/* Product Information */}
                <div className="space-y-2 text-sm tracking-wider text-gray-700">
                  <p className="lowercase">
                    hand embroidered rabari stitch done by nomadic pastoralist
                    tribes from kutch region
                  </p>
                  <p className="lowercase">100% handwoven ramie fabric</p>
                  <p className="lowercase">mother of pearl buttons</p>
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
            {/* Picsum Images */}
            <Image
              key="picsum-11"
              src="https://picsum.photos/id/11/600/1000"
              alt="Product image 1 (W:600)"
              width={600}
              height={1000}
              className="w-full h-auto select-none pointer-events-none"
              priority
              draggable={false}
            />
            <Image
              key="picsum-22"
              src="https://picsum.photos/id/22/900/600"
              alt="Product image 2 (W:900)"
              width={900}
              height={600}
              className="w-full h-auto select-none pointer-events-none"
              draggable={false}
            />
            <Image
              key="picsum-33"
              src="https://picsum.photos/id/33/700/800"
              alt="Product image 3 (W:700)"
              width={700}
              height={800}
              className="w-full h-auto select-none pointer-events-none"
              draggable={false}
            />
            <Image
              key="picsum-44"
              src="https://picsum.photos/id/44/850/1200"
              alt="Product image 4 (W:850)"
              width={850}
              height={1200}
              className="w-full h-auto select-none pointer-events-none"
              draggable={false}
            />
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
                    (currentUrlSize || "in between") === size
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
