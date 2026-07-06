import type {
  PuzzleCompletePayload,
  PuzzleCompleteResponse,
  ProgressResponse,
} from '../shared/api';

/**
 * Fetch helper: POST /api/puzzle-complete
 * Sends: { timeTaken, puzzleId }
 * Returns: { puzzleIndex }
 */
export async function puzzleComplete(
  payload: PuzzleCompletePayload
): Promise<PuzzleCompleteResponse> {
  try {
    const response = await fetch('/api/puzzle-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`puzzleComplete: HTTP ${response.status}`);
      return { puzzleIndex: 1 };
    }

    const data: PuzzleCompleteResponse = await response.json();
    console.log('[puzzleComplete]', data);
    return data;
  } catch (error) {
    console.error('[puzzleComplete] Error:', error);
    return { puzzleIndex: 1 };
  }
}

/**
 * Fetch helper: GET /api/progress
 * Returns: { userId, puzzleIndex }
 */
export async function getProgress(): Promise<ProgressResponse> {
  try {
    const response = await fetch('/api/progress');
    if (!response.ok) {
      console.error(`getProgress: HTTP ${response.status}`);
      return { userId: 'anonymous', puzzleIndex: 1 };
    }
    const data: ProgressResponse = await response.json();
    console.log('[getProgress]', data);
    return data;
  } catch (error) {
    console.error('[getProgress] Error:', error);
    return { userId: 'anonymous', puzzleIndex: 1 };
  }
}
