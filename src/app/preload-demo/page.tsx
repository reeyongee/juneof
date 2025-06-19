"use client";

import { useProducts } from "@/context/ProductContext";
import Image from "next/image";

export default function PreloadDemoPage() {
  const { preloadedProducts, isProductsLoaded } = useProducts();

  return (
    <main className="min-h-screen bg-[#F8F4EC] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">
          Shopify Products Preload Demo
        </h1>

        <div className="mb-6 p-4 bg-blue-100 border border-blue-400 rounded">
          <h2 className="text-lg font-semibold mb-2">Preload Status</h2>
          <p>
            <strong>Products Loaded:</strong> {isProductsLoaded ? "Yes" : "No"}
          </p>
          <p>
            <strong>Number of Products:</strong> {preloadedProducts.length}
          </p>
        </div>

        {isProductsLoaded && preloadedProducts.length > 0 ? (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Preloaded Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {preloadedProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white p-4 rounded-lg shadow"
                >
                  <h3 className="font-semibold text-lg mb-2">
                    {product.title}
                  </h3>
                  <p className="text-gray-600 mb-2">Handle: {product.handle}</p>
                  <p className="text-green-600 font-semibold mb-2">
                    ${product.priceRange.minVariantPrice.amount}{" "}
                    {product.priceRange.minVariantPrice.currencyCode}
                  </p>
                  <p className="text-sm text-gray-500 mb-3">
                    Images: {product.images.edges.length}
                  </p>
                  {product.images.edges.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {product.images.edges
                        .slice(0, 3)
                        .map((imageEdge, index) => (
                          <Image
                            key={index}
                            src={imageEdge.node.originalSrc}
                            alt={
                              imageEdge.node.altText ||
                              `${product.title} image ${index + 1}`
                            }
                            className="w-full h-20 object-cover rounded"
                            width={80}
                            height={80}
                          />
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-4">
              {!isProductsLoaded ? "Loading products..." : "No products found"}
            </h2>
            <p className="text-gray-600">
              {!isProductsLoaded
                ? "Products are being preloaded during the splash screen."
                : "Check your Shopify configuration or try refreshing the page."}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
