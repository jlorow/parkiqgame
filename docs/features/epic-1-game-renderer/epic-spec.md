# Epic 1: Game Renderer
**PRD Reference:** Feature 1 (Daily Parking Puzzle)
**Tech Stack Reference:** Sections 2, 4, 7, 8

## Goal
Establish a working Phaser 4 game instance inside a React
component that renders a mobile-sized canvas with the correct
visual constants. All other epics render inside this shell.

## Acceptance Criteria
- Phaser 4 initialises at 390×844px inside the Devvit webview
- Canvas fallback activates automatically if WebGL unavailable
- A red player car shape renders at a given grid position
- A gray obstacle car shape renders at a given grid position
- White parking bay lines render on dark asphalt background
- Scene transitions work between PuzzleScene → WrongAnswerScene
  → CorrectScene → ResultScene without page reload

## Design Reference
See `epic-images/puzzle-screen.png` for the target visual
output. Cars must match the flat top-down style shown —
geometric shapes, not sprites or photos.

## Stories
1. story-1-phaser-setup
2. story-2-car-components
3. story-3-parking-grid
4. story-4-scene-manager

## Dependencies
- Epic 6 Story 1 (Devvit setup) must be complete first
  so Phaser renders inside the correct webview shell
