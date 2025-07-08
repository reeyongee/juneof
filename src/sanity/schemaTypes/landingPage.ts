// src/sanity/schemaTypes/landingPage.ts

import { defineField, defineType } from "sanity";
import { CircleIcon, ImagesIcon } from "@sanity/icons";

export const landingPage = defineType({
  name: "landingPage",
  title: "Landing Page",
  type: "document",
  icon: CircleIcon,
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      initialValue: "Landing Page Images",
      readOnly: true,
    }),
    // --- Section 1 ---
    defineField({
      name: "section1_image1",
      title: "Section 1 - Main Image (Left)",
      type: "image",
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
      group: "section1",
    }),
    defineField({
      name: "section1_image2",
      title: "Section 1 - Second Image",
      type: "image",
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
      group: "section1",
    }),
    defineField({
      name: "section1_image3",
      title: "Section 1 - Third Image",
      type: "image",
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
      group: "section1",
    }),
    defineField({
      name: "section1_image4",
      title: "Section 1 - Final Image (Right)",
      type: "image",
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
      group: "section1",
    }),
    // --- Section 2 & 3 ---
    defineField({
      name: "sticky_image",
      title: "Section 2 - Sticky Image",
      type: "image",
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
      group: "section2and3",
    }),
    defineField({
      name: "text_section_image",
      title: "Section 3 - Text Section Image",
      type: "image",
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
      group: "section2and3",
    }),
    // --- Section 4 (Gallery) - THE IMPROVED PART ---
    defineField({
      name: "galleryImages",
      title: "Gallery Images (Instagram Section)",
      description:
        "Upload all the unique images for the bottom gallery. You only need to upload each image once. You can reorder them here.",
      type: "array",
      icon: ImagesIcon,
      group: "section4",
      of: [
        {
          type: "image",
          options: {
            hotspot: true, // Allows for better cropping
          },
        },
      ],
      validation: (Rule) =>
        Rule.required()
          .min(5)
          .error("Please upload at least 5 images for the gallery."),
    }),
  ],
  // Add tabs to organize the fields in the Studio
  groups: [
    { name: "section1", title: "Section 1: Horizontal Scroll" },
    { name: "section2and3", title: "Section 2 & 3: Sticky/Text" },
    { name: "section4", title: "Section 4: Gallery" },
  ],
});
