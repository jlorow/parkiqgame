# ParkIQ — Product Requirements Document

> **Hackathon:** Reddit Games With a Hook
> **Deploy target:** July 8, 2026 · Judging: July 15–16, 2026
> **Tech Stack:** Phaser 4 + React 18 + TypeScript + Vite + Devvit Web (Reddit) + Hono
> **Genre:** Linear puzzle progression (Honk-style) — NOT a daily/Wordle-style game

---

## Product Overview

**ParkIQ** is a driving puzzle game running inside Reddit as a Devvit Interactive Post. The player drives a car out of a tight parking scenario using on-screen controls. There is no daily gating, no calendar logic, no leaderboard, and no streak system. The core loop is pure linear progression, similar to Reddit games like Honk:

```
Load current puzzle
      ↓
Play
      ↓
Crash? → Instant restart (no menu, no scene change)
      ↓
Win?   → Unlock next puzzle → Load immediately
      ↓
(after puzzle 15) → Brief "You cleared all puzzles!" celebration → loop back to puzzle 1
```

**Retention hook:** "one more puzzle" compulsion loop — not "come back tomorrow."

---

## Target Audience

Car enthusiasts, learner drivers, and petrolheads aged 17–35 who consume driving content on social media, browsing Reddit casually.

---

## Current Gameplay Loop (implemented)

1. Player opens the Reddit Interactive Post → splash screen shows "Tap to Start"
2. Tap triggers expanded mode → `game.tsx` loads → fetch the player's current puzzle index (defaults to 1 for new players)
3. `PuzzleScene` loads the puzzle (player car, obstacles, bay lines, exit zone). **No timer.**
4. Player uses on-screen controls (forward/reverse/left/right) to drive toward the exit zone
5. **Collision:** particle burst at impact, `crunch.mp3` (300ms cooldown), car resets to spawn. **No menu, unlimited retries.**
6. **Exit reached:** `success.mp3`, POST progress, next puzzle loads immediately
7. **After puzzle 15:** celebration overlay, then loop back to puzzle 1

---

## Epic Build Order (Current State)

| Epic | Description | Status |
|------|-------------|--------|
| 1 | Game Renderer | ✅ Built, working |
| 2 | Puzzle Engine | ✅ Reworked (index-based) |
| 3 | Feedback System | ❌ Scrapped |
| 4 | Streak + Retention | ❌ Scrapped — replaced by Epic 9 |
| 5 | Share Card | ❌ Scrapped |
| 6 | Devvit Integration | ✅ Simplified fetch-based |
| 7 | Drive Mechanic | ✅ Built, working |
| 8 | Pixel Art Visual Style | ✅ Story 8-1 done |
| 9 | Linear Progression | ✅ Done — replaced Epic 4 |
| 10 | Visual Foundation & Rendering Architecture | ✅ Done |
| 11 | Theme Registry | ✅ Delivered |
| 12 | Car Geometry Rebuild | 🟡 Superseded by Epic 13 |
| 13 | Figma Hand-Drawn Asset Pipeline | ✅ SVG assets integrated |
| 14 | Layout & Presentation Polish | ✅ Audits completed |
| 15 | Gameplay Integrity & Movement | 🟡 4/5 stories done |

---

## What Is Scrapped

```
✗ WrongAnswerScene, CorrectScene, ResultScene — deleted
✗ AlreadyPlayedScene, LeaderboardScene — deleted
✗ Share card / clipboard mechanic
✗ Multiple choice quiz mechanic
✗ Quiz mechanic (correctAnswer, options, wrongPaths)
✗ Arcade physics on PlayerCar
✗ Wordle-style emoji share blocks
✗ postMessage bridge (using HTTP fetch instead)
✗ Daily puzzle rotation (getTodaysPuzzle, LAUNCH_DATE mod 15)
✗ Streak system (streak:{userId}, lastPlayed:{userId})
✗ Leaderboard (leaderboard:{date}, score:{date}:{userId})
✗ 60-second countdown timer / Time's Up!
✗ Calendar/serverDate-driven puzzle selection
```

---

## Detailed Epic Breakdown

### Epic 1 — Game Renderer
✅ Phaser 4 scene with parking grid, car sprites, basic layout.

### Epic 2 — Puzzle Engine
✅ Index-based `getPuzzleByIndex()`. 15 hand-authored puzzles.

### Epic 3 — Feedback System (SCRAPPED)

### Epic 4 — Streak + Retention (SCRAPPED)

### Epic 5 — Share Card (SCRAPPED)

### Epic 6 — Devvit Integration
✅ Simplified to `puzzleIndex:{userId}` via plain `fetch`.

### Epic 7 — Drive Mechanic
✅ Movement, collision, exit detection. No Arcade physics.

### Epic 8 — Pixel Art Visual Style
- **8-1:** ✅ `pixelArt: true`, SVG scaled 2.5x, bay lines 3px
- **8-2+:** DEFERRED (superseded by Epic 13)

### Epic 9 — Linear Progression
✅ Removes all streak/leaderboard/daily logic.
- **9-1:** Backend: `puzzleIndex:{userId}` key, removed old keys
- **9-2:** Engine: `getPuzzleByIndex(index)` with wraparound at 15
- **9-3:** Flow: remove timer, immediate next-puzzle load
- **9-4:** Celebration: "You cleared all puzzles!" overlay
- **9-5:** Delete LeaderboardScene and leaderboard UI

### Epic 10 — Visual Foundation & Rendering Architecture
✅ Restructured rendering, layout, UI. Four themes.
- **10.1:** Visual Layout Architecture
- **10.2:** Rendering Pipeline (single environment renderer)
- **10.3:** Movement Bounds (rotation-aware clamping)
- **10.4:** Environment Rendering (street, garage, underground, rooftop)
- **10.5:** Visual Polish (shadows, lighting, props)

### Epic 11 — Theme Registry
✅ Centralized colors in `ThemeRegistry.ts`.
- `THEME_GRID_COLORS`, `CARD_TINT`, `THEME_FLAT_COLORS`
- Wired into ParkingGrid, CarSprite, PuzzleScene, DrivingControls

### Epic 12 — Car Geometry Rebuild
🟡 Superseded by Epic 13.

### Epic 13 — Figma Hand-Drawn Asset Pipeline
✅ SVG assets: 6 car variants, 4 road tiles, props.

### Epic 14 — Layout & Presentation Polish
✅ 5 audit stories identifying layout inconsistencies.

### Epic 15 — Gameplay Integrity & Movement
🟡 4/5 stories done.

| Story | Status | Deliverable |
|-------|--------|-------------|
| 15.1 | ✅ | Playfield Boundary Enforcement |
| 15.2 | ✅ | Vehicle Collision Integrity |
| 15.3 | ✅ | Environmental Obstacle Collision |
| 15.4 | ✅ | Collision Response & Reset Behaviour |
| 15.5 | ⬜ | Gameplay Validation Pass (pending) |

**Story 15.4 fixes:**
- **Fix 1:** 300ms cooldown on crunch sound (prevents double-fire)
- **Fix 2:** `skipExitCheck` flag (prevents reset→win false positive)
- **Fix 3:** Particle burst replaces red overlay (20 particles, 600ms lifespan, additive blend)

---

## Collision Detection Spec

1. Compute candidate from input
2. Build `Phaser.Geom.Rectangle` (36×64 local) at candidate
3. For each non-pillar/non-wall obstacle, build its rect
4. `Rectangle.Overlaps()` — reject if any overlap
5. On overlap: particle burst → `crunch.mp3` (300ms cooldown) → reset to spawn

## Exit Zone Detection

- 96×96 `Phaser.Geom.Rectangle` in container-local coords
- On overlap: `success.mp3`, POST `/api/puzzle-complete`, next puzzle loads
- Puzzle 15 → overlay → wrap to puzzle 1
- Double-fire guard via `exited` flag

## API Endpoints

```
GET  /api/progress  → { userId, puzzleIndex }
POST /api/puzzle-complete  → body: { puzzleId } → writes puzzleIndex+1
DELETED: /api/leaderboard, /api/result-today
```

## Redis Keys

| Key | Purpose |
|-----|---------|
| `puzzleIndex:{userId}` | Current puzzle (1–15, wraps) |

All other keys removed.

---

## Layout Constants

| Constant | Value |
|----------|-------|
| Canvas | 390 × 844px |
| UNIT_PX | 48 |
| SCALE_X, SCALE_Y | 1.35, 1.53 |
| CONTAINER_X, Y | 1, -30 |
| CAR_W, CAR_H | 36, 64 |
| MOVE_SPEED | 120 px/s |
| ROTATION_SPEED | 90 deg/s |
| Grid | 6×6 cells (288×288px) |
| Controls center | 195, 690 |

---

## Build Commands

| Command | Purpose |
|---------|---------|
| `npm run type-check` | `tsc --build` |
| `npm run lint` | ESLint |
| `npm run build` | Vite build |
| `npm run dev` | Devvit playtest |
| `npm run deploy` | Type-check + lint + upload |
| `npm run launch` | Deploy + publish |
