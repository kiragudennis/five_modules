"use client";

import {
  motion,
  useAnimation,
  useInView,
  type HTMLMotionProps,
  type Variants,
} from "framer-motion";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface AnimatedSectionProps extends HTMLMotionProps<"section"> {
  once?: boolean;
  delay?: number;
  spacing?: "none" | "tight" | "normal" | "loose";
  animation?: "fadeUp" | "fade" | "slideLeft" | "slideRight";
}

const spacingClasses = {
  none: "py-0",
  tight: "py-4 md:py-6", // Reduced spacing
  normal: "py-8 md:py-12", // Standard
  loose: "py-16 md:py-24", // Large
};

const animationVariants: Record<string, Variants> = {
  fadeUp: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
    },
  },
  fade: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  },
  slideLeft: {
    hidden: { opacity: 0, x: 40 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.7,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
    },
  },
  slideRight: {
    hidden: { opacity: 0, x: -40 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.7,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
    },
  },
};

export function AnimatedSection({
  className,
  children,
  once = true,
  delay = 0,
  spacing = "tight", // Default to tight for landing pages
  animation = "fadeUp",
  ...props
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const isInView = useInView(ref, {
    once,
    margin: "-30px", // Reduced margin for earlier trigger
    amount: 0.2, // Trigger when 20% is visible
  });

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [controls, isInView]);

  return (
    <motion.section
      ref={ref}
      className={cn(spacingClasses[spacing], className)}
      initial="hidden"
      animate={controls}
      variants={animationVariants[animation]}
      custom={delay}
      transition={{ delay }}
      {...props}
    >
      {children}
    </motion.section>
  );
}

// Optional: Create a tighter container for hero/first sections
export function HeroSection(props: Omit<AnimatedSectionProps, "spacing">) {
  return <AnimatedSection spacing="none" animation="fade" {...props} />;
}

// Optional: Minimal spacing for compact sections
export function CompactSection(props: Omit<AnimatedSectionProps, "spacing">) {
  return <AnimatedSection spacing="tight" {...props} />;
}
