"use client";

/**
 * Scroll Progress Component
 * Based on Framer project's Scroll_Progress.tsx
 * Tracks scroll position between start and end elements
 */

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface ScrollProgressProps {
  startId?: string;
  endId?: string;
  className?: string;
  showOnTop?: boolean;
}

export function ScrollProgress({
  startId = "start",
  endId = "end",
  className = "",
  showOnTop = true,
}: ScrollProgressProps) {
  const [progress, setProgress] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const prevScrollY = useRef(0);

  useEffect(() => {
    const calculateProgress = () => {
      const startEl = document.getElementById(startId);
      const endEl = document.getElementById(endId);

      if (startEl && endEl) {
        const viewportHeight = window.innerHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const startPosition = startEl.offsetTop;
        const endPosition = endEl.offsetTop + endEl.offsetHeight - viewportHeight;
        const totalScrollDistance = endPosition - startPosition;
        const currentScrollDistance = scrollTop - startPosition;
        const scrollProgress = Math.max(
          0,
          Math.min(100, (currentScrollDistance / totalScrollDistance) * 100)
        );

        setProgress(scrollProgress);
      } else {
        // Fallback: calculate based on document height
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollProgress = (scrollTop / docHeight) * 100;
        setProgress(scrollProgress);
      }
    };

    const handleScroll = () => {
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      if (scrollY !== prevScrollY.current) {
        prevScrollY.current = scrollY;
        calculateProgress();
        setIsScrolling(true);
      }
    };

    const handleScrollEnd = () => {
      setIsScrolling(false);
    };

    calculateProgress();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("scrollend", handleScrollEnd);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("scrollend", handleScrollEnd);
    };
  }, [startId, endId]);

  return (
    <div
      className={`fixed ${showOnTop ? "top-0" : "bottom-0"} left-0 right-0 h-1 bg-muted z-50 ${className}`}
    >
      <motion.div
        className="h-full bg-primary"
        style={{
          width: `${progress}%`,
          transition: isScrolling ? "none" : "width 0.5s ease-in-out",
        }}
        initial={{ width: "0%" }}
      />
    </div>
  );
}
