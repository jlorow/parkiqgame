import type {
  UserData,
  PuzzleCompletePayload,
  PuzzleCompleteResponse,
  LeaderboardData,
  ResultTodayResponse,
} from '../shared/api';

/**
 * Fetch helper: GET /api/user-data
 * Returns: { userId, streak, lastPlayed, serverDate }
 * 
 * Falls back to default values if the API call fails:
 * - streak: 0
 * - lastPlayed: null
 * - serverDate: current time
 */
export async function getUserData(): Promise<UserData> {
  try {
    const response = await fetch('/api/user-data');

    if (!response.ok) {
      console.error(`getUserData: HTTP ${response.status}`);
      return {
        userId: 'anonymous',
        streak: 0,
        lastPlayed: null,
        serverDate: new Date().toISOString(),
      };
    }

    const data: UserData = await response.json();
    console.log('[getUserData]', data);
    return data;
  } catch (error) {
    console.error('[getUserData] Error:', error);
    return {
      userId: 'anonymous',
      streak: 0,
      lastPlayed: null,
      serverDate: new Date().toISOString(),
    };
  }
}

/**
 * Fetch helper: POST /api/puzzle-complete
 * Sends: { timeTaken, wasCorrect, shareBlocks, puzzleId }
 * Returns: { streak, score }
 * 
 * Falls back to score: 0 if the API call fails.
 */
export async function puzzleComplete(
  payload: PuzzleCompletePayload
): Promise<PuzzleCompleteResponse> {
  try {
    const response = await fetch('/api/puzzle-complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`puzzleComplete: HTTP ${response.status}`);
      return {
        streak: 0,
        score: 0,
      };
    }

    const data: PuzzleCompleteResponse = await response.json();
    console.log('[puzzleComplete]', data);
    return data;
  } catch (error) {
    console.error('[puzzleComplete] Error:', error);
    return {
      streak: 0,
      score: 0,
    };
  }
}

/**
 * Fetch helper: GET /api/leaderboard
 * Returns: { entries: [{userId, score, rank}] }
 * 
 * Falls back to empty entries if the API call fails.
 */
export async function getLeaderboard(): Promise<LeaderboardData> {
  try {
    const response = await fetch('/api/leaderboard');

    if (!response.ok) {
      console.error(`getLeaderboard: HTTP ${response.status}`);
      return {
        entries: [],
      };
    }

    const data: LeaderboardData = await response.json();
    console.log('[getLeaderboard]', data);
    return data;
  } catch (error) {
    console.error('[getLeaderboard] Error:', error);
    return {
      entries: [],
    };
  }
}

/**
 * Fetch helper: GET /api/result-today
 * Returns: { shareBlocks: string[] | null }
 *
 * Falls back to null if the API call fails.
 */
export async function getResultToday(): Promise<ResultTodayResponse> {
  try {
    const response = await fetch('/api/result-today');

    if (!response.ok) {
      console.error(`getResultToday: HTTP ${response.status}`);
      return { shareBlocks: null };
    }

    const data: ResultTodayResponse = await response.json();
    console.log('[getResultToday]', data);
    return data;
  } catch (error) {
    console.error('[getResultToday] Error:', error);
    return { shareBlocks: null };
  }
}
