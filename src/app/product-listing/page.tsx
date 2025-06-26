import ProductListingClient from "./ProductListingClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "shop - june of",
};

export default async function ProductListingPage() {
  return <ProductListingClient />;
}
