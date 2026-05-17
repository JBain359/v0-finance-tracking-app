/**
 * Animation configurations from Framer project
 * Based on the motion patterns and timing from the Framer design system
 */

import { Variants } from "framer-motion";

// Base transition configurations matching Framer's smooth animations
export const transitions = {
  default: {
    duration: 0.5,
    ease: [0.25, 0.1, 0.25, 1], // Smooth ease-in-out
  },
  smooth: {
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1], // Material design easing
  },
  bounce: {
    type: "spring" as const,
    stiffness: 300,
    damping: 20,
  },
  fast: {
    duration: 0.2,
    ease: [0.4, 0, 0.2, 1],
  },
};

// Fade in animation (for page content)
export const fadeIn: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.smooth,
  },
};

// Fade in from bottom (for cards, sections)
export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 40,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.default,
  },
};

// Scale animation (for buttons, interactive elements)
export const scaleOnHover = {
  scale: 1.05,
  transition: transitions.fast,
};

export const scaleOnTap = {
  scale: 0.95,
  transition: transitions.fast,
};

// Stagger children animation (for lists, grids)
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

// Slide in from left (for sidebar, navigation)
export const slideInLeft: Variants = {
  hidden: {
    x: -100,
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: transitions.smooth,
  },
};

// Slide in from right
export const slideInRight: Variants = {
  hidden: {
    x: 100,
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: transitions.smooth,
  },
};

// Rotate animation (like Framer's withRotate)
export const rotateVariants: Variants = {
  initial: { rotate: 0 },
  animate: {
    rotate: 90,
    transition: { duration: 2 },
  },
};

// Hover lift effect (for cards)
export const hoverLift = {
  y: -4,
  boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
  transition: transitions.smooth,
};

// Page transition variants
export const pageTransition: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: transitions.default,
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: transitions.fast,
  },
};

// Accordion/collapse animation
export const collapseVariants: Variants = {
  open: {
    height: "auto",
    opacity: 1,
    transition: transitions.smooth,
  },
  closed: {
    height: 0,
    opacity: 0,
    transition: transitions.smooth,
  },
};

// Fade animation for modals/overlays
export const modalBackdrop: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
};

export const modalContent: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: transitions.smooth,
  },
};

// Scroll-triggered animation (whileInView)
export const scrollReveal: Variants = {
  hidden: {
    opacity: 0,
    y: 50,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.default,
  },
};

// Number counter animation helper
export const counterAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};
