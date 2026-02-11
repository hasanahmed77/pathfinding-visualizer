"use client";

import { ControlPanel } from "@/components/ControlPanel";
import { MazeCanvas } from "@/components/MazeCanvas";
import { useMazeSolver } from "@/hooks/useMazeSolver";

export default function Home() {
  const {
    maze,
    status,
    algorithm,
    isSolving,
    solveRef,
    progressRef,
    drawRef,
    mazeMeta,
    handleGenerate,
    handleSolve,
    resetSolve,
  } = useMazeSolver();

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

        <ControlPanel
          status={status}
          algorithm={algorithm}
          mazeMeta={mazeMeta}
          isSolving={isSolving}
          onGenerate={handleGenerate}
          onSolve={handleSolve}
          onReset={resetSolve}
        />

        <MazeCanvas
          maze={maze}
          solveRef={solveRef}
          progressRef={progressRef}
          drawRef={drawRef}
        />
      </div>
    </div>
  );
}
