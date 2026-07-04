# Epic: Drive Mechanic

## Epic Goal

Transform ParkIQ from a multiple-choice parking quiz into a **micro driving puzzle** where the player performs the escape manoeuvre using simple on-screen driving controls.

The redesign must preserve the existing backend, puzzle rotation, leaderboard, streak, and Devvit integration while replacing the interaction model with real-time player input, collision feedback, and satisfying animations.

---

## Success Criteria

By the end of this epic:

* Players no longer answer A/B/C/D questions.
* Players drive the car using on-screen controls.
* The parking scene occupies the majority of the screen.
* Collisions fail the puzzle.
* Escaping reaches the existing completion flow.
* Existing Redis, leaderboard and streak systems continue to work unchanged.
* All gameplay runs inside Phaser 4 Arcade Physics on Devvit Web.

---

# Story 1 — Redesign the Puzzle Screen Layout

## Goal

Convert the current quiz layout into a game layout without changing gameplay yet.

This story establishes the visual foundation for every remaining story.

---

### Files

Modify

```
src/game/scenes/PuzzleScene.ts
```

Minor updates if required

```
src/game/PhaserGame.tsx
```

---

### Scope

Remove:

* answer buttons
* answer text blocks
* long scenario description

Introduce:

* large gameplay area
* compact HUD
* timer
* move counter placeholder
* control panel placeholder
* larger parking diagram
* exit zone indicator

The player car and obstacle cars remain static.

No movement yet.

---

### Acceptance Criteria

* Parking scene fills approximately 70% of screen height.
* HUD fits comfortably in portrait mode.
* Text reduced to one concise objective.
* Controls appear but are disabled.
* Existing puzzle loading still works.
* Existing puzzle rendering unchanged.

---

### Depends On

None.

---

# Story 2 — Steering Control System

## Goal

Replace answer selection with interactive driving controls.

Introduce a reusable control layer independent of puzzle logic.

---

### Files

Modify

```
src/game/scenes/PuzzleScene.ts
```

Create (if appropriate)

```
src/game/components/DrivingControls.ts
```

or equivalent reusable UI component.

---

### Scope

Implement:

* Left steering
* Right steering
* Forward
* Reverse

Controls should work via pointer events.

No keyboard support required.

Steering should modify steering angle.

Movement should advance the vehicle while pressed.

No collisions yet.

---

### Acceptance Criteria

* Controls respond immediately.
* Car rotates smoothly.
* Car translates smoothly.
* Steering feels responsive.
* Controls work on touch devices.
* No answer buttons remain.

---

### Depends On

Story 1

---

# Story 3 — Vehicle Movement Model

## Goal

Introduce a simple arcade driving model appropriate for a puzzle game.

This is **not** a driving simulator.

---

### Files

Modify

```
src/game/scenes/PuzzleScene.ts
```

Potential helper

```
src/game/components/CarController.ts
```

---

### Scope

Implement

* forward movement
* reverse movement
* steering while moving
* turning radius
* steering reset behaviour
* move counting

Movement should feel deliberate rather than fast.

No drifting.

No inertia simulation.

---

### Acceptance Criteria

* Car follows believable arcs.
* Reverse works.
* Steering behaves consistently.
* Movement remains deterministic.
* Move counter increments correctly.

---

### Depends On

Story 2

---

# Story 4 — Collision & Escape Logic

## Goal

Turn movement into gameplay.

The player either escapes or crashes.

---

### Files

Modify

```
src/game/scenes/PuzzleScene.ts
```

---

### Scope

Enable Arcade Physics.

Create:

* player body
* obstacle bodies
* exit trigger

Implement:

Obstacle collision

↓

Failure

Exit overlap

↓

Success

No scoring changes yet.

---

### Acceptance Criteria

* Car cannot pass through obstacles.
* Collision immediately ends the puzzle.
* Exit zone completes the puzzle.
* Puzzle state cannot continue after completion.

---

### Depends On

Story 3

---

# Story 5 — Failure Experience

## Goal

Replace the quiz explanation screen with an animated crash outcome.

---

### Files

Replace

```
src/game/scenes/WrongAnswerScene.ts
```

---

### Scope

Display:

* crashed vehicle
* impact animation
* camera shake
* red flash
* collision marker
* correct escape path overlay
* streak information
* next puzzle countdown

Player cannot continue today's puzzle.

---

### Acceptance Criteria

* Scene clearly communicates failure.
* Correct route is understandable visually.
* Countdown information still functions.
* Existing daily-play restriction remains intact.

---

### Depends On

Story 4

---

# Story 6 — Success Experience

## Goal

Reward successful driving with a satisfying completion sequence.

---

### Files

Replace

```
src/game/scenes/CorrectScene.ts
```

---

### Scope

Animate:

* vehicle exiting
* particle celebration
* score reveal
* move count
* completion time
* streak increase

Reuse existing backend completion logic.

No share card.

---

### Acceptance Criteria

* Success feels rewarding.
* Statistics are readable.
* Existing completion API continues working.
* Streak updates correctly.

---

### Depends On

Story 4

---

# Story 7 — Results Flow Simplification

## Goal

Remove the legacy share-card concept and make the result flow purely gameplay focused.

---

### Files

Replace

```
src/game/scenes/ResultScene.ts
```

Modify if required

```
src/game/scenes/AlreadyPlayedScene.ts
```

---

### Scope

Remove:

* share card
* clipboard functionality
* emoji grids
* share button

Provide:

* today's result
* score
* leaderboard shortcut
* play tomorrow messaging

---

### Acceptance Criteria

* No share functionality remains.
* Flow feels consistent with new gameplay.
* Existing navigation still works.

---

### Depends On

Story 6

---

# Story 8 — Scoring & Game State Integration

## Goal

Connect the new gameplay loop to the existing scoring infrastructure.

---

### Files

Modify

```
src/game/scenes/PuzzleScene.ts
```

Potential updates

```
src/lib/devvit-client.ts
```

only if interface adjustments are genuinely required.

---

### Scope

Implement:

Correct escape

↓

Base score

*

Speed bonus

*

Efficiency bonus

Failure

↓

Zero score

Ensure API payloads remain compatible.

Fix the incorrect scoring behaviour for failed attempts.

---

### Acceptance Criteria

* Failed runs score zero.
* Successful runs calculate bonuses correctly.
* Leaderboard updates without backend changes.
* Existing Redis schema remains unchanged.

---

### Depends On

Story 6

---

# Story 9 — Gameplay Polish & Feel

## Goal

Elevate the experience through animation, feedback, and visual refinement without expanding gameplay scope.

---

### Files

Modify

```
src/game/scenes/PuzzleScene.ts
src/game/scenes/WrongAnswerScene.ts
src/game/scenes/CorrectScene.ts
```

Minor updates if needed

```
src/game/components/CarSprite.ts
```

---

### Scope

Add:

* smooth vehicle interpolation
* steering animation
* brake light feedback (if practical with current assets)
* collision particles
* success particles
* subtle camera zoom
* screen shake
* sound integration using existing audio assets
* UI transitions
* button press animations
* consistent spacing, colors, and rounded panel styling

No new gameplay mechanics.

---

### Acceptance Criteria

* Controls feel responsive.
* Animations are smooth on the target canvas (390×844).
* Existing crunch/success sounds are used appropriately.
* UI presents a cohesive visual style aligned with the redesigned ParkIQ identity.
* Gameplay remains performant within Devvit Web using Phaser 4 WebGL.

---

# Epic Completion Definition

The epic is complete when:

* ✅ The quiz mechanic has been completely removed.
* ✅ Players solve puzzles by driving rather than selecting answers.
* ✅ The parking scene is the primary focus of the screen.
* ✅ Steering controls are intuitive on mobile.
* ✅ Collision and escape outcomes are clearly communicated through animation and feedback.
* ✅ Existing backend systems (Redis, streaks, leaderboards, daily puzzle rotation, APIs) continue to function without architectural changes.
* ✅ The experience feels like a lightweight mobile driving puzzle rather than a questionnaire, while remaining achievable within the existing Phaser 4.2.0 and Devvit Web constraints.
