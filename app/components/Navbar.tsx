"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [isLightSection, setIsLightSection] = useState(false);

  // Function to check which section is in view and update navbar colors
  const checkSectionColors = () => {
    const scrollPosition = window.scrollY + window.innerHeight / 3;

    // Check if we're in a light-colored section (like the collection section)
    const collectionSection = document.querySelector(".collection-section");

    if (collectionSection) {
      const sectionTop =
        collectionSection.getBoundingClientRect().top + window.scrollY;
      setIsLightSection(scrollPosition >= sectionTop);
    }
  };

  useEffect(() => {
    setMounted(true);

    // Initial check
    checkSectionColors();

    // Add scroll event listener
    window.addEventListener("scroll", checkSectionColors);

    // Cleanup
    return () => {
      window.removeEventListener("scroll", checkSectionColors);
    };
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles.logoContainer}>
        {/* Logo placeholder - keeps the space reserved for the animated logo */}
        <div className="w-[145px] h-[80px]" />
      </div>
      <div className={styles.buttonContainer}>
        <Link
          href="/shop"
          className={`${styles.navLink} ${
            isLightSection ? styles.darkText : styles.lightText
          }`}
        >
          shop
        </Link>
        <Link
          href="/bag"
          className={`${styles.navLink} ${
            isLightSection ? styles.darkText : styles.lightText
          }`}
        >
          bag
        </Link>
        <Link
          href="/instagram"
          className={`${styles.navLink} ${
            isLightSection ? styles.darkText : styles.lightText
          }`}
        >
          <Image
            src="/images/instagram-icon.svg"
            alt="Instagram"
            width={22}
            height={22}
            className={`${styles.icon} ${
              isLightSection ? styles.darkIcon : styles.lightIcon
            }`}
          />
        </Link>
        <Link
          href="/account"
          className={`${styles.navLink} ${
            isLightSection ? styles.darkText : styles.lightText
          }`}
        >
          <Image
            src="/images/user-icon.svg"
            alt="User Account"
            width={26}
            height={26}
            className={`${styles.icon} ${
              isLightSection ? styles.darkIcon : styles.lightIcon
            }`}
          />
        </Link>
      </div>
    </nav>
  );
}
