# Story 2-3: Daily Puzzle Rotation
**Epic:** Puzzle Engine
**PRD Reference:** Feature 2 — streak + daily rotation

## User Story
As a player, I want the same puzzle to be available to
everyone on the same day, so that results are comparable
and the game feels like a shared daily event.

## Functional Requirements
- `src/lib/puzzle-engine.ts` exports `getTodaysPuzzle()`
- Function derives puzzle index from days elapsed since
  launch date (June 29, 2026) modulo 15
- Same date always returns same puzzle for all users
- Launch date is a constant — never derived from user
  device (use server-side date from Devvit context)
- PuzzleScene receives today's puzzle from this function,
  not from a hardcoded ID

## Implementation Steps

1. Create `src/lib/puzzle-engine.ts`

2. Define `LAUNCH_DATE = new Date('2026-06-29')`

3. Implement `getTodaysPuzzle(serverDate: Date): Puzzle`:
   - Calculate days since LAUNCH_DATE
   - Index = daysElapsed % puzzleData.length
   - Return puzzleData[index]

4. In the Devvit backend, pass the server-side date to
   the webview via the message bridge (see Epic 6 Story 2)
   so puzzle selection is not spoofable by device clock

5. Update App.tsx to call getTodaysPuzzle() with the
   server date received from Devvit before starting
   PuzzleScene

🔴 REPORT BEFORE CONTINUING
Manually test: change serverDate to +1 day, +2 days,
+15 days. Confirm each returns the expected puzzle
and +15 days wraps back to puzzle 1.

## VERIFIED
- [ ] getTodaysPuzzle() returns correct puzzle for today
- [ ] +15 days wraps back to puzzle index 0
- [ ] Server date used, not device clock
- [ ] PuzzleScene receives puzzle from this function
