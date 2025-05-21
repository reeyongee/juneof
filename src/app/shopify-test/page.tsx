import {
  storefrontApiRequest,
  GET_FIRST_5_PRODUCTS_QUERY,
  ShopifyProductsData, // Import the type for the expected data
} from "@/lib/shopify"; // Adjust path if your lib folder is elsewhere

async function fetchShopifyProducts() {
  try {
    // Use the type when calling the API request
    const data = await storefrontApiRequest<ShopifyProductsData>(
      GET_FIRST_5_PRODUCTS_QUERY
    );
    return data.products.edges.map((edge) => edge.node); // Extract just the product nodes
  } catch (error) {
    console.error("Failed to fetch Shopify products for test page:", error);
    return null; // Return null or an empty array on error
  }
}

export default async function ShopifyTestPage() {
  const products = await fetchShopifyProducts();

  if (!products) {
    return (
      <main style={{ padding: "20px", fontFamily: "monospace" }}>
        <h1>Shopify Test Page</h1>
        <p style={{ color: "red" }}>
          Error fetching products from Shopify. Check console for details.
        </p>
      </main>
    );
  }

  if (products.length === 0) {
    return (
      <main style={{ padding: "20px", fontFamily: "monospace" }}>
        <h1>Shopify Test Page</h1>
        <p>No products found in your Shopify store, or an issue occurred.</p>
      </main>
    );
  }

  return (
    <main
      style={{
        padding: "20px",
        fontFamily: "monospace",
        backgroundColor: "#f0f0f0",
      }}
    >
      <h1>Shopify Test Page - Raw Product Data</h1>
      <p>Fetched {products.length} product(s).</p>
      <hr style={{ margin: "20px 0" }} />
      <h2>Products:</h2>
      <pre
        style={{
          backgroundColor: "#fff",
          padding: "15px",
          border: "1px solid #ccc",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
        }}
      >
        {JSON.stringify(products, null, 2)}
      </pre>
    </main>
  );
}
