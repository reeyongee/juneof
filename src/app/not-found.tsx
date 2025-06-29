import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "page not found - june of",
  description:
    "oops! the page you're looking for doesn't exist. discover june of's sustainable fashion collection or return to our homepage.",
  keywords:
    "404 error, page not found, june of, sustainable fashion, heritage clothing",
  openGraph: {
    title: "page not found - june of",
    description:
      "oops! the page you're looking for doesn't exist. discover june of's sustainable fashion collection or return to our homepage.",
    url: "https://www.juneof.com/404",
    siteName: "june of",
    images: [
      {
        url: "https://www.juneof.com/landing-images/logo.svg",
        width: 1200,
        height: 630,
        alt: "june of - page not found",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "page not found - june of",
    description:
      "oops! the page you're looking for doesn't exist. discover june of's sustainable fashion collection or return to our homepage.",
    images: ["https://www.juneof.com/landing-images/logo.svg"],
  },
  robots: {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
    },
  },
};

export default function NotFound() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "page not found - june of",
            description:
              "404 error page for june of sustainable fashion website",
            url: "https://www.juneof.com/404",
            isPartOf: {
              "@type": "WebSite",
              name: "june of",
              url: "https://www.juneof.com",
            },
            publisher: {
              "@type": "Organization",
              name: "june of",
              url: "https://www.juneof.com",
            },
          }),
        }}
      />
      <main className="min-h-screen bg-[#F8F4EC] flex items-center justify-center p-8">
        <div className="text-center space-y-8 max-w-lg">
          {/* Main 404 Message */}
          <div className="space-y-4">
            <h1 className="text-6xl font-light tracking-widest lowercase text-gray-900">
              404
            </h1>

            <h2 className="text-2xl font-medium tracking-widest lowercase text-gray-900">
              oops! we&apos;re lost too
            </h2>
          </div>

          {/* Quirky On-Brand Message */}
          <div className="space-y-4">
            <p className="text-gray-700 tracking-wider lowercase leading-relaxed">
              don&apos;t worry though, our other pages are still here, patiently
              waiting to show you something beautiful.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 pt-4">
            <Link
              href="/product-listing"
              className="block w-full border border-gray-900 py-3 text-center text-base tracking-widest hover:bg-gray-100 transition-colors lowercase"
            >
              discover our collection
            </Link>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-center">
              <Link
                href="/"
                className="text-sm tracking-widest lowercase hover:text-gray-600 transition-colors"
              >
                return home
              </Link>

              <Link
                href="/about-us"
                className="text-sm tracking-widest lowercase hover:text-gray-600 transition-colors"
              >
                learn about us
              </Link>

              <Link
                href="/contact-us"
                className="text-sm tracking-widest lowercase hover:text-gray-600 transition-colors"
              >
                get in touch
              </Link>
            </div>
          </div>

          {/* Small Brand Touch */}
          <div className="pt-8 border-t border-gray-300">
            <p className="text-xs tracking-widest lowercase text-gray-500">
              a playful homage to the creative depth of india
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
