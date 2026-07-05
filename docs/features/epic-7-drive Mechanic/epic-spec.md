I actually think this is the right moment to adjust the Epic. The new information fundamentally changes the implementation strategy, and it's much cheaper to fix the roadmap now than halfway through.

One thing I do want to push back on slightly: I **would not rewrite Stories 1 and 2**. They're already implemented, tested, and they leave the codebase in a good state. Rewriting those stories would create documentation drift between your Git history and your implementation plan.

Instead, I'd version the Epic:

* **Epic: Drive Mechanic v2**
* Stories 1–2: Completed (as implemented)
* Stories 3 onward: Revised based on the new player-physics architecture.

I think that's the most maintainable approach.

---

# Epic: Drive Mechanic (v2)

## Story 1 — Gameplay Layout Redesign ✅ Completed

**Status:** Complete

Purpose:

* Remove quiz layout.
* Make the parking scene the visual focus.
* Prepare the screen for interactive controls.

Files:

* `parkiq/src/game/scenes/PuzzleScene.ts`

Deliverables:

* Large parking scene.
* Simplified HUD.
* Objective text.
* Placeholder controls.

---

## Story 2 — Interactive Driving Controls ✅ Completed

**Status:** Complete

Purpose:

* Replace placeholders with real touch controls.
* Create reusable `DrivingControls`.
* Improve UI polish.
* Add steering preview.

Files:

* `parkiq/src/game/components/DrivingControls.ts`
* `parkiq/src/game/scenes/PuzzleScene.ts`

Deliverables:

* Interactive control pad.
* Press animations.
* Steering preview.
* Idle animation.
* HUD improvements.

---

# Story 3 — Player Vehicle (Physics Foundation)

This is where the architecture changes.

## Goal

Replace the static player image with a dedicated Arcade Physics vehicle.

Obstacle cars remain static.

The player becomes the only physics-driven object.

---

### Create

```
parkiq/src/game/components/PlayerCar.ts
```

Responsibilities:

* create physics image
* configure damping
* drag
* acceleration
* steering
* braking
* expose update()

PuzzleScene should never contain driving mathematics.

---

### PuzzleScene

Replace:

```
CarSprite(player)
```

with

```
PlayerCar
```

Obstacle cars continue using:

```
CarSprite
```

---

### Implement

Forward

Reverse

Steering

Natural deceleration

Maximum speed

Rotation interpolation

Acceleration curve

Reverse speed limiter

Steering only while moving

Movement bounds

---

### Camera

Static.

Do not follow the player.

---

### Polish (implemented, not optional)

* wheel steering animation
* gentle engine idle vibration
* exhaust dust particles when accelerating
* tire marks that fade after 2–3 seconds
* slight camera impulse when changing direction
* easing on acceleration and braking

---

### Result

At the end of Story 3:

The player can freely drive around the parking area.

No collisions yet.

---

# Story 4 — World Physics & Environment

Add:

Arcade Physics

World bounds

Obstacle colliders

Exit trigger

Invisible parking boundaries

---

### Implement

Player vs obstacle

Player vs wall

Player vs exit

Sliding collision response

No object pushing

No obstacle movement

---

### Feedback

Collision:

* screen shake
* impact particles
* crunch sound
* red flash
* car rebounds slightly

Exit:

* green pulse
* particles
* smooth slowdown

---

# Story 5 — Success & Failure

Replace both result scenes.

Wrong:

Drive into obstacle

↓

Immediate collision

↓

Overlay

↓

Tomorrow countdown

↓

Current streak

Correct:

Reach exit

↓

Drive through exit

↓

Confetti

↓

Score animation

↓

Streak animation

---

# Story 6 — Scoring & Daily Flow

Fix:

Wrong = 0

Correct scoring

Move bonus

Speed bonus

Timer bonus

Leaderboard submission

Already played flow

---

# Story 7 — Final Polish

Implement—not suggest:

## UI

* icon-only controls
* consistent spacing
* 8px spacing system
* rounded panels
* soft shadows
* improved typography hierarchy
* subtle gradients
* vignette
* orange accent consistency

## Gameplay

* smoother steering interpolation
* easing everywhere
* particles
* polished transitions
* fade scene changes
* timer pulse
* button ripple
* richer audio feedback

## Accessibility

* larger touch targets
* improved contrast
* safe margins for portrait
* eliminate overlapping UI

---

## One important architectural rule I'd add

From Story 3 onward, **PuzzleScene should stop growing**.

It should become an orchestrator only:

```
PuzzleScene
│
├── PlayerCar
├── DrivingControls
├── ParkingGrid
├── HUD
├── EffectsManager
└── PuzzleLoader
```
