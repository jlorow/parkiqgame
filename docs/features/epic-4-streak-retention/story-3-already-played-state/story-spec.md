# Story 4-3: Already Played State
**Epic:** Streak + Retention
**PRD Reference:** Feature 2 — daily return loop

## User Story
As a player who already completed today's puzzle, I
want to see my result and streak instead of the puzzle
again, so that the app handles re-visits gracefully.

## Functional Requirements
- On app load: if lastPlayed === today's date (from Redis),
  skip PuzzleScene entirely
- Show a "Already Played Today" screen with:
  - PARKIQ logo + puzzle number
  - Large text: "You've completed today's puzzle"
  - Streak pill showing current streak
  - Countdown timer to next puzzle (time until midnight)
  - "Come back tomorrow for #N" text
  - SHARE RESULT button (replays the share card from
    today's result — use cached result from Redis or
    localStorage equivalent)
- Player cannot replay the puzzle from this screen

## Implementation Steps

1. In App.tsx, after receiving USER_DATA from Devvit:
   check if lastPlayed === today. If yes, render
   AlreadyPlayedScreen component instead of starting
   PuzzleScene.

2. Create `src/ui/AlreadyPlayedScreen.tsx` with the
   layout above. Compute countdown to midnight using
   current server time.

3. Store today's shareBlocks result in Redis:
   `result:{userId}:{date}` — written in Story 4-1
   alongside streak. Read here to power SHARE RESULT.

🔴 REPORT BEFORE CONTINUING
Complete a puzzle, then reload the Reddit post.
Confirm AlreadyPlayedScreen shows instead of puzzle.
Confirm countdown timer is accurate.
Confirm SHARE RESULT shows today's correct result.

## VERIFIED
- [ ] Already-played users never see puzzle again today
- [ ] Streak displays correctly on this screen
- [ ] Countdown to midnight is accurate
- [ ] SHARE RESULT shows correct today's result
- [ ] No way to replay puzzle from this screen
