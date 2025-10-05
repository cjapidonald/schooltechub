import { useMemo, type CSSProperties } from "react";

type Spark = {
  id: number;
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
  xOffset: number;
};

type SparkStyle = CSSProperties & {
  "--spark-x": string;
};

const SparklesBackground = () => {
  const sparks = useMemo<Spark[]>(
    () =>
      Array.from({ length: 32 }, (_, index) => ({
        id: index,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 2 + Math.random() * 4,
        duration: 5 + Math.random() * 6,
        delay: Math.random() * 8,
        xOffset: (Math.random() - 0.5) * 120,
      })),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {sparks.map((spark) => {
        const style: SparkStyle = {
          left: `${spark.left}%`,
          top: `${spark.top}%`,
          width: `${spark.size}px`,
          height: `${spark.size}px`,
          animationDuration: `${spark.duration}s`,
          animationDelay: `${spark.delay}s`,
          opacity: 0.75,
          background: "radial-gradient(circle, hsla(var(--glow-primary) / 0.9) 0%, transparent 70%)",
          ["--spark-x"]: `${spark.xOffset}px`,
        };

        return <span key={spark.id} className="absolute block animate-spark rounded-full" style={style} />;
      })}
    </div>
  );
};

export default SparklesBackground;
