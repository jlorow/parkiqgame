# Story 1-2: Car Components
**Epic:** Game Renderer
**PRD Reference:** Feature 1 — puzzle diagram visual quality

## User Story
As a player, I want to see clearly readable top-down car
shapes in the puzzle diagram, so that I can immediately
understand the parking scenario.

## Functional Requirements
- `CarSprite.ts` — Phaser Graphics object drawn as a
  rounded rectangle representing a top-down car view
  - Player car: #E8320A (racing red), 2×4 grid units
  - Obstacle car: #6B7280 (gray), 2×4 grid units
  - Each car has a subtle darker rectangle for windscreen
  - Each car accepts: x, y, angle, type ('player'|'obstacle')
- Cars render at correct grid position using GRID constants
  from Tech Stack Spec Section 8
- Cars rotate correctly when angle !== 0

## Non-Functional Requirements
- Car shapes must be readable at 390px canvas width
- No external image assets — all drawn with Phaser Graphics

## Implementation Steps

1. Create `src/game/components/CarSprite.ts`
   - Use Phaser.GameObjects.Graphics
   - Draw body as fillRoundedRect
   - Draw windscreen as fillRect (darker shade)
   - Accept config: { x, y, angle, type }

2. Create `src/game/components/ObstacleCar.ts` as a
   thin wrapper around CarSprite with type forced to
   'obstacle'

3. Add a temporary test scene that renders:
   - 1 red player car at grid position [4,3], angle 15°
   - 4 gray obstacle cars surrounding it
   - Verify visually matches epic-images/puzzle-screen.png

🔴 REPORT BEFORE CONTINUING
Show screenshot of test scene with player car and
obstacle cars rendered. Compare against
epic-images/puzzle-screen.png — cars must be
clearly readable geometric shapes.

4. Remove test scene after approval. CarSprite and
   ObstacleCar are now ready for use in Epic 2.

## VERIFIED
- [ ] Player car renders in #E8320A at correct size
- [ ] Obstacle cars render in #6B7280 at correct size
- [ ] Windscreen detail visible on each car
- [ ] Angle rotation works correctly (test at 0°, 15°, 45°, 90°)
- [ ] No image assets used — pure Phaser Graphics
