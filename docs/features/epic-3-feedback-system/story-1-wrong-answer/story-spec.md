# Story 3-1: Wrong Answer Animation
**Epic:** Feedback System
**PRD Reference:** Feature 1 — wrong answer feedback

## User Story
As a player who chose wrong, I want to see my car
collide with the obstacle and understand why, so that
I learn from the mistake and feel the consequence.

## Functional Requirements
- WrongAnswerScene receives `{ answer, puzzle }` from
  PuzzleScene
- Renders the same parking diagram as PuzzleScene
- Plays collision animation (Tech Stack Spec Section 7):
  - Car translates toward obstacle: 400ms ease-in
  - Impact starburst at collision point: scale 0→1.5→0, 200ms
  - Car shakes in place: 200ms horizontal oscillation
- Below diagram: shows the player's wrong answer letter
  in red, the collision reason from puzzle.wrongPaths,
  and a one-line explanation
- After animation completes: shows "Correct Answer: [C]
  [answer text]" in green pill at bottom
- "Try Again Tomorrow" muted text link below pill
  (does not allow replay — links to already-played state)

## UX Requirements
- Animation must not be skippable (too short to need skip)
- Impact starburst: red #EF4444, positioned at exact
  collision point between car and obstacle

## Implementation Steps

1. Implement WrongAnswerScene.create() — render same
   diagram as PuzzleScene (reuse ParkingGrid + CarSprite)

2. Implement collision animation using Phaser tweens:
   - tween player car position toward obstacle
   - on tween complete: show impact starburst graphic,
     trigger shake tween

3. After all tweens complete, render wrong answer
   explanation card below diagram

4. Render correct answer pill in green

🔴 REPORT BEFORE CONTINUING
Show a screen recording or sequential screenshots of
the full animation. Confirm timing matches spec:
400ms move + 200ms impact + 200ms shake.

5. Test with all 3 wrong answers from puzzle ID 1

🔴 REPORT BEFORE CONTINUING
Confirm each of the 3 wrong answer paths for puzzle 1
shows the correct collision point and explanation text.

## VERIFIED
- [ ] Car moves toward correct obstacle (not random direction)
- [ ] Impact starburst appears at collision point
- [ ] Car shake plays after impact
- [ ] Total animation duration ~800ms
- [ ] Wrong answer explanation text correct per puzzle.wrongPaths
- [ ] Correct answer pill shows after animation
