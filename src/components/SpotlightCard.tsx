"use client";
import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  enable3DTilt?: boolean;
}

export default function SpotlightCard({
  children,
  className,
  enable3DTilt = true,
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("");
  const [glareOpacity, setGlareOpacity] = useState(0);
  const [boxShadow, setBoxShadow] = useState("");

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // CSS variables for spotlight glow
    cardRef.current.style.setProperty("--mx", `${x}px`);
    cardRef.current.style.setProperty("--my", `${y}px`);

    // Visible, premium 3D perspective tilt on desktop mouse interaction
    if (enable3DTilt && e.pointerType === "mouse") {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotX = -((y - centerY) / centerY) * 7.5;
      const rotY = ((x - centerX) / centerX) * 7.5;

      setTransform(
        `perspective(1100px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateY(-8px) scale3d(1.02, 1.02, 1.02)`
      );
      setGlareOpacity(0.28);
      setBoxShadow(
        `0 25px 50px -10px rgba(0,0,0,0.22), 0 40px 80px -15px rgb(var(--brand) / 0.22), inset 0 1px 2px rgba(255,255,255,0.35)`
      );
    }
  };

  const handlePointerLeave = () => {
    if (enable3DTilt) {
      setTransform("perspective(1100px) rotateX(0deg) rotateY(0deg) translateY(0px) scale3d(1, 1, 1)");
      setGlareOpacity(0);
      setBoxShadow("");
    }
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        "spot card card-3d relative overflow-hidden transition-all duration-300 ease-out will-change-transform",
        className
      )}
      style={{
        transform: transform || undefined,
        boxShadow: boxShadow || undefined,
        transformStyle: "preserve-3d",
      }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {/* Dynamic 3D Glare Reflection Layer that tracks cursor in 3D */}
      {enable3DTilt && (
        <div
          className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-300 rounded-[inherit]"
          style={{
            opacity: glareOpacity,
            background:
              "radial-gradient(circle 380px at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.38), transparent 70%)",
            mixBlendMode: "overlay",
          }}
        />
      )}
      {children}
    </div>
  );
}
