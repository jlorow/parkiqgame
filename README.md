# ParkIQ 🅿️

A real-time parking puzzle game for Reddit, built with Phaser + Devvit Web.

Can you thread the gap, angle the turn, and park it clean — without touching another car?

---

## What is ParkIQ?

ParkIQ is a top-down driving puzzle game embedded directly in Reddit posts. Each puzzle drops you into a tight parking lot full of obstacles — other cars, walls, barricades, shrubs, trees — and gives you one job: drive your car out (or into) the marked parking spot without hitting anything.

No multiple choice. No quiz mechanics. Every puzzle is a real-time driving challenge using direct pixel-level movement and precision steering — closer to a spatial reasoning puzzle than a typical casual game, wrapped in a fast, replayable, "one more puzzle" loop built for Reddit's feed.

## How to Play

1. Open the post — tap Play on the splash screen.
2. Use the on-screen D-pad to drive your car (steer + move forward/back).
3. Reach the marked exit zone, parked at the correct angle, without colliding with anything.
4. Crash into an obstacle? Instant reset — try again immediately, no penalty, no waiting.
5. Clear a puzzle, move to the next. 15 puzzles of increasing difficulty, plus bonus levels.

## Parking Types

ParkIQ implements three real parking disciplines, each with its own approach angle and tolerance:

- Parallel — slide in lengthwise, aligned with the direction of travel
- Perpendicular — nose straight in, 90° to the lane
- Angled — diagonal parking, the trickiest of the three

Every exit zone checks both position *and* approach angle before counting as a win — get the angle wrong and you won't park, even if you're sitting right on top of the spot.

## Bonus Levels

- Scissor Trap — a tight two-car threading challenge
- Impossible Escape — pilot a full semitruck through a narrow obstacle course, using a dedicated large-vehicle collision profile

## What Makes It Tick

- Hand-drawn puzzle art. Every puzzle's parking lot surface — lane lines, angled stalls, textures — is original hand-drawn artwork, not procedurally generated. The lot you're driving on is real, deliberate level design, not a repeating tile.
- A custom-built Level Editor. ParkIQ ships with its own standalone puzzle design tool — a zero-dependency, single-file editor for placing obstacles, setting exact angles, and validating a layout is actually solvable (live overlap warnings, edge-clearance checks, and a manual path test-drive feature) before it ever reaches a player.
- A freeform coordinate system. Puzzles aren't locked to a grid — obstacles, walls, and props are placed at real pixel positions and arbitrary angles, letting layouts feel organic and hand-designed rather than boxy.
- Real rotation-aware collision. Every vehicle and prop uses an angle-bucketed collision lookup table, so a car's hitbox actually reflects its rotated footprint — a sedan at 45° occupies real, different space than the same sedan at 0°.

## Tech Stack

- Game engine: Phaser 4.2.0
- Frontend: React 18 + TypeScript + Vite
- Platform: Reddit Devvit Web
- Backend: Hono + Redis
- Viewport: 390×844 mobile-first webview

## Why ParkIQ

Parking is a small, universal frustration everyone instantly understands — which makes it a natural fit for quick, replayable puzzle design. ParkIQ turns that everyday annoyance into a tight, skill-based challenge built specifically for how people actually browse Reddit: short sessions, immediate feedback, no punishment for failure, and a clear reason to come back for "just one more."

## Development

This project was built and significantly extended during the hackathon submission window — including the full freeform coordinate/collision rework, the custom Level Editor tool, hand-drawn puzzle art replacing placeholder visuals, and prop-based obstacles (barricades, cones, shrubs, trees) with real collision behavior.

### Local Setup

```bash
npm install
npm run dev       # local playtest via Devvit
npm run deploy    # build + upload
devvit publish    # submit for review
```

## Credits

Built by u/[your Reddit username] for Reddit's Games with a Hook Hackathon.
