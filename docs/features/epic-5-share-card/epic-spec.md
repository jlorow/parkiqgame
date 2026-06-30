# Epic 5: Share Card
**PRD Reference:** Feature 3 (Share Card)
**Tech Stack Reference:** Section 8

## Goal
Generate a Wordle-style shareable text card that players
copy and post on Reddit/social media — the primary viral
growth mechanism.

## Acceptance Criteria
- Share card shows puzzle number, green/red block row,
  and parkiq.app URL
- Blocks reflect actual attempt (correct first try = all
  green except the attempt blocks)
- Copy to clipboard works on mobile Reddit webview
- Tapping SHARE RESULT in CorrectScene or AlreadyPlayed
  screen opens the share card view

## Design Reference
See `epic-images/share-card.png` for the visual layout.

## Stories
1. story-1-share-card-generation
2. story-2-copy-clipboard

## Dependencies
- Epic 3 Story 2 (SHARE RESULT button)
- Epic 4 Story 1 (result stored in Redis)

---

# Story 5-1: Share Card Generation
**Epic:** Share Card

## User Story
As a player who just solved a puzzle, I want a
pre-formatted result card generated automatically,
so that sharing requires zero effort.

## Functional Requirements
- `src/lib/share-utils.ts` exports `generateShareText(puzzle, wasCorrect, timeTaken)`
- Returns a plain text string:
  ```
  ParkIQ #421
  🟩🟩🟥🟩🟩
  parkiq.app
  ```
- shareBlocks from puzzle.shareBlocks used as the
  block row (pre-defined per puzzle, not computed
  from player path)
- If player answered wrong: first block is 🟥,
  remaining from puzzle.shareBlocks
- ResultScene renders the share card UI:
  - Dark rounded card with puzzle number
  - Mini parking diagram (escape path only, no labels)
  - Block row
  - parkiq.app text
  - COPY TO CLIPBOARD button below card

## Implementation Steps

1. Create `src/lib/share-utils.ts` with generateShareText()

2. In ResultScene, call generateShareText() and store
   result in component state

3. Render share card UI matching epic-images/share-card.png

4. Render mini diagram — reuse ParkingGrid at 50% scale,
   overlay PathArrow for escape route only, no cars visible

🔴 REPORT BEFORE CONTINUING
Show share card rendered on screen. Text output must
match the format above exactly. Mini diagram must show
only the green escape path, no car labels.

## VERIFIED
- [ ] Share text format matches spec exactly
- [ ] Block row reflects wasCorrect state
- [ ] Mini diagram shows escape path only
- [ ] parkiq.app appears in share text

---

# Story 5-2: Copy to Clipboard
**Epic:** Share Card

## User Story
As a player, I want to tap one button to copy the
share card text, so that I can paste it anywhere
immediately.

## Functional Requirements
- COPY TO CLIPBOARD button uses navigator.clipboard.writeText()
- On success: button text changes to "Copied! ✓" for 2
  seconds then reverts
- On failure (clipboard blocked): button text changes to
  "Select text above" and the share text renders as
  selectable plain text below the card
- Clipboard write only triggers on explicit button tap
  (never auto-copies)

## Implementation Steps

1. In ResultScene, wire COPY TO CLIPBOARD button to
   navigator.clipboard.writeText(shareText)

2. Handle success: update button label to "Copied! ✓",
   revert after 2000ms using Phaser timer

3. Handle failure: render shareText as a selectable
   HTML overlay (not Phaser text — needs to be
   selectable by native OS). Use a DOM element
   absolutely positioned over the canvas.

🔴 REPORT BEFORE CONTINUING
Test copy on mobile Reddit webview (Android and iOS
if possible). Paste result into Reddit comment.
Confirm format is correct and emoji blocks appear.

## VERIFIED
- [ ] Copy works on mobile Reddit webview
- [ ] Button shows "Copied! ✓" for 2s on success
- [ ] Fallback plain text shown if clipboard blocked
- [ ] Pasted text matches share format exactly
- [ ] Emoji blocks render correctly when pasted
