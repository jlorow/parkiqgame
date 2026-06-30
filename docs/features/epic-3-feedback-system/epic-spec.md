# Epic 3: Feedback System
**PRD Reference:** Feature 1 — wrong/correct answer UX
**Tech Stack Reference:** Section 7 (Animation Spec)

## Goal
Deliver the visceral wrong-answer collision animation and
the educational correct-answer step sequence that make
ParkIQ memorable and shareable.

## Acceptance Criteria
- Wrong answer: player car animates toward the named
  obstacle, collision impact marker appears, one-line
  explanation shows, correct answer is revealed
- Correct answer: 4-step swipeable card sequence plays
  showing escape path with green arrows
- Sound effects play on collision and on "Escaped!" card
  (after user gesture gate)
- All animations complete within spec timings from
  Tech Stack Spec Section 7

## Design Reference
- `epic-images/wrong-answer-reveal.png` — wrong answer
  3-panel layout (desktop reference, adapt to mobile carousel)
- `epic-images/correct-answer-steps.png` — 4-step desktop
  reference
- `epic-images/correct-sequence-mobile.png` — mobile
  carousel implementation target

## Stories
1. story-1-wrong-answer
2. story-2-correct-sequence
3. story-3-sound-effects

## Dependencies
- Epic 1 (all stories) — car components + scene manager
- Epic 2 Story 1 — puzzle schema (wrongPaths, escapeSteps)
- Epic 2 Story 2 — puzzle renderer (scene transition data)
