"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import type { Maze, SolveData } from "@/lib/types";
import { clamp, COLORS } from "@/lib/maze";

type MazeCanvasProps = {
  maze: Maze;
  solveRef: MutableRefObject<SolveData | null>;
  progressRef: MutableRefObject<{
    visited: number;
    path: number;
    phase: string;
    lastTime: number;
  }>;
  drawRef: MutableRefObject<() => void>;
};

export const MazeCanvas = ({ maze, solveRef, progressRef, drawRef }: MazeCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const sizeRef = useRef({ width: 0, height: 0 });

  const drawFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const { width, height } = sizeRef.current;
    if (!width || !height) {
      return;
    }

    const { rows, cols, cells } = maze;
    const padding = 18;
    const cellSize = clamp(
      Math.min((width - padding * 2) / cols, (height - padding * 2) / rows),
      10,
      32
    );

    const mazeWidth = cols * cellSize;
    const mazeHeight = rows * cellSize;
    const offsetX = (width - mazeWidth) / 2;
    const offsetY = (height - mazeHeight) / 2;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, width, height);

    const solve = solveRef.current;
    const visitedCap = solve
      ? clamp(Math.floor(progressRef.current.visited), 0, solve.orderLength)
      : 0;
    const pathCap = solve
      ? clamp(Math.floor(progressRef.current.path), 0, solve.pathLength)
      : 0;

    for (let i = 0; i < cells.length; i += 1) {
      const cell = cells[i];
      const x = offsetX + cell.col * cellSize;
      const y = offsetY + cell.row * cellSize;

      if (solve) {
        const pathRank = solve.pathRank[i];
        const visitRank = solve.visitRank[i];

        if (pathRank !== -1 && pathRank <= pathCap) {
          ctx.fillStyle = COLORS.path;
          ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
        } else if (visitRank !== -1 && visitRank <= visitedCap) {
          ctx.fillStyle = COLORS.visited;
          ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
        }
      }

      ctx.strokeStyle = COLORS.wall;
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (cell.walls.top) {
        ctx.moveTo(x, y);
        ctx.lineTo(x + cellSize, y);
      }
      if (cell.walls.right) {
        ctx.moveTo(x + cellSize, y);
        ctx.lineTo(x + cellSize, y + cellSize);
      }
      if (cell.walls.bottom) {
        ctx.moveTo(x + cellSize, y + cellSize);
        ctx.lineTo(x, y + cellSize);
      }
      if (cell.walls.left) {
        ctx.moveTo(x, y + cellSize);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    const startX = offsetX + cellSize / 2;
    const startY = offsetY + cellSize / 2;
    const endX = offsetX + (cols - 0.5) * cellSize;
    const endY = offsetY + (rows - 0.5) * cellSize;

    ctx.fillStyle = COLORS.start;
    ctx.beginPath();
    ctx.arc(startX, startY, cellSize * 0.22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = COLORS.end;
    ctx.beginPath();
    ctx.arc(endX, endY, cellSize * 0.22, 0, Math.PI * 2);
    ctx.fill();
  };

  useEffect(() => {
    drawRef.current = drawFrame;
    drawFrame();
  }, [maze]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const resize = () => {
      const rect = wrapper.getBoundingClientRect();
      const scale = window.devicePixelRatio || 1;
      canvas.width = rect.width * scale;
      canvas.height = rect.height * scale;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      sizeRef.current = { width: rect.width, height: rect.height };
      drawFrame();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(wrapper);
    resize();

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="canvas-wrap" ref={wrapperRef}>
      <canvas ref={canvasRef} />
      <div className="legend">
        <div>
          <i className="visited" /> Visited
        </div>
        <div>
          <i className="path" /> Path
        </div>
        <div>
          <i className="start" /> Start
        </div>
        <div>
          <i className="end" /> End
        </div>
      </div>
    </div>
  );
};
