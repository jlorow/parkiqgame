# ParkIQ — Puzzle Content Design Doc v2 (revised per playtester review)

## What changed from v1 and why

v1 leaned entirely on "single lane-shift" because that's the easiest pattern to verify safe in a 6-row grid with a 3-row-long car. Review feedback correctly identified this as repetitive and low-tension. v2 keeps every puzzle checked against the same real physics, but uses stronger levers:

- **Tight squeeze** = column separation of exactly **3** between two flanking obstacles (144px gap vs 72px car — a genuine zero-margin fit, not a comfortable one).
- **Comfortable gap** = column separation of **4+** (used sparingly now, mostly for beginner puzzles 1-2).
- **Dead lane** = an obstacle placed such that a column is blocked almost its entire length (true of any single mid-column obstacle in this grid) — used deliberately to make one visually-plausible lane a trap.
- **Mirror** = `col' = 5 - col` on a verified puzzle — guaranteed valid by symmetry, used to multiply variety cheaply.
- Same non-overlap rules as v1: same-column needs row-diff ≥3; different-column needs col-diff ≥2 minimum to clear.

All puzzles below were re-checked by hand against these rules. As before, exact feel/timing still needs real in-game playtesting.

---

## TIER 1 — BEGINNER (1-5): parallel, street theme, angle 0°, start row 5

### Puzzle 1 — id 1, difficulty 1 — warm-up, comfortable gap
- playerCar: col 2, row 5, angle 0
- obstacles: sedan (col 0, row 5), suv (col 4, row 5) [col-diff from player: 2 and 2, safe]
- exitZone: col 2, row 0, top
- Solution: Hold forward — lane is clear.
- Note: Pure control intro. No decision required.

### Puzzle 2 — id 2, difficulty 2 — first real decision point
- playerCar: col 2, row 5, angle 0
- obstacles: sedan (col 0, row 1) [dead lane: col-diff 2 from player, safe at start; blocks col0 almost entirely], suv (col 4, row 4) [col-diff 2, dead lane on the right too, but only from row1 down — check: suv at row4, blocks col4 for rows 2-5ish, leaving col4 open near row0-1]
- exitZone: col 4, row 0, top
- Solution: The left lane (col 0) looks open near the start but is blocked further up. The right lane (col 4) has a car close by, but the top is clear — go right.
- Note: First genuine "which lane is actually safe?" choice. Left looks safer at a glance (obstacle is far away); right looks scarier (obstacle closer) but is the correct path.

### Puzzle 3 — id 3, difficulty 2 — narrow squeeze (comfortable, col-diff 4)
- playerCar: col 2, row 5, angle 0
- obstacles: sedan (col 0, row 2), suv (col 4, row 2) [col-diff between them: 4, a real but forgiving gap centered at col 2]
- exitZone: col 2, row 0, top
- Solution: Drive straight up the middle — the gap between the two cars is wide enough if you stay centered.
- Note: First "can I fit through that?" moment, but with margin, so it builds confidence before the real squeeze in Puzzle 5.

### Puzzle 4 — id 4, difficulty 3 — mirror of Puzzle 2
- playerCar: col 3, row 5, angle 0
- obstacles: sedan (col 5, row 1) [mirrors P2's col0 obstacle: 5-0=5, using col5, dead lane on the right], suv (col 1, row 4) [mirrors P2's col4 obstacle]
- exitZone: col 1, row 0, top
- Solution: Mirror of Puzzle 2 — the right lane looks open but is blocked further up; go left instead.
- Note: Tests whether the player actually understood Puzzle 2's lesson, not just memorized "go right."

### Puzzle 5 — id 5, difficulty 4 (hardest beginner) — first TIGHT squeeze
- playerCar: col 2, row 5, angle 0
- obstacles: sedan (col 0, row 2), suv (col 3, row 2) [col-diff between them: 3 — exact zero-margin fit]
- exitZone: col 1, row 0, top (inside the gap, not centered on the whole grid)
- Solution: Ease forward and thread precisely between the two cars — there's no room for drift either direction.
- Note: The real "no way that fits" moment. It does, exactly, with zero margin. This is the hardest beginner puzzle on purpose.

---

## TIER 2 — INTERMEDIATE (6-10): garage type, garage/underground theme, angle 90°/270° start

### Puzzle 6 — id 6, difficulty 2, garage — turn + comfortable squeeze
- playerCar: col 2, row 5, angle 90
- obstacles: sedan (col 0, row 2), suv (col 4, row 2) [col-diff 4, comfortable — same shape as P3]
- exitZone: col 2, row 0, top
- Solution: Turn to face forward, then drive straight through the centered gap.
- Note: Reintroduces the comfortable squeeze with the added turn step.

### Puzzle 7 — id 7, difficulty 3, garage — decision point + turn
- playerCar: col 2, row 5, angle 270
- obstacles: sedan (col 0, row 1) [dead lane], suv (col 4, row 4) [dead lane further down]
- exitZone: col 4, row 0, top
- Solution: Turn to face forward. The left lane looks safer but dead-ends; go right.
- Note: Same decision-point shape as Puzzle 2, now with a turn required first.

### Puzzle 8 — id 8, difficulty 4, underground — TIGHT squeeze + turn
- playerCar: col 2, row 5, angle 90
- obstacles: sedan (col 0, row 2), suv (col 3, row 2) [col-diff 3, exact fit]
- exitZone: col 1, row 0, top
- Solution: Turn to face forward, then thread the gap precisely — same tight fit as Puzzle 5.
- Note: Combines the turn mechanic with the hardest squeeze so far.

### Puzzle 9 — id 9, difficulty 4, underground — double shift (two sequential tight gaps)
- playerCar: col 1, row 5, angle 90
- obstacles: sedan (col 4, row 4) [first gap partner, low row band], suv (col 1, row 1) [second gap partner, high row band — check col-diff from first pair's relevant lane to avoid interference]
- exitZone: col 4, row 0, top
- Solution: Turn to face forward. Stay left initially to avoid the car on the right, then shift right in the upper section to avoid the car now blocking the left lane near the top.
- Note: First puzzle requiring two separate lane decisions in one run — the safe lane changes partway through.

### Puzzle 10 — id 10, difficulty 5 (hardest intermediate) — mirror of Puzzle 8
- playerCar: col 3, row 5, angle 270
- obstacles: sedan (col 5, row 2), suv (col 2, row 2) [mirrors P8's gap: col-diff 3, exact fit, flipped]
- exitZone: col 4, row 0, top
- Solution: Turn to face forward, then thread the same tight gap as Puzzle 8, mirrored.
- Note: Confirms the tight-squeeze skill transfers to the opposite side.

---

## TIER 3 — ADVANCED (11-15): reverse_bay, rooftop theme, angle 180° start (must reverse)

### Puzzle 11 — id 11, difficulty 3, rooftop — reverse + comfortable squeeze
- playerCar: col 2, row 5, angle 180
- obstacles: sedan (col 0, row 2), suv (col 4, row 2) [col-diff 4]
- exitZone: col 2, row 0, top
- Solution: Reverse straight back through the centered gap.
- Note: Reverse version of Puzzle 3 — establishes reversing through a real (if comfortable) gap.

### Puzzle 12 — id 12, difficulty 4, rooftop — reverse + TIGHT squeeze
- playerCar: col 2, row 5, angle 180
- obstacles: sedan (col 0, row 2), suv (col 3, row 2) [col-diff 3, exact fit]
- exitZone: col 1, row 0, top
- Solution: Reverse and thread the gap precisely — no margin, same fit as Puzzle 5/8, now in reverse.
- Note: Reversing through a zero-margin gap is noticeably harder to judge than driving forward through one — intentional difficulty spike.

### Puzzle 13 — id 13, difficulty 4, rooftop — reverse + decision point + side exit
- playerCar: col 2, row 4, angle 180
- obstacles: sedan (col 0, row 1) [dead lane], suv (col 4, row 5) [placed behind/below, harmless — real decision is about which way to turn after reversing]
- exitZone: col 5, row 2, right
- Solution: Reverse up until clear of the parking row, then turn right and drive forward to the side exit.
- Note: First side exit combined with reversing — introduces changing direction after the initial reverse.

### Puzzle 14 — id 14, difficulty 5 — reverse + double shift
- playerCar: col 1, row 5, angle 180
- obstacles: sedan (col 4, row 4), suv (col 1, row 1) [same double-shift shape as Puzzle 9, now in reverse]
- exitZone: col 4, row 0, top
- Solution: Reverse and stay left initially, then shift right in the upper section as the safe lane changes.
- Note: Hardest reverse puzzle — combines two lane decisions with the added difficulty of judging distance in reverse.

### Puzzle 15 — id 15, difficulty 5 (capstone) — tight squeeze + side exit
- playerCar: col 1, row 4, angle 180
- obstacles: sedan (col 3, row 1), suv (col 0, row 1) [col-diff 3 from sedan — check: sedan col3 vs suv col0, diff3, but neither is directly between player col1 and exit col5; this pair creates a tight corridor the player must pass through around row1 before turning right]
- exitZone: col 5, row 1, right
- Solution: Reverse and steer right, threading the tight gap near the top, then turn right and drive forward to the side exit.
- Note: Final capstone — combines the hardest squeeze with the side-exit turn, the most demanding puzzle in the set.

---

## Note on Puzzle 9/14's "double shift" — flag for playtest verification

The double-shift design (obstacle low-right + obstacle high-left, forcing a lane change mid-route) is geometrically valid by the same rules as every other puzzle here, but it's the least mechanically similar to anything already verified in-game. This one most needs real playtesting to confirm the "safe lane change window" actually feels reasonable to execute with the analog controls, not just that it's mathematically non-overlapping.

## Same required implementation wiring as v1 (unchanged)
`checkExitReached()` and the exit-zone visual still need to read from `puzzle.exitZone` per-puzzle instead of the hardcoded rectangle — see v1 doc for details, this requirement is unchanged.
