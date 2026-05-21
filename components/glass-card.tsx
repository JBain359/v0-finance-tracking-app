import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  blur?: "sm" | "md" | "lg" | "xl";
  border?: boolean;
  gradient?: boolean;
}

export function GlassCard({
  children,
  className,
  blur = "md",
  border = true,
  gradient = false,
}: GlassCardProps) {
  const blurClasses = {
    sm: "backdrop-blur-sm",
    md: "backdrop-blur-md",
    lg: "backdrop-blur-lg",
    xl: "backdrop-blur-xl",
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl",
        blurClasses[blur],
        "bg-white/10 dark:bg-black/20",
        border && "border border-white/20 dark:border-white/10",
        "shadow-[0_8px_32px_0_rgba(0,0,0,0.12)]",
        "dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]",
        gradient &&
          "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/20 before:to-transparent before:pointer-events-none",
        className,
      )}
    >
      {children}
    </div>
  );
}
