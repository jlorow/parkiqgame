# Story 4-2: Daily Leaderboard
**Epic:** Streak + Retention
**PRD Reference:** Feature 2 — competitive retention

## User Story
As a competitive player, I want to see today's top 10
scores, so that I'm motivated to answer quickly and
return to beat others.

## Functional Requirements
- Score formula:
  - Base: 100 points
  - Speed bonus: +50 if timeTaken < 10 seconds
  - First attempt bonus: +25 if correct on first tap
  - Maximum score: 175 points
- On puzzle complete: write score to Redis sorted set
  key `leaderboard:{YYYY-MM-DD}` with score as rank value
- ResultScene shows top 10 for today:
  - Rank number, Reddit username, score
  - Current user's row highlighted in racing red
  - If current user not in top 10, pin their row at bottom
- Leaderboard data fetched from Devvit backend on
  result screen load, not cached

## Implementation Steps

1. In Devvit backend PUZZLE_COMPLETE handler (Story 4-1):
   calculate score and write to sorted set:
   `redis.zAdd('leaderboard:YYYY-MM-DD', score, userId)`

2. Add Devvit backend handler for `GET_LEADERBOARD`:
   read top 10 from sorted set, return with usernames

3. In ResultScene, send `GET_LEADERBOARD` message and
   render the response as a ranked list

4. Highlight current user's row in #E8320A

🔴 REPORT BEFORE CONTINUING
Test with 3 different Reddit accounts completing the
same puzzle. Show leaderboard displaying all 3 with
correct scores and ranking order.

## VERIFIED
- [ ] Score formula calculates correctly
- [ ] Leaderboard sorted set updates on completion
- [ ] Top 10 render on result screen
- [ ] Current user row highlighted
- [ ] User outside top 10 pinned at bottom
