import { defineField, defineType } from "sanity";
import { DocumentIcon } from "@sanity/icons";

export const legalPage = defineType({
  name: "legalPage",
  title: "Legal Page",
  type: "document",
  icon: DocumentIcon,
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: "e.g., Privacy Policy, Terms & Conditions",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      description: "The unique URL path for this page (e.g., privacy-policy)",
      options: {
        source: "title", // Automatically generate from the title
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "content",
      title: "Page Content (HTML)",
      description: "Paste the raw HTML content for this page here.",
      type: "text", // 'text' type allows for multi-line input
      rows: 20, // Makes the input box taller in the Studio
      validation: (Rule) => Rule.required(),
    }),
  ],
});
