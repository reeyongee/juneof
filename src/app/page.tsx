import Link from "next/link";
import ParallaxImageCarousel from "@/app/components/ParallaxImageCarousel";

export default function Home() {
  return (
    <>
      <ParallaxImageCarousel />
      <main className="bg-[#F8F4EC] space-y-4">
        <section className="h-screen flex flex-col items-center justify-center space-y-4">
          <Link
            href="/product"
            className="border border-gray-900 px-8 py-4 text-xl tracking-widest hover:bg-gray-100 transition-colors"
          >
            VIEW PRODUCT
          </Link>
          <Link
            href="/product-listing"
            className="border border-gray-900 px-8 py-4 text-xl tracking-widest hover:bg-gray-100 transition-colors"
          >
            VIEW ALL PRODUCTS
          </Link>
          <Link
            href="/privacy-policy"
            className="border border-gray-900 px-8 py-4 text-xl tracking-widest hover:bg-gray-100 transition-colors"
          >
            PRIVACY POLICY
          </Link>
          <Link
            href="/shopify-test"
            className="border border-gray-900 px-8 py-4 text-xl tracking-widest hover:bg-gray-100 transition-colors"
          >
            SHOPIFY TEST
          </Link>
        </section>

        {/* Additional sections to demonstrate footer uncover effect */}
        <section className="h-screen flex flex-col items-center justify-center px-8">
          <div className="max-w-4xl text-center space-y-8">
            <h2 className="text-4xl font-bold tracking-wide">Our Story</h2>
            <p className="text-lg leading-relaxed">
              Discover the journey behind our brand and the passion that drives
              us to create exceptional experiences for our customers.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="p-6 border border-gray-300 rounded">
                <h3 className="text-xl font-semibold mb-4">Quality</h3>
                <p>
                  We believe in crafting products that stand the test of time.
                </p>
              </div>
              <div className="p-6 border border-gray-300 rounded">
                <h3 className="text-xl font-semibold mb-4">Innovation</h3>
                <p>
                  Pushing boundaries to bring you the latest in design and
                  functionality.
                </p>
              </div>
              <div className="p-6 border border-gray-300 rounded">
                <h3 className="text-xl font-semibold mb-4">Community</h3>
                <p>
                  Building connections and fostering relationships with our
                  valued customers.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="h-screen flex flex-col items-center justify-center px-8">
          <div className="max-w-4xl text-center space-y-8">
            <h2 className="text-4xl font-bold tracking-wide">
              Featured Products
            </h2>
            <p className="text-lg leading-relaxed">
              Explore our carefully curated selection of premium products
              designed to enhance your lifestyle.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
              <div className="aspect-square bg-gray-200 rounded flex items-center justify-center">
                <span className="text-gray-500">Product Image</span>
              </div>
              <div className="aspect-square bg-gray-200 rounded flex items-center justify-center">
                <span className="text-gray-500">Product Image</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
