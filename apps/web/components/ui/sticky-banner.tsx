'use client';

import { motion, useMotionValueEvent, useScroll } from 'motion/react';
import type React from 'react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export const StickyBanner = ({
  className,
  children,
  hideOnScroll = false,
}: {
  className?: string;
  children: React.ReactNode;
  hideOnScroll?: boolean;
}) => {
  const [visible, setVisible] = useState(true);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    if (hideOnScroll && latest > 40) {
      setVisible(false);
    } else {
      setVisible(true);
    }
  });

  return (
    <motion.div
      className={cn(
        'sticky inset-x-0 top-0 z-[60] flex min-h-[1.75rem] w-full items-center justify-center px-4 py-1',
        'border-b border-primary/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]',
        className,
      )}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: visible ? 0 : -100, opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
    >
      {children}
    </motion.div>
  );
};
