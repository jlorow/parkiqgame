import { Hono } from 'hono';
import { context, redis, reddit } from '@devvit/web/server';
import type {
  DecrementResponse,
  IncrementResponse,
  InitResponse,
  PuzzleCompleteResponse,
  ProgressResponse,
} from '../../shared/api';

type ErrorResponse = {
  status: 'error';
  message: string;
};

export const api = new Hono();

// ──────────────────────────────────────────────────────────
//  Puzzle Index Helpers (Story 9-1)
// ──────────────────────────────────────────────────────────

const MAX_PUZZLE_ID = 15;

async function getPuzzleIndex(userId: string): Promise<number> {
  try {
    const raw = await redis.get(`puzzleIndex:${userId}`);
    return raw ? parseInt(raw, 10) : 1;
  } catch (error) {
    console.error(`Failed to read puzzleIndex for ${userId}:`, error);
    return 1;
  }
}

async function setPuzzleIndex(userId: string, index: number): Promise<void> {
  try {
    await redis.set(`puzzleIndex:${userId}`, index.toString());
    console.log(`[redis] puzzleIndex:${userId} = ${index}`);
  } catch (error) {
    console.error(`Failed to write puzzleIndex for ${userId}:`, error);
  }
}

function nextPuzzleIndex(puzzleId: number): number {
  return puzzleId >= MAX_PUZZLE_ID ? 1 : puzzleId + 1;
}

function resolveUserId(userId: string | undefined | null): string {
  return userId ?? 'anonymous';
}

// ──────────────────────────────────────────────────────────
//  GET /api/progress (Story 9-1)
// ──────────────────────────────────────────────────────────

api.get('/progress', async (c) => {
  try {
    const user = await reddit.getCurrentUser();
    const userId = resolveUserId(user?.id);
    const puzzleIndex = await getPuzzleIndex(userId);
    console.log(`[progress] userId=${userId}, puzzleIndex=${puzzleIndex}`);
    return c.json<ProgressResponse>({ userId, puzzleIndex });
  } catch (error) {
    console.error('API progress Error:', error);
    return c.json<ProgressResponse>({ userId: 'anonymous', puzzleIndex: 1 }, 200);
  }
});

api.get('/init', async (c) => {
  const { postId } = context;

  if (!postId) {
    console.error('API Init Error: postId not found in devvit context');
    return c.json<ErrorResponse>(
      { status: 'error', message: 'postId is required but missing from context' },
      400
    );
  }

  try {
    const [count, username] = await Promise.all([
      redis.get('count'),
      reddit.getCurrentUsername(),
    ]);

    return c.json<InitResponse>({
      type: 'init',
      postId: postId,
      count: count ? parseInt(count) : 0,
      username: username ?? 'anonymous',
    });
  } catch (error) {
    console.error(`API Init Error for post ${postId}:`, error);
    let errorMessage = 'Unknown error during initialization';
    if (error instanceof Error) {
      errorMessage = `Initialization failed: ${error.message}`;
    }
    return c.json<ErrorResponse>({ status: 'error', message: errorMessage }, 400);
  }
});

api.post('/increment', async (c) => {
  const { postId } = context;
  if (!postId) {
    return c.json<ErrorResponse>({ status: 'error', message: 'postId is required' }, 400);
  }
  const count = await redis.incrBy('count', 1);
  return c.json<IncrementResponse>({ count, postId, type: 'increment' });
});

api.post('/decrement', async (c) => {
  const { postId } = context;
  if (!postId) {
    return c.json<ErrorResponse>({ status: 'error', message: 'postId is required' }, 400);
  }
  const count = await redis.incrBy('count', -1);
  return c.json<DecrementResponse>({ count, postId, type: 'decrement' });
});

// ──────────────────────────────────────────────────────────
//  POST /api/puzzle-complete
//  Advances puzzleIndex; returns { puzzleIndex }.
// ──────────────────────────────────────────────────────────

api.post('/puzzle-complete', async (c) => {
  try {
    const body = await c.req.json();
    const { puzzleId } = body;

    if (typeof puzzleId !== 'number') {
      return c.json<ErrorResponse>({ status: 'error', message: 'Invalid request body' }, 400);
    }

    const user = await reddit.getCurrentUser();
    const userId = resolveUserId(user?.id);

    const nextIndex = nextPuzzleIndex(puzzleId);
    await setPuzzleIndex(userId, nextIndex);

    console.log(`[puzzle-complete] userId=${userId}, puzzleId=${puzzleId}, nextIndex=${nextIndex}`);

    return c.json<PuzzleCompleteResponse>({ puzzleIndex: nextIndex });
  } catch (error) {
    console.error('API puzzle-complete Error:', error);
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return c.json<ErrorResponse>({ status: 'error', message: errorMessage }, 500);
  }
});
