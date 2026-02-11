import type { Algorithm, Maze, SolveData } from "./types";

export const DEFAULT_ROWS = 23;
export const DEFAULT_COLS = 41;

export const COLORS = {
  background: "#000000",
  wall: "#1f1f1f",
  visited: "rgba(22, 242, 178, 0.35)",
  path: "rgba(246, 178, 58, 0.85)",
  start: "#22c55e",
  end: "#ff4d5e",
} as const;

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const indexFromRowCol = (row: number, col: number, cols: number) =>
  row * cols + col;

export const generateMaze = (rows: number, cols: number): Maze => {
  const cells = Array.from({ length: rows * cols }, (_, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    return {
      row,
      col,
      walls: { top: true, right: true, bottom: true, left: true },
    };
  });

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

export const buildSolveData = (maze: Maze, algorithm: Algorithm): SolveData => {
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
