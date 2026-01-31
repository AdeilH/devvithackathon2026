import { useRef, useEffect, useCallback } from 'react';
import { ShapeState, ShapeType, SHAPE_COLORS } from '../../shared/types/api';

interface ShapeCanvasProps {
  shape: ShapeState;
  size: number;
  label?: string;
  animated?: boolean;
}

// Shape polygon definitions (normalized to unit circle)
const SHAPE_POLYGONS: Record<ShapeType, number[][]> = {
  triangle: [
    [0, -1],
    [0.866, 0.5],
    [-0.866, 0.5],
  ],
  square: [
    [-0.707, -0.707],
    [0.707, -0.707],
    [0.707, 0.707],
    [-0.707, 0.707],
  ],
  pentagon: (() => {
    const points: number[][] = [];
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      points.push([Math.cos(angle), Math.sin(angle)]);
    }
    return points;
  })(),
  hexagon: (() => {
    const points: number[][] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * 2 * Math.PI) / 6;
      points.push([Math.cos(angle), Math.sin(angle)]);
    }
    return points;
  })(),
  star: (() => {
    const points: number[][] = [];
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const radius = i % 2 === 0 ? 1 : 0.5;
      points.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
    }
    return points;
  })(),
  arrow: [
    [0, -1],
    [0.5, 0],
    [0.25, 0],
    [0.25, 1],
    [-0.25, 1],
    [-0.25, 0],
    [-0.5, 0],
  ],
};

export function ShapeCanvas({ shape, size, label, animated = false }: ShapeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const currentStateRef = useRef({
    rotation: shape.rotation,
    scale: shape.scale,
    colorIndex: shape.colorIndex,
  });

  const drawShape = useCallback((
    ctx: CanvasRenderingContext2D,
    shapeState: {
      type: ShapeType;
      rotation: number;
      scale: number;
      flippedH: boolean;
      flippedV: boolean;
      colorIndex: number;
    },
    canvasSize: number
  ) => {
    const { type, rotation, scale, flippedH, flippedV, colorIndex } = shapeState;
    const centerX = canvasSize / 2;
    const centerY = canvasSize / 2;
    const baseRadius = canvasSize * 0.35;
    const color = SHAPE_COLORS[colorIndex] ?? '#FF6B6B';

    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Save context for transforms
    ctx.save();

    // Move to center
    ctx.translate(centerX, centerY);

    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Apply scale
    ctx.scale(scale, scale);

    // Apply flips
    if (flippedH) ctx.scale(-1, 1);
    if (flippedV) ctx.scale(1, -1);

    // Get polygon points
    const points = SHAPE_POLYGONS[type];

    // Helper to draw the shape path
    const drawPath = () => {
      ctx.beginPath();
      points.forEach((point, i) => {
        const x = (point[0] ?? 0) * baseRadius;
        const y = (point[1] ?? 0) * baseRadius;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.closePath();
    };

    // Draw outer glow (multiple layers)
    ctx.shadowColor = color;
    ctx.shadowBlur = 25;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    drawPath();
    ctx.fillStyle = color;
    ctx.fill();

    // Draw inner glow layer
    ctx.shadowBlur = 15;
    drawPath();
    ctx.fill();

    // Reset shadow for main shape
    ctx.shadowBlur = 0;

    // Create gradient fill
    const gradient = ctx.createRadialGradient(
      -baseRadius * 0.3, -baseRadius * 0.3, 0,
      0, 0, baseRadius * 1.2
    );
    gradient.addColorStop(0, lightenColor(color, 30));
    gradient.addColorStop(0.5, color);
    gradient.addColorStop(1, darkenColor(color, 20));

    drawPath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw highlight (inner light reflection)
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    const highlightGradient = ctx.createRadialGradient(
      -baseRadius * 0.4, -baseRadius * 0.4, 0,
      0, 0, baseRadius
    );
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
    highlightGradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
    drawPath();
    ctx.fillStyle = highlightGradient;
    ctx.fill();
    ctx.restore();

    // Draw subtle border
    drawPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw darker inner edge
    drawPath();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();
  }, []);

  // Helper functions for color manipulation
  const lightenColor = (hex: string, percent: number): string => {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
  };

  const darkenColor = (hex: string, percent: number): string => {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up high DPI canvas
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    if (animated) {
      // Animate to new state
      const startState = { ...currentStateRef.current };
      const targetState = {
        rotation: shape.rotation,
        scale: shape.scale,
        colorIndex: shape.colorIndex,
      };

      // Handle rotation animation (take shortest path)
      let rotationDiff = targetState.rotation - startState.rotation;
      if (rotationDiff > 180) rotationDiff -= 360;
      if (rotationDiff < -180) rotationDiff += 360;
      const targetRotation = startState.rotation + rotationDiff;

      const duration = 200; // ms
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);

        const currentRotation = startState.rotation + (targetRotation - startState.rotation) * eased;
        const currentScale = startState.scale + (targetState.scale - startState.scale) * eased;

        drawShape(ctx, {
          type: shape.type,
          rotation: currentRotation,
          scale: currentScale,
          flippedH: shape.flippedH,
          flippedV: shape.flippedV,
          colorIndex: progress >= 0.5 ? targetState.colorIndex : startState.colorIndex,
        }, size);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          // Animation complete, update ref
          currentStateRef.current = {
            rotation: shape.rotation,
            scale: shape.scale,
            colorIndex: shape.colorIndex,
          };
        }
      };

      // Cancel any existing animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      animationRef.current = requestAnimationFrame(animate);
    } else {
      // Draw immediately without animation
      drawShape(ctx, shape, size);
      currentStateRef.current = {
        rotation: shape.rotation,
        scale: shape.scale,
        colorIndex: shape.colorIndex,
      };
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [shape, size, animated, drawShape]);

  return (
    <div className="shape-canvas-container" style={{ textAlign: 'center' }}>
      {label && <div className="shape-label">{label}</div>}
      <canvas
        ref={canvasRef}
        style={{
          width: size,
          height: size,
          borderRadius: '12px',
          background: 'transparent',
        }}
      />
    </div>
  );
}

export default ShapeCanvas;
