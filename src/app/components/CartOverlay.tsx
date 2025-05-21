"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
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

  // Use cart from context
  const { cartItems, updateItemQuantity, removeItemFromCart, clearCart } =
    useCart();

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

  const handleCheckout = () => {
    console.log("Checkout initiated with items:", cartItems);
    alert("Proceeding to checkout!");
    // Actual checkout logic would go here
    // clearCart(); // Example: clear cart after successful checkout
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
          {/* Centered Title */}
          <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 text-center pointer-events-none">
            <h2 className="text-2xl font-serif lowercase inline-block">bag</h2>
          </div>
          {/* Close Button pushed to the right */}
          <div className="ml-auto">
            <button
              onClick={handleCloseStart}
              className="text-gray-600 hover:text-black transition-colors p-1 border border-gray-300 rounded-md"
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
                      className="px-2 py-1 hover:bg-gray-100"
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.id, 1)}
                      className="px-2 py-1 hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                  <p className="font-medium w-20 text-right">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                  <button
                    onClick={() => removeItemFromCart(item.id)}
                    className="ml-2 text-gray-500 hover:text-gray-700 text-lg"
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
            <div className="flex justify-between items-center">
              <p className="text-lg font-serif lowercase">Subtotal</p>
              <p className="text-lg font-medium">{formatPrice(subtotal)}</p>
            </div>
            <button
              onClick={clearCart}
              className="w-full text-gray-700 hover:text-gray-900 py-2 text-sm lowercase tracking-wider transition-colors border border-gray-300 hover:bg-gray-100 rounded-md"
            >
              clear bag
            </button>
            <button
              onClick={handleCheckout}
              className="w-full bg-[#BEBDBA] hover:bg-[#acaaaa] text-white py-3 rounded-md text-lg font-serif tracking-wider transition-colors lowercase"
            >
              checkout
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
