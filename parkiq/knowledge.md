# ParkIQ — Project Knowledge Base

> **Hackathon:** Reddit Games With a Hook — **Deadline:** July 16, 2026
> **Tech Stack:** Phaser 4 + React 18 + TypeScript + Vite + Devvit Web (Reddit) + Hono
> **MVP Success Metric:** Day-7 retention ≥ 25%

---

## Product Overview

**ParkIQ** is a Wordle-style daily parking puzzle game running inside Reddit as a Devvit Interactive Post. Players view a top-down parking scenario and pick the correct escape maneuver from 4 options (A/B/C/D) within a 60-second timer.

### Core Gameplay Loop
1. Player opens the Reddit Interactive Post → today's parking diagram loads (top-down view with player car, obstacle cars, bay lines)
2. Player taps one of 4 answer buttons to pick the escape direction
3. **Wrong answer:** collision animation (car moves into obstacle, impact starburst, shake), one-line explanation appears, correct answer revealed
4. **Correct answer:** 4-step swipeable card sequence shows escape path with green arrows, then stat pills (answer, streak, time) and SHARE RESULT button
5. Player taps SHARE RESULT → Wordle-style text card (puzzle # + 🟩/🟥 blocks + parkiq.app) copied to clipboard
6. On next visit: "Already Played Today" screen shows streak and countdown to tomorrow's puzzle

### Target Audience
Car enthusiasts, learner drivers, and petrolheads aged 17–35 who consume driving content on social media.

---

## Epic Build Order (Strict)

Epics must be built in this order (some overlap — Epic 6 Story 1 first, rest of Epic 6 after Epic 4):

```
EPIC 1: Game Renderer        ← build first, everything depends on it
EPIC 6: Devvit Integration   ← Story 1 first (before Epic 1); Stories 2–3 after Epic 4
EPIC 2: Puzzle Engine        ← requires renderer + Devvit shell
EPIC 3: Feedback System      ← requires puzzle engine
EPIC 4: Streak + Retention   ← requires Redis bridge from Epic 6 Story 2
EPIC 5: Share Card           ← requires feedback system + streak
```

### Epic 1 — Game Renderer
Establish Phaser 4 inside a React component at 390×844px.

| Story | Summary |
|---|---|
| 1-1 | Phaser 4 Setup — blank dark canvas in Reddit webview |
| 1-2 | Car Components — top-down geometric car shapes (no images) |
| 1-3 | Parking Grid — road, bay lines, pillars for 3 environments |
| 1-4 | Scene Manager — 4 Phaser scenes with data-passing transitions |

### Epic 2 — Puzzle Engine
Puzzle schema, JSON data, daily rotation.

| Story | Summary |
|---|---|
| 2-1 | Puzzle Schema + Data — TS interfaces + 15 hand-authored puzzles |
| 2-2 | Puzzle Renderer — diagram, question, 60s timer, 4 answer buttons |
| 2-3 | Daily Rotation — puzzle index = days since June 29, 2026 mod 15 |

### Epic 3 — Feedback System
Wrong-answer collision animation + correct-answer step sequence.

| Story | Summary |
|---|---|
| 3-1 | Wrong Answer — car→obstacle (400ms), impact (200ms), shake (200ms), explanation |
| 3-2 | Correct Answer — 4 swipeable cards with green arrows, stat pills, SHARE RESULT |
| 3-3 | Sound Effects — crunch.mp3, success.mp3, tick.mp3 (gated behind user gesture) |

### Epic 4 — Streak + Retention
Daily streak counter + leaderboard. Targets "Best Use of Retention Mechanics" prize ($3,000).

| Story | Summary |
|---|---|
| 4-1 | Streak Logic — Redis `streak:{userId}`, `lastPlayed:{userId}` |
| 4-2 | Leaderboard — score = 100 base + 50 speed + 25 first-attempt, top-10 sorted set |
| 4-3 | Already Played — skip puzzle if played today, show streak + countdown |

### Epic 5 — Share Card
Wordle-style shareable text card (viral growth mechanism).

| Story | Summary |
|---|---|
| 5-1 | Share Card Generation — `generateShareText()` produces formatted text |
| 5-2 | Copy to Clipboard — `navigator.clipboard.writeText()`, "Copied! ✓" feedback |

### Epic 6 — Devvit Integration
Get ParkIQ running as a live Reddit Interactive Post.

| Story | Summary |
|---|---|
| 6-1 | Devvit Setup — Node 22, CLI auth, template, test subreddit — **done BEFORE Epic 1** |
| 6-2 | Redis + Message Bridge — postMessage bridge, Redis read/write — after Epic 3 |
| 6-3 | Public Post — production deploy, public subreddit, Devpost video — **done LAST** |

---

## Project Structure

```
parkiq/
├── devvit.json              # Devvit app config (name ≤16 chars)
├── package.json
├── vite.config.ts
├── eslint.config.js
├── tsconfig.json
├── src/
│   ├── client/              # React frontend
│   │   ├── splash.html      # Inline/feed view entry
│   │   ├── splash.tsx       # Splash screen React component
│   │   ├── game.html        # Expanded view entry (Phaser lives here)
│   │   ├── game.tsx         # Game React component
│   │   ├── index.css        # Global styles (Tailwind)
│   │   ├── global.ts        # Global type/config constants
│   │   └── hooks/           # React hooks
│   ├── server/              # Hono backend
│   │   ├── index.ts         # Server entry point
│   │   ├── core/post.ts     # Post core logic
│   │   └── routes/          # Route handlers
│   │       ├── api.ts       # /api/* endpoints
│   │       ├── menu.ts      # Internal menu endpoints
│   │       ├── forms.ts     # Internal form endpoints
│   │       └── triggers.ts  # Internal trigger endpoints
│   └── shared/
│       └── api.ts           # Shared types between client/server
├── tools/                   # TypeScript project references
│   ├── tsconfig.base.json
│   ├── tsconfig.client.json
│   ├── tsconfig.server.json
│   ├── tsconfig.shared.json
│   └── tsconfig.vite.json
└── docs/                    # PRD, epics, tech specs
```

### Entrypoint Architecture (devvit.json)
- **`post.entrypoints.default`** → `splash.html` (inline/feed view, lightweight)
- **`post.entrypoints.game`** → `game.html` (expanded view, heavy deps)
- **`server.entry`** → `dist/server/index.cjs`
- **Menu items:** registered under `menu.items` with internal endpoints
- **Forms/Triggers:** registered under `forms` and `triggers` objects

### Client-Server Communication
- Plain `fetch` calls from client to Hono routes (no tRPC/RPC layer)
- Shared types in `/src/shared/api.ts` ensure consistency
- Devvit also uses a `postMessage` bridge between backend and webview for:
  - `USER_DATA` (userId, streak, lastPlayed, serverDate)
  - `PUZZLE_COMPLETE` (timeTaken, wasCorrect, shareBlocks)
  - `GET_LEADERBOARD` / `LEADERBOARD_DATA`

---

## Devvit/Reddit-Specific Rules

- **App name** ≤16 characters (`parkiqgame` in devvit.json)
- Use `navigateTo` from `@devvit/web/client` instead of `window.location`
- No `window.alert` — use `showToast` or `showForm` from `@devvit/web/client`
- No geolocation, camera, microphone, or notification APIs
- No inline `<script>` tags in HTML — use separate `.ts`/`.tsx` files
- This project uses **Devvit Web only** — do NOT use `@devvit/public-api` or blocks

### Redis Key Patterns
| Key | Type | Purpose |
|---|---|---|
| `streak:{userId}` | integer | Current streak count |
| `lastPlayed:{userId}` | ISO date | Last puzzle completion |
| `score:{date}:{userId}` | integer | Daily score |
| `leaderboard:{date}` | sorted set | Daily top 10 |
| `result:{userId}:{date}` | JSON string | Share blocks |

---

## Coding Standards

### TypeScript Config (strict mode)
- `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noUnusedLocals`, `noUnusedParameters`
- Project references in `tools/tsconfig.*.json`

### ESLint
- `@typescript-eslint/no-floating-promises: error` — all async calls must be awaited or explicitly voided
- Lint with: `npm run lint`

### Prettier
- Single quotes, ES5 trailing commas
- Format with: `npm run prettier`

### Naming & Style
- Prefer **type aliases** over interfaces
- Prefer **named exports** over default exports
- **Never** cast TypeScript types (no `as any`)
- When adding a new menu/form endpoint, register it in `devvit.json`

### Phaser 4 Config
```typescript
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,       // WebGL preferred, Canvas fallback
  width: 390,              // Mobile-first
  height: 844,
  backgroundColor: '#0F0F0F',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
}
```

### Visual Constants
```typescript
COLORS = {
  background: '#0F0F0F',  playerCar: '#E8320A',  obstacleCar: '#6B7280',
  exitZone: '#22C55E',    wrongPath: '#EF4444',  correctPath: '#22C55E',
  bayLines: '#FFFFFF',    pillar: '#1F2937',     uiAccent: '#E8320A',
  textPrimary: '#FFFFFF', textMuted: '#6B7280',  cardBg: '#1C1C1E',  buttonBg: '#2A2A2A',
}
GRID = { unitPx: 48,  carWidth: 2,  carLength: 4,  bayWidth: 2.5,  bayLength: 5 }
```

---

## Build, Test & Dev Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start playtest with Devvit |
| `npm run build` | Vite build |
| `npm run type-check` | `tsc --build` (project references) |
| `npm run lint` | ESLint on `src/**/*.{ts,tsx}` |
| `npm run prettier` | Prettier formatting |
| `npm run deploy` | Type-check + lint + `devvit upload` |
| `npm run launch` | Deploy + `devvit publish` |

---

## Commit & PR Guidelines

- Commits are single-line and concise
- Dependency updates: `Bump <package> from <old> to <new> (#PR)`
- Manual commits: short and descriptive
- PR numbers included in parentheses at end

---

## Definition of Done (mandatory per story)
A story is NOT complete until:
1. Every IPC/API handler referenced is implemented with real logic — not a stub, not mock data
2. The screen's data comes from an actual upstream source — never a hardcoded placeholder
3. The relevant test case has been run and the ACTUAL output is pasted — not "this should work"
4. If something can't be fully implemented this pass, the screen must show "Not yet implemented" — never fake success

## Sequencing Rule
Implement and verify one story at a time. Do not start the next until the current one's Definition of Done is explicitly confirmed. If asked to "build all screens," stop and ask for confirmation before skipping verification.

## Reporting Requirement
End every story with:
VERIFIED:
- Handler(s) touched: [list]
- Real data source confirmed: [yes/no + how]
- Test run: [what you actually ran]
- Result: [actual output, not assumption]



## Out of Scope (MVP)

- AI puzzle generation (Claude API)
- User-submitted scenarios
- Premium / payments / push notifications
- Standalone PWA / Next.js build
- Supabase or any external database
- Admin dashboard
- Trailer / forklift / large vehicle types
- WebGL-only rendering (Canvas fallback required)
- Multiplayer or real-time features

---

## Key Links

- Devvit docs: https://developers.reddit.com/docs/llms.txt
- Devvit template: https://github.com/reddit/devvit-template-react
- Launch date (puzzle index base): **June 29, 2026**
