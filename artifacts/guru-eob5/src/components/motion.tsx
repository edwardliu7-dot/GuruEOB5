/**
 * Shared Framer Motion animation primitives.
 * Import from here — never import framer-motion directly in pages.
 */
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

// ── Variants ─────────────────────────────────────────────────────────────────

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit:   { opacity: 0, y: -8,  transition: { duration: 0.2,  ease: "easeIn" } },
};

export const staggerContainerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: { opacity: 1, y: 0,  scale: 1,   transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
};

export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1,    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
  exit:   { opacity: 0, scale: 0.96,  transition: { duration: 0.18, ease: "easeIn" } },
};

export const slideInLeftVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

// ── Page Transition ───────────────────────────────────────────────────────────
// Wrap inside Layout — keyed by route so it re-triggers on navigation.

export function PageTransition({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={fadeUpVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── FadeIn ────────────────────────────────────────────────────────────────────
// Simple fade + slide-up for sections / headings.

export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Stagger Grid ─────────────────────────────────────────────────────────────
// Use StaggerContainer around a grid, StaggerItem around each card.

export function StaggerContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={staggerItemVariants} className={className}>
      {children}
    </motion.div>
  );
}

// ── ScaleIn ───────────────────────────────────────────────────────────────────
// For dialog content, empty states, chart cards.

export function ScaleIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.32, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── AnimateList ───────────────────────────────────────────────────────────────
// Stagger a list of items (table rows, cards) as they appear.

export function AnimateList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <AnimatePresence initial={false}>
      <motion.div
        variants={staggerContainerVariants}
        initial="hidden"
        animate="visible"
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function AnimateListItem({
  children,
  layoutId,
  className,
}: {
  children: React.ReactNode;
  layoutId?: string;
  className?: string;
}) {
  return (
    <motion.div
      layout
      layoutId={layoutId}
      variants={staggerItemVariants}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── MotionCard ────────────────────────────────────────────────────────────────
// Drop-in replacement for a plain div that acts as an interactive card.

export function MotionCard({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: "0 8px 30px rgba(0,0,0,0.10)" }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onClick={onClick}
      className={cn("cursor-default", className)}
    >
      {children}
    </motion.div>
  );
}

// ── NumberTicker ──────────────────────────────────────────────────────────────
// Animates a number from 0 to its final value.

import { useEffect, useRef, useState } from "react";

export function NumberTicker({
  value,
  duration = 1.2,
  className,
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);

  useEffect(() => {
    const to = value;
    const from = fromRef.current;
    startRef.current = null;

    const tick = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = (ts - startRef.current) / (duration * 1000);
      const t = Math.min(elapsed, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = to;
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return <span className={className}>{display}</span>;
}

// ── Re-export AnimatePresence for convenience ─────────────────────────────────
export { AnimatePresence, motion };
