import { Old_Standard_TT } from "next/font/google";
import "./globals.css";
import type { Metadata } from "next";

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
  title: "Product Page",
  description: "A beautiful product page",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${oldStandardTT.className} flex flex-col min-h-screen`}>
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
