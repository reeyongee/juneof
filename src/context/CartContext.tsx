"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import { createCartAndRedirect } from "@/lib/shopify";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";
import { useAddress } from "./AddressContext";
import * as pixel from "@/lib/meta-pixel"; // Import the pixel helper

export interface CartItem {
  id: string; // Unique ID for the cart item (e.g., productID + size)
  name: string;
  size: string;
  price: number;
  quantity: number;
  imageUrl: string;
  variantId?: string; // Shopify variant ID for checkout
  productHandle?: string; // Shopify product handle
}

export interface CheckoutLoginContext {
  isCheckoutLogin: boolean;
  lastAddedProductHandle?: string;
  shouldOpenCartAfterLogin?: boolean;
}

interface CartContextType {
  cartItems: CartItem[];
  addItemToCart: (item: Omit<CartItem, "id" | "quantity">) => void;
  removeItemFromCart: (itemId: string) => void;
  updateItemQuantity: (itemId: string, change: number) => void;
  clearCart: () => void;
  proceedToCheckout: (email?: string) => Promise<void>;
  checkoutLoginContext: CheckoutLoginContext;
  setCheckoutLoginContext: (context: CheckoutLoginContext) => void;
  clearCheckoutLoginContext: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

const GUEST_CART_STORAGE_KEY = "juneof-guest-cart";

export const CartProvider = ({ children }: CartProviderProps) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [checkoutLoginContext, setCheckoutLoginContextState] =
    useState<CheckoutLoginContext>({
      isCheckoutLogin: false,
      lastAddedProductHandle: undefined,
      shouldOpenCartAfterLogin: false,
    });
  const { isAuthenticated, customerData, tokens } = useAuth();
  const { selectedAddressId, addresses } = useAddress();
  const previousAuthState = useRef<boolean | null>(null);
  const hasInitialized = useRef(false);

  // Initialize cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined" && !hasInitialized.current) {
      const savedGuestCart = localStorage.getItem(GUEST_CART_STORAGE_KEY);
      if (savedGuestCart) {
        try {
          const parsedCart = JSON.parse(savedGuestCart);
          if (Array.isArray(parsedCart)) {
            setCartItems(parsedCart);
          }
        } catch (error) {
          console.error("Error parsing saved guest cart:", error);
          localStorage.removeItem(GUEST_CART_STORAGE_KEY);
        }
      }
      hasInitialized.current = true;
    }
  }, []);

  // Handle authentication state changes
  useEffect(() => {
    if (previousAuthState.current === null) {
      // First time setting auth state, just record it
      previousAuthState.current = isAuthenticated;
      return;
    }

    const wasAuthenticated = previousAuthState.current;
    const isNowAuthenticated = isAuthenticated;

    if (!wasAuthenticated && isNowAuthenticated) {
      // User just logged in - restore guest cart if it exists
      if (typeof window !== "undefined") {
        const savedGuestCart = localStorage.getItem(GUEST_CART_STORAGE_KEY);
        if (savedGuestCart) {
          try {
            const parsedCart = JSON.parse(savedGuestCart);
            if (Array.isArray(parsedCart) && parsedCart.length > 0) {
              setCartItems(parsedCart);
              // Clear the guest cart from localStorage since user is now authenticated
              localStorage.removeItem(GUEST_CART_STORAGE_KEY);

              // Show toast notification about cart restoration
              toast.success("Welcome back!", {
                description: `Your bag has been restored with ${
                  parsedCart.length
                } item${parsedCart.length === 1 ? "" : "s"}`,
                duration: 3000,
              });
            }
          } catch (error) {
            console.error("Error restoring guest cart after login:", error);
            localStorage.removeItem(GUEST_CART_STORAGE_KEY);
          }
        }
      }
    } else if (wasAuthenticated && !isNowAuthenticated) {
      // User just logged out - clear cart completely
      setCartItems([]);
      // Also clear any guest cart data
      if (typeof window !== "undefined") {
        localStorage.removeItem(GUEST_CART_STORAGE_KEY);
      }
    }

    previousAuthState.current = isAuthenticated;
  }, [isAuthenticated]);

  // Save cart to localStorage for guest users
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      !isAuthenticated &&
      hasInitialized.current
    ) {
      if (cartItems.length > 0) {
        localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(cartItems));
      } else {
        localStorage.removeItem(GUEST_CART_STORAGE_KEY);
      }
    }
  }, [cartItems, isAuthenticated]);

  const addItemToCart = (newItemData: Omit<CartItem, "id" | "quantity">) => {
    // Track the last added product handle for checkout login context
    if (newItemData.productHandle) {
      setCheckoutLoginContextState((prev) => ({
        ...prev,
        lastAddedProductHandle: newItemData.productHandle,
      }));
    }

    // Determine target quantity based on the state *before* this specific add action.
    // We read from `cartItems` here (the state variable) NOT `prevItems` from the updater.
    const existingItemInCurrentState = cartItems.find(
      (item) => item.name === newItemData.name && item.size === newItemData.size
    );

    // If the item already exists in the current actual cart, its target quantity is current + 1.
    // If it's a brand new item, its target quantity is 1.
    const targetQuantity = existingItemInCurrentState
      ? existingItemInCurrentState.quantity + 1
      : 1;

    setCartItems((prevItems) => {
      // Now, inside the updater, we work with `prevItems` which React provides.
      const itemIndexInPrev = prevItems.findIndex(
        (item) =>
          item.name === newItemData.name && item.size === newItemData.size
      );

      if (itemIndexInPrev > -1) {
        // Item exists in the `prevItems` state slice.
        // Only update if its current quantity in `prevItems` is less than our predetermined target.
        if (prevItems[itemIndexInPrev].quantity < targetQuantity) {
          const updatedItems = [...prevItems];
          updatedItems[itemIndexInPrev] = {
            ...updatedItems[itemIndexInPrev],
            quantity: targetQuantity, // Set to the calculated target
          };
          return updatedItems;
        }
        // If quantity is already at or above target (e.g., from StrictMode's first call),
        // return `prevItems` unchanged to prevent further increment.
        return prevItems;
      } else {
        // Item is new to this `prevItems` state slice.
        // This path will be taken for a brand new item on the first StrictMode call.
        // On a second StrictMode call for a new item, `itemIndexInPrev` would be > -1,
        // and the above block would prevent re-adding or double incrementing.
        return [
          ...prevItems,
          {
            ...newItemData,
            // Ensure a unique ID only if truly new; if reusing, ID might be from existingItemInCurrentState.
            // For simplicity here, assuming new item gets new ID based on original logic.
            id: `${newItemData.name}-${newItemData.size}-${Date.now()}`,
            quantity: targetQuantity, // This will be 1 for a new item.
          },
        ];
      }
    });

    // Show toast notification for adding item to cart
    toast.success("Added to bag", {
      description: `${newItemData.name} (${newItemData.size}) added to your bag`,
      duration: 2500,
    });
  };

  const removeItemFromCart = (itemId: string) => {
    // Find the item being removed for toast notification
    const itemToRemove = cartItems.find((item) => item.id === itemId);

    setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));

    // Show toast notification for removing item
    if (itemToRemove) {
      toast.info("Removed from bag", {
        description: `${itemToRemove.name} (${itemToRemove.size}) removed from your bag`,
        duration: 2500,
      });
    }
  };

  const updateItemQuantity = (itemId: string, change: number) => {
    setCartItems(
      (prevItems) =>
        prevItems
          .map((item) => {
            if (item.id === itemId) {
              const newQuantity = item.quantity + change;
              return newQuantity > 0
                ? { ...item, quantity: newQuantity }
                : null;
            }
            return item;
          })
          .filter((item) => item !== null) as CartItem[]
    );
  };

  const clearCart = () => {
    const itemCount = cartItems.length;
    setCartItems([]);

    // Clear guest cart from localStorage as well
    if (typeof window !== "undefined") {
      localStorage.removeItem(GUEST_CART_STORAGE_KEY);
    }

    // Show toast notification for clearing cart
    if (itemCount > 0) {
      toast.info("Bag cleared", {
        description: `Removed ${itemCount} item${
          itemCount === 1 ? "" : "s"
        } from your bag`,
        duration: 2500,
      });
    }

    // Reset cursor state to prevent cursor disappearing issue
    // This ensures the cursor is properly visible after DOM changes
    setTimeout(() => {
      // Dispatch a custom event to trigger cursor reinitialization
      const cursorResetEvent = new CustomEvent("cursor-reset", {
        bubbles: true,
        detail: { reason: "cart-cleared" },
      });
      document.dispatchEvent(cursorResetEvent);

      // Also trigger a mousemove event to refresh cursor position
      const rect = document.body.getBoundingClientRect();
      const mouseEvent = new MouseEvent("mousemove", {
        clientX: rect.width / 2,
        clientY: rect.height / 2,
        bubbles: true,
      });
      document.dispatchEvent(mouseEvent);
    }, 150);
  };

  const setCheckoutLoginContext = (context: CheckoutLoginContext) => {
    setCheckoutLoginContextState(context);
  };

  const clearCheckoutLoginContext = () => {
    setCheckoutLoginContextState({
      isCheckoutLogin: false,
      lastAddedProductHandle: undefined,
      shouldOpenCartAfterLogin: false,
    });
  };

  const proceedToCheckout = async () => {
    try {
      // Use customer email if available
      const email = customerData?.customer?.emailAddress?.emailAddress;

      // Get customer access token from tokens if available
      const customerAccessToken = tokens?.accessToken;

      // Get selected delivery address
      const selectedAddress = addresses.find(
        (addr) => addr.id === selectedAddressId
      );
      const deliveryAddress = selectedAddress
        ? {
            firstName: selectedAddress.firstName || undefined,
            lastName: selectedAddress.lastName || undefined,
            company: selectedAddress.company || undefined,
            address1: selectedAddress.address1 || undefined,
            address2: selectedAddress.address2 || undefined,
            city: selectedAddress.city || undefined,
            province:
              selectedAddress.province || selectedAddress.zoneCode || undefined,
            country: selectedAddress.territoryCode || "IN", // Default to India
            zip: selectedAddress.zip || undefined,
            phone: selectedAddress.phoneNumber || undefined,
          }
        : undefined;

      // Track InitiateCheckout event just before redirecting
      if (pixel.PIXEL_ID && cartItems.length > 0) {
        const subtotal = cartItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        pixel.track("InitiateCheckout", {
          content_ids: cartItems.map((item) => item.productHandle || item.id),
          content_type: "product_group", // Use product_group for multiple items
          num_items: cartItems.reduce((sum, item) => sum + item.quantity, 0),
          currency: "INR", // Assuming INR
          value: subtotal,
        });
      }

      await createCartAndRedirect(
        cartItems,
        customerAccessToken || undefined,
        email || undefined,
        deliveryAddress
      );

      // Clear cart after successful checkout initiation
      clearCart();
    } catch (error) {
      console.error("Checkout failed:", error);
      // You might want to show a toast or error message to the user here
      throw error;
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addItemToCart,
        removeItemFromCart,
        updateItemQuantity,
        clearCart,
        proceedToCheckout,
        checkoutLoginContext,
        setCheckoutLoginContext,
        clearCheckoutLoginContext,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
