"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Algorithm, Maze, MazeStatus, SolveData } from "@/lib/types";
import {
  buildSolveData,
  DEFAULT_COLS,
  DEFAULT_ROWS,
  generateMaze,
} from "@/lib/maze";

const DEFAULT_STATUS: MazeStatus = "Ready";

type Phase = "idle" | "explore" | "path" | "done";

type Progress = {
  visited: number;
  path: number;
  phase: Phase;
  lastTime: number;
};

export const useMazeSolver = () => {
  const [maze, setMaze] = useState<Maze>(() =>
    generateMaze(DEFAULT_ROWS, DEFAULT_COLS)
  );
  const [status, setStatus] = useState<MazeStatus>(DEFAULT_STATUS);
  const [algorithm, setAlgorithm] = useState<Algorithm | "None">("None");
  const [isSolving, setIsSolving] = useState(false);

  const mazeRef = useRef(maze);
  const solveRef = useRef<SolveData | null>(null);
  const animationRef = useRef<number | null>(null);
  const progressRef = useRef<Progress>({
    visited: 0,
    path: 0,
    phase: "idle",
    lastTime: 0,
  });
  const drawRef = useRef<() => void>(() => {});

  useEffect(() => {
    mazeRef.current = maze;
    drawRef.current();
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
    setStatus(DEFAULT_STATUS);
    drawRef.current();
  };

  const handleGenerate = () => {
    resetSolve();
    setMaze(generateMaze(DEFAULT_ROWS, DEFAULT_COLS));
    setStatus("Maze generated");
  };

  const handleSolve = (label: Algorithm) => {
    if (isSolving) {
      return;
    }
    const solveData = buildSolveData(mazeRef.current, label);
    animateSolve(solveData, label);
  };

  const animateSolve = (solveData: SolveData, label: Algorithm) => {
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

      drawRef.current();

      if (progressRef.current.phase !== "done") {
        animationRef.current = requestAnimationFrame(tick);
      } else {
        animationRef.current = null;
        progressRef.current.phase = "idle";
      }
    };

    animationRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    return () => {
      stopAnimation();
    };
  }, []);

  const mazeMeta = useMemo(
    () => `${maze.rows} x ${maze.cols}`,
    [maze.rows, maze.cols]
  );

  return {
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
  };
};
