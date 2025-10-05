import { useEffect, useRef, useState } from "react";

type UseInViewOptions = {
  threshold?: number | number[];
  rootMargin?: string;
  once?: boolean;
};

export const useInView = <T extends HTMLElement>({
  threshold = 0.2,
  rootMargin = "0px",
  once = true,
}: UseInViewOptions = {}) => {
  const elementRef = useRef<T | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const node = elementRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            if (once) {
              obs.disconnect();
            }
          } else if (!once) {
            setIsInView(false);
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, once]);

  return { ref: elementRef, isInView } as const;
};
