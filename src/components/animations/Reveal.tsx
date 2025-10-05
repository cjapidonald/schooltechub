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

  const baseTransformClass =
    direction === "left" ? "-translate-x-8" : direction === "right" ? "translate-x-8" : "translate-y-8";
  const activeTransformClass = direction === "left" || direction === "right" ? "translate-x-0" : "translate-y-0";
  const isVerticalReveal = direction === "up";

  return (
    <div
      ref={ref}
      className={cn(
        "will-change-transform",
        isVerticalReveal
          ? "reveal-landing"
          : "opacity-0 transition-transform transition-opacity duration-700 ease-out",
        !isVerticalReveal && baseTransformClass,
        isInView &&
          (isVerticalReveal
            ? "reveal-landing-visible"
            : cn("opacity-100", activeTransformClass)),
        className,
      )}
      style={{
        transitionDelay: !isVerticalReveal ? `${delay}ms` : undefined,
        animationDelay: isVerticalReveal ? `${delay}ms` : undefined,
      }}
    >
      {children}
    </div>
  );
};
