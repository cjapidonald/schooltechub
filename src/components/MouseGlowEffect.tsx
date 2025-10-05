import { useEffect, useRef } from "react";

const MouseGlowEffect = () => {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    let isListening = false;
    let lastMouseEvent: MouseEvent | null = null;
    let frameRequested = false;
    let animationFrameId: number | null = null;

    const updateGlowPosition = () => {
      frameRequested = false;
      animationFrameId = null;
      if (!lastMouseEvent || !glowRef.current) {
        return;
      }

      const { clientX, clientY } = lastMouseEvent;
      glowRef.current.style.left = `${clientX}px`;
      glowRef.current.style.top = `${clientY}px`;
    };

    const handleMouseMove = (event: MouseEvent) => {
      lastMouseEvent = event;
      if (frameRequested) {
        return;
      }

      frameRequested = true;
      animationFrameId = window.requestAnimationFrame(updateGlowPosition);
    };

    const enableEffect = () => {
      if (!isListening) {
        window.addEventListener("mousemove", handleMouseMove);
        isListening = true;
      }
    };

    const disableEffect = () => {
      if (isListening) {
        window.removeEventListener("mousemove", handleMouseMove);
        isListening = false;
      }
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        frameRequested = false;
      }
      lastMouseEvent = null;
    };

    const handlePreferenceChange = () => {
      if (mediaQuery.matches) {
        disableEffect();
      } else {
        enableEffect();
      }
    };

    handlePreferenceChange();
    mediaQuery.addEventListener("change", handlePreferenceChange);

    return () => {
      disableEffect();
      mediaQuery.removeEventListener("change", handlePreferenceChange);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      className="pointer-events-none fixed z-50 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-3xl transition-opacity duration-200"
      style={{
        background: "radial-gradient(circle, hsl(var(--glow-primary) / 0.3) 0%, transparent 70%)",
      }}
    />
  );
};

export default MouseGlowEffect;