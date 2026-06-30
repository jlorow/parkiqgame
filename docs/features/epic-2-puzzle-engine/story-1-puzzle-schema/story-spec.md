# Story 2-1: Puzzle Schema + Data
**Epic:** Puzzle Engine
**PRD Reference:** Feature 1 — puzzle content

## User Story
As a developer, I want a typed puzzle schema and 15
pre-authored puzzle objects, so that the game has
launch-ready content that is guaranteed solvable.

## Functional Requirements
- TypeScript interfaces in `src/game/puzzles/puzzle-types.ts`
  matching the schema in Tech Stack Spec Section 6 exactly
- `src/game/puzzles/puzzle-data.ts` exports an array of
  15 puzzle objects:
  - Puzzles 1–5: type `parallel` (street environment)
  - Puzzles 6–10: type `garage` (garage environment)
  - Puzzles 11–15: type `reverse_bay` (open_lot environment)
- Each puzzle has: id, type, difficulty, question, environment,
  playerCar, obstacles, options (A/B/C/D), correctAnswer,
  wrongPaths, escapeSteps (4 steps), expertTip, shareBlocks

## Puzzle Content Rules
- Each puzzle must have exactly 1 correct answer
- Each wrong answer must produce a collision with a
  specific named obstacle (used in Epic 3)
- Difficulty 1–2 for puzzles 1–5, 3 for puzzles 6–10,
  4–5 for puzzles 11–15
- expertTip must reference a real driving concept
- shareBlocks must be 5 elements: mix of 🟩 and 🟥

## Implementation Steps

1. Create `src/game/puzzles/puzzle-types.ts` with all
   interfaces from Tech Stack Spec Section 6

2. Create `src/game/puzzles/puzzle-data.ts` — author
   all 15 puzzles. For each puzzle verify:
   - The correct answer actually creates a clear path
   - Each wrong answer actually hits a named obstacle
   - escapeSteps describe the correct answer in 4 stages

3. Run TypeScript compiler — zero type errors allowed:
   `npx tsc --noEmit`

🔴 REPORT BEFORE CONTINUING
Show the TypeScript compiler output (must be clean).
List all 15 puzzle IDs with their type and
correctAnswer for manual review.

4. Do not proceed if any puzzle fails the manual review

## VERIFIED
- [ ] puzzle-types.ts compiles with zero errors
- [ ] puzzle-data.ts compiles with zero errors
- [ ] 15 puzzles present (5 per type)
- [ ] Every puzzle has exactly 1 correct answer
- [ ] Every wrong answer references a real obstacle
- [ ] Every puzzle has 4 escapeSteps
- [ ] shareBlocks arrays are all length 5
