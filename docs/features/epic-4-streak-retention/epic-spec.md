# Epic 4: Streak + Retention
**PRD Reference:** Feature 2 (Streak + Daily Rotation)
**Tech Stack Reference:** Section 5.2 (Redis Schema)

## Goal
Implement the daily streak counter and leaderboard that
give players a reason to return tomorrow. This is the
primary mechanic targeting the "Best Use of Retention
Mechanics" prize ($3,000).

## Acceptance Criteria
- Player streak increments when they complete today's puzzle
- Player streak resets if they miss a day
- Streak is stored per Reddit user ID in Devvit Redis
- Daily leaderboard shows top 10 players by score
- Score = base 100pts + speed bonus + first-attempt bonus
- Player who already completed today's puzzle sees
  "Come back tomorrow" state instead of puzzle

## Design Reference
See `epic-images/result-screen.png` for the streak
display on the result screen (streak pill in stats row).

## Stories
1. story-1-streak-logic
2. story-2-leaderboard
3. story-3-already-played-state

## Dependencies
- Epic 6 Story 2 (Redis bridge) must be complete
- Epic 3 Story 2 (CorrectScene stat pills) must be complete
