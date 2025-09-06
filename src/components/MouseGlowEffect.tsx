import { useEffect, useRef } from "react";

const MouseGlowEffect = () => {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (glowRef.current) {
        glowRef.current.style.left = `${e.clientX}px`;
        glowRef.current.style.top = `${e.clientY}px`;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
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