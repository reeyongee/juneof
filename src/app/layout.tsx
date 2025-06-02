import { Old_Standard_TT } from "next/font/google";
import "./globals.css";
import type { Metadata } from "next";
import { CartProvider } from "@/context/CartContext";
import { SplashProvider } from "@/context/SplashContext";
import ClientLayout from "@/app/components/ClientLayout";

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
        <SplashProvider>
          <CartProvider>
            <ClientLayout>{children}</ClientLayout>
          </CartProvider>
        </SplashProvider>
      </body>
    </html>
  );
}
