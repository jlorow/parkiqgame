Epic 9 — Visual Foundation & Rendering Architecture
Goal

Bring ParkIQ's gameplay presentation in line with the approved visual mockups by restructuring the rendering architecture, layout, and UI while preserving all gameplay mechanics and puzzle geometry.

Non Goals

Do NOT

redesign gameplay
modify puzzles
change collision sizes
change UNIT_PX
change puzzle JSON
alter driving mechanics
Success Criteria

By the end of this epic:

✅ playfield visually dominates the screen

✅ controls integrate naturally beneath gameplay

✅ car cannot leave playfield

✅ one unified rendering pipeline

✅ four visually distinct themes

✅ believable parking environments

✅ renderer supports future themes cleanly

Story 9.1

Visual Layout Architecture

Goal

Redesign layout.

No art.

Deliverables

new playfield proportions
HUD sizing
control positioning
card sizing
spacing
responsive layout
Story 9.2

Rendering Pipeline

Goal

Merge three theme renderers into one.

Deliverables

single environment renderer

single theme ownership

single draw order

Story 9.3

Movement Bounds

Goal

Player can never leave parking lot.

Deliverables

world bounds

movement clamping

visual bounds == gameplay bounds

Story 9.4

Environment Rendering

Goal

Replace prototype parking lot with believable locations.

Deliverables

street

garage

rooftop

underground

Story 9.5

Visual Polish

Goal

Final pass.

Deliverables

shadows

lighting

props

exit

theme polish

micro details