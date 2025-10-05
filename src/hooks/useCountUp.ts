import { useEffect, useRef, useState } from "react";

type UseCountUpOptions = {
  duration?: number;
  start?: number;
};

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export const useCountUp = (end: number, shouldStart: boolean, options: UseCountUpOptions = {}) => {
  const { duration = 1500, start = 0 } = options;
  const [value, setValue] = useState(start);
  const frameRef = useRef<number>();
  const startTimeRef = useRef<number | null>(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (!shouldStart || hasAnimatedRef.current) {
      return;
    }

    hasAnimatedRef.current = true;
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      const easedProgress = easeOutCubic(progress);
      const nextValue = start + (end - start) * easedProgress;

      setValue(nextValue);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [duration, end, shouldStart, start]);

  return value;
};
