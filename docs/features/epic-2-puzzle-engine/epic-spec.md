# Epic 2: Puzzle Engine
**PRD Reference:** Feature 1 (Daily Parking Puzzle)
**Tech Stack Reference:** Sections 6, 8

## Goal
Define the puzzle data structure, render any puzzle from
JSON onto the game canvas, and determine which puzzle
to show based on today's date.

## Acceptance Criteria
- A TypeScript interface defines the complete puzzle schema
- All 15 launch puzzles exist as valid JSON objects
- Given a puzzle JSON object, PuzzleScene renders the
  correct diagram with player car, obstacle cars, question
  text, and A/B/C/D answer buttons
- Given today's date, the engine returns the correct
  puzzle index deterministically for all players
- Timer counts down from 60 seconds and records time taken

## Design Reference
See `epic-images/` for all 3 puzzle type screenshots:
- `parallel-park-puzzle.png` — street environment
- `garage-puzzle.png` — garage with pillar
- `reverse-bay-puzzle.png` — open lot reverse entry

## Stories
1. story-1-puzzle-schema
2. story-2-puzzle-renderer
3. story-3-daily-rotation

## Dependencies
- Epic 1 (all stories) must be complete
- Epic 6 Story 1 (Devvit setup) must be complete
