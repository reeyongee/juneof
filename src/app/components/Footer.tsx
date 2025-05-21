import React from "react";
import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  // Use a color close to the image, adjust as needed
  const backgroundColor = "bg-[#FDF3E1]"; // Example: A pale beige/orange
  const textColor = "text-black"; // Example: Black text

  return (
    <footer
      className={`w-full ${backgroundColor} ${textColor} pt-10 pb-10 overflow-x-hidden`}
    >
      <div className="container mx-auto px-4 md:px-8">
        {/* Links Section */}
        <div className="flex flex-wrap justify-between items-start text-base tracking-wider mb-16">
          {/* Column 1: Empty (was Newsletter) */}
          <div className="w-full md:w-1/4 mb-6 md:mb-0">
            {/* Intentionally empty */}
          </div>

          {/* Column 2: Social/Shop */}
          <div className="w-full sm:w-auto md:w-1/4 mb-6 md:mb-0 flex flex-col items-start md:items-center">
            <Link href="#" className="hover:opacity-75 mb-1">
              instagram
            </Link>
            {/* Removed TikTok and Shop Lello */}
          </div>

          {/* Column 3: Legal */}
          <div className="w-full sm:w-auto md:w-1/4 mb-6 md:mb-0 flex flex-col items-start md:items-center">
            <Link href="#" className="hover:opacity-75 mb-1">
              terms of use
            </Link>
            <Link href="#" className="hover:opacity-75">
              privacy policy
            </Link>
          </div>

          {/* Column 4: Company */}
          <div className="w-full sm:w-auto md:w-1/4 mb-6 md:mb-0 flex flex-col items-start md:items-end">
            <Link href="#" className="hover:opacity-75 mb-1">
              about us
            </Link>
            <Link href="#" className="hover:opacity-75 mb-1">
              contact us
            </Link>
            {/* Removed Credits */}
            <a
              href="https://juneof.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-75 mt-4"
            >
              juneof.com
            </a>
          </div>
        </div>

        {/* Logo Section - Removed cutoff, smaller, left-aligned */}
        <div className="w-full flex justify-start mt-8">
          <Image
            src="/juneof-logo.svg"
            alt="Juneof Logo"
            width={640} // Reduced width by 20%
            height={160} // Reduced height by 20%
            // Removed transform class
            className="pointer-events-none"
            style={{ userSelect: "none" }}
            draggable="false"
            priority // Optional: Keep if logo is critical LCP
          />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
