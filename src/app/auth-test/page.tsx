import ShopifyAuth from "@/components/ShopifyAuth";

export default function AuthTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Shopify Customer Account Test
          </h1>
          <p className="text-gray-600">
            Test the Shopify Customer Account API authentication
          </p>
        </div>

        <ShopifyAuth />
      </div>
    </div>
  );
}
