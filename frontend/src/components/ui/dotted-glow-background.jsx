import React, { useEffect, useRef } from "react";

export function DottedGlowBackground({
  className = "",
  opacity = 1,
  gap = 20,
  radius = 1.6,
  colorLightVar = "--color-neutral-500",
  glowColorLightVar = "--color-neutral-600",
  colorDarkVar = "--color-neutral-500",
  glowColorDarkVar = "--color-sky-800",
  backgroundOpacity = 0,
  speedMin = 0.3,
  speedMax = 1.6,
  speedScale = 1,
  dotColor = "rgba(255, 77, 79, 0.18)",
  glowColor = "rgba(239, 68, 68, 0.85)",
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = null;
    let width = 0;
    let height = 0;
    let dots = [];

    const mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000 };

    const resize = () => {
      width = canvas.parentElement ? canvas.parentElement.offsetWidth : window.innerWidth;
      height = canvas.parentElement ? canvas.parentElement.offsetHeight : window.innerHeight;
      canvas.width = width;
      canvas.height = height;

      dots = [];
      const cols = Math.ceil(width / gap) + 1;
      const rows = Math.ceil(height / gap) + 1;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const speed = (speedMin + Math.random() * (speedMax - speedMin)) * speedScale * 0.02;
          dots.push({
            x: c * gap,
            y: r * gap,
            baseRadius: radius,
            phase: Math.random() * Math.PI * 2,
            speed: speed,
            glowIntensity: 0,
          });
        }
      }
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.targetX = -1000;
      mouse.targetY = -1000;
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave, { passive: true });
    resize();

    let time = 0;

    const render = () => {
      time += 0.02;
      mouse.x += (mouse.targetX - mouse.x) * 0.15;
      mouse.y += (mouse.targetY - mouse.y) * 0.15;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        
        // Shimmering breathing glow wave
        const wave = (Math.sin(time * dot.speed * 40 + dot.phase) + 1) / 2;
        
        // Mouse proximity glow
        const dx = mouse.x - dot.x;
        const dy = mouse.y - dot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let cursorGlow = 0;
        if (dist < 140) {
          cursorGlow = Math.pow(1 - dist / 140, 2);
        }

        const alpha = Math.min(1, 0.15 + wave * 0.35 + cursorGlow * 0.85);
        const r = dot.baseRadius + cursorGlow * 1.5;

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, r, 0, Math.PI * 2);

        if (cursorGlow > 0.1 || wave > 0.7) {
          ctx.fillStyle = glowColor.replace(/[\d\.]+\)$/, `${alpha})`);
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = cursorGlow > 0.1 ? 8 : 4;
        } else {
          ctx.fillStyle = dotColor.replace(/[\d\.]+\)$/, `${alpha})`);
          ctx.shadowBlur = 0;
        }

        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [gap, radius, speedMin, speedMax, speedScale, dotColor, glowColor]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      style={{
        opacity: opacity,
        maskImage: "radial-gradient(ellipse at center, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 85%)",
        WebkitMaskImage: "radial-gradient(ellipse at center, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 85%)",
      }}
    />
  );
}
