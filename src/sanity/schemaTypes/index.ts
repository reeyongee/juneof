import { type SchemaTypeDefinition } from "sanity";
import { landingPage } from "./landingPage"; // <-- IMPORT your new schema

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [landingPage], // <-- ADD your schema to the types array
};
