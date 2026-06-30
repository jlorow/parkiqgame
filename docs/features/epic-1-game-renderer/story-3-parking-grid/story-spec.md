# Story 1-3: Parking Grid
**Epic:** Game Renderer
**PRD Reference:** Feature 1 — puzzle diagram environment

## User Story
As a player, I want to see parking bay lines and road
surface in the diagram, so that I can read the spatial
layout of the scenario.

## Functional Requirements
- `ParkingGrid.ts` — renders the environment layer
  beneath cars
- Road surface: fill entire canvas area with #1C1C1E
- Bay lines: white (#FFFFFF) 2px stroke rectangles
  at grid-unit intervals
- Supports 3 environment types passed as config:
  - `street` — vertical bay lines, centre driving lane
  - `garage` — bay lines + solid pillar rectangles (#1F2937)
  - `open_lot` — horizontal bay lines, wider driving lane
- Grid constants from Tech Stack Spec Section 8

## Non-Functional Requirements
- Grid renders before cars (z-order: grid → obstacles → player)
- Pillar rectangles in garage type must be clearly
  distinguishable from cars

## Implementation Steps

1. Create `src/game/components/ParkingGrid.ts`

2. Implement `drawStreet(scene, config)` —
   road surface + vertical bay lines

3. Implement `drawGarage(scene, config)` —
   road surface + bay lines + pillar rectangles

4. Implement `drawOpenLot(scene, config)` —
   road surface + horizontal bay lines

5. Test each environment type in isolation with no cars.
   Confirm bay lines are clearly visible at 390px width.

🔴 REPORT BEFORE CONTINUING
Show screenshots of all 3 environment types.
Bay lines must be clearly readable on dark background.

6. After approval, ParkingGrid is ready for use
   in Epic 2 Story 2.

## VERIFIED
- [ ] Street environment renders correctly
- [ ] Garage environment renders with visible pillars
- [ ] Open lot environment renders correctly
- [ ] Z-order correct (grid behind cars)
- [ ] Bay lines readable on #1C1C1E background
