import { MutableRefObject, useEffect, useRef, useState } from "react";

type UseInViewOptions = IntersectionObserverInit & {
  once?: boolean;
};

export function useInView<T extends Element = HTMLElement>(
  options: UseInViewOptions = {}
) {
  const { once = false, root = null, rootMargin, threshold } = options;
  const [inView, setInView] = useState(false);
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) {
              observer.disconnect();
            }
          } else if (!once) {
            setInView(false);
          }
        });
      },
      {
        root,
        rootMargin,
        threshold,
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [once, root, rootMargin, JSON.stringify(threshold)]);

  return { ref, inView } as {
    ref: MutableRefObject<T | null>;
    inView: boolean;
  };
}
