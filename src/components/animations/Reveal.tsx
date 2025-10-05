import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/useInView";

type RevealProps = PropsWithChildren<{
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right";
}>;

export const Reveal = ({ children, className, delay = 0, direction = "up" }: RevealProps) => {
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.2 });

  const initialTransform =
    direction === "up" ? "translate-y-8" : direction === "left" ? "-translate-x-8" : "translate-x-8";
  const inViewTransform = direction === "up" ? "translate-y-0" : "translate-x-0";

  return (
    <div
      ref={ref}
      className={cn(
        "opacity-0 transition-transform transition-opacity duration-700 ease-out will-change-transform",
        initialTransform,
        isInView && "opacity-100",
        isInView && inViewTransform,
        className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};
