import ContactUsClient from "./ContactUsClient";
import { Metadata } from "next";

// SEO Metadata
export const metadata: Metadata = {
  title: "contact us - june of",
  description:
    "get in touch with june of. we'd love to hear from you. send us a message about our sustainable fashion, heritage clothing, or any questions you have.",
  keywords:
    "contact june of, customer service, sustainable fashion inquiry, heritage clothing questions, ethical fashion support",
  openGraph: {
    title: "contact us - june of",
    description:
      "get in touch with june of. we'd love to hear from you. send us a message about our sustainable fashion, heritage clothing, or any questions you have.",
    url: "https://www.juneof.com/contact-us",
    siteName: "june of",
    images: [
      {
        url: "https://www.juneof.com/contact_us.jpg",
        width: 1200,
        height: 630,
        alt: "june of contact us page - get in touch",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "contact us - june of",
    description:
      "get in touch with june of. we'd love to hear from you. send us a message about our sustainable fashion, heritage clothing, or any questions you have.",
    images: ["https://www.juneof.com/contact_us.jpg"],
  },
  alternates: {
    canonical: "https://www.juneof.com/contact-us",
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

export default function ContactUsPage() {
  // Structured data for contact page
  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "contact us - june of",
    description:
      "get in touch with june of. we'd love to hear from you about our sustainable fashion and heritage clothing.",
    url: "https://www.juneof.com/contact-us",
    mainEntity: {
      "@type": "Organization",
      name: "june of",
      email: "reach@juneof.com",
      telephone: "+1 (555) 123-4567",
      url: "https://www.juneof.com",
      sameAs: ["https://www.instagram.com/juneof__"],
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+1 (555) 123-4567",
        email: "reach@juneof.com",
        contactType: "customer service",
        availableLanguage: "english",
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(contactSchema),
        }}
      />
      <ContactUsClient />
    </>
  );
}
