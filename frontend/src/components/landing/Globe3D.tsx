"use client";

import { useEffect, useRef, useCallback } from "react";
import createGlobe from "cobe";

interface Globe3DProps {
  size?: number;
  className?: string;
}

export function Globe3D({ size = 500, className }: Globe3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);
  const phiRef = useRef(0);
  const globeRef = useRef<ReturnType<typeof createGlobe> | null>(null);

  const initGlobe = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Destroy previous instance
    if (globeRef.current) {
      globeRef.current.destroy();
    }

    globeRef.current = createGlobe(canvas, {
      devicePixelRatio: 2,
      width: size * 2,
      height: size * 2,
      phi: 0.3,
      theta: 0.2,
      dark: 1,
      diffuse: 3,
      mapSamples: 16000,
      mapBrightness: 8,
      baseColor: [0.15, 0.15, 0.15],
      markerColor: [0.02, 0.59, 0.41],
      glowColor: [0.03, 0.03, 0.03],
      scale: 1,
      offset: [0, 0],
      markers: [
        { location: [37.7749, -122.4194], size: 0.08 },  // US
        { location: [52.52, 13.405], size: 0.08 },       // Germany
        { location: [-34.6037, -58.3816], size: 0.08 },   // Argentina
        { location: [19.076, 72.8777], size: 0.08 },      // India
        { location: [-33.9249, 18.4241], size: 0.08 },    // South Africa
      ],
      onRender: (state) => {
        if (!pointerInteracting.current) {
          phiRef.current += 0.003;
        }
        state.phi = phiRef.current + pointerInteractionMovement.current;
      },
    });
  }, [size]);

  useEffect(() => {
    initGlobe();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const onPointerDown = (e: PointerEvent) => {
      pointerInteracting.current = e.clientX - pointerInteractionMovement.current;
      canvas.style.cursor = "grabbing";
    };
    const onPointerUp = () => {
      pointerInteracting.current = null;
      canvas.style.cursor = "grab";
    };
    const onPointerOut = () => {
      pointerInteracting.current = null;
      canvas.style.cursor = "grab";
    };
    const onPointerMove = (e: PointerEvent) => {
      if (pointerInteracting.current !== null) {
        const delta = e.clientX - pointerInteracting.current;
        pointerInteractionMovement.current = delta / 200;
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerout", onPointerOut);
    canvas.addEventListener("pointermove", onPointerMove);

    return () => {
      if (globeRef.current) {
        globeRef.current.destroy();
        globeRef.current = null;
      }
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerout", onPointerOut);
      canvas.removeEventListener("pointermove", onPointerMove);
    };
  }, [initGlobe]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: size,
        height: size,
        cursor: "grab",
        maxWidth: "100%",
        aspectRatio: "1",
      }}
    />
  );
}
