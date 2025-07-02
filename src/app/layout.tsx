import { Old_Standard_TT } from "next/font/google";
import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script"; // Import next/script
import { organizationSchema } from "@/lib/seo";

import { SplashProvider } from "@/context/SplashContext";
import { AuthProvider } from "@/context/AuthContext";
import { LoadingProvider } from "@/context/LoadingContext";
import { ProductProvider } from "@/context/ProductContext";
import { CartProvider } from "@/context/CartContext";
import { AddressProvider } from "@/context/AddressContext";
import ClientLayout from "@/app/components/ClientLayout";
import LenisProvider from "@/components/LenisProvider";

const oldStandardTT = Old_Standard_TT({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | juneof",
    default: "juneof",
  },
  description:
    "Heritage meets now. Indian craft reworked for a generation in motion. Timeless fabrics, reimagined silhouettes.",
  keywords: [
    "sustainable fashion",
    "Indian craft",
    "heritage clothing",
    "ethical fashion",
    "artisanal clothing",
    "handwoven fabrics",
    "kantha cotton",
    "conscious fashion",
    "june of",
  ],
  authors: [{ name: "June Of" }],
  creator: "June Of",
  publisher: "June Of",
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
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon.png",
    apple: [
      { url: "/favicon.png", sizes: "180x180", type: "image/png" },
      { url: "/favicon.png", sizes: "152x152", type: "image/png" },
      { url: "/favicon.png", sizes: "144x144", type: "image/png" },
      { url: "/favicon.png", sizes: "120x120", type: "image/png" },
      { url: "/favicon.png", sizes: "114x114", type: "image/png" },
      { url: "/favicon.png", sizes: "76x76", type: "image/png" },
      { url: "/favicon.png", sizes: "72x72", type: "image/png" },
      { url: "/favicon.png", sizes: "60x60", type: "image/png" },
      { url: "/favicon.png", sizes: "57x57", type: "image/png" },
    ],
    other: [
      {
        rel: "icon",
        url: "/favicon.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        rel: "icon",
        url: "/favicon.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        rel: "apple-touch-icon",
        url: "/favicon.png",
        sizes: "180x180",
      },
      {
        rel: "mask-icon",
        url: "/favicon.png",
        color: "#000000",
      },
    ],
  },
  metadataBase: new URL("https://www.juneof.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.juneof.com",
    siteName: "juneof",
    title: "juneof",
    description:
      "Heritage meets now. Indian craft reworked for a generation in motion. Timeless fabrics, reimagined silhouettes.",
    images: [
      {
        url: "/landing-images/logo.svg",
        width: 1200,
        height: 630,
        alt: "June Of Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "juneof",
    description:
      "Heritage meets now. Indian craft reworked for a generation in motion. Timeless fabrics, reimagined silhouettes.",
    images: ["/landing-images/logo.svg"],
    creator: "@juneof",
    site: "@juneof",
  },
  verification: {
    google: "your-google-verification-code",
    // Add other verification codes as needed
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  return (
    <html lang="en">
      <head>
        {/* Favicon and Icon Links for Cross-Browser Compatibility */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="57x57" href="/favicon.png" />
        <link rel="shortcut icon" href="/favicon.png" />
        <meta name="msapplication-TileImage" content="/favicon.png" />
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="manifest" href="/site.webmanifest" />

        {/* Google Analytics 4 (GA4) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-ES618WEEFG"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-ES618WEEFG');
          `}
        </Script>

        {/* Meta Pixel Script */}
        {PIXEL_ID && (
          <Script id="meta-pixel-base" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${PIXEL_ID}');
            `}
          </Script>
        )}

        {/* Organization Schema */}
        <Script
          id="organization-schema"
          type="application/ld+json"
          strategy="afterInteractive"
        >
          {JSON.stringify(organizationSchema)}
        </Script>
      </head>
      <body className={`${oldStandardTT.className} flex flex-col min-h-screen`}>
        {/* Meta Pixel noscript Fallback */}
        {PIXEL_ID && (
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        )}
        <LenisProvider>
          <LoadingProvider>
            <SplashProvider>
              <ProductProvider>
                <AuthProvider>
                  <AddressProvider>
                    <CartProvider>
                      <ClientLayout>{children}</ClientLayout>
                    </CartProvider>
                  </AddressProvider>
                </AuthProvider>
              </ProductProvider>
            </SplashProvider>
          </LoadingProvider>
        </LenisProvider>
      </body>
    </html>
  );
}
