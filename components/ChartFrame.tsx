"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  className?: string;
  children: ReactNode;
};

/**
 * Hides its children until its own bounding box has a measured width > 0.
 * This sidesteps Recharts' "width(-1) and height(-1)" hydration warning,
 * which fires when ResponsiveContainer measures before the parent grid
 * track has laid out.
 */
export default function ChartFrame({ className = "", children }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const check = () => {
      const rect = node.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) setReady(true);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {ready ? children : null}
    </div>
  );
}
