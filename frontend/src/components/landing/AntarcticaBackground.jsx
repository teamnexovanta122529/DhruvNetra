import { useEffect, useRef } from "react";

export default function AntarcticaBackground({ mouse }) {
  const backgroundRef = useRef(null);

  useEffect(() => {
    let animationFrame;

    const animate = () => {
      if (backgroundRef.current) {
        const x = mouse.current.x;
        const y = mouse.current.y;

        const targetX = x * 5;
        const targetY = y * 4;

        backgroundRef.current.style.transform = `
          translate3d(${targetX}px, ${targetY}px, 0)
          scale(1.035)
        `;
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationFrame);
  }, [mouse]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Main Antarctica image with natural polar daylight grading */}
      <div
        ref={backgroundRef}
        className="absolute inset-[-3%] bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/antarctica.jpg')",
          filter: "saturate(0.95) contrast(1.04) brightness(1.02)",
          willChange: "transform",
        }}
      />

      {/* Crisp daylight polar wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(240,248,255,0.45) 0%, rgba(224,242,254,0.2) 40%, rgba(240,248,255,0.55) 100%)",
        }}
      />

      {/* Subtle ice blue atmospheric tint */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(115deg, rgba(186,230,253,0.3) 0%, transparent 50%, rgba(204,251,241,0.25) 100%)",
        }}
      />

      {/* Soft center readability veil for deep navy hero typography */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.35) 45%, rgba(241,245,249,0.15) 80%)",
        }}
      />

      {/* Soft bottom vignette for coordinates */}
      <div
        className="absolute inset-x-0 bottom-0 h-[30%]"
        style={{
          background:
            "linear-gradient(to top, rgba(241,245,249,0.65), transparent)",
        }}
      />
    </div>
  );
}