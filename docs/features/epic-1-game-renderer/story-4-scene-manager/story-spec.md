# Story 1-4: Scene Manager
**Epic:** Game Renderer
**PRD Reference:** Feature 1 — full puzzle flow

## User Story
As a player, I want the game to move smoothly between the
puzzle, result, and share screens without reloading,
so that the experience feels like a native app.

## Functional Requirements
- 4 Phaser scenes registered in game config:
  PuzzleScene, WrongAnswerScene, CorrectScene, ResultScene
- Scene transitions triggered by game events, not page nav
- Data passed between scenes via Phaser scene data manager:
  - PuzzleScene → WrongAnswerScene: `{ answer, puzzle }`
  - PuzzleScene → CorrectScene: `{ timeTaken, puzzle }`
  - CorrectScene → ResultScene: `{ timeTaken, streak, puzzle }`
- No browser back button or URL change on transition

## Non-Functional Requirements
- Transition must complete within 300ms
- No blank frame visible during scene switch

## Implementation Steps

1. Create stub files for all 4 scenes (empty preload/
   create/update methods):
   - `src/game/scenes/PuzzleScene.ts`
   - `src/game/scenes/WrongAnswerScene.ts`
   - `src/game/scenes/CorrectScene.ts`
   - `src/game/scenes/ResultScene.ts`

2. Register all 4 in PhaserGame.tsx game config scenes array

3. In PuzzleScene stub, add a temporary button that
   calls `this.scene.start('WrongAnswerScene', { test: true })`

4. In WrongAnswerScene stub, add a button that calls
   `this.scene.start('CorrectScene', { test: true })`

5. In CorrectScene stub, add a button that calls
   `this.scene.start('ResultScene', { test: true })`

6. Test the full transition chain in Reddit webview

🔴 REPORT BEFORE CONTINUING
Confirm all 4 scenes transition without blank frames
or console errors. Show each scene stub is reachable.

7. Remove temporary test buttons. Scene stubs remain
   for Epic 2 and Epic 3 to fill in.

## VERIFIED
- [ ] All 4 scenes registered in game config
- [ ] PuzzleScene → WrongAnswerScene transition works
- [ ] PuzzleScene → CorrectScene transition works
- [ ] CorrectScene → ResultScene transition works
- [ ] Scene data passes correctly between transitions
- [ ] No blank frames during transition
