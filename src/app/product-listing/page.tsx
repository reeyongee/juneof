import ProductCard from "../components/ProductCard";
import {
  storefrontApiRequest,
  GET_PRODUCTS_FOR_LISTING_QUERY,
  ShopifyProductsData,
  ShopifyProductNode,
} from "@/lib/shopify";

// Function to fetch Shopify products for listing
async function fetchShopifyProducts() {
  try {
    const data = await storefrontApiRequest<ShopifyProductsData>(
      GET_PRODUCTS_FOR_LISTING_QUERY,
      { first: 20 } // Fetch up to 20 products
    );
    return data.products.edges.map((edge) => edge.node);
  } catch (error) {
    console.error("Failed to fetch Shopify products:", error);
    return [];
  }
}

// Function to transform Shopify product data to ProductCard props
function transformShopifyProduct(product: ShopifyProductNode) {
  // Get the first image, or use a placeholder if no images
  const primaryImage =
    product.images.edges[0]?.node?.originalSrc ||
    "https://picsum.photos/300/450";

  // For hover image, try to use the second image, or use a slightly different placeholder
  const hoverImage =
    product.images.edges[1]?.node?.originalSrc ||
    product.images.edges[0]?.node?.originalSrc ||
    "https://picsum.photos/id/238/300/450";

  // Convert price from string to number (Shopify returns price as string)
  const price = parseFloat(product.priceRange.minVariantPrice.amount);
  const currencyCode = product.priceRange.minVariantPrice.currencyCode;

  return {
    imageUrl: primaryImage,
    hoverImageUrl: hoverImage,
    name: product.title.toUpperCase(),
    price: price,
    productUrl: `/product/${product.handle}`,
    currencyCode: currencyCode,
  };
}

export default async function ProductListingPage() {
  const shopifyProducts = await fetchShopifyProducts();

  // Transform Shopify products to match ProductCard props
  const products = shopifyProducts.map(transformShopifyProduct);

  // Fallback to mock data if no Shopify products are available
  const fallbackProducts = [
    {
      imageUrl: "https://picsum.photos/id/237/300/450",
      hoverImageUrl: "https://picsum.photos/id/238/300/450",
      name: "MALLO BLACK TROUSERS",
      price: 30000.0,
      productUrl: "/product/mallo-black-trousers",
      currencyCode: "INR",
    },
    {
      imageUrl: "https://picsum.photos/id/239/300/450",
      hoverImageUrl: "https://picsum.photos/id/240/300/450",
      name: "CLASSIC WHITE SHIRT",
      price: 25000.0,
      productUrl: "/product/classic-white-shirt",
      currencyCode: "INR",
    },
    {
      imageUrl: "https://picsum.photos/id/241/300/450",
      hoverImageUrl: "https://picsum.photos/id/242/300/450",
      name: "DENIM JACKET",
      price: 45000.0,
      productUrl: "/product/denim-jacket",
      currencyCode: "INR",
    },
    {
      imageUrl: "https://picsum.photos/id/243/300/450",
      hoverImageUrl: "https://picsum.photos/id/244/300/450",
      name: "SUMMER DRESS",
      price: 35000.0,
      productUrl: "/product/summer-dress",
      currencyCode: "INR",
    },
  ];

  const displayProducts = products.length > 0 ? products : fallbackProducts;

  return (
    <main className="min-h-screen bg-[#F8F4EC] p-8">
      {products.length === 0 && (
        <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 rounded">
          <p className="text-yellow-800">
            No Shopify products found. Displaying mock data. Check your Shopify
            configuration.
          </p>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 lowercase tracking-widest opacity-0">
          &nbsp;
        </h1>
        <p className="text-gray-600 mt-2 opacity-0">&nbsp;</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {displayProducts.map((product, index) => (
          <ProductCard
            key={
              products.length > 0
                ? `shopify-${product.productUrl}`
                : `fallback-${index}`
            }
            imageUrl={product.imageUrl}
            hoverImageUrl={product.hoverImageUrl}
            name={product.name}
            price={product.price}
            productUrl={product.productUrl}
            currencyCode={product.currencyCode}
          />
        ))}
      </div>
    </main>
  );
}
