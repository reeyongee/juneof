import { defineField, defineType } from "sanity";
import { DocumentIcon } from "@sanity/icons";

export const washCare = defineType({
  name: "washCare",
  title: "Wash Care Guide",
  type: "document",
  icon: DocumentIcon,
  fields: [
    defineField({
      name: "productId",
      title: "Product ID",
      type: "string",
      description: "Enter the numeric Shopify product ID (e.g., 123456789)",
      validation: (Rule) =>
        Rule.required()
          .regex(/^\d+$/, { name: "numeric", invert: false })
          .error("Product ID must be numeric only"),
    }),
    defineField({
      name: "productTitle",
      title: "Product Title",
      type: "string",
      description: "Product name for reference (optional)",
    }),
    defineField({
      name: "content",
      title: "Wash Care Instructions (HTML)",
      type: "text",
      description: "Enter the HTML content for wash care instructions",
      rows: 20,
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: "productTitle",
      subtitle: "productId",
    },
    prepare(selection) {
      const { title, subtitle } = selection;
      return {
        title: title || "Untitled Product",
        subtitle: `Product ID: ${subtitle}`,
      };
    },
  },
});
