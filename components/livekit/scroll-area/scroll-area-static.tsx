'use client';

import { forwardRef, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ScrollAreaStaticProps {
  children?: React.ReactNode;
  className?: string;
}

export const ScrollAreaStatic = forwardRef<HTMLDivElement, ScrollAreaStaticProps>(
  function ScrollAreaStatic({ className, children }, ref) {
    const scrollContentRef = useRef<HTMLDivElement>(null);

    const mergedRef = useCallback(
      (node: HTMLDivElement | null) => {
        scrollContentRef.current = node;

        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref]
    );

    return (
      <div ref={mergedRef} className={cn('overflow-y-scroll scroll-smooth', className)}>
        <div>{children}</div>
      </div>
    );
  }
);
