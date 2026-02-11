"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Walls = {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
};

type Cell = {
  row: number;
  col: number;
  walls: Walls;
};

type Maze = {
  rows: number;
  cols: number;
  cells: Cell[];
};

type SolveData = {
  visitRank: number[];
  pathRank: number[];
  orderLength: number;
  pathLength: number;
};

const DEFAULT_ROWS = 23;
const DEFAULT_COLS = 41;

const COLORS = {
  background: "#000000",
  wall: "#1f1f1f",
  visited: "rgba(22, 242, 178, 0.35)",
  path: "rgba(246, 178, 58, 0.85)",
  start: "#22c55e",
  end: "#ff4d5e",
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const indexFromRowCol = (row: number, col: number, cols: number) =>
  row * cols + col;

const generateMaze = (rows: number, cols: number): Maze => {
  const cells: Cell[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      cells.push({
        row,
        col,
        walls: { top: true, right: true, bottom: true, left: true },
      });
    }
  }

  const total = rows * cols;
  const visited = new Array(total).fill(false);
  const stack: number[] = [];

  const start = 0;
  visited[start] = true;
  stack.push(start);

  const directions = [
    { dr: -1, dc: 0, from: "top", to: "bottom" },
    { dr: 0, dc: 1, from: "right", to: "left" },
    { dr: 1, dc: 0, from: "bottom", to: "top" },
    { dr: 0, dc: -1, from: "left", to: "right" },
  ] as const;

  while (stack.length) {
    const current = stack[stack.length - 1];
    const currentRow = Math.floor(current / cols);
    const currentCol = current % cols;

    const unvisitedNeighbors: number[] = [];
    const neighborDirs: (typeof directions)[number][] = [];

    directions.forEach((dir) => {
      const nextRow = currentRow + dir.dr;
      const nextCol = currentCol + dir.dc;
      if (nextRow < 0 || nextRow >= rows || nextCol < 0 || nextCol >= cols) {
        return;
      }
      const nextIndex = indexFromRowCol(nextRow, nextCol, cols);
      if (!visited[nextIndex]) {
        unvisitedNeighbors.push(nextIndex);
        neighborDirs.push(dir);
      }
    });

    if (!unvisitedNeighbors.length) {
      stack.pop();
      continue;
    }

    const pick = Math.floor(Math.random() * unvisitedNeighbors.length);
    const nextIndex = unvisitedNeighbors[pick];
    const dir = neighborDirs[pick];

    cells[current].walls[dir.from] = false;
    cells[nextIndex].walls[dir.to] = false;

    visited[nextIndex] = true;
    stack.push(nextIndex);
  }

  return { rows, cols, cells };
};

const buildSolveData = (
  maze: Maze,
  algorithm: "BFS" | "DFS"
): SolveData => {
  const { rows, cols, cells } = maze;
  const total = rows * cols;
  const visited = new Array(total).fill(false);
  const parent = new Array(total).fill(-1);
  const order: number[] = [];

  const start = 0;
  const target = total - 1;

  const getNeighbors = (index: number) => {
    const cell = cells[index];
    const neighbors: number[] = [];
    if (!cell.walls.top) {
      neighbors.push(index - cols);
    }
    if (!cell.walls.right) {
      neighbors.push(index + 1);
    }
    if (!cell.walls.bottom) {
      neighbors.push(index + cols);
    }
    if (!cell.walls.left) {
      neighbors.push(index - 1);
    }
    return neighbors;
  };

  if (algorithm === "BFS") {
    const queue: number[] = [start];
    visited[start] = true;

    while (queue.length) {
      const current = queue.shift();
      if (current === undefined) {
        break;
      }
      order.push(current);
      if (current === target) {
        break;
      }
      const neighbors = getNeighbors(current);
      neighbors.forEach((next) => {
        if (!visited[next]) {
          visited[next] = true;
          parent[next] = current;
          queue.push(next);
        }
      });
    }
  } else {
    const stack: number[] = [start];
    visited[start] = true;

    while (stack.length) {
      const current = stack.pop();
      if (current === undefined) {
        break;
      }
      order.push(current);
      if (current === target) {
        break;
      }
      const neighbors = getNeighbors(current);
      neighbors.reverse().forEach((next) => {
        if (!visited[next]) {
          visited[next] = true;
          parent[next] = current;
          stack.push(next);
        }
      });
    }
  }

  const path: number[] = [];
  if (visited[target]) {
    let current = target;
    while (current !== -1) {
      path.push(current);
      if (current === start) {
        break;
      }
      current = parent[current];
    }
    path.reverse();
  } else {
    path.push(start);
  }

  const visitRank = new Array(total).fill(-1);
  order.forEach((index, idx) => {
    visitRank[index] = idx;
  });

  const pathRank = new Array(total).fill(-1);
  path.forEach((index, idx) => {
    pathRank[index] = idx;
  });

  return {
    visitRank,
    pathRank,
    orderLength: order.length,
    pathLength: path.length,
  };
};

export default function Home() {
  const [maze, setMaze] = useState(() =>
    generateMaze(DEFAULT_ROWS, DEFAULT_COLS)
  );
  const [status, setStatus] = useState("Ready");
  const [algorithm, setAlgorithm] = useState<"BFS" | "DFS" | "None">(
    "None"
  );
  const [isSolving, setIsSolving] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const mazeRef = useRef(maze);
  const solveRef = useRef<SolveData | null>(null);
  const animationRef = useRef<number | null>(null);
  const progressRef = useRef({
    visited: 0,
    path: 0,
    phase: "idle",
    lastTime: 0,
  });
  const sizeRef = useRef({ width: 0, height: 0 });

  useEffect(() => {
    mazeRef.current = maze;
    drawFrame();
  }, [maze]);

  const stopAnimation = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    progressRef.current.phase = "idle";
    setIsSolving(false);
  };

  const resetSolve = () => {
    stopAnimation();
    solveRef.current = null;
    progressRef.current = { visited: 0, path: 0, phase: "idle", lastTime: 0 };
    setAlgorithm("None");
    setStatus("Ready");
    drawFrame();
  };

  const handleGenerate = () => {
    resetSolve();
    setMaze(generateMaze(DEFAULT_ROWS, DEFAULT_COLS));
    setStatus("Maze generated");
  };

  const animateSolve = (solveData: SolveData, label: "BFS" | "DFS") => {
    stopAnimation();
    solveRef.current = solveData;
    progressRef.current = {
      visited: 0,
      path: 0,
      phase: "explore",
      lastTime: 0,
    };
    setAlgorithm(label);
    setStatus(`Solving with ${label}`);
    setIsSolving(true);

    const speed = 90;
    const pathSpeed = 130;

    const tick = (time: number) => {
      const { phase } = progressRef.current;
      if (phase === "idle") {
        return;
      }

      const solve = solveRef.current;
      if (!solve) {
        return;
      }

      if (!progressRef.current.lastTime) {
        progressRef.current.lastTime = time;
      }
      const delta = (time - progressRef.current.lastTime) / 1000;
      progressRef.current.lastTime = time;

      if (phase === "explore") {
        progressRef.current.visited += delta * speed;
        if (progressRef.current.visited >= solve.orderLength - 1) {
          progressRef.current.visited = solve.orderLength - 1;
          progressRef.current.phase = "path";
        }
      }

      if (progressRef.current.phase === "path") {
        progressRef.current.path += delta * pathSpeed;
        if (progressRef.current.path >= solve.pathLength - 1) {
          progressRef.current.path = solve.pathLength - 1;
          progressRef.current.phase = "done";
          setStatus(`Solved with ${label}`);
          setIsSolving(false);
        }
      }

      drawFrame();

      if (progressRef.current.phase !== "done") {
        animationRef.current = requestAnimationFrame(tick);
      } else {
        animationRef.current = null;
        progressRef.current.phase = "idle";
      }
    };

    animationRef.current = requestAnimationFrame(tick);
  };

  const handleSolve = (label: "BFS" | "DFS") => {
    if (isSolving) {
      return;
    }
    const solveData = buildSolveData(mazeRef.current, label);
    animateSolve(solveData, label);
  };

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

    const { rows, cols, cells } = mazeRef.current;
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

  const mazeMeta = useMemo(
    () => `${maze.rows} x ${maze.cols}`,
    [maze.rows, maze.cols]
  );

  return (
    <div className="app">
      <div className="shell">
        <header className="header">
          <h1>Maze Solver</h1>
          <p>
            Generate a new maze, then watch BFS or DFS expand through the
            corridors until the path is revealed. Smooth, minimal, and
            deliberately dark.
          </p>
        </header>

        <div className="panel">
          <div className="controls">
            <button
              className="btn primary"
              onClick={handleGenerate}
              disabled={isSolving}
            >
              Generate Maze
            </button>
            <button
              className="btn"
              onClick={() => handleSolve("BFS")}
              disabled={isSolving}
            >
              BFS Search
            </button>
            <button
              className="btn"
              onClick={() => handleSolve("DFS")}
              disabled={isSolving}
            >
              DFS Search
            </button>
            <button className="btn ghost" onClick={resetSolve}>
              Reset
            </button>
          </div>

          <div className="status">
            <span>Status: {status}</span>
            <span>Algorithm: {algorithm}</span>
            <span>Maze: {mazeMeta}</span>
          </div>
        </div>

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
      </div>
    </div>
  );
}
