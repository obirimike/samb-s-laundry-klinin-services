"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUp } from "lucide-react";

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const adminScrollEl = document.getElementById("admin-main-content");

    const handleScroll = () => {
      const scrollY = adminScrollEl
        ? Math.max(window.scrollY, adminScrollEl.scrollTop)
        : window.scrollY;

      setIsVisible(scrollY > 280);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    if (adminScrollEl) {
      adminScrollEl.addEventListener("scroll", handleScroll, { passive: true });
    }

    // Reset visibility and re-check on route change
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (adminScrollEl) {
        adminScrollEl.removeEventListener("scroll", handleScroll);
      }
    };
  }, [pathname]);

  const scrollToTop = () => {
    const adminScrollEl = document.getElementById("admin-main-content");
    if (adminScrollEl && adminScrollEl.scrollTop > 0) {
      adminScrollEl.scrollTo({ top: 0, behavior: "smooth" });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      title="Back to top"
      className={`fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-[#031c43] text-white shadow-xl ring-1 ring-white/20 transition-all duration-300 hover:bg-blue-800 hover:scale-110 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-300 active:scale-95 sm:bottom-8 sm:right-8 ${
        isVisible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-4 opacity-0 pointer-events-none"
      }`}
    >
      <ArrowUp size={20} strokeWidth={2.5} aria-hidden="true" />
    </button>
  );
}
