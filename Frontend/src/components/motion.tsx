"use client";

import { motion, type Variants, type HTMLMotionProps } from "framer-motion";
import { type ReactNode } from "react";

// ── Fade-in page wrapper ──
export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Staggered list container ──
const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

export function StaggerList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className={className}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, ...props }: { children: ReactNode; className?: string } & HTMLMotionProps<"div">) {
  return (
    <motion.div variants={staggerItem} className={className} {...props}>
      {children}
    </motion.div>
  );
}

// ── Scale pop for badges/achievements ──
export function PopIn({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Tab content crossfade ──
export function TabContent({ children, tabKey, className }: { children: ReactNode; tabKey: string; className?: string }) {
  return (
    <motion.div
      key={tabKey}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── PR Alert / Celebration animation ──
export function CelebrationPop({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ scale: 0.3, opacity: 0, y: -20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
