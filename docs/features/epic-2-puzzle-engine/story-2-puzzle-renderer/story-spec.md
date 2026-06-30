# Story 2-2: Puzzle Renderer
**Epic:** Puzzle Engine
**PRD Reference:** Feature 1 — core puzzle UX

## User Story
As a player, I want to see the puzzle diagram, question,
and answer buttons on screen, so that I can understand
and respond to the scenario.

## Functional Requirements
- PuzzleScene.create() accepts a puzzle object and renders:
  1. PARKIQ logo top-left, 3 icon buttons top-right
  2. "PUZZLE #N" in muted gray, centered below top bar
  3. Question text in bold white below puzzle number
  4. Parking diagram card (ParkingGrid + cars from Epic 1)
  5. Timer display below diagram (0:60 counting down)
  6. 4 answer buttons (A/B/C/D) stacked below timer
- Answer buttons: dark #2A2A2A background, racing red
  circle badge with letter, white answer text
- On button tap: disable all buttons immediately,
  pass answer to correct scene transition
- Timer reaching 0:00 counts as wrong answer (option E,
  treated same as wrong answer flow)
- Timer text turns #E8320A at 10 seconds remaining

## UX Requirements
- Minimum tap target: 44×44px per button
- Buttons must not be tappable after first selection
- Diagram card must be square aspect ratio

## Implementation Steps

1. Implement PuzzleScene.create() using the puzzle object
   passed from scene data. Use ParkingGrid and CarSprite
   from Epic 1.

2. Render top bar (logo + icons) as Phaser text/graphics
   objects pinned to top of canvas

3. Render question text and puzzle number

4. Render diagram card: call ParkingGrid then overlay
   CarSprite objects from puzzle.obstacles and
   puzzle.playerCar

5. Implement 60-second countdown timer using
   Phaser.Time.addEvent. Store timeTaken on answer.

6. Render 4 answer buttons as Phaser interactive
   rectangles with text. On tap, disable all buttons
   and call appropriate scene transition.

🔴 REPORT BEFORE CONTINUING
Show screenshot of a rendered puzzle (use puzzle ID 1).
Must match parallel-park-puzzle.png in epic-images.
Confirm timer counts down and buttons are tappable.

7. Test all 3 puzzle types render correctly from their
   JSON objects before marking complete.

🔴 REPORT BEFORE CONTINUING
Show screenshots of puzzle types 2 (garage) and 3
(reverse bay) rendered from their JSON objects.

## VERIFIED
- [ ] All 3 puzzle types render from JSON
- [ ] Timer counts down from 60, turns red at 10
- [ ] Timer expiry triggers wrong answer flow
- [ ] Buttons disable after first tap
- [ ] Tap targets are minimum 44×44px
- [ ] Diagram is square aspect ratio
