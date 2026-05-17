"use client";

/**
 * Animated Components Library
 * Reusable animation wrappers based on Framer project patterns
 */

import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";
import {
  fadeIn,
  fadeInUp,
  scaleOnHover,
  scaleOnTap,
  staggerContainer,
  slideInLeft,
  slideInRight,
  hoverLift,
  scrollReveal,
} from "@/lib/animations";

// Animated Container with fade-in
interface AnimatedContainerProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  delay?: number;
}

export function AnimatedContainer({
  children,
  delay = 0,
  className,
  ...props
}: AnimatedContainerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      transition={{ delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Animated Section that reveals on scroll
export function AnimatedSection({
  children,
  className,
  ...props
}: AnimatedContainerProps) {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={scrollReveal}
      className={className}
      {...props}
    >
      {children}
    </motion.section>
  );
}

// Stagger container for lists and grids
export function StaggerContainer({
  children,
  className,
  ...props
}: AnimatedContainerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Individual stagger item
export function StaggerItem({
  children,
  className,
  ...props
}: AnimatedContainerProps) {
  return (
    <motion.div variants={fadeInUp} className={className} {...props}>
      {children}
    </motion.div>
  );
}

// Animated card with hover lift effect
export function AnimatedCard({
  children,
  className,
  onClick,
  ...props
}: AnimatedContainerProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeInUp}
      whileHover={hoverLift}
      className={className}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Animated button with scale effects
interface AnimatedButtonProps extends HTMLMotionProps<"button"> {
  children: ReactNode;
}

export function AnimatedButton({
  children,
  className,
  ...props
}: AnimatedButtonProps) {
  return (
    <motion.button
      whileHover={scaleOnHover}
      whileTap={scaleOnTap}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
}

// Slide in from left (for sidebar items)
export function SlideInLeft({
  children,
  delay = 0,
  className,
  ...props
}: AnimatedContainerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={slideInLeft}
      transition={{ delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Slide in from right
export function SlideInRight({
  children,
  delay = 0,
  className,
  ...props
}: AnimatedContainerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={slideInRight}
      transition={{ delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Fade in from bottom
export function FadeInUp({
  children,
  delay = 0,
  className,
  ...props
}: AnimatedContainerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      transition={{ delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Number counter animation
interface AnimatedNumberProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export function AnimatedNumber({
  value,
  duration = 2,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
}: AnimatedNumberProps) {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration }}
      >
        {prefix}
        {value.toFixed(decimals)}
        {suffix}
      </motion.span>
    </motion.span>
  );
}

// Page transition wrapper
export function PageTransition({ children, className }: AnimatedContainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
