# Story 3-3: Sound Effects
**Epic:** Feedback System
**PRD Reference:** Feature 1 — sensory feedback
**Tech Stack Reference:** Section 9

## User Story
As a player, I want to hear a crash on wrong answers
and a success sound on correct escapes, so that the
feedback is more satisfying and memorable.

## Functional Requirements
- 3 sound files loaded: crunch.mp3, success.mp3, tick.mp3
- crunch.mp3 plays at the moment of impact starburst
  in WrongAnswerScene (Story 3-1 step 2 tween complete)
- success.mp3 plays when step 4 card ("Escaped!") appears
- tick.mp3 plays every second when timer ≤ 10 seconds
- Sound only plays after a user gesture has been made
  (browser audio policy) — first puzzle tap counts as gesture
- If audio context is locked, sounds are silently skipped
  (no error, no broken state)
- No sound toggle UI required in MVP

## Implementation Steps

1. Generate sound files using Phaser Desktop SFX
   Generator (free at phaser.io/desktop):
   - crunch.mp3: short impact/collision sound ~300ms
   - success.mp3: positive completion sound ~500ms
   - tick.mp3: short tick/click ~100ms
   Save to `public/assets/sounds/`

2. In PhaserGame.tsx config, add audio: { disableWebAudio: false }

3. In PuzzleScene.preload(), load all 3 sound files:
   `this.load.audio('crunch', 'assets/sounds/crunch.mp3')`

4. In WrongAnswerScene, play crunch at collision moment:
   `this.sound.play('crunch')`

5. In CorrectScene, play success when card 4 renders

6. In PuzzleScene timer, play tick each second at ≤10s:
   wrap in try/catch, fail silently if audio locked

🔴 REPORT BEFORE CONTINUING
Test sound playback in Reddit webview on a real mobile
device. Confirm crunch plays on wrong answer tap,
success plays on step 4, tick plays at 10s.
Confirm no errors if sounds are blocked by browser.

## VERIFIED
- [ ] crunch.mp3 plays at collision moment
- [ ] success.mp3 plays at step 4 card
- [ ] tick.mp3 plays every second at ≤10s remaining
- [ ] No error thrown if audio context locked
- [ ] Sound files load from public/assets/sounds/
