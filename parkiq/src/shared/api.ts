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
};

export type LeaderboardEntry = {
  userId: string;
  score: number;
  rank: number;
};

export type LeaderboardData = {
  entries: LeaderboardEntry[];
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
