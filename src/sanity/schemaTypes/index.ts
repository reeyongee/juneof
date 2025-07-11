import { type SchemaTypeDefinition } from "sanity";
import { landingPage } from "./landingPage"; // <-- IMPORT your new schema
import { legalPage } from "./legalPage"; // <-- Import the new schema
import { washCare } from "./washCare"; // <-- Import wash care schema
import { sizeGuide } from "./sizeGuide"; // <-- Import size guide schema

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [landingPage, legalPage, washCare, sizeGuide], // <-- Add new schemas to the array
};
