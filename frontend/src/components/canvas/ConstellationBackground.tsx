import React, { useEffect, useRef } from "react";

interface ConstellationBackgroundProps {
  isLight?: boolean;
}

export const ConstellationBackground: React.FC<ConstellationBackgroundProps> = ({ isLight }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, dpr = 1;
    let nodes: Array<{ x: number; y: number; vx: number; vy: number; r: number; glow: number }> = [];
    let animId: number;

    const col = isLight
      ? { node: "120, 110, 200", spark: "217, 130, 20", teal: "22, 148, 134" }
      : { node: "185, 179, 255", spark: "255, 196, 107", teal: "94, 211, 196" };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.max(40, Math.min(110, Math.floor((W * H) / 14000)));
      nodes = [];
      for (let i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
          r: 1.2 + Math.random() * 1.8,
          glow: 0,
        });
      }
    };

    const linkDist = 135;

    const frame = () => {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (!reduce) {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < -20) n.x = W + 20;
          if (n.x > W + 20) n.x = -20;
          if (n.y < -20) n.y = H + 20;
          if (n.y > H + 20) n.y = -20;
        }
        n.glow *= 0.94;
      }
      for (let a = 0; a < nodes.length; a++) {
        for (let b = a + 1; b < nodes.length; b++) {
          const dx = nodes[a].x - nodes[b].x;
          const dy = nodes[a].y - nodes[b].y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < linkDist * linkDist) {
            const t = 1 - Math.sqrt(dist2) / linkDist;
            const g = Math.max(nodes[a].glow, nodes[b].glow);
            ctx.strokeStyle =
              g > 0.05
                ? `rgba(${col.spark},${Math.min(0.85, t * (0.25 + g))})`
                : `rgba(${col.node},${t * 0.22})`;
            ctx.lineWidth = g > 0.05 ? 1.3 : 1;
            ctx.beginPath();
            ctx.moveTo(nodes[a].x, nodes[a].y);
            ctx.lineTo(nodes[b].x, nodes[b].y);
            ctx.stroke();
          }
        }
      }
      for (let j = 0; j < nodes.length; j++) {
        const m = nodes[j];
        const c = m.glow > 0.08 ? col.spark : col.node;
        ctx.fillStyle = `rgba(${c},${m.glow > 0.08 ? 0.5 + m.glow * 0.5 : 0.55})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r + m.glow * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      animId = requestAnimationFrame(frame);
    };

    resize();
    frame();
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [isLight]);

  return (
    <>
      {/* Neural Canvas Layer */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none z-0"
        aria-hidden="true"
      />
      {/* Radial Purple Glow Layer */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: isLight
            ? "radial-gradient(60% 50% at 50% 46%, #d9d3ff 0%, transparent 70%)"
            : "radial-gradient(60% 50% at 50% 46%, #2a2468 0%, transparent 70%)",
          opacity: 0.75,
        }}
        aria-hidden="true"
      />
    </>
  );
};
