"use client";

/**
 * Dot Pattern Background
 * Subtle dot grid pattern inspired by Framer project
 * - 48px × 48px tile with 4 dots (3px circles)
 * - Smaller and more refined than Framer's original
 * - Typically used at 8-10% opacity
 * - Positioned absolutely behind content
 */

import { cn } from "@/lib/utils";

interface DotPatternProps {
  className?: string;
  dotSize?: number;
  dotColor?: string;
  opacity?: number;
  spacing?: number;
  withDollarSigns?: boolean;
}

export function DotPattern({
  className,
  dotSize = 1,
  dotColor = "currentColor",
  opacity = 0.1,
  spacing = 20,
  withDollarSigns = false,
}: DotPatternProps) {
  const patternId = "dot-pattern";

  return (
    <div
      className={cn("pointer-events-none fixed inset-0 z-0", className)}
      style={{ opacity }}
    >
      <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id={patternId}
            x="0"
            y="0"
            width={spacing}
            height={spacing}
            patternUnits="userSpaceOnUse"
          >
            <circle cx={dotSize} cy={dotSize} r={dotSize} fill={dotColor} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
}

/**
 * CSS-based dot pattern with optional dollar signs
 * Creates a subtle financial theme in the background
 */
export function DotPatternCSS({
  className,
  opacity = 0.1,
  withDollarSigns = true,
}: {
  className?: string;
  opacity?: number;
  withDollarSigns?: boolean;
}) {
  // Pattern with 6 positions (3 tiles wide × 2 tiles tall)
  // Position 6 (bottom-right of the 2x3 grid) has a $ symbol
  const dollarPattern = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='144' height='96'%3E%3Cdefs%3E%3Cstyle%3E.dollar%7Bfont-family:Arial,sans-serif;font-size:10px;font-weight:700;%7D%3C/style%3E%3C/defs%3E%3Cpath fill='transparent' d='M0 0h144v96H0Z'/%3E%3Ccircle cx='12' cy='11.5' r='1.5' fill='currentColor'/%3E%3Ccircle cx='60' cy='11.5' r='1.5' fill='currentColor'/%3E%3Ccircle cx='108' cy='11.5' r='1.5' fill='currentColor'/%3E%3Ccircle cx='12' cy='59.5' r='1.5' fill='currentColor'/%3E%3Ccircle cx='60' cy='59.5' r='1.5' fill='currentColor'/%3E%3Ctext x='106' y='65' class='dollar' fill='currentColor' text-anchor='middle'%3E%24%3C/text%3E%3C/svg%3E")`;

  const dotsOnlyPattern = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Cpath fill='transparent' d='M0 0h48v48H0Z'/%3E%3Cpath fill='currentColor' d='M12 10a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm0 24a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm24 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm0-24a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z'/%3E%3C/svg%3E")`;

  return (
    <div
      className={cn("pointer-events-none fixed inset-0 z-0", className)}
      style={{
        opacity,
        backgroundImage: withDollarSigns ? dollarPattern : dotsOnlyPattern,
        backgroundSize: withDollarSigns ? "144px 96px" : "48px 48px",
        backgroundRepeat: "repeat",
      }}
    />
  );
}
