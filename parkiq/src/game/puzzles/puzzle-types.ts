/** Puzzle scenario types */
export type PuzzleType = 'parallel' | 'garage' | 'reverse_bay';

/** Environment discriminator for ParkingGrid layout rendering */
export type PuzzleEnvironment = 'street' | 'garage' | 'open_lot';

/** Theme for environment-specific visual styling */
export type PuzzleTheme = 'street' | 'garage' | 'rooftop' | 'underground';

/** Difficulty rating (1 = easiest, 5 = hardest) */
export type Difficulty = 1 | 2 | 3 | 4 | 5;

/** Direction a train travels along its track */
export type TrainDirection = 'left' | 'right';

/** Configuration for one track of the Dual-Train Scissor Trap */
export type TrainConfig = {
  /** Grid row this track occupies */
  row: number;
  /** Movement direction */
  direction: TrainDirection;
  /** Train speed in px/s (positive magnitude — direction field controls sign) */
  speed: number;
  /** Gap between train segments in grid units */
  gapUnits: number;
  /** Gap in pixels (derived from gapUnits × UNIT_PX) */
  gapPx: number;
};

/** Types of obstacles that can appear in a puzzle */
export type ObstacleType = 'sedan' | 'suv' | 'pillar' | 'wall';

/**
 * A static obstacle in the parking scene.
 * Position can use either grid-space col/row or freeform pixel x/y.
 * At load time, convertGridToPixel() normalises all to x/y internally.
 */
export type Obstacle = {
  type: ObstacleType;
  /** Grid column (0–5, left to right) — legacy, converted to x at load */
  col: number;
  /** Grid row (0–5, top to bottom) — legacy, converted to y at load */
  row: number;
  /** Rotation angle in degrees (0 = facing up) */
  angle: number;
  /** Freeform pixel x (0–288, left to right) — authored directly for new puzzles */
  x?: number;
  /** Freeform pixel y (0–288, top to bottom) — authored directly for new puzzles */
  y?: number;
};

/** One step in the escape sequence (shown in expertTip flow) */
export type EscapeStep = {
  step: number;
  description: string;
};

/** Exit zone — grid position and which edge the player exits through.
 *  Legacy puzzles use col/row/direction; freeform puzzles use x/y/angle/parkingType. */
export type ExitZone = {
  col: number;
  row: number;
  /** Legacy exit direction — still used by 15 existing puzzles' rendering */
  direction: 'top' | 'bottom' | 'left' | 'right';
  /** Freeform pixel x (0–288) */
  x?: number;
  /** Freeform pixel y (0–288) */
  y?: number;
  /** Exit angle in degrees for the angled parking-type check */
  angle?: number;
  /** Parking type for tight position+angle win check.
   *  When set on ExitZone, overrides the puzzle-level parkingType. */
  parkingType?: 'parallel' | 'perpendicular' | 'angled';
};

/**
 * Full puzzle data object.
 */
export type Puzzle = {
  /** Sequential puzzle number (1-based, 1–15) */
  id: number;
  /** Type of parking scenario */
  type: PuzzleType;
  /** Visual theme for environment styling */
  theme: PuzzleTheme;
  /** Difficulty rating */
  difficulty: Difficulty;
  /** The question displayed to the player */
  question: string;
  /** Environment discriminator used by ParkingGrid */
  environment: PuzzleEnvironment;
  /** Player car position and orientation in grid units */
  playerCar: {
    col: number;
    row: number;
    angle: number;
    /** Freeform pixel x (0–288) */
    x?: number;
    /** Freeform pixel y (0–288) */
    y?: number;
  };
  /** Vehicle type — 'sedan' (default), 'truck', 'limo' (Limousine.svg), or 'semitruck' (Trailer.svg).
   *  'truck' | 'limo' | 'semitruck' all use 36×96 collision box. */
  playerVehicle?: 'sedan' | 'truck' | 'limo' | 'semitruck';
  /** Obstacles in the scene (other cars, pillars, walls) */
  obstacles: Obstacle[];
  /** Optional dual-train scissor trap configuration (bonus / final-boss levels only) */
  trains?: TrainConfig[];
  /** Exit zone — grid position and exit direction */
  exitZone: ExitZone;
  /** Optional parking type for tight position+angle win check.
   *  If set, the exit zone shrinks to 48×48 and requires the
   *  player to be within ±10° of parkingAngle. If unset, legacy
   *  96×96 touch-only exit check applies. */
  parkingType?: 'parallel' | 'perpendicular';
  /** Target angle in degrees for the parking-type win check.
   *  0 = parallel (facing up), 90 = perpendicular (facing right).
   *  Only used when parkingType is set. */
  parkingAngle?: number;
  /** Escape steps describing the correct maneuver */
  escapeSteps: EscapeStep[];
  /** Driving tip shown after solving */
  expertTip: string;
};
