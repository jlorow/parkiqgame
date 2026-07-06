# ParkIQ — Project Knowledge Base

> **Hackathon:** Reddit Games With a Hook — **Deploy target: July 8, 2026 · Judging: July 15–16, 2026**
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
Win? → Unlock next puzzle → Load immediately
      ↓
(after puzzle 15) → Brief "You cleared all puzzles!" celebration → loop back to puzzle 1
```

**Retention hook:** "one more puzzle" compulsion loop — not "come back tomorrow."

### Core Gameplay Loop (current — authoritative)
1. Player opens the Reddit Interactive Post → splash screen shows "Tap to Start"
2. Tap triggers expanded mode → `game.tsx` loads → fetch the player's current puzzle index (defaults to 1 for new players)
3. PuzzleScene loads the puzzle at that index (player car, static obstacle cars, bay lines, green exit zone). **No timer.**
4. Player uses on-screen controls (forward/reverse/left/right) to drive toward the exit zone without hitting obstacles
5. **Collision** (car overlaps an obstacle): car instantly reverts to its previous position, `crunch.mp3` plays (try/catch guarded), screen flashes red briefly, car resets to spawn position. **No scene change, no menu, unlimited instant retries.**
6. **Exit zone reached:** `success.mp3` plays, the backend records progress (`puzzleIndex + 1`), and the **next puzzle loads immediately in the same flow** — no lock screen, no "already played" gate, no waiting.
7. **After puzzle 15:** show a brief "You cleared all puzzles!" celebration, then loop back to puzzle 1 (index wraps: `(index % 15) + 1` or equivalent). This keeps the game evergreen for repeat play.

### Target Audience
Car enthusiasts, learner drivers, and petrolheads aged 17–35 who consume driving content on social media, browsing Reddit casually.

---

## What Is Scrapped — Do Not Build or Reference

```
✗ WrongAnswerScene — deleted
✗ CorrectScene — deleted
✗ ResultScene — deleted
✗ AlreadyPlayedScene — deleted (no daily gate to show)
✗ LeaderboardScene — deleted (no leaderboard)
✗ Share card / clipboard mechanic
✗ Multiple choice A/B/C/D answer buttons
✗ Quiz mechanic of any kind (correctAnswer, options, wrongPaths, AnswerOption type)
✗ Arcade physics on PlayerCar (no physics engine at all)
✗ Wordle-style emoji share blocks
✗ postMessage bridge (using HTTP fetch instead)
✗ Daily puzzle rotation (getTodaysPuzzle(serverDate), LAUNCH_DATE mod 15 logic)
✗ Streak system (streak:{userId}, lastPlayed:{userId})
✗ Leaderboard (leaderboard:{date}, score:{date}:{userId}, result:{userId}:{date})
✗ 60-second countdown timer / "Time's Up!" failure state
✗ Calendar/serverDate-driven puzzle selection of any kind
```

If any epic/story description elsewhere implies rebuilding one of the above, that description is stale — follow this list instead.

---

## Epic Build Order (Strict)

```
EPIC 1: Game Renderer          ← built, working
EPIC 6: Devvit Integration     ← Story 1 done; Story 2 simplified (see below)
EPIC 2: Puzzle Engine          ← rework in progress (index-based, not date-based)
EPIC 7: Drive Mechanic         ← built, working (movement/collision/exit detection)
EPIC 9: Linear Progression     ← done — replaced Epic 4 entirely
EPIC 8: Pixel Art Visual Style ← Story 8-1 done, rest deferred into Epic 10
EPIC 10: Visual Foundation & Rendering Architecture ← CURRENT FOCUS
```

*(Epic 3 "Feedback System" and Epic 5 "Share Card" were already fully superseded — see "What Is Scrapped." Epic 4 "Streak + Retention" is now fully removed, replaced by Epic 9.)*

### Epic 9 — Linear Progression (replaces Epic 4)
| Story | Summary |
|---|---|
| 9-1 | Backend simplification — remove streak/leaderboard/daily Redis keys and endpoints, add `puzzleIndex:{userId}` |
| 9-2 | Puzzle engine rework — replace `getTodaysPuzzle(serverDate)` with `getPuzzleByIndex(index)`, add wraparound at 15 |
| 9-3 | Scene flow rewire — remove timer, remove AlreadyPlayedScene routing, wire win → immediate next-puzzle load in PuzzleScene |
| 9-4 | Completion celebration — brief "You cleared all puzzles!" screen after puzzle 15, then loop to puzzle 1 |
| 9-5 | Delete LeaderboardScene and all leaderboard UI/entry points (e.g. any HUD icon linking to it) |

### Epic 10 — Visual Foundation & Rendering Architecture
**Goal:** Bring ParkIQ's gameplay presentation in line with the approved visual mockups by restructuring rendering architecture, layout, and UI, while preserving all gameplay mechanics and puzzle geometry.

**Non-Goals (do NOT touch under this epic):** gameplay logic, puzzle JSON, collision hitbox sizes, UNIT_PX, or any verified puzzle-data.ts geometry; driving mechanics (movement formulas, rotation speed, etc.)

**Confirmed findings from the architecture audit already run (do not re-audit from scratch — build on these):**
1. **Real gameplay bug**: `checkCollision()` only tests obstacle rectangles — there is NO boundary/edge check against the grid or playfield. The player car can currently be driven straight out of the parking lot into the HUD/controls. Fix under Story 10.3.
2. Street theme draws trees twice (once in `ParkingGrid.ts`, once in `PuzzleScene.ts`'s `foreGfx`) — duplicate, uncoordinated, cosmetic-only.
3. Playfield occupies only ~46% of the vertical screen; ~21% is confirmed unused empty space below the controls.
4. Theme visuals are split across three uncoordinated locations (`renderThemeEnvironment` full-screen backdrop, `foreGfx` in `renderParkingScene`, `drawThemeDecorations` in `ParkingGrid.ts`) with no shared palette constants.
5. `DrivingControls` is not a Phaser Container — drawn at absolute scene coordinates, can't be repositioned/scaled as a unit.
6. Known layout metrics (reference, don't re-derive): canvas 390×844; container origin (1,52) scaled 1.35×; grid 288×288 unscaled (388.8×388.8 on screen); card ~y46–447; controls centered at (195,590); ~176px unused below controls.
7. **Zoom ceiling is mathematically capped, confirmed during Story 10.1**: the grid already renders at 388.8-389.8px on a 390px-wide canvas (0.05-1% margin). Any zoom beyond ~1% clips real gameplay content (obstacles/road surface in the rightmost column) — confirmed via exact pixel math, not assumption. The "feels zoomed out / less tense" complaint from visual review CANNOT be solved by scaling the grid further, regardless of implementation technique (container scale, camera zoom, or otherwise) — the constraint is the fixed 390px canvas width, not the scaling method. Story 10.4/10.5 must solve this through environment density (surrounding decoration, tighter visual spacing illusions, thinner lines) rather than raw scale.

| Story | Goal | Deliverables |
|---|---|---|
| 10.1 | Visual Layout Architecture | New playfield proportions (target playfield ≥70% of vertical screen), HUD sizing, control positioning, card sizing, spacing, eliminate unused dead space. No art/texture changes yet. |
| 10.2 | Rendering Pipeline | Merge the three uncoordinated theme-drawing locations into one single environment renderer, one draw order, one owner per visual element. |
| 10.3 | Movement Bounds | Add real boundary clamping so the player car can never leave the playfield — fixes the confirmed bug above. Visible playfield boundary must exactly match the gameplay boundary. |
| 10.4 | Environment Rendering | Replace the flat parking-lot-as-entire-scene approach with believable themed locations where the parking area sits inside a larger environment, not the other way around. |
| 10.5 | Visual Polish | Shadows, lighting, props, exit styling, final theme detail pass. |

Sequence strictly in this order (Sequencing Rule applies per-story within this epic too).

### Epic 2 — Puzzle Engine (revised)
| Story | Summary |
|---|---|
| 2-1 | Puzzle Schema + Data — TS types + 15 hand-authored puzzles with real `col/row/angle/exitZone` geometry (content-authoring task, still pending) |
| 2-2 | Puzzle Renderer — diagram + driving controls (no timer UI) |
| 2-3 | ~~Daily Rotation~~ → superseded by Epic 9-2's index-based selection |

### Epic 6 — Devvit Integration (revised)
| Story | Summary |
|---|---|
| 6-1 | Devvit Setup — done |
| 6-2 | Redis + HTTP Bridge — simplified to a single `puzzleIndex:{userId}` read/write via plain `fetch` calls (no postMessage bridge, no streak/leaderboard writes) |
| 6-3 | Public Post — production deploy, public subreddit, Devpost video — done LAST |

### Epic 7 — Drive Mechanic (unchanged, already working)
Movement, collision detection, and exit-zone detection are already built and verified — see Movement/Collision specs below. Only the *consequence* of reaching the exit zone changes under Epic 9 (immediate next puzzle instead of a lock screen).

### Epic 8 — Pixel Art Visual Style (Story 8-1 DONE, rest deferred)
| Story | Summary |
|---|---|
| 8-1 | ✅ DONE — `pixelArt: true`, SVG scaled to 2.5x, bay lines 3px, obstacle cars now correctly sized to match player car. Note: this is config-only — the car still reads as an aliased vector shape, not genuine hand-drawn pixel art, since `pixelArt: true` disables smoothing but doesn't redraw the asset. |
| 8-2+ | DEFERRED — real pixel-art sprite assets (car, tiles) needed for the actual visual style from the reference mood images. Revisit after other epics/content work are complete, time permitting before deploy. |

---

## Project Structure

```
parkiq/
├── devvit.json
├── package.json
├── vite.config.ts
├── src/
│   ├── client/
│   │   ├── splash.html / splash.tsx   # "Tap to Start"
│   │   ├── game.html / game.tsx       # Phaser mounts here
│   │   ├── index.css / global.ts
│   │   └── hooks/
│   ├── server/
│   │   ├── index.ts
│   │   └── routes/api.ts              # SIMPLIFIED — see API Endpoints below
│   ├── shared/api.ts
│   ├── lib/
│   │   ├── puzzle-engine.ts           # getPuzzleByIndex(), wraparound logic
│   │   └── devvit-client.ts           # fetch helpers
│   └── game/
│       ├── PhaserGame.tsx
│       ├── components/
│       │   ├── CarSprite.ts           # obstacle cars — unchanged
│       │   ├── ObstacleCar.ts         # unchanged
│       │   └── ParkingGrid.ts         # unchanged
│       ├── scenes/
│       │   └── PuzzleScene.ts         # ONLY remaining scene — everything happens here
│       │       (AlreadyPlayedScene.ts and LeaderboardScene.ts are DELETED under Epic 9)
│       └── puzzles/
│           ├── puzzle-types.ts
│           └── puzzle-data.ts
└── public/assets/{sprites,sounds}/
```

### Client-Server Communication
Plain `fetch` calls only — no postMessage bridge, no tRPC/RPC layer.

---

## API Endpoints (revised — Epic 9)

```
GET  /api/progress
  → { userId, puzzleIndex }
  (replaces /api/user-data; drop serverDate entirely — no longer needed)

POST /api/puzzle-complete
  → body: { puzzleId: number }
  → writes: puzzleIndex:{userId} = puzzleId + 1 (wrap to 1 if puzzleId was 15)
  → returns: { puzzleIndex }

DELETE (no longer exist):
  ✗ /api/leaderboard
  ✗ /api/result-today
```

### Redis Key Patterns (revised)
| Key | Type | Purpose |
|---|---|---|
| `puzzleIndex:{userId}` | integer | The puzzle the player should currently see (1–15, wraps) |

All other keys (`streak:*`, `lastPlayed:*`, `score:*`, `leaderboard:*`, `result:*`) are removed.

---

## Devvit/Reddit-Specific Rules
- App name ≤16 characters (`parkiqgame`)
- Use `navigateTo` from `@devvit/web/client` instead of `window.location`
- No `window.alert` — use Phaser text overlays
- No geolocation, camera, microphone, or notification APIs
- No inline `<script>` tags in HTML
- **Devvit Web only** — do NOT use `@devvit/public-api` or blocks
- Audio/Clipboard APIs require a user gesture — wrap audio in try/catch, never crash on failure

---

## Critical Phaser 4 API Rules

```
REMOVED in Phaser 4 — will crash if used:
✗ setTintFill() → use: setTint(c).setTintMode(Phaser.TintModes.FILL)
✗ GeometryMask → use: Mask Filter or Stencil container
✗ Arcade Physics on PlayerCar → we use direct image translation only, no physics engine

COORDINATE SYSTEM FOR GRAPHICS:
Always: scene.add.graphics({ x, y }), then draw in LOCAL coords from (0,0)
NEVER mix absolute canvas coords with local draw calls

TINTING SVG:
this.load.svg('car', 'assets/sprites/car-top-down.svg', { width: 32, height: 64 })
const img = scene.add.image(x, y, 'car')
img.setTint(0xE8320A).setTintMode(Phaser.TintModes.FILL)
img.setScale(2.5)
```

### Phaser Game Config
```typescript
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 390,
  height: 844,
  backgroundColor: '#0F0F0F',
  pixelArt: true,           // Epic 8
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
}
```
Note: the mount container has aspect-ratio-constrained CSS (`min(100vw, calc(100vh * 390/844))`, flex-centered) — do not revert this when touching the Phaser config.

---

## Visual Constants

```typescript
COLORS = {
  background:  '#0F0F0F',
  playerCar:   '#E8320A',
  obstacleCar: '#6B7280',
  exitZone:    '#22C55E',
  bayLines:    '#FFFFFF',
  pillar:      '#1F2937',
  uiAccent:    '#E8320A',
  textPrimary: '#FFFFFF',
  textMuted:   '#6B7280',
  cardBg:      '#1C1C1E',
  buttonBg:    '#2A2A2A',
}

GRID = { unitPx: 48, carWidth: 1.5, carLength: 3, bayWidth: 2.5, bayLength: 5 }
```
Note: `carWidth`/`carLength` corrected to match the verified 72×144px collision hitbox (72/48=1.5, 144/48=3). An earlier version of this file stated `carWidth: 2, carLength: 4`, which was wrong and contradicted the actual collision code — see Car Footprint note below.

### Environment Theming
```
street:      road #1C1C1E, lines #FFFFFF, pillar #1F2937
garage:      road #111827, lines #FBBF24 (yellow), pillar #374151
rooftop:     road #D1D5DB (light concrete), lines #FFFFFF, pillar #9CA3AF
underground: road #0F172A (very dark), lines #E8320A (red warning), pillar #1E293B
```

---

## Grid Coordinate System (authoritative — verified against live code)

```
Grid size:    288 × 288px = 6 columns × 6 rows, 48px per unit — verified correct
Container:    positioned at (CONTAINER_X=1, CONTAINER_Y=52) in scene-root pixels,
              scaled by CONTAINER_SCALE=1.35
Offsets:      CONTAINER_OFFSET_X=1, CONTAINER_OFFSET_Y=2 (grid-unit offsets,
              added before multiplying by UNIT_PX — NOT scene-root pixel offsets)
UNIT_PX:      48

Conversion (grid col/row → container-local pixel, cell top-left reference):
  pixelX = (col + CONTAINER_OFFSET_X) * UNIT_PX
  pixelY = (row + CONTAINER_OFFSET_Y) * UNIT_PX

Columns: 0–5 (left to right) · Rows: 0–5 (top to bottom, Row 0 = top/near exit usually)
```

⚠️ This replaces an earlier incorrect version of this section that stated an absolute origin of `(51, 120)` with a `+24` cell-center adjustment — that formula was never real, it was written during a documentation merge without checking the actual code. The formula above is the real one, verified directly against `PuzzleScene.ts`.

All car, obstacle, and exit zone positions in puzzle JSON use grid units (col/row), never raw pixels. All game objects (player car, obstacles, grid) share one container-local coordinate space via the formula above — no world-to-local conversion needed anywhere.

### Car Footprint (authoritative — verified against live collision code)
```
CAR_W = 72px, CAR_H = 144px  (the ONLY correct value — used by collision,
                               and now matched exactly by the visual sprite scale)
In grid units: 1.5 columns wide, 3 rows long
```
⚠️ The car is **1.5 grid columns wide**, not a clean whole number. A single empty column (48px) is narrower than the car — the car needs at least 2 full columns of lateral clearance to fit without overlapping when centered on a column boundary. Do not assume "1 empty column = enough room" when designing puzzle geometry.

---

## Puzzle JSON Schema (authoritative)

```typescript
type Puzzle = {
  id: number                // 1–15, doubles as progression index
  type: 'parallel' | 'garage' | 'reverse_bay'
  theme: 'street' | 'garage' | 'rooftop' | 'underground'
  difficulty: 1 | 2 | 3 | 4 | 5
  question: string          // shown as scene subtitle
  environment: 'street' | 'garage' | 'open_lot'
  playerCar: { col: number; row: number; angle: number }  // angle: 0=up,90=right,180=down,270=left
  obstacles: Array<{ type: 'sedan' | 'suv' | 'pillar' | 'wall'; col: number; row: number; angle: number }>
  exitZone: { col: number; row: number; direction: 'top' | 'bottom' | 'left' | 'right' }
  escapeSteps: Array<{ step: number; description: string }>  // retained, currently unused by UI
  expertTip: string
}
```
Note: `shareBlocks`, `correctAnswer`, `options`, `wrongPaths`, `AnswerOption` are quiz-era dead fields — do not use, safe to remove from the type entirely during Epic 2-1's schema rework.

### Difficulty Design Rules (progression order = difficulty order)
```
Puzzles 1–5   (parallel, street theme):     2–3 moves, player angle 0°, 2–3 obstacles, wide lanes
Puzzles 6–10  (garage, garage/underground): 4–6 moves, player angle 90°/270°, pillars, tighter lanes
Puzzles 11–15 (reverse_bay, rooftop):       7+ moves, player angle 180° (must reverse first), tight clearances
```

### Rendering Order (Z-order)
```
1 (bottom): ParkingGrid background · 2: Exit zone (green, pulsing) · 3: Obstacle cars
4: Pillar/wall rectangles · 5: Player car · 6 (top): HUD (puzzle name, controls — no timer)
```

---

## PlayerCar Movement Spec (authoritative — unchanged, already working)

- **No physics engine.** Plain `Phaser.GameObjects.Image`, no Arcade Physics body, no velocity/momentum/drag.
- Car is a child of the same container as ParkingGrid/obstacles, sharing container-local pixel coordinates.
- Tint `#E8320A`, scale `1.35 * 1.08` (pre-pixel-art; Epic 8 adjusts to `{width:32,height:64}` load + `.setScale(2.5)`).

| Input | Effect | Formula |
|---|---|---|
| Forward | Translate in facing direction | `dx = sin(rad)*MOVE_SPEED*dt`, `dy = -cos(rad)*MOVE_SPEED*dt` |
| Reverse | Translate opposite | same, `moveDir = -1` |
| Left | Rotate CCW | `angle -= ROTATION_SPEED*dt` |
| Right | Rotate CW | `angle += ROTATION_SPEED*dt` |

`0° = facing up`. `MOVE_SPEED = 120 px/s`, `ROTATION_SPEED = 90 deg/s`. All motion scaled by `dt`. Instant stop on release — no coasting. Multi-key inputs apply simultaneously. Applied via direct `setPosition()`/`setAngle()`.

---

## Collision and Win Spec (authoritative — revised for Epic 9)

### Collision Detection (unchanged)
1. Compute candidate position from input.
2. Build a `Phaser.Geom.Rectangle` (72×144) at the candidate position.
3. For each obstacle (excluding pillars/walls' own static rects), build its rectangle.
4. `Phaser.Geom.Rectangle.Overlaps()` — if ANY overlap, reject candidate (car stays put; rotation still applies).
5. On overlap: revert position, play `crunch.mp3` (try/catch), flash red 200ms, reset to spawn. **No scene change, no menu, instant retry — this is now the ONLY failure state, since the timer is removed.**

### Exit Zone Detection (revised — no more lock screen)
- Exit zone is a `Phaser.Geom.Rectangle` in container-local coordinates, derived from the puzzle's `exitZone` col/row/direction.
- On overlap: play `success.mp3`, call `POST /api/puzzle-complete` with `{ puzzleId }`, then **immediately load the next puzzle** in PuzzleScene (in-place reinit, not a scene transition to a separate screen).
- If `puzzleId === 15`: show a brief "You cleared all puzzles!" celebration overlay, then wrap to puzzle 1.
- Guard against double-fire with a boolean flag (e.g. `exited`), same pattern as prior collision guard.

### Timer — REMOVED
There is no time limit and no "Time's Up!" state. Failure is only ever a collision, and it never ends the session — it just resets the car in place.

### Coordinate Space
All geometry (player car, obstacles, exit zone) uses the same container-local pixel space — no conversion needed.

---

## Coding Standards
- TypeScript strict mode: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noUnusedLocals`, `noUnusedParameters`
- ESLint: `@typescript-eslint/no-floating-promises: error`
- Prettier: single quotes, ES5 trailing commas
- Prefer type aliases over interfaces, named exports over default exports, never cast types (no `as any`)

---

## Build, Test & Dev Commands
| Command | Purpose |
|---|---|
| `npm run dev` | Start playtest with Devvit |
| `npm run build` | Vite build |
| `npm run type-check` | `tsc --build` |
| `npm run lint` | ESLint |
| `npm run deploy` | Type-check + lint + `devvit upload` |
| `npm run launch` | Deploy + `devvit publish` |

---

## Definition of Done (mandatory per story)
1. Every API handler referenced is implemented with real logic — not a stub, not mock data
2. Data comes from an actual upstream source — never a hardcoded placeholder
3. The relevant test case has been run and the ACTUAL output is pasted — not "this should work"
4. If something can't be fully implemented this pass, show "Not yet implemented" — never fake success

## Git Branching Rule (mandatory)
Before writing any code, run: `git checkout -b feature/<name>` — adjust `<name>` to match the current prompt/epic/story (e.g. `feature/epic9-story9-5-cleanup`). Freebuff executes this git command in the project terminal before implementing anything, every time, with no exceptions. This must be the first action taken in response to any task prompt, before Step 0/audit work begins.

## Sequencing Rule
Implement and verify one story at a time. Do not start the next until the current one's Definition of Done is explicitly confirmed.

## Visual Architecture Principles (Epic 10)
The approved mockups are the source of truth for visual architecture. When implementing visuals, optimize for matching the approved game feel rather than preserving the current renderer structure. Priority order: (1) gameplay correctness, (2) layout, (3) visual hierarchy, (4) theme richness, (5) decorative polish. Gameplay correctness must never be sacrificed, but it alone is not sufficient completion if the approved visual direction isn't met.

**Single rendering pipeline**: theme rendering must come from one coordinated pipeline, not split across multiple independent systems. Preferred draw order: Theme Base → Ground Surface → Parking Surface → Parking Bays → Curbs/Sidewalks → Theme Props → Exit → Vehicles → Effects → HUD → Controls. Every visual element has exactly one owner.

**Layout principles**: the parking lot is the primary gameplay surface and should visually dominate the screen. Controls belong to the gameplay card, not as isolated floating widgets. Avoid unused vertical space.

**Theme philosophy**: themes must feel like different locations, not just different colors. Each theme should communicate place through surface, props, surrounding environment, lighting, edge treatment, and exit styling.

**Gameplay boundary rule**: players must never be able to drive outside the playable parking lot. Visible playfield boundaries and gameplay boundaries must always match exactly.

## Screenshot Validation Rule (mandatory for any visual story)
Any story that materially changes gameplay presentation (layout, UI, rendering, environment, controls, or theme visuals) is NOT complete until the implementation is compared side-by-side against the approved mockup(s). Completion requires identifying remaining visual differences, not merely confirming the code compiles or a feature was technically added. "Done" means "the game now looks and behaves like the approved design," not "the requested feature was implemented." A passing type-check/build is necessary but never sufficient for a visual story.

## Scope Discipline (mandatory)
Do not add, rename, remove, or modify any type/interface field, config value, data schema, or API contract beyond what the current task explicitly requests — even if it seems related, helpful, or like an obvious next step. If something additional seems necessary to complete the task correctly, STOP and report what and why in your response — do not implement it preemptively. Unrequested additions have caused real build breakage in this project (e.g. a premature `exitZone` field added to `puzzle-types.ts` broke type-check across all 15 puzzles). When in doubt, do less, not more.

## Agent-Verifiable vs. Human-Only Verification
Not everything in the Definition of Done can be confirmed by the agent. Split verification into two explicit buckets in every report:
- **Agent-verifiable** (must paste real output): grep results, type-check/build output, console logs, network/fetch responses, file existence checks.
- **Human-only** (must be explicitly deferred, never claimed as "confirmed"): visual correctness (does it look right, is it centered, does a flash actually render), game feel (does movement feel responsive, does a collision feel abrupt or well-paced), and anything requiring eyes on the actual running game in the real Devvit/Reddit environment. For these, describe exactly what was implemented and what the human should look for — do not assert it "works" or is "confirmed" without a human having actually observed it running.

## Reporting Requirement
End every story with:
```
VERIFIED:
- Handler(s) touched: [list]
- Real data source confirmed: [yes/no + how]
- Test run: [what you actually ran]
- Result: [actual output, not assumption]
```

---

## Out of Scope (MVP)
- AI puzzle generation, user-submitted scenarios, premium/payments/push notifications
- Standalone PWA / Next.js build, Supabase or any external database, admin dashboard
- Multiplayer or real-time features
- WrongAnswerScene / CorrectScene / ResultScene / AlreadyPlayedScene / LeaderboardScene (all deleted)
- Share card / clipboard mechanic, multiple choice quiz mechanic, Arcade physics on PlayerCar
- postMessage bridge (using HTTP fetch instead)
- **Daily/calendar-based puzzle rotation** (replaced by linear index progression)
- **Streak and leaderboard systems** (replaced by "one more puzzle" loop)
- **60-second timer / time-based failure state** (removed — collision is the only failure state)

---

## Key Links
- Devvit docs: https://developers.reddit.com/docs/llms.txt
- Devvit template: https://github.com/reddit/devvit-template-react