# Story 3-2: Correct Answer Step Sequence
**Epic:** Feedback System
**PRD Reference:** Feature 1 — correct answer UX

## User Story
As a player who answered correctly, I want to see the
escape route broken into 4 steps with arrows, so that
I understand exactly how the maneuver works.

## Functional Requirements
- CorrectScene receives `{ timeTaken, puzzle }` from
  PuzzleScene
- Top of screen: green checkmark icon, "Correct!" bold
  white, green pill badge showing answer letter + text
- Below: horizontally swipeable 4-card carousel
  - Each card: dark #1C1C1E rounded card
  - Card header: green circle step number + step title
  - Card body: parking diagram showing car position at
    this step with green directional arrow
  - Card footer: step description with highlight word
    in green (from puzzle.escapeSteps[n].highlightWord)
- Dot pagination indicator below carousel (green active)
- Cards are swipeable left/right by drag gesture
- After last card: stat pills row appears
  (Answer, Streak, Time taken)
- SHARE RESULT button (racing red) appears below stats
- "Come back tomorrow for #N" muted text at bottom

## UX Requirements
- Cards must be swipeable on mobile touch
- Partial edge of next card visible (peek effect)
- Step arrows must match puzzle.escapeSteps direction

## Implementation Steps

1. Implement CorrectScene.create() — render header
   section (checkmark, "Correct!", answer pill)

2. Implement swipeable card carousel using Phaser
   input drag events. Each card renders its step's
   diagram state and arrow using PathArrow component.

3. Implement PathArrow.ts — draws a green dashed
   curved arrow from car position in direction of step

4. Implement dot pagination that updates on card swipe

5. After user reaches card 4 (or 3 seconds auto-advance):
   reveal stat pills and SHARE RESULT button

🔴 REPORT BEFORE CONTINUING
Show screenshots of all 4 step cards for puzzle ID 1.
Each card must show the car in a different position
with a green arrow indicating the step's movement.

6. Confirm swipe gesture works on mobile Reddit webview

🔴 REPORT BEFORE CONTINUING
Confirm swipe gesture works. Show stat pills and
SHARE RESULT button visible after last card.

## VERIFIED
- [ ] 4 cards render with correct step content
- [ ] Swipe gesture works on mobile
- [ ] Peek effect shows next card edge
- [ ] Green arrows match step directions from escapeSteps
- [ ] Stat pills show correct answer, streak, time
- [ ] SHARE RESULT button present and tappable
- [ ] "Come back tomorrow" text present
