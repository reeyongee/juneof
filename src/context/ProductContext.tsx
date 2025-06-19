"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { ShopifyProductNode } from "@/lib/shopify";

interface ProductContextType {
  preloadedProducts: ShopifyProductNode[];
  setPreloadedProducts: (products: ShopifyProductNode[]) => void;
  isProductsLoaded: boolean;
  setIsProductsLoaded: (loaded: boolean) => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: ReactNode }) {
  const [preloadedProducts, setPreloadedProducts] = useState<
    ShopifyProductNode[]
  >([]);
  const [isProductsLoaded, setIsProductsLoaded] = useState(false);

  return (
    <ProductContext.Provider
      value={{
        preloadedProducts,
        setPreloadedProducts,
        isProductsLoaded,
        setIsProductsLoaded,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error("useProducts must be used within a ProductProvider");
  }
  return context;
}
