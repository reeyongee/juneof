"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { Badge } from "@/components/ui/badge";

// Hook to detect mobile devices
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const userAgent =
        navigator.userAgent ||
        navigator.vendor ||
        (window as unknown as { opera?: string }).opera ||
        "";
      const mobileRegex =
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
      const isMobileDevice = mobileRegex.test(userAgent.toLowerCase());
      const isSmallScreen = window.innerWidth <= 768;

      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    return () => {
      window.removeEventListener("resize", checkDevice);
    };
  }, []);

  return isMobile;
};

interface ProductCardProps {
  imageUrl: string;
  hoverImageUrl: string;
  name: string;
  price: number;
  productUrl: string;
  currencyCode?: string; // Optional currency code from Shopify
  expressInterest?: boolean; // Whether to show "coming soon!" banner
}

// Enhanced price formatter that handles different currencies
const formatPrice = (price: number, currencyCode?: string): string => {
  // If no currency code provided, default to Rupees
  if (!currencyCode || currencyCode === "INR") {
    return `₹ ${price.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  // Handle other common currencies
  const currencySymbols: { [key: string]: string } = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    CAD: "C$",
    AUD: "A$",
    JPY: "¥",
  };

  const symbol = currencySymbols[currencyCode] || currencyCode;

  return `${symbol} ${price.toLocaleString("en-US", {
    minimumFractionDigits: currencyCode === "JPY" ? 0 : 2,
    maximumFractionDigits: currencyCode === "JPY" ? 0 : 2,
  })}`;
};

const ProductCard: React.FC<ProductCardProps> = ({
  imageUrl,
  hoverImageUrl,
  name,
  price,
  productUrl,
  currencyCode,
  expressInterest = false,
}) => {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const defaultImageRef = useRef<HTMLDivElement>(null);
  const hoverImageRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (cardRef.current && hoverImageRef.current) {
      gsap.set(cardRef.current, { backgroundColor: "transparent" });
      gsap.set(hoverImageRef.current, { opacity: 0 });
    }
  }, []);

  const handleMouseEnter = () => {
    if (cardRef.current && defaultImageRef.current && hoverImageRef.current) {
      gsap.to(cardRef.current, {
        backgroundColor: "#FFFFFF",
        scale: 0.92,
        duration: 0.3,
        ease: "power1.inOut",
      });
      gsap.to(defaultImageRef.current, {
        opacity: 0,
        duration: 0.3,
        ease: "power1.inOut",
      });
      gsap.to(hoverImageRef.current, {
        opacity: 1,
        duration: 0.3,
        ease: "power1.inOut",
      });
    }
  };

  const handleMouseLeave = () => {
    if (cardRef.current && defaultImageRef.current && hoverImageRef.current) {
      gsap.to(cardRef.current, {
        backgroundColor: "transparent",
        scale: 0.9,
        duration: 0.3,
        ease: "power1.inOut",
      });
      gsap.to(defaultImageRef.current, {
        opacity: 1,
        duration: 0.3,
        ease: "power1.inOut",
      });
      gsap.to(hoverImageRef.current, {
        opacity: 0,
        duration: 0.3,
        ease: "power1.inOut",
      });
    }
  };

  return (
    <Link
      href={productUrl}
      ref={cardRef}
      onMouseEnter={!isMobile ? handleMouseEnter : undefined}
      onMouseLeave={!isMobile ? handleMouseLeave : undefined}
      className="block group p-4 text-center scale-90"
    >
      <div className="relative overflow-hidden mb-4 aspect-[2/3]">
        <div ref={defaultImageRef} className="absolute inset-0">
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover w-full h-full select-none pointer-events-none"
            draggable={false}
          />
        </div>
        <div ref={hoverImageRef} className="absolute inset-0">
          <Image
            src={hoverImageUrl}
            alt={`${name} - hover view`}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover w-full h-full select-none pointer-events-none"
            draggable={false}
          />
        </div>
      </div>
      <h3 className="text-lg text-gray-900 lowercase font-medium tracking-widest mb-2">
        {name}
      </h3>
      {expressInterest ? (
        <Badge className="bg-black text-white hover:bg-black/90 px-4 py-2 text-sm font-semibold tracking-widest lowercase border-0">
          coming soon!
        </Badge>
      ) : (
        <p className="text-sm text-gray-900 font-medium lowercase">
          {formatPrice(price, currencyCode)}
        </p>
      )}
    </Link>
  );
};

export default ProductCard;
