import type { HTMLAttributes, ReactNode } from "react";

import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";

type ScrollRevealProps = {
  children: ReactNode;
  delay?: number;
  once?: boolean;
} & HTMLAttributes<HTMLDivElement>;

export const ScrollReveal = ({
  children,
  className,
  delay = 0,
  once = true,
  ...rest
}: ScrollRevealProps) => {
  const { style, ...restProps } = rest;
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.2, once });

  return (
    <div
      ref={ref}
      className={cn(
        "transform transition-all duration-700 ease-out will-change-[transform,opacity]",
        inView ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
        className
      )}
      style={{ transitionDelay: `${delay}ms`, ...style }}
      {...restProps}
    >
      {children}
    </div>
  );
};

export default ScrollReveal;
