# Maze Solver

A minimal, black‑theme maze solver built with Next.js. It generates a random maze and animates BFS or DFS as they explore and solve the path.

## Features
- Random maze generation (recursive backtracking)
- BFS and DFS visualizations with smooth animation
- Canvas-based rendering for crisp, fast drawing
- Clean, modular architecture (components, hooks, lib)

## Tech Stack
- Next.js (App Router)
- React + TypeScript
- Tailwind (used for base setup, custom CSS for styling)

## Getting Started
```bash
npm install
npm run dev
```

Open `http://localhost:3000` to view the app.

## Project Structure
- `src/app/page.tsx` – Page entry
- `src/components` – UI components
- `src/hooks` – State + animation logic
- `src/lib` – Maze algorithms and types

## Controls
- **Generate Maze**: creates a new random maze
- **BFS Search** / **DFS Search**: runs and animates the algorithm
- **Reset**: clears the current visualization state
