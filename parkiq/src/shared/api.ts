// ──────────────────────────────────────────────────────────
//  User Data & Leaderboard Types
// ──────────────────────────────────────────────────────────

export type UserData = {
  userId: string;
  streak: number;
  lastPlayed: string | null; // ISO date string
  serverDate: string; // ISO date string
};

export type PuzzleCompletePayload = {
  timeTaken: number;
  wasCorrect: boolean;
  shareBlocks: string[];
  puzzleId: number;
};

export type PuzzleCompleteResponse = {
  streak: number;
  score: number;
  /** The next puzzle the player should see (1–15, wraps). Added in Story 9-1. */
  puzzleIndex?: number;
};

export type LeaderboardEntry = {
  userId: string;
  score: number;
  rank: number;
};

export type LeaderboardData = {
  entries: LeaderboardEntry[];
};

export type ResultTodayResponse = {
  shareBlocks: string[] | null;
};

// ──────────────────────────────────────────────────────────
//  Progress Types (Story 9-1)
// ──────────────────────────────────────────────────────────

/**
 * Response from GET /api/progress.
 * puzzleIndex defaults to 1 for new players; wraps from 15 → 1.
 */
export type ProgressResponse = {
  userId: string;
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
