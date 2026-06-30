# Repository Guidelines

Devvit web application (ParkIQ) running on Reddit.com. Server is a Hono REST API; client is React in an iframe.

---

## Product Overview

**ParkIQ** is a Wordle-style daily parking puzzle game built on Reddit's Devvit Web platform for the *Reddit Games With a Hook Hackathon* (deadline July 16, 2026). Players view a top-down parking scenario and pick the correct escape maneuver from 4 options (A/B/C/D) within a 60-second timer.

**Core gameplay loop:**
1. Player opens the Reddit Interactive Post → PuzzleScene loads today's parking diagram (top-down view with player car, obstacle cars, and bay lines)
2. Player taps one of 4 answer buttons to pick the escape direction
3. **Wrong answer:** collision animation plays (car moves into obstacle, impact starburst, shake), a one-line explanation appears, correct answer is revealed
4. **Correct answer:** 4-step swipeable card sequence shows the escape path with green arrows, then stat pills (answer, streak, time) and SHARE RESULT button appear
5. Player taps SHARE RESULT → a Wordle-style text card (puzzle number + 🟩/🟥 blocks + parkiq.app) is copied to clipboard for posting on Reddit/X/WhatsApp
6. On next visit, the "Already Played Today" screen shows streak and countdown to tomorrow's puzzle

**Target audience:** Car enthusiasts, learner drivers, and petrolheads aged 17–35 who consume driving content on social media.

**MVP success metric:** Day-7 retention ≥ 25%, measured via Devvit Redis streak data.

**Tech stack:** Phaser 4 (game rendering), React 18 (UI shell), TypeScript, Vite, Devvit Web (Reddit hosting + Redis), Hono (server routes).

---

## Epic Overview & Build Order

Epics must be built in this strict order (some overlap exists between epics 6 and 1):

```
EPIC 1: Game Renderer   ← build first, everything depends on it
EPIC 6: Devvit Integration ← Story 1 first (before Epic 1); Stories 2–3 after Epic 4
EPIC 2: Puzzle Engine    ← requires renderer + Devvit shell
EPIC 3: Feedback System  ← requires puzzle engine
EPIC 4: Streak + Retention ← requires Redis bridge from Epic 6 Story 2
EPIC 5: Share Card       ← requires feedback system + streak
```

### Epic 1 — Game Renderer
**Purpose:** Establish a working Phaser 4 game instance inside a React component that renders a mobile-sized canvas (390×844px) with the correct visual constants. All other epics render inside this shell.

| Story | Name | Summary |
|---|---|---|
| 1-1 | Phaser 4 Setup | Install Phaser 4, create `PhaserGame.tsx` wrapper, blank dark canvas renders in Reddit webview |
| 1-2 | Car Components | `CarSprite.ts` and `ObstacleCar.ts` — top-down geometric car shapes drawn with Phaser Graphics (no images) |
| 1-3 | Parking Grid | `ParkingGrid.ts` — renders road surface, bay lines, and pillars for 3 environment types (street, garage, open lot) |
| 1-4 | Scene Manager | 4 Phaser scenes registered (PuzzleScene, WrongAnswerScene, CorrectScene, ResultScene) with data-passing transitions |

### Epic 2 — Puzzle Engine
**Purpose:** Define the puzzle data schema, render any puzzle from JSON onto the game canvas, and determine which puzzle to show based on today's date.

| Story | Name | Summary |
|---|---|---|
| 2-1 | Puzzle Schema + Data | TypeScript interfaces + 15 hand-authored puzzles (5 parallel, 5 garage, 5 reverse bay) |
| 2-2 | Puzzle Renderer | `PuzzleScene.create()` renders diagram, question text, 60s countdown timer, and 4 answer buttons from puzzle JSON |
| 2-3 | Daily Rotation | `getTodaysPuzzle()` derives puzzle index from days since launch date (June 29, 2026) modulo 15 |

### Epic 3 — Feedback System
**Purpose:** Deliver the visceral wrong-answer collision animation and educational correct-answer step sequence that make ParkIQ memorable.

| Story | Name | Summary |
|---|---|---|
| 3-1 | Wrong Answer Animation | Car translates into obstacle (400ms), impact starburst (200ms), shake (200ms), then explanation card + correct answer pill |
| 3-2 | Correct Answer Steps | Green checkmark header, 4 swipeable cards with green arrows showing escape path, stat pills, SHARE RESULT button |
| 3-3 | Sound Effects | crunch.mp3 (collision), success.mp3 (escape), tick.mp3 (timer ≤10s) — all gated behind user gesture |

### Epic 4 — Streak + Retention
**Purpose:** Implement daily streak counter and leaderboard — the primary mechanic targeting the *Best Use of Retention Mechanics* prize ($3,000).

| Story | Name | Summary |
|---|---|---|
| 4-1 | Streak Logic | Read/write `streak:{userId}` and `lastPlayed:{userId}` in Devvit Redis; increment on next-day play, reset on skip |
| 4-2 | Daily Leaderboard | Score formula (100 base + 50 speed + 25 first-attempt), top-10 sorted set in Redis, highlighted user row |
| 4-3 | Already Played State | Skip puzzle if `lastPlayed === today`; show streak, countdown to midnight, and SHARE RESULT |

### Epic 5 — Share Card
**Purpose:** Generate a Wordle-style shareable text card — the primary viral growth mechanism.

| Story | Name | Summary |
|---|---|---|
| 5-1 | Share Card Generation | `generateShareText()` produces `ParkIQ #N + block row + parkiq.app`; mini diagram shows escape path only |
| 5-2 | Copy to Clipboard | `navigator.clipboard.writeText()`, "Copied! ✓" feedback, fallback selectable text overlay if blocked |

### Epic 6 — Devvit Integration
**Purpose:** Get ParkIQ running as a live Reddit Interactive Post with Devvit Redis for user identity and data persistence.

| Story | Name | Summary |
|---|---|---|
| 6-1 | Devvit Environment Setup | Node 22, Devvit CLI auth, React template, test subreddit, first Interactive Post — **must be done BEFORE Epic 1** |
| 6-2 | Redis + Message Bridge | Devvit backend reads/writes Redis (`streak:`, `lastPlayed:`, `score:`, `leaderboard:`, `result:` keys); postMessage bridge between backend and webview (USER_DATA, PUZZLE_COMPLETE, GET_LEADERBOARD) |
| 6-3 | Public Reddit Post | Production deploy, public subreddit, pinned Interactive Post, Devpost demo video — **done LAST** |

### Devvit/Reddit-Specific Integration Details

- **App name:** `parkiq` (≤16 chars in `devvit.yaml`)
- **Two entrypoints:** `splash.html` (inline/feed view, lightweight) and `game.html` (expanded view, Phaser lives here)
- **Client-server bridge:** `postMessage` between Devvit backend and React/Phaser webview — not fetch/TCP
  - Backend → webview: `USER_DATA` (userId, streak, lastPlayed, serverDate), `PUZZLE_COMPLETE_ACK`, `LEADERBOARD_DATA`
  - Webview → backend: `GET_USER_DATA`, `PUZZLE_COMPLETE` (timeTaken, wasCorrect, shareBlocks), `GET_LEADERBOARD`
- **Redis key patterns:** `streak:{userId}`, `lastPlayed:{userId}`, `score:{date}:{userId}`, `leaderboard:{date}` (sorted set), `result:{userId}:{date}`
- **User identity:** handled entirely by Devvit/Reddit context — no custom auth
- **Server date** passed from Devvit backend to webview to prevent device-clock spoofing of puzzle selection
- **Interactive Posts** are the game entry point in the Reddit feed; created via three-dots menu → "Make my experience post"
- **Canvas fallback:** Phaser renderer uses `Phaser.AUTO` (WebGL preferred, Canvas fallback) for Reddit Android webview compatibility
- **Devvit docs:** https://developers.reddit.com/docs/llms.txt

## Project Structure & Module Organization

- `/src/server`: Hono-based backend. `index.ts` mounts routes; `routes/api.ts` handles `/api/*` endpoints; `routes/menu.ts`, `forms.ts`, `triggers.ts` handle Devvit internal endpoints (`/internal/*`). Access `redis`, `reddit`, and `context` via `@devvit/web/server`.
- `/src/client`: React frontend. Two entrypoints registered in `devvit.json`:
  - `splash.html` → Inline view (feed). Keep lightweight — this is the first thing users see.
  - `game.html` → Expanded view. Heavy dependencies belong here.
- `/src/shared`: Type definitions shared between client and server (`api.ts`).
- Client-server communication: plain `fetch` calls from client to Hono routes. Shared types in `/src/shared` ensure consistency — no tRPC or RPC layer.

## Build, Test, and Development Commands

- `npm run dev` — Start playtest with Devvit (`devvit playtest ParkIQGame`)
- `npm run build` — Vite build
- `npm run deploy` — Type-check + lint + `devvit upload`
- `npm run launch` — Deploy + `devvit publish`
- `npm run type-check` — `tsc --build` (project references in `tools/tsconfig.*.json`)
- `npm run lint` — ESLint on `src/**/*.{ts,tsx}`
- `npm run prettier` — Prettier formatting

## Coding Style & Naming Conventions

- TypeScript strict mode (`tools/tsconfig.base.json`). Notable strict flags: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noUnusedLocals`, `noUnusedParameters`.
- ESLint enforces `@typescript-eslint/no-floating-promises: error`. All async calls must be awaited or explicitly voided.
- Prettier: single quotes, ES5 trailing commas.
- Prefer type aliases over interfaces. Prefer named exports over default exports. Never cast TypeScript types.
- When adding a new menu/form endpoint, register it in `devvit.json` under the appropriate mapping (menu items, forms, or triggers).

## Frontend Constraints (Devvit iframe)

- You may find code referencing blocks or `@devvit/public-api`. Do NOT use this — this project uses Devvit web only.
- Use `navigateTo` from `@devvit/web/client` instead of `window.location`.
- No `window.alert` — use `showToast` or `showForm` from `@devvit/web/client`.
- No geolocation, camera, microphone, or notification APIs.
- No inline `<script>` tags in HTML files — use separate `.ts` files.

## Commit & Pull Request Guidelines

Commits are single-line, concise. Dependency updates follow `Bump <package> from <old> to <new> (#PR)`. Manual commits are short and descriptive. PR numbers are included in parentheses at the end.

Devvit docs: https://developers.reddit.com/docs/llms.txt
