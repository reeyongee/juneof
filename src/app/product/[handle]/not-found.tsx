import Link from "next/link";

export default function ProductNotFound() {
  return (
    <main className="min-h-screen bg-[#F8F4EC] flex items-center justify-center p-8">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-3xl font-medium tracking-widest lowercase text-gray-900">
          product not found
        </h1>

        <p className="text-gray-700 tracking-wider lowercase">
          the product you&apos;re looking for doesn&apos;t exist or may have
          been removed.
        </p>

        <div className="space-y-4">
          <Link
            href="/product-listing"
            className="block w-full border border-gray-900 py-3 text-center text-base tracking-widest hover:bg-gray-100 transition-colors lowercase"
          >
            browse all products
          </Link>

          <Link
            href="/"
            className="block text-sm tracking-widest lowercase hover:text-gray-600 transition-colors"
          >
            return home
          </Link>
        </div>
      </div>
    </main>
  );
}
