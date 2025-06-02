import Link from "next/link";
import ParallaxImageCarousel from "@/app/components/ParallaxImageCarousel";

export default function Home() {
  return (
    <>
      <ParallaxImageCarousel />
      <main className="h-screen flex flex-col items-center justify-center bg-[#F8F4EC] space-y-4">
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
      </main>
    </>
  );
}
