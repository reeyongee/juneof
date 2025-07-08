import { type SchemaTypeDefinition } from "sanity";
import { landingPage } from "./landingPage"; // <-- IMPORT your new schema
import { legalPage } from "./legalPage"; // <-- Import the new schema

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [landingPage, legalPage], // <-- Add it to the array
};
