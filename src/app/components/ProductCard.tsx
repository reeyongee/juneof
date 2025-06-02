"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useEffect } from "react";
import { gsap } from "gsap";

interface ProductCardProps {
  imageUrl: string;
  hoverImageUrl: string;
  name: string;
  price: number;
  productUrl: string;
  currencyCode?: string; // Optional currency code from Shopify
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
}) => {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const defaultImageRef = useRef<HTMLDivElement>(null);
  const hoverImageRef = useRef<HTMLDivElement>(null);

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
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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
      <h3 className="text-lg text-gray-900 lowercase font-medium tracking-widest mb-1">
        {name}
      </h3>
      <p className="text-sm text-gray-900 font-medium lowercase">
        {formatPrice(price, currencyCode)}
      </p>
    </Link>
  );
};

export default ProductCard;
