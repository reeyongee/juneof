import { createClient } from "@sanity/client";

import { apiVersion, dataset, projectId } from "../env";

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false, // Set to false if statically generating pages, using ISR or tag-based revalidation
  // Disable features that might cause readableStream issues
  withCredentials: false,
  // Force traditional HTTP requests instead of streaming
  requestTagPrefix: "sanity",
  perspective: "published",
  // Ensure CORS compatibility
  stega: false,
});
