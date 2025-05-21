import { Old_Standard_TT } from "next/font/google";
import "./globals.css";
import type { Metadata } from "next";
import Footer from "@/app/components/Footer";
import RevealOnScrollUp from "@/app/components/RevealOnScrollUp";
import SmoothScrollProvider from "@/app/components/SmoothScrollProvider";
import Navbar from "@/app/components/Navbar";
import { CartProvider } from "@/context/CartContext";

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
        <CartProvider>
          <SmoothScrollProvider />
          <Navbar />
          <RevealOnScrollUp>
            <main className="flex-grow bg-white">{children}</main>
            <Footer />
          </RevealOnScrollUp>
        </CartProvider>
      </body>
    </html>
  );
}
