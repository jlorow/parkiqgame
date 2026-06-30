# Story 1-1: Phaser 4 Setup
**Epic:** Game Renderer
**PRD Reference:** Feature 1 — core puzzle rendering

## User Story
As a player opening ParkIQ on Reddit, I want the game
canvas to load inside the post, so that I can see the
puzzle without leaving Reddit.

## Functional Requirements
- Install Phaser 4.1.x into the Devvit React template
- Create `PhaserGame.tsx` component that mounts a Phaser
  game instance into a div ref
- Game config: type AUTO (WebGL + Canvas fallback),
  390×844px, background #0F0F0F
- Game instance destroys cleanly on component unmount
- No scenes needed yet — blank canvas is the target output

## Non-Functional Requirements
- Canvas must render within 3 seconds on mid-range Android
- No console errors on mount or unmount

## Implementation Steps

1. Run `npm install phaser@^4.1.0` in the project root

2. Create `src/game/PhaserGame.tsx` with a useEffect that
   instantiates Phaser.Game using the config in Tech Stack
   Spec Section 4. Mount to a div ref.

3. Import and render `<PhaserGame />` inside `App.tsx`

4. Run `npm run dev` and navigate to the test subreddit
   post

🔴 REPORT BEFORE CONTINUING
Show a screenshot of the blank dark canvas rendering
inside the Reddit webview. Confirm no console errors.

5. Only proceed if canvas is visible and error-free

## VERIFIED
- [ ] Phaser 4 installed (check package.json)
- [ ] Canvas renders at correct size in Reddit webview
- [ ] Background colour is #0F0F0F
- [ ] No console errors on mount
- [ ] Component unmounts cleanly (no memory leak warning)
