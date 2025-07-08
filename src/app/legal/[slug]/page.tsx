"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { client } from "../../../sanity/lib/client";
import { useViewportHeight } from "../../../hooks/useViewportHeight";

interface LegalPageData {
  title: string;
  slug: { current: string };
  content: string;
}

export default function LegalPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [pageData, setPageData] = useState<LegalPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const backgroundRef = useRef<HTMLDivElement>(null);
  const mainElementRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useViewportHeight();

  useEffect(() => {
    const fetchLegalPage = async () => {
      try {
        setLoading(true);
        const query = `*[_type == "legalPage" && slug.current == $slug][0]{
          title,
          slug,
          content
        }`;

        const data = await client.fetch(query, { slug });

        if (!data) {
          setError("Legal page not found");
        } else {
          setPageData(data);
        }
      } catch (err) {
        console.error("Error fetching legal page:", err);
        setError("Failed to load legal page");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchLegalPage();
    }
  }, [slug]);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  useEffect(() => {
    if (pageData?.title) {
      document.title = `${pageData.title.toLowerCase()} - june of`;
    }
  }, [pageData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fdf3e1]">
        <div className="text-xl lowercase tracking-wider">Loading...</div>
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fdf3e1]">
        <div className="text-xl lowercase tracking-wider text-red-600">
          {error || "Page not found"}
        </div>
      </div>
    );
  }

  // Mobile Layout
  if (isMobile) {
    return (
      <div
        className="relative min-h-screen"
        style={{ backgroundColor: "#fdf3e1" }}
      >
        <main className="relative flex flex-col min-h-screen text-black pt-20">
          <div className="p-6">
            <h1 className="text-lg font-medium tracking-widest lowercase text-black mb-8">
              {pageData.title.toLowerCase()}
            </h1>

            <div
              className="legal-content text-sm lowercase tracking-wider text-black space-y-4"
              dangerouslySetInnerHTML={{ __html: pageData.content }}
            />
          </div>
        </main>
      </div>
    );
  }

  // Desktop Layout
  return (
    <>
      <div className="relative" style={{ backgroundColor: "#fdf3e1" }}>
        {/* Clipping container for the parallax image */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            ref={backgroundRef}
            className="absolute inset-0 z-0 h-[130%] opacity-0"
          />
        </div>

        <main
          ref={mainElementRef}
          className="relative flex min-h-screen text-black pt-24"
        >
          {/* Left Column (Sticky Title) */}
          <div className="relative sticky top-0 z-10 flex h-screen w-[40%] flex-shrink-0 flex-col justify-center p-8 border-r border-gray-300">
            <h1 className="text-xl font-medium tracking-widest lowercase text-black mix-blend-difference">
              {pageData.title.toLowerCase()}
            </h1>
          </div>

          {/* Right Column (Scrollable Content) */}
          <div className="relative z-10 flex-grow p-8 bg-[rgba(0,0,0,0.02)] backdrop-blur-md">
            <div
              ref={contentRef}
              className="legal-content text-xl lowercase tracking-wider text-black space-y-4 mix-blend-difference"
              dangerouslySetInnerHTML={{ __html: pageData.content }}
            />
          </div>
        </main>
      </div>
    </>
  );
}
