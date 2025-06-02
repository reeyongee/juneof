import { redirect } from "next/navigation";

export default function ProductIndexPage() {
  // Redirect to product listing page since individual products require a handle
  redirect("/product-listing");
}
