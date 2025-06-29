import { DefaultSeoProps } from "next-seo";

export const defaultSEO: DefaultSeoProps = {
  titleTemplate: "%s | June Of",
  defaultTitle: "June Of – Heritage Meets Now",
  description:
    "June Of is where heritage meets the now. We take cues from the richness of Indian craft and rework it for a generation that lives in motion. Timeless fabrics in reimagined silhouettes, with intention behind every stitch.",
  canonical: "https://www.juneof.com",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.juneof.com",
    siteName: "June Of",
    title: "June Of – Heritage Meets Now",
    description:
      "June Of is where heritage meets the now. We take cues from the richness of Indian craft and rework it for a generation that lives in motion. Timeless fabrics in reimagined silhouettes, with intention behind every stitch.",
    images: [
      {
        url: "https://www.juneof.com/landing-images/logo.svg",
        width: 1200,
        height: 630,
        alt: "June Of Logo",
      },
    ],
  },
  twitter: {
    handle: "@juneof",
    site: "@juneof",
    cardType: "summary_large_image",
  },
  additionalMetaTags: [
    {
      name: "viewport",
      content: "width=device-width, initial-scale=1",
    },
    {
      name: "author",
      content: "June Of",
    },
    {
      name: "keywords",
      content:
        "sustainable fashion, Indian craft, heritage clothing, ethical fashion, artisanal clothing, handwoven fabrics, kantha cotton, conscious fashion",
    },
    {
      httpEquiv: "x-ua-compatible",
      content: "IE=edge",
    },
  ],
  additionalLinkTags: [
    {
      rel: "icon",
      href: "/favicon.png",
    },
    {
      rel: "apple-touch-icon",
      href: "/favicon.png",
      sizes: "76x76",
    },
  ],
};

// Organization Schema
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "June Of",
  url: "https://www.juneof.com",
  logo: "https://www.juneof.com/landing-images/logo.svg",
  description:
    "June Of is where heritage meets the now. We take cues from the richness of Indian craft and rework it for a generation that lives in motion.",
  foundingDate: "2024",
  founder: {
    "@type": "Person",
    name: "June Of Team",
  },
  address: {
    "@type": "PostalAddress",
    addressCountry: "IN",
    addressRegion: "Rajasthan",
    addressLocality: "Jaipur",
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+91-XXX-XXX-XXXX",
    contactType: "Customer Service",
    email: "reach@juneof.com",
  },
  sameAs: [
    "https://instagram.com/juneof",
    "https://twitter.com/juneof",
    "https://facebook.com/juneof",
  ],
  keywords:
    "sustainable fashion, Indian craft, heritage clothing, ethical fashion, artisanal clothing",
};

// Product Schema Generator
export const generateProductSchema = (product: {
  name: string;
  description: string;
  price: number;
  currency: string;
  availability: string;
  condition: string;
  brand: string;
  sku?: string;
  image?: string;
  url: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: product.name,
  description: product.description,
  brand: {
    "@type": "Brand",
    name: product.brand,
  },
  sku: product.sku,
  image: product.image || "https://www.juneof.com/landing-images/logo.svg",
  url: product.url,
  offers: {
    "@type": "Offer",
    price: product.price,
    priceCurrency: product.currency,
    availability: `https://schema.org/${product.availability}`,
    itemCondition: `https://schema.org/${product.condition}`,
    seller: {
      "@type": "Organization",
      name: "June Of",
    },
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "5",
    reviewCount: "1",
  },
});

// Breadcrumb Schema Generator
export const generateBreadcrumbSchema = (
  breadcrumbs: Array<{ name: string; url: string }>
) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: breadcrumbs.map((crumb, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: crumb.name,
    item: crumb.url,
  })),
});

// FAQ Schema Generator
export const generateFAQSchema = (
  faqs: Array<{ question: string; answer: string }>
) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
});
