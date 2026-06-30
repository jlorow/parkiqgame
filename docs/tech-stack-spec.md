# ParkIQ — Tech Stack Specification
**Date:** June 29, 2026
**Version:** 1.0 — Hackathon Submission Scope
**Target Deadline:** July 4, 2026 (Devpost submission)

---

## 1. Platform Constraint (Non-Negotiable)

ParkIQ is built for the **Reddit Games With a Hook Hackathon**.
The game must run inside Reddit as a Devvit Web app using
Reddit's Interactive Posts feature. This is the primary
deployment target. A standalone PWA is explicitly out of scope
for this version.

---

## 2. Core Stack

| Layer | Technology | Version | Reason |
|---|---|---|---|
| Platform | Devvit Web | Latest | Required by hackathon rules |
| Runtime | Node.js | 22.x | Required by Devvit |
| Game Engine | Phaser 4 | 4.1.x (Salusa) | Eligible for $5K Phaser prize; AI-ready API; free MIT license |
| Renderer | Phaser Canvas (fallback) | — | WebGL preferred; Canvas fallback required for Reddit Android webview compatibility |
| Frontend Framework | React | 18.x | Devvit Web template default; component-based puzzle UI |
| Bundler | Vite | Latest | Instant hot reload; Devvit template default |
| Language | TypeScript | 5.x | Type safety for puzzle JSON schema and game state |
| Storage | Devvit Redis | Built-in | Per-user streak, last-played date, leaderboard scores — no external DB needed |
| Hosting | Reddit (Devvit) | — | Free; zero infrastructure cost; required by platform |

---

## 3. Project Structure

```
parkiq/
├── devvit.yaml              # Devvit app config (app name ≤16 chars)
├── package.json
├── vite.config.ts
├── src/
│   ├── main.tsx             # Devvit entry point — renders launch button
│   ├── App.tsx              # Root React component
│   ├── game/
│   │   ├── PhaserGame.tsx   # Phaser 4 game instance wrapper
│   │   ├── scenes/
│   │   │   ├── PuzzleScene.ts      # Main puzzle render + input
│   │   │   ├── WrongAnswerScene.ts # Collision animation
│   │   │   ├── CorrectScene.ts     # Step sequence animation
│   │   │   └── ResultScene.ts      # Share card + stats
│   │   ├── components/
│   │   │   ├── CarSprite.ts        # Red player car (top-down SVG shape)
│   │   │   ├── ObstacleCar.ts      # Gray obstacle car
│   │   │   ├── ParkingGrid.ts      # Bay lines + road surface
│   │   │   └── PathArrow.ts        # Green escape arrow animation
│   │   └── puzzles/
│   │       ├── puzzle-data.ts      # All 15 puzzle JSON objects
│   │       └── puzzle-types.ts     # TypeScript interfaces
│   ├── ui/
│   │   ├── AnswerButtons.tsx       # A/B/C/D pill buttons
│   │   ├── ShareCard.tsx           # Wordle-style result card
│   │   ├── StreakBadge.tsx         # Streak counter display
│   │   └── Leaderboard.tsx         # Daily top 10
│   └── lib/
│       ├── devvit-client.ts        # Devvit Redis read/write helpers
│       ├── puzzle-engine.ts        # Date → puzzle index logic
│       └── share-utils.ts          # Share card text generator
├── public/
│   └── assets/                     # Any static sound files
└── docs/                           # PRD, epics, this spec
```

---

## 4. Phaser 4 Configuration

```typescript
// Renderer strategy: WebGL with Canvas fallback
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,        // tries WebGL, falls back to Canvas
  width: 390,               // iPhone 14 Pro width — mobile first
  height: 844,              // iPhone 14 Pro height
  backgroundColor: '#0F0F0F',
  scene: [PuzzleScene, WrongAnswerScene, CorrectScene, ResultScene],
  physics: {
    default: 'arcade',      // lightweight; used only for collision
    arcade: { debug: false }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
}
```

---

## 5. Devvit Integration Points

### 5.1 App Identity
```yaml
# devvit.yaml
name: parkiq              # must be ≤16 characters
version: 0.0.1
```

### 5.2 Redis Schema (per-user storage)

| Key Pattern | Value | Purpose |
|---|---|---|
| `streak:{userId}` | integer | Current daily streak count |
| `lastPlayed:{userId}` | ISO date string | Last puzzle completion date |
| `score:{date}:{userId}` | integer | Daily score for leaderboard |
| `leaderboard:{date}` | sorted set | Daily top 10 by score |

### 5.3 Message Bridge
Devvit uses a postMessage bridge between the Devvit backend
and the React/Phaser webview frontend:

```typescript
// Frontend sends to Devvit backend
window.parent.postMessage({ type: 'GET_USER_DATA' }, '*')

// Devvit backend responds
window.addEventListener('message', (e) => {
  if (e.data.type === 'USER_DATA') {
    const { streak, lastPlayed } = e.data.payload
  }
})
```

---

## 6. Puzzle Data Schema

```typescript
interface Puzzle {
  id: number                    // sequential, 1-based
  type: 'parallel' | 'garage' | 'reverse_bay'
  difficulty: 1 | 2 | 3 | 4 | 5
  question: string
  environment: string           // describes scene context
  playerCar: {
    x: number                   // grid position
    y: number
    angle: number               // degrees, 0 = facing up
  }
  obstacles: Obstacle[]
  options: {
    A: string
    B: string
    C: string
    D: string
  }
  correctAnswer: 'A' | 'B' | 'C' | 'D'
  wrongPaths: {                 // what each wrong answer hits
    [key: string]: string       // e.g. "A": "Hits car on left"
  }
  escapeSteps: EscapeStep[]    // 4 steps for correct answer sequence
  expertTip: string
  shareBlocks: string[]        // e.g. ["🟩","🟩","🟥","🟩","🟩"]
}

interface Obstacle {
  type: 'sedan' | 'suv' | 'pillar' | 'wall'
  x: number
  y: number
  angle: number
}

interface EscapeStep {
  stepNumber: 1 | 2 | 3 | 4
  title: string
  description: string
  highlightWord: string        // word to color green in description
}
```

---

## 7. Animation Spec

### Wrong Answer (collision)
```
Duration:     800ms total
Step 1:       Car translates toward obstacle (400ms, ease-in)
Step 2:       Impact flash — red starburst scale(0→1.5→0) (200ms)
Step 3:       Car shakes in place (200ms, horizontal oscillation)
Sound:        crunch.mp3, triggered at Step 2 start
              (requires prior user gesture — tap to enable)
```

### Correct Answer (escape sequence)
```
Duration:     300ms per card transition
Cards:        4 cards, swipeable carousel
Arrow:        Green dashed path drawn progressively per card
Sound:        success.mp3 on "Escaped!" card appearance
```

### Timer
```
Duration:     60 seconds countdown
Display:      Numeric (0:60 → 0:00) below diagram
Urgency:      Timer text turns racing red #E8320A at 0:10
Sound:        tick.mp3 every second from 0:10 to 0:00
```

---

## 8. Visual Constants

```typescript
export const COLORS = {
  background:    '#0F0F0F',
  playerCar:     '#E8320A',   // racing red
  obstacleCar:   '#6B7280',   // neutral gray
  exitZone:      '#22C55E',   // green
  wrongPath:     '#EF4444',   // red
  correctPath:   '#22C55E',   // green
  bayLines:      '#FFFFFF',
  pillar:        '#1F2937',
  uiAccent:      '#E8320A',
  textPrimary:   '#FFFFFF',
  textMuted:     '#6B7280',
  cardBg:        '#1C1C1E',
  buttonBg:      '#2A2A2A',
}

export const GRID = {
  unitPx:        48,           // 1 grid unit = 48px on mobile
  carWidth:      2,            // grid units
  carLength:     4,            // grid units
  bayWidth:      2.5,          // grid units
  bayLength:     5,            // grid units
}
```

---

## 9. Sound Assets

| File | Trigger | Duration |
|---|---|---|
| `crunch.mp3` | Wrong answer collision moment | ~300ms |
| `success.mp3` | Correct answer "Escaped!" card | ~500ms |
| `tick.mp3` | Every second when timer ≤ 10s | ~100ms |

All sounds generated via Phaser Desktop SFX Generator (free).
All sounds require prior user gesture before playing (browser policy).

---

## 10. Out of Scope (Explicitly)

```
✗ AI puzzle generation (Claude API)
✗ User-submitted scenarios
✗ Premium / payments
✗ Push notifications
✗ Standalone PWA / Next.js build
✗ Supabase or any external database
✗ Admin dashboard
✗ Trailer / forklift / large vehicle types
✗ WebGL-only rendering (Canvas fallback required)
✗ Multiplayer or real-time features
```

---

## 11. Dev Environment Setup Sequence

```bash
# 1. Verify Node 22
node --version   # must be v22.x.x

# 2. Install Devvit CLI
npm install -g devvit

# 3. Authenticate
devvit login

# 4. Clone React template
git clone https://github.com/reddit/devvit-template-react parkiq
cd parkiq

# 5. Install Phaser 4
npm install phaser@^4.1.0

# 6. Configure app name in devvit.yaml
# name: parkiq

# 7. Create test subreddit on Reddit.com
# Update dev:devvit command in package.json with subreddit name

# 8. Upload and run
npm run upload
npm run dev
# Navigate to subreddit → three dots → "Make my experience post"
```
