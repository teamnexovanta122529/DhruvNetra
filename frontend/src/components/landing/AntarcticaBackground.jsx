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
      {/* Main Antarctica image */}
      <div
        ref={backgroundRef}
        className="absolute inset-[-3%] bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/antarctica.jpg')",
          filter: "saturate(0.82) contrast(1.08) brightness(0.88)",
          willChange: "transform",
        }}
      />

      {/* Cold cinematic color grade */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(4,18,30,0.34) 0%, rgba(5,25,39,0.08) 45%, rgba(2,10,18,0.48) 100%)",
          mixBlendMode: "multiply",
        }}
      />

      {/* Blue atmospheric tint */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(110deg, rgba(24,83,110,0.18), transparent 45%, rgba(0,160,190,0.08))",
        }}
      />

      {/* Cinematic vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, transparent 42%, rgba(1,8,15,0.58) 100%)",
        }}
      />

      {/* Bottom cinematic fade */}
      <div
        className="absolute inset-x-0 bottom-0 h-[35%]"
        style={{
          background:
            "linear-gradient(to top, rgba(1,8,15,0.72), transparent)",
        }}
      />
    </div>
  );
}