/** Puzzle scenario types */
export type PuzzleType = 'parallel' | 'garage' | 'reverse_bay';

/** Environment discriminator for ParkingGrid layout rendering */
export type PuzzleEnvironment = 'street' | 'garage' | 'open_lot';

/** Difficulty rating (1 = easiest, 5 = hardest) */
export type Difficulty = 1 | 2 | 3 | 4 | 5;

/** Multiple-choice answer keys */
export type AnswerOption = 'A' | 'B' | 'C' | 'D';

/** Types of obstacles that can appear in a puzzle */
export type ObstacleType = 'sedan' | 'suv' | 'pillar' | 'wall';

/**
 * A static obstacle in the parking scene.
 * Position and angle are in grid-space coordinates.
 */
export type Obstacle = {
  type: ObstacleType;
  /** Grid X position */
  x: number;
  /** Grid Y position */
  y: number;
  /** Rotation angle in degrees (0 = facing up) */
  angle: number;
};

/**
 * One step in the correct-answer escape sequence.
 * Each puzzle has exactly 4 steps shown swipeably on the correct-answer screen.
 */
export type EscapeStep = {
  /** Ordinal position (1–4) */
  stepNumber: 1 | 2 | 3 | 4;
  /** Short heading for the step card */
  title: string;
  /** Explanation of what happens in this step */
  description: string;
  /** Word within the description that should be visually highlighted (green) */
  highlightWord: string;
};

/**
 * Full puzzle data object.
 *
 * Each puzzle represents a single parking scenario with:
 *  - A top-down car layout (player car + obstacles)
 *  - 4 multiple-choice answers with exactly 1 correct
 *  - Metadata for rendering, feedback, and sharing
 */
export type Puzzle = {
  /** Sequential puzzle number (1-based, 1–15) */
  id: number;
  /** Type of parking scenario */
  type: PuzzleType;
  /** Difficulty rating */
  difficulty: Difficulty;
  /** The question displayed to the player */
  question: string;
  /** Environment discriminator used by ParkingGrid */
  environment: PuzzleEnvironment;
  /** Player car position and orientation */
  playerCar: {
    x: number;
    y: number;
    angle: number;
  };
  /** Obstacles in the scene (other cars, pillars, walls) */
  obstacles: Obstacle[];
  /** The 4 multiple-choice answer strings keyed A–D */
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  /** The letter of the correct answer */
  correctAnswer: AnswerOption;
  /**
   * Maps each wrong-answer key to the collision description.
   * Every wrong answer must reference a named obstacle it collides with.
   */
  wrongPaths: Record<string, string>;
  /** Exactly 4 escape steps describing the correct maneuver */
  escapeSteps: EscapeStep[];
  /** Driving tip referencing a real-world concept, shown after answering */
  expertTip: string;
  /**
   * Exactly 5 emoji blocks (🟩 or 🟥) representing the attempt sequence
   * for the Wordle-style share card.
   */
  shareBlocks: string[];
};
