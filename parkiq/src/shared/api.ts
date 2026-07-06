// ──────────────────────────────────────────────────────────
//  Progress Types (Story 9-1)
// ──────────────────────────────────────────────────────────

export type ProgressResponse = {
  userId: string;
  puzzleIndex: number;
};

// ──────────────────────────────────────────────────────────
//  Puzzle Complete Types
// ──────────────────────────────────────────────────────────

export type PuzzleCompletePayload = {
  timeTaken: number;
  puzzleId: number;
};

export type PuzzleCompleteResponse = {
  puzzleIndex: number;
};

// ──────────────────────────────────────────────────────────
//  Legacy Counter Types (from template)
// ──────────────────────────────────────────────────────────

export type InitResponse = {
  type: 'init';
  postId: string;
  count: number;
  username: string;
};

export type IncrementResponse = {
  type: 'increment';
  postId: string;
  count: number;
};

export type DecrementResponse = {
  type: 'decrement';
  postId: string;
  count: number;
};
