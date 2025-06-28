import { Old_Standard_TT } from "next/font/google";
import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script"; // Import next/script

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
  title: "june of",
  description:
    "a timeless brand for the modern and classical people who love to express their individuality boldly with styles to match",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
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
      </head>
      <body className={`${oldStandardTT.className} flex flex-col min-h-screen`}>
        {/* Meta Pixel noscript Fallback */}
        {PIXEL_ID && (
          <noscript>
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
