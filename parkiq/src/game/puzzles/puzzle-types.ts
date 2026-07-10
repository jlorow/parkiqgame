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
 * Position uses grid-space col/row coordinates.
 */
export type Obstacle = {
  type: ObstacleType;
  /** Grid column (0–5, left to right) */
  col: number;
  /** Grid row (0–5, top to bottom) */
  row: number;
  /** Rotation angle in degrees (0 = facing up) */
  angle: number;
};

/** One step in the escape sequence (shown in expertTip flow) */
export type EscapeStep = {
  step: number;
  description: string;
};

/** Exit zone — grid position and which edge the player exits through */
export type ExitZone = {
  col: number;
  row: number;
  direction: 'top' | 'bottom' | 'left' | 'right';
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
  playerCar: { col: number; row: number; angle: number };
  /** Obstacles in the scene (other cars, pillars, walls) */
  obstacles: Obstacle[];
  /** Optional dual-train scissor trap configuration (bonus / final-boss levels only) */
  trains?: TrainConfig[];
  /** Exit zone — grid position and exit direction */
  exitZone: ExitZone;
  /** Escape steps describing the correct maneuver */
  escapeSteps: EscapeStep[];
  /** Driving tip shown after solving */
  expertTip: string;
};
