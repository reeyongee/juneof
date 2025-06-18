"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useAddress } from "@/context/AddressContext";
import { useAuth } from "@/context/AuthContext";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { useRouter } from "next/navigation";
import AddressSelectionOverlay from "./AddressSelectionOverlay";
import { ShoppingBagIcon, XMarkIcon } from "@heroicons/react/24/outline";

// Define props interface
interface CartOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

// Simple price formatter for Rupees (consistent with ProductCard)
const formatPrice = (price: number): string => {
  return `₹ ${price.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export default function CartOverlay({ isOpen, onClose }: CartOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isAddressSelectionOpen, setIsAddressSelectionOpen] = useState(false);

  // Use cart from context
  const {
    cartItems,
    updateItemQuantity,
    removeItemFromCart,
    clearCart,
    proceedToCheckout,
  } = useCart();

  // Use address from context
  const { addresses, selectedAddressId } = useAddress();

  // Use auth from context
  const { isAuthenticated, login } = useAuth();

  // Use profile completion from hook
  const { isProfileComplete } = useProfileCompletion();

  // Use router for navigation
  const router = useRouter();

  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Get selected address for display
  const selectedAddress = addresses.find(
    (addr) => addr.id === selectedAddressId
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleCloseStart = () => {
    if (!isAnimatingOut) {
      setIsAnimatingOut(true);
    }
  };

  useEffect(() => {
    const overlayElement = overlayRef.current;
    const contentElement = contentRef.current;
    const backdropElement =
      overlayElement?.querySelector<HTMLDivElement>(".backdrop");

    if (!overlayElement || !contentElement || !backdropElement) return;

    tl.current?.kill();

    if (isOpen && !isAnimatingOut) {
      gsap.set(overlayElement, { autoAlpha: 1 });
      gsap.set(contentElement, { x: "100%", opacity: 0 }); // Start off-screen right
      gsap.set(backdropElement, { opacity: 0 });

      tl.current = gsap
        .timeline()
        .to(backdropElement, {
          opacity: 1,
          duration: 0.4,
        })
        .to(
          contentElement,
          {
            x: "0%", // Slide in
            opacity: 1,
            duration: 0.5,
            ease: "power3.out",
          },
          "-=0.3"
        );
    } else if (isAnimatingOut) {
      tl.current = gsap
        .timeline({
          onComplete: () => {
            if (overlayElement) {
              gsap.set(overlayElement, { autoAlpha: 0 });
            }
            onClose();
            setIsAnimatingOut(false);
          },
        })
        .to(contentElement, {
          x: "100%", // Slide out
          opacity: 0,
          duration: 0.4,
          ease: "power2.in",
        })
        .to(
          backdropElement,
          {
            opacity: 0,
            duration: 0.3,
          },
          "-=0.2"
        );
    }

    return () => {
      tl.current?.kill();
    };
  }, [isOpen, isAnimatingOut, onClose]);

  const handleQuantityChange = (itemId: string, change: number) => {
    updateItemQuantity(itemId, change);
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleCheckout = async () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      login();
      return;
    }

    // Check if profile is complete
    if (!isProfileComplete) {
      // Redirect to dashboard with profile completion flow
      router.push("/dashboard");
      handleCloseStart(); // Close cart overlay
      return;
    }

    try {
      setIsCheckingOut(true);
      await proceedToCheckout();
      // Cart will be cleared automatically in proceedToCheckout
      // Close the cart overlay after successful checkout initiation
      handleCloseStart();
    } catch (error) {
      console.error("Checkout failed:", error);
      // You might want to show an error message to the user here
      alert("Checkout failed. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (!isMounted) {
    return null;
  }

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex justify-end invisible" // Align to the right
      style={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === overlayRef.current?.querySelector(".backdrop")) {
          handleCloseStart();
        }
      }}
    >
      <div className="backdrop absolute inset-0 bg-black/20 backdrop-blur-sm" />

      <div
        ref={contentRef}
        className="relative h-full w-full max-w-md bg-[#F8F4EC] text-[#171717] flex flex-col shadow-xl"
      >
        {/* Header */}
        <div className="relative flex items-center p-6 border-b border-gray-300">
          {/* Clear Bag Button - positioned in upper left */}
          <div className="mr-auto">
            {cartItems.length > 0 && (
              <button
                onClick={clearCart}
                className="text-sm tracking-widest lowercase hover:text-gray-600 transition-colors no-underline-effect regular-cursor clear-cart-btn"
              >
                clear bag
              </button>
            )}
          </div>

          {/* Centered Title */}
          <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 text-center pointer-events-none">
            <h2 className="text-2xl font-serif lowercase inline-block">bag</h2>
          </div>

          {/* Close Button pushed to the right */}
          <div className="ml-auto">
            <button
              onClick={handleCloseStart}
              className="text-gray-600 hover:text-black transition-colors p-1 border border-gray-300 no-underline-effect"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-grow overflow-y-auto p-6 flex flex-col">
          {cartItems.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-start text-center pt-16">
              <ShoppingBagIcon className="h-24 w-24 text-gray-600 mb-6" />
              <p className="text-xl font-medium text-gray-700">
                Your bag is empty.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-4">
                  <div className="w-20 h-20 relative rounded overflow-hidden">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-medium lowercase">{item.name}</h3>
                    <p className="text-sm text-gray-600 lowercase">
                      {item.size}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleQuantityChange(item.id, -1)}
                      className="px-2 py-1 hover:bg-gray-100 no-underline-effect"
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.id, 1)}
                      className="px-2 py-1 hover:bg-gray-100 no-underline-effect"
                    >
                      +
                    </button>
                  </div>
                  <p className="font-medium w-20 text-right">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                  <button
                    onClick={() => removeItemFromCart(item.id)}
                    className="ml-2 text-gray-500 hover:text-gray-700 text-lg no-underline-effect"
                    aria-label={`Remove ${item.name}`}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="p-6 border-t border-gray-300 space-y-4">
            {/* Address Selection */}
            <div>
              {!isAuthenticated ? (
                <div className="bg-[#F8F4EC] border border-gray-300 p-3 text-xs">
                  <div className="flex justify-center">
                    <button
                      onClick={login}
                      className="text-xs tracking-widest lowercase hover:text-gray-600 transition-colors underline"
                    >
                      sign in to view addresses
                    </button>
                  </div>
                </div>
              ) : selectedAddress ? (
                <div className="bg-[#F8F4EC] border border-gray-300 p-3 text-xs">
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-black lowercase tracking-wider truncate">
                        {selectedAddress.name ||
                          `${selectedAddress.firstName} ${selectedAddress.lastName}`.trim()}
                      </p>
                    </div>
                    <div className="text-gray-600 lowercase tracking-wider">
                      <p className="truncate">{selectedAddress.address1}</p>
                      <p className="truncate">
                        {selectedAddress.city},{" "}
                        {selectedAddress.province || selectedAddress.zoneCode}{" "}
                        {selectedAddress.zip}
                      </p>
                    </div>
                    <div className="flex justify-center">
                      <button
                        onClick={() => setIsAddressSelectionOpen(true)}
                        className="text-xs tracking-widest lowercase hover:text-gray-600 transition-colors underline"
                      >
                        change address
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-[#F8F4EC] border border-gray-300 p-3 text-xs">
                  <div className="flex justify-center">
                    <button
                      onClick={() => setIsAddressSelectionOpen(true)}
                      className="text-xs tracking-widest lowercase hover:text-gray-600 transition-colors underline"
                    >
                      select address
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center">
              <p className="text-lg font-serif lowercase">Subtotal</p>
              <p className="text-lg font-medium">{formatPrice(subtotal)}</p>
            </div>
            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full bg-[#171717] text-[#F8F4EC] hover:bg-black py-3 text-base lowercase tracking-wider transition-colors disabled:opacity-50 checkout-btn no-underline-effect"
            >
              {isCheckingOut
                ? "Processing..."
                : !isAuthenticated
                ? "sign in to checkout"
                : !isProfileComplete
                ? "complete profile to checkout"
                : "checkout"}
            </button>
          </div>
        )}
      </div>

      {/* Address Selection Overlay */}
      <AddressSelectionOverlay
        isOpen={isAddressSelectionOpen}
        onClose={() => setIsAddressSelectionOpen(false)}
      />
    </div>,
    document.body
  );
}
