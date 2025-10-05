import { useEffect, useState } from "react";

import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";

type AnimatedCounterProps = {
  value: number;
  suffix?: string;
  duration?: number;
  className?: string;
};

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export const AnimatedCounter = ({
  value,
  suffix = "",
  duration = 1200,
  className,
}: AnimatedCounterProps) => {
  const { ref, inView } = useInView<HTMLSpanElement>({ threshold: 0.4, once: true });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!inView) {
      return;
    }

    let frameId: number;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (startTime === null) {
        startTime = timestamp;
      }

      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = easeOutCubic(progress);
      const currentValue = Math.round(value * easedProgress);

      setDisplayValue(currentValue);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [duration, inView, value]);

  return (
    <span ref={ref} className={cn("inline-block", className)}>
      {`${displayValue.toLocaleString()}${suffix}`}
    </span>
  );
};

export default AnimatedCounter;
