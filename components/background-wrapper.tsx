"use client";

/**
 * Background Wrapper Component
 * Combines background colors with optional dot pattern
 * Based on Framer project patterns
 */

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { DotPatternCSS } from "@/components/dot-pattern";

interface BackgroundWrapperProps {
  children: ReactNode;
  className?: string;
  withDots?: boolean;
  dotOpacity?: number;
  dotClassName?: string;
  withDollarSigns?: boolean;
}

export function BackgroundWrapper({
  children,
  className,
  withDots = false,
  dotOpacity = 0.08,
  dotClassName = "text-foreground",
  withDollarSigns = true,
}: BackgroundWrapperProps) {
  return (
    <div className={cn("relative", className)}>
      {withDots && (
        <DotPatternCSS
          className={dotClassName}
          opacity={dotOpacity}
          withDollarSigns={withDollarSigns}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/**
 * Hero Section with Dot Pattern
 * Common pattern from Framer project
 */
interface HeroWithDotsProps {
  children: ReactNode;
  className?: string;
  dotOpacity?: number;
  withDollarSigns?: boolean;
}

export function HeroWithDots({
  children,
  className,
  dotOpacity = 0.1,
  withDollarSigns = true,
}: HeroWithDotsProps) {
  return (
    <section className={cn("relative overflow-hidden", className)}>
      <DotPatternCSS
        className="text-foreground"
        opacity={dotOpacity}
        withDollarSigns={withDollarSigns}
      />
      <div className="relative z-10">{children}</div>
    </section>
  );
}
