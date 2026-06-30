# ParkIQ — MVP PRD
**Date:** June 29, 2026
**Version:** 1.0 — Hackathon Submission Scope

---

### 1. Executive Summary

**Elevator Pitch:**
A daily parking puzzle game where drivers judge the correct escape maneuver from a top-down scenario.

**Problem Statement:**
Millions of drivers encounter real parking situations they misjudge — tight garages, parallel park escapes, reverse bay entries — yet no engaging tool exists to sharpen this spatial judgment. Viral social posts (11M+ views) prove people actively debate these scenarios but have nowhere to play them. Driving theory apps are dry and forgettable; existing games don't teach real maneuver judgment.

**Target User:**
Car enthusiasts, learner drivers, and petrolheads aged 17–35 who consume driving content on social media and want a quick, satisfying daily brain challenge tied to real-world scenarios.

**Proposed Solution:**
A Wordle-style daily puzzle PWA built on Reddit (Devvit Web) where players view a top-down parking diagram and pick the correct escape direction from 4 options — with animated wrong/correct feedback and a shareable result card.

**MVP Success Metric:**
Day-7 retention rate ≥ 25% (players returning 7 days after first play), measured via Devvit Redis streak data.

---

### 2. Key Features (Max 3)

---

#### Feature 1: Daily Parking Puzzle

**User Story:**
As a driver, I want to see a top-down parking scenario and pick the correct escape maneuver, so that I can test my spatial judgment in under 60 seconds.

**Acceptance Criteria:**
- Given the puzzle screen loads, when the player taps an answer button, then the diagram immediately shows whether the path succeeds or collides
- Given a correct answer, when the animation completes, then the 4-step escape sequence plays automatically
- Given a wrong answer, when the player taps, then the collision is shown with a one-line explanation of why it fails
- Given any answer, when the result is shown, then a Share Result button appears

**Priority:** P0 — this is the entire game

**Dependencies / Risks:**
- SVG car component library must be built before any puzzle can render
- All 15 launch puzzles must be hand-authored and verified solvable before submission

---

#### Feature 2: Streak + Daily Rotation

**User Story:**
As a returning player, I want a new puzzle every day and a visible streak counter, so that I have a reason to come back tomorrow.

**Acceptance Criteria:**
- Given a player has already completed today's puzzle, when they return, then they see "Come back tomorrow for #[N]" and their current streak
- Given a player misses a day, when they return, then their streak resets to 0
- Given today's date, when the puzzle loads, then it always maps to the same puzzle number for all players (deterministic by date)
- Given a player's streak, when it hits 7 / 30 days, then a milestone badge is displayed on the result screen

**Priority:** P0 — core retention mechanic; directly targets the hackathon "Best Use of Retention Mechanics" prize

**Dependencies / Risks:**
- Requires Devvit Redis for per-user streak persistence across sessions
- Reddit's webview session model must reliably identify returning users

---

#### Feature 3: Share Card

**User Story:**
As a player who just solved a puzzle, I want to copy a shareable result card, so that I can post my score on social media and challenge others.

**Acceptance Criteria:**
- Given the result screen, when the player taps Share Result, then a card is generated showing: puzzle number, Wordle-style green/red block row, and parkiq.app URL
- Given the share card, when copied, then it pastes as plain text + emoji blocks (no image file required)
- Given a wrong-first-then-correct attempt, when the share card generates, then the block row reflects the actual attempt sequence

**Priority:** P1 — primary viral growth mechanism; secondary to core puzzle but must ship at launch

**Dependencies / Risks:**
- Clipboard API requires user gesture trigger (tap) — cannot auto-copy on load
- Share card text format must look good on Reddit comments, X/Twitter, and WhatsApp

---

### 3. Requirements Overview

**Functional:**
- Load today's puzzle from a static JSON array indexed by date offset from launch date
- Render top-down parking diagram using Phaser 4 with flat 2D SVG-style car shapes
- Accept one tap input per puzzle (A/B/C/D) — no re-attempts without penalty
- Animate wrong answer: car moves toward obstacle, stops at collision point with impact marker
- Animate correct answer: 4-card step sequence showing escape path with green arrows
- Store streak and last-played date in Devvit Redis per Reddit user ID
- Generate share card text on result screen
- Display daily leaderboard (top 10 scores by time-to-answer) from Devvit Redis sorted set

**Integration Points:**
- Devvit Web (Reddit's developer platform) — hosting, user identity, Redis storage
- Phaser 4 — game rendering and animation
- Reddit Interactive Posts — game entry point in feed

**Non-Functional:**
- Performance: Game loads inside Reddit webview in under 3 seconds on a mid-range Android device
- Security: User identity handled entirely by Devvit/Reddit — no custom auth required
- Accessibility: All 4 answer options reachable by tap; minimum touch target 44×44px

**UX Requirements:**
- Intended experience: One-screen, under-60-second daily ritual that feels satisfying to complete and embarrassing to get wrong.
- Must-have UX principles:
  1. Immediate feedback — every tap produces a visible response within 300ms
  2. No dead ends — every state (correct, wrong, already-played) has a clear next action

---

### 4. Validation Plan

**Core Hypothesis:**
Drivers will return daily to a parking judgment puzzle if the feedback is visceral, the result is shareable, and the challenge rotates.

**Key Assumption:**
The viral engagement seen on parking scenario posts (11M views on X) translates into active daily game play, not just passive viewing.

**Next Step:**
Submit to Reddit hackathon by July 4 with 15 live puzzles across 3 scenario types. Measure 7-day retention from launch day cohort via Devvit Redis streak data. If Day-7 retention exceeds 25%, proceed to standalone PWA build post-hackathon.

---

### 5. Critical Questions Checklist

**1. Who is the primary user and what is their core job-to-be-done?**
Drivers aged 17–35 who want a quick, satisfying daily challenge that tests real spatial judgment. Their job-to-be-done is feeling competent (or humorously incompetent) about parking scenarios they encounter in real life.

**2. What is the riskiest assumption in this MVP?**
That puzzle engagement converts from "interesting to watch" to "worth playing daily." The social post data proves passive interest; active return behaviour is unproven until launch.

**3. What does success look like at the end of the hackathon period?**
A live Reddit game with 15 working puzzles, measurable Day-7 retention above 25%, and at least one sub-prize placement (target: Best Use of Retention Mechanics, $3,000).

**4. What is explicitly OUT of scope for this MVP?**
AI puzzle generation, user-submitted scenarios, premium tiers, push notifications, standalone PWA deployment, full vehicle library (trailers, forklifts), admin dashboard, and any puzzle type beyond the 3 defined scenario types.

**5. What is the biggest technical risk?**
Devvit's webview rendering environment may constrain Phaser 4's WebGL renderer on lower-end Android devices inside the Reddit app. Fallback to Canvas renderer must be tested on Day 1 of environment setup.
