import type { Algorithm } from "@/lib/types";

type ControlPanelProps = {
  status: string;
  algorithm: Algorithm | "None";
  mazeMeta: string;
  isSolving: boolean;
  onGenerate: () => void;
  onSolve: (algorithm: Algorithm) => void;
  onReset: () => void;
};

export const ControlPanel = ({
  status,
  algorithm,
  mazeMeta,
  isSolving,
  onGenerate,
  onSolve,
  onReset,
}: ControlPanelProps) => {
  return (
    <div className="panel">
      <div className="controls">
        <button className="btn primary" onClick={onGenerate} disabled={isSolving}>
          Generate Maze
        </button>
        <button className="btn" onClick={() => onSolve("BFS")} disabled={isSolving}>
          BFS Search
        </button>
        <button className="btn" onClick={() => onSolve("DFS")} disabled={isSolving}>
          DFS Search
        </button>
        <button className="btn ghost" onClick={onReset}>
          Reset
        </button>
      </div>

      <div className="status">
        <span>Status: {status}</span>
        <span>Algorithm: {algorithm}</span>
        <span>Maze: {mazeMeta}</span>
      </div>
    </div>
  );
};
