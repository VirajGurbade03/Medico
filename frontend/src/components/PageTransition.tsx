'use client';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

const variants = {
  hidden: { opacity: 0, y: 12 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

export const PageTransition = ({ children }: { children: ReactNode }) => (
  <motion.main
    initial="hidden"
    animate="enter"
    exit="exit"
    variants={variants}
    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    className="page-wrapper"
  >
    {children}
  </motion.main>
);

export const StaggerContainer = ({ children, className, style }: { children: ReactNode, className?: string, style?: React.CSSProperties }) => (
  <motion.div
    initial="hidden"
    animate="show"
    variants={{
      hidden: {},
      show: {
        transition: {
          staggerChildren: 0.1,
        },
      },
    }}
    className={className}
    style={style}
  >
    {children}
  </motion.div>
);

export const FadeInItem = ({ children }: { children: ReactNode }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 15 },
      show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
    }}
  >
    {children}
  </motion.div>
);
