import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function CustomCursor() {
  const cursorRef = useRef(null);
  const followerRef = useRef(null);

  const mousePosRef = useRef({
    x: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
    y: typeof window !== "undefined" ? window.innerHeight / 2 : 0,
  });

  const followerPosRef = useRef({
    x: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
    y: typeof window !== "undefined" ? window.innerHeight / 2 : 0,
  });

  // Track the active mount target (document.fullscreenElement in fullscreen mode, or document.body)
  const [mountTarget, setMountTarget] = useState(() => {
    if (typeof document !== "undefined") {
      return (
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement ||
        document.body
      );
    }
    return null;
  });

  // =========================================================
  // DYNAMIC FULLSCREEN TOP-LAYER PORTALING
  // =========================================================
  useEffect(() => {
    const handleFullscreenChange = () => {
      const activeFullscreenEl =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement ||
        document.body;

      setMountTarget(activeFullscreenEl);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);

  // =========================================================
  // MOUSE TRACKING & ANIMATION LOOP
  // =========================================================
  useEffect(() => {
    let animationFrame;

    const handleMouseMove = (event) => {
      const x = event.clientX;
      const y = event.clientY;

      mousePosRef.current.x = x;
      mousePosRef.current.y = y;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
    };

    const animate = () => {
      const mouse = mousePosRef.current;
      const follower = followerPosRef.current;

      follower.x += (mouse.x - follower.x) * 0.14;
      follower.y += (mouse.y - follower.y) * 0.14;

      if (followerRef.current) {
        followerRef.current.style.transform = `translate3d(${follower.x}px, ${follower.y}px, 0)`;
      }

      animationFrame = requestAnimationFrame(animate);
    };

    const handlePointerOver = (event) => {
      const interactive = event.target.closest(
        "button, a, [data-cursor], [role='button'], .dashboard-nav-item, .station-card, .metric-card, .alert-item, .model-controls button, .control-btn, input, select, textarea"
      );

      if (interactive) {
        cursorRef.current?.classList.add("cursor-active");
        followerRef.current?.classList.add("cursor-follower-active");
      }
    };

    const handlePointerOut = (event) => {
      const interactive = event.target.closest(
        "button, a, [data-cursor], [role='button'], .dashboard-nav-item, .station-card, .metric-card, .alert-item, .model-controls button, .control-btn, input, select, textarea"
      );

      if (interactive) {
        cursorRef.current?.classList.remove("cursor-active");
        followerRef.current?.classList.remove("cursor-follower-active");
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseover", handlePointerOver, { passive: true });
    window.addEventListener("mouseout", handlePointerOut, { passive: true });

    animationFrame = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handlePointerOver);
      window.removeEventListener("mouseout", handlePointerOut);

      cancelAnimationFrame(animationFrame);
    };
  }, []);

  const cursorContent = (
    <>
      <div
        ref={cursorRef}
        className="custom-cursor"
        style={{
          transform: `translate3d(${mousePosRef.current.x}px, ${mousePosRef.current.y}px, 0)`,
        }}
      />
      <div
        ref={followerRef}
        className="custom-cursor-follower"
        style={{
          transform: `translate3d(${followerPosRef.current.x}px, ${followerPosRef.current.y}px, 0)`,
        }}
      />
    </>
  );

  if (!mountTarget) {
    return cursorContent;
  }

  return createPortal(cursorContent, mountTarget);
}