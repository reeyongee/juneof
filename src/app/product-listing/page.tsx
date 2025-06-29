import ProductListingClient from "./ProductListingClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "shop - june of",
  description:
    "discover june of's collection of sustainable fashion. heritage meets now in our thoughtfully crafted clothing made from timeless fabrics with intention behind every stitch.",
  keywords:
    "sustainable fashion, heritage clothing, ethical fashion, artisanal clothing, handwoven fabrics, kantha cotton, conscious fashion, june of collection, shop sustainable",
  openGraph: {
    title: "shop - june of",
    description:
      "discover june of's collection of sustainable fashion. heritage meets now in our thoughtfully crafted clothing made from timeless fabrics with intention behind every stitch.",
    url: "https://www.juneof.com/product-listing",
    siteName: "june of",
    images: [
      {
        url: "https://www.juneof.com/landing-images/1.webp",
        width: 1200,
        height: 630,
        alt: "june of sustainable fashion collection",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "shop - june of",
    description:
      "discover june of's collection of sustainable fashion. heritage meets now in our thoughtfully crafted clothing made from timeless fabrics with intention behind every stitch.",
    images: ["https://www.juneof.com/landing-images/1.webp"],
  },
  alternates: {
    canonical: "https://www.juneof.com/product-listing",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function ProductListingPage() {
  // Structured data for product collection
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "june of collection",
    description:
      "discover june of's collection of sustainable fashion. heritage meets now in our thoughtfully crafted clothing made from timeless fabrics with intention behind every stitch.",
    url: "https://www.juneof.com/product-listing",
    mainEntity: {
      "@type": "ItemList",
      name: "june of products",
      description:
        "sustainable fashion collection featuring heritage-inspired clothing",
      numberOfItems: "10+",
      itemListElement: [],
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "home",
          item: "https://www.juneof.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "shop",
          item: "https://www.juneof.com/product-listing",
        },
      ],
    },
    provider: {
      "@type": "Organization",
      name: "june of",
      url: "https://www.juneof.com",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionSchema),
        }}
      />
      <ProductListingClient />
    </>
  );
}
