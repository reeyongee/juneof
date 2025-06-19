import ProductListingClient from "./ProductListingClient";

export default async function ProductListingPage() {
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

  return <ProductListingClient fallbackProducts={fallbackProducts} />;
}
