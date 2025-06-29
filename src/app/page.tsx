import LandingPageContent from "@/app/components/LandingPageContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "june of",
  description:
    "June Of is where heritage meets the now. We take cues from the richness of Indian craft and rework it for a generation that lives in motion. Timeless fabrics in reimagined silhouettes, with intention behind every stitch.",
  openGraph: {
    title: "june of",
    description:
      "June Of is where heritage meets the now. We take cues from the richness of Indian craft and rework it for a generation that lives in motion.",
    url: "https://www.juneof.com",
    images: [
      {
        url: "/landing-images/logo.svg",
        width: 1200,
        height: 630,
        alt: "june of",
      },
    ],
  },
  alternates: {
    canonical: "https://www.juneof.com",
  },
};

export default function Home() {
  return (
    <>
      <LandingPageContent />
    </>
  );
}
