# ParkIQ — Project Documentation
**For LLM Coding Agents (Freebuff CLI and equivalents)**

---

## What This Directory Is

This is the single source of truth for building ParkIQ —
a daily parking puzzle game built on Reddit's Devvit Web
platform for the Reddit Games With a Hook Hackathon (deadline
July 16, 2026).

---

## How To Use This Directory

### Always Read First
- `features/epic-N-name/` — each epic is a major deliverable
- `features/epic-N-name/pm-notes/PRD.md` — links each epic
  back to the PRD requirement it satisfies
- `features/epic-N-name/epic-images/` — design screenshots
  from the product designer. **If images are present, read
  them before writing any implementation plan for that epic.**

### Before Implementing Any Story
1. Read the epic's `epic-spec.md` for context
2. Read the story's `story-spec.md` for acceptance criteria
3. Check `story-images/` for any screen-specific designs
4. **Ask the user to confirm your understanding of the
   feature's intended function before writing code**
5. Reference the PRD in `pm-notes/PRD.md` for any detail
   not covered in the story spec

### Design Images May Or May Not Be Present
Some stories have screen designs in `story-images/`.
Some do not — especially infrastructure stories (Devvit
setup, Redis bridge). For stories without images, infer
the visual intent from the epic-level images and the
color/layout constants in the Tech Stack Spec.

---

## Epic Build Order (Strict — Do Not Reorder)

```
EPIC 1: Game Renderer        ← build first, everything depends on it
EPIC 6: Devvit Integration   ← set up platform before game logic
EPIC 2: Puzzle Engine        ← requires renderer + Devvit shell
EPIC 3: Feedback System      ← requires puzzle engine
EPIC 4: Streak + Retention   ← requires Redis bridge from Epic 6
EPIC 5: Share Card           ← requires feedback system + streak
```

---

## Key Reference Documents

| Document | Location |
|---|---|
| PRD | `features/*/pm-notes/PRD.md` (same file, linked per epic) |
| Tech Stack Spec | `../project-documentation/tech-stack-spec.md` |
| Puzzle Data | Defined in Epic 2, Story 1 |
| Visual Constants | Tech Stack Spec, Section 8 |
| Redis Schema | Tech Stack Spec, Section 5.2 |

---

## Story Format Convention

Every story uses this format:
- **Numbered steps** — implementation tasks in order
- **Report gates** — marked `🔴 REPORT BEFORE CONTINUING`
  — agent must stop, show output, wait for approval
- **VERIFIED block** — at the end of every story, agent
  must confirm each acceptance criterion is met before
  marking the story complete

---

## What Is Explicitly Out Of Scope

Do not build, suggest, or scaffold any of the following:
- AI puzzle generation
- User-submitted scenarios
- Standalone PWA / Next.js build
- Supabase or external database
- Premium features or payments
- Push notifications
- Admin dashboard
- Large vehicle types (trailers, forklifts)
