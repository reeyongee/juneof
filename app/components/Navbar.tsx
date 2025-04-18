"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
        <Link href="/shop" className={styles.navLink}>
          shop
        </Link>
        <Link href="/bag" className={styles.navLink}>
          bag
        </Link>
        <Link href="/instagram" className={styles.navLink}>
          <Image
            src="/images/instagram-icon.svg"
            alt="Instagram"
            width={22}
            height={22}
            className={styles.icon}
          />
        </Link>
        <Link href="/account" className={styles.navLink}>
          <Image
            src="/images/user-icon.svg"
            alt="User Account"
            width={26}
            height={26}
            className={styles.icon}
          />
        </Link>
      </div>
    </nav>
  );
}
