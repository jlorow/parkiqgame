# Story 4-1: Streak Logic
**Epic:** Streak + Retention
**PRD Reference:** Feature 2

## User Story
As a returning player, I want my daily streak to
increment when I complete a puzzle and reset if I
miss a day, so that I'm motivated to play every day.

## Functional Requirements
- On puzzle completion (correct or wrong): write to Redis:
  - `streak:{userId}` — increment if lastPlayed was yesterday,
    set to 1 if lastPlayed was before yesterday, keep if
    lastPlayed is today (no double-count)
  - `lastPlayed:{userId}` — set to today's date (ISO string)
- On app load: read streak and lastPlayed from Redis,
  pass to webview via message bridge
- Streak value displayed in CorrectScene stat pills
  (already wired in Epic 3 Story 2)
- Milestone badges shown on result screen at 7, 30 days

## Implementation Steps

1. In Devvit backend (`main.tsx`), add Redis read on
   app init: get `streak:{userId}` and `lastPlayed:{userId}`
   Send to webview as USER_DATA message.

2. In Devvit backend, add a message handler for
   `PUZZLE_COMPLETE` from webview. On receipt:
   - Read lastPlayed for this user
   - Calculate new streak value
   - Write updated streak + lastPlayed to Redis

3. In webview (`src/lib/devvit-client.ts`), send
   `PUZZLE_COMPLETE` message with timeTaken and
   wasCorrect after any puzzle answer

4. In CorrectScene, use streak value received on
   app init to populate stat pill

🔴 REPORT BEFORE CONTINUING
Test streak logic manually:
- Complete a puzzle → confirm streak = 1
- Complete again same day → confirm streak stays 1
- Simulate next day → confirm streak = 2
- Simulate day after tomorrow → confirm streak resets to 1
Show Redis values after each test.

## VERIFIED
- [ ] Streak increments on next-day completion
- [ ] Streak stays same if completed twice same day
- [ ] Streak resets to 1 if day skipped
- [ ] lastPlayed updates correctly
- [ ] Streak value reaches CorrectScene stat pill
