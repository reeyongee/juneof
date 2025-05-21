import ProductCard from "../components/ProductCard";

export default function ProductListingPage() {
  // Re-added hoverImageUrl to data
  const product = {
    imageUrl: "https://picsum.photos/id/237/300/450",
    hoverImageUrl: "https://picsum.photos/id/238/300/450", // Added hover image URL
    name: "MALLO BLACK TROUSERS",
    price: 30000.0,
    productUrl: "/product",
  };

  return (
    <main className="min-h-screen bg-[#F8F4EC] p-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <ProductCard
          imageUrl={product.imageUrl}
          hoverImageUrl={product.hoverImageUrl}
          name={product.name}
          price={product.price}
          productUrl={product.productUrl}
        />
        <ProductCard
          imageUrl={product.imageUrl}
          hoverImageUrl={product.hoverImageUrl}
          name={product.name}
          price={product.price}
          productUrl={product.productUrl}
        />
        <ProductCard
          imageUrl={product.imageUrl}
          hoverImageUrl={product.hoverImageUrl}
          name={product.name}
          price={product.price}
          productUrl={product.productUrl}
        />
        <ProductCard
          imageUrl={product.imageUrl}
          hoverImageUrl={product.hoverImageUrl}
          name={product.name}
          price={product.price}
          productUrl={product.productUrl}
        />
      </div>
    </main>
  );
}
