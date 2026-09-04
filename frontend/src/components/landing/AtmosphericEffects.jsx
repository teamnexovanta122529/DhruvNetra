export default function AtmosphericEffects({ mouse }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Distant horizon glow */}
      <div
        className="absolute left-1/2 bottom-[28%] w-[70vw] h-[22vw] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse, rgba(91,218,238,0.14) 0%, rgba(54,153,180,0.06) 38%, transparent 72%)",
          filter: "blur(35px)",
          transform: `translateX(calc(-50% + ${mouse.current.x * 8}px))`,
        }}
      />

      {/* Upper atmospheric haze */}
      <div
        className="absolute inset-x-0 top-0 h-[55%]"
        style={{
          background:
            "linear-gradient(180deg, rgba(117,205,224,0.07), transparent 75%)",
          opacity: 0.8,
        }}
      />

      {/* Soft moving atmospheric light */}
      <div
        className="absolute -top-[15%] left-[15%] w-[45vw] h-[35vw] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(111,218,235,0.055), transparent 68%)",
          filter: "blur(55px)",
          transform: `translate3d(${mouse.current.x * 12}px, ${
            mouse.current.y * 8
          }px, 0)`,
        }}
      />

      {/* Subtle cold light from the opposite side */}
      <div
        className="absolute top-[10%] right-[5%] w-[30vw] h-[30vw] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(77,193,218,0.045), transparent 70%)",
          filter: "blur(50px)",
        }}
      />

      {/* Very subtle cinematic rays */}
      <div
        className="absolute left-[30%] top-0 w-[18vw] h-[75vh]"
        style={{
          background:
            "linear-gradient(180deg, rgba(190,241,250,0.035), transparent 75%)",
          transform: "rotate(18deg)",
          filter: "blur(25px)",
          opacity: 0.55,
        }}
      />

      {/* Fine atmospheric grain */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.035,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E\")",
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}