# 🔷 ShapeSwifter

**Transform. Solve. Compete. Daily.**

A daily shape transformation puzzle game built for the Reddit Daily Games Hackathon 2026.

## 🎮 How to Play

1. **Goal**: Transform the START shape to match the TARGET shape
2. **Transforms**: Use the available transformation buttons:
   - ↻ / ↺ — Rotate clockwise/counter-clockwise (90°)
   - ⇆ / ⇅ — Flip horizontally/vertically
   - ⊕ / ⊖ — Scale up (25%) / down (20%)
   - 🎨 — Cycle through colors
3. **Undo**: Free undo - doesn't count as a move
4. **Win**: Match all properties (rotation, scale, flip state, color)

## ⭐ Scoring

- **Base Score**: 1000 points
- **Move Penalty**: -50 points per move over optimal
- **Time Penalty**: -1 point per second after 30 seconds
- **Stars**:
  - ⭐⭐⭐ Perfect - solved in optimal moves
  - ⭐⭐ Good - solved in optimal + 2 moves or less
  - ⭐ Complete - puzzle solved

## 🔥 Features

- **Daily Puzzle**: Same puzzle for everyone each day (seeded by date)
- **Streak Tracking**: Keep your streak alive!
- **Leaderboard**: Compete with other Redditors
- **Share**: Share your results with emoji summary

## 🛠 Tech Stack

- **Client**: React 18, TypeScript, Vite, HTML5 Canvas
- **Server**: Express, Devvit API
- **Storage**: Redis (puzzles, scores, leaderboards)
- **Styling**: Tailwind CSS + custom CSS

## 📁 Project Structure

```
src/
├── client/                 # React app (Vite + TypeScript)
│   └── game/
│       ├── App.tsx         # Main game component
│       ├── components/     # UI components
│       ├── gameLogic.ts    # Game logic, transforms, scoring
│       ├── ShapeCanvas.tsx # Canvas-based shape rendering
│       ├── useGameState.ts # Game state management hook
│       └── styles.css      # Game styles
├── server/                 # Devvit backend (Express)
│   ├── index.ts            # API routes, Redis, puzzle generation
│   └── core/post.ts        # Custom post creation
└── shared/
    └── types/api.ts        # Shared TypeScript types
```

## 🚀 Getting Started

> Make sure you have Node 22 downloaded on your machine!

1. `npm install`
2. `npm run dev` — Start development server with live reload
3. Follow the Devvit playtest instructions to see the game on Reddit

## 📦 Commands

- `npm run dev` — Development server with live reload
- `npm run build` — Build client and server
- `npm run deploy` — Upload new version
- `npm run launch` — Publish for review
- `npm run check` — Type check, lint, and format

## 🏆 Hackathon

Built for the [Reddit Daily Games Hackathon 2026](https://redditdailygames2026.devpost.com/)

---

*Made with ❤️ for Reddit*
