export type Walls = {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
};

export type Cell = {
  row: number;
  col: number;
  walls: Walls;
};

export type Maze = {
  rows: number;
  cols: number;
  cells: Cell[];
};

export type SolveData = {
  visitRank: number[];
  pathRank: number[];
  orderLength: number;
  pathLength: number;
};

export type Algorithm = "BFS" | "DFS";

export type MazeStatus = "Ready" | "Maze generated" | `Solving with ${Algorithm}` | `Solved with ${Algorithm}`;
