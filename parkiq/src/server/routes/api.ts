import { Hono } from 'hono';
import { context, redis, reddit } from '@devvit/web/server';
import type {
  DecrementResponse,
  IncrementResponse,
  InitResponse,
  UserData,
  PuzzleCompleteResponse,
  LeaderboardData,
  ResultTodayResponse,
} from '../../shared/api';

type ErrorResponse = {
  status: 'error';
  message: string;
};

export const api = new Hono();

// ──────────────────────────────────────────────────────────
//  GET /api/init (legacy counter endpoint)
// ──────────────────────────────────────────────────────────

api.get('/init', async (c) => {
  const { postId } = context;

  if (!postId) {
    console.error('API Init Error: postId not found in devvit context');
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required but missing from context',
      },
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
    return c.json<ErrorResponse>(
      { status: 'error', message: errorMessage },
      400
    );
  }
});

api.post('/increment', async (c) => {
  const { postId } = context;
  if (!postId) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required',
      },
      400
    );
  }

  const count = await redis.incrBy('count', 1);
  return c.json<IncrementResponse>({
    count,
    postId,
    type: 'increment',
  });
});

api.post('/decrement', async (c) => {
  const { postId } = context;
  if (!postId) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required',
      },
      400
    );
  }

  const count = await redis.incrBy('count', -1);
  return c.json<DecrementResponse>({
    count,
    postId,
    type: 'decrement',
  });
});

// ──────────────────────────────────────────────────────────
//  GET /api/user-data
//  Returns: userId, streak, lastPlayed, serverDate
// ──────────────────────────────────────────────────────────

api.get('/user-data', async (c) => {
  try {
    const user = await reddit.getCurrentUser();
    const userId = user?.id;

    if (!userId) {
      console.error('API user-data Error: userId not found');
      return c.json<UserData>(
        {
          userId: 'anonymous',
          streak: 0,
          lastPlayed: null,
          serverDate: new Date().toISOString(),
        },
        200
      );
    }

    // Read streak and lastPlayed from Redis with try/catch per requirements
    let streak = 0;
    let lastPlayed: string | null = null;

    try {
      const streakStr = await redis.get(`streak:${userId}`);
      streak = streakStr ? parseInt(streakStr) : 0;
    } catch (error) {
      console.error(`Failed to read streak for ${userId}:`, error);
      streak = 0;
    }

    try {
      const lastPlayedStr = await redis.get(`lastPlayed:${userId}`);
      lastPlayed = lastPlayedStr ?? null;
    } catch (error) {
      console.error(`Failed to read lastPlayed for ${userId}:`, error);
      lastPlayed = null;
    }

    const serverDate = new Date().toISOString();

    console.log(
      `[user-data] userId=${userId}, streak=${streak}, lastPlayed=${lastPlayed}, serverDate=${serverDate}`
    );

    return c.json<UserData>({
      userId,
      streak,
      lastPlayed,
      serverDate,
    });
  } catch (error) {
    console.error('API user-data Error:', error);
    return c.json<UserData>(
      {
        userId: 'anonymous',
        streak: 0,
        lastPlayed: null,
        serverDate: new Date().toISOString(),
      },
      200
    );
  }
});

// ──────────────────────────────────────────────────────────
//  POST /api/puzzle-complete
//  Writes streak, lastPlayed, score, leaderboard, result to Redis
// ──────────────────────────────────────────────────────────

api.post('/puzzle-complete', async (c) => {
  try {
    const body = await c.req.json();
    const { timeTaken, wasCorrect, shareBlocks, puzzleId } = body;

    // Validate input
    if (
      typeof timeTaken !== 'number' ||
      typeof wasCorrect !== 'boolean' ||
      !Array.isArray(shareBlocks) ||
      typeof puzzleId !== 'number'
    ) {
      return c.json<ErrorResponse>(
        {
          status: 'error',
          message: 'Invalid request body',
        },
        400
      );
    }

    const user = await reddit.getCurrentUser();
    const userId = user?.id;

    if (!userId) {
      return c.json<ErrorResponse>(
        {
          status: 'error',
          message: 'userId not found',
        },
        401
      );
    }

    // Calculate score: 100 base + 50 if timeTaken < 10 + 25 if wasCorrect on first attempt
    let score = 100;
    if (timeTaken < 10) {
      score += 50;
    }
    if (wasCorrect) {
      score += 25;
    }

    console.log(
      `[puzzle-complete] userId=${userId}, timeTaken=${timeTaken}, wasCorrect=${wasCorrect}, puzzleId=${puzzleId}, score=${score}`
    );

    // Get today's date (ISO string, YYYY-MM-DD format)
    const todayDate = new Date();
    const today = todayDate.toISOString().split('T')[0]!;

    // Read lastPlayed to determine streak logic
    let streak = 1; // Default to 1 for first solve or new player
    try {
      const lastPlayedStr = await redis.get(`lastPlayed:${userId}`);
      const currentStreakStr = await redis.get(`streak:${userId}`);

      if (lastPlayedStr && currentStreakStr) {
        const lastPlayedDate = lastPlayedStr; // Already in YYYY-MM-DD format
        const currentStreak = parseInt(currentStreakStr);

        // Check if lastPlayed was yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0]!;

        if (lastPlayedDate === yesterdayStr) {
          // Increment streak if last played was yesterday
          streak = currentStreak + 1;
        } else if (lastPlayedDate === today) {
          // Keep streak if already played today
          streak = currentStreak;
        } else {
          // Reset to 1 if older than yesterday
          streak = 1;
        }
      }
    } catch (error) {
      console.error(`Failed to calculate streak for ${userId}:`, error);
      streak = 1;
    }

    // Write all Redis keys with try/catch per requirements
    try {
      await redis.set(`streak:${userId}`, streak.toString());
      console.log(`[redis] streak:${userId} = ${streak}`);
    } catch (error) {
      console.error(`Failed to write streak for ${userId}:`, error);
    }

    try {
      await redis.set(`lastPlayed:${userId}`, today);
      console.log(`[redis] lastPlayed:${userId} = ${today}`);
    } catch (error) {
      console.error(`Failed to write lastPlayed for ${userId}:`, error);
    }

    try {
      await redis.set(`score:${today}:${userId}`, score.toString());
      console.log(`[redis] score:${today}:${userId} = ${score}`);
    } catch (error) {
      console.error(`Failed to write score for ${userId}:`, error);
    }

    // Add to leaderboard sorted set (higher score = better)
    try {
      await redis.zAdd(`leaderboard:${today}`, {
        member: userId,
        score: score,
      });
      console.log(`[redis] leaderboard:${today} added ${userId} with score ${score}`);
    } catch (error) {
      console.error(`Failed to add to leaderboard for ${userId}:`, error);
    }

    // Write result (shareBlocks as JSON)
    // Fix: if wasCorrect is false, replace first block with 🟥 to reflect actual attempt
    const blocksToStore = wasCorrect
      ? shareBlocks
      : shareBlocks.map((block, index) => (index === 0 ? '🟥' : block));
    try {
      await redis.set(
        `result:${userId}:${today}`,
        JSON.stringify(blocksToStore)
      );
      console.log(
        `[redis] result:${userId}:${today} = ${JSON.stringify(blocksToStore)}`
      );
    } catch (error) {
      console.error(`Failed to write result for ${userId}:`, error);
    }

    const response: PuzzleCompleteResponse = {
      streak,
      score,
    };

    console.log(`[puzzle-complete] response: ${JSON.stringify(response)}`);

    return c.json<PuzzleCompleteResponse>(response);
  } catch (error) {
    console.error('API puzzle-complete Error:', error);
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: errorMessage,
      },
      500
    );
  }
});

// ──────────────────────────────────────────────────────────
//  GET /api/leaderboard
//  Returns top 10 from today's leaderboard sorted set
// ──────────────────────────────────────────────────────────

api.get('/leaderboard', async (c) => {
  try {
    const todayDate = new Date();
    const today = todayDate.toISOString().split('T')[0]!;
    const leaderboardKey = `leaderboard:${today}`;

    // Read top 10 from sorted set (descending by score)
    let entries: { userId: string; score: number; rank: number }[] = [];

    try {
      const results = await redis.zRange(leaderboardKey, 0, 9, {
        by: 'rank',
        reverse: true,
      });

      // zRange returns an array of members; we need to fetch scores too
      if (results && results.length > 0) {
        for (let i = 0; i < results.length; i++) {
          const member = results[i];
          if (member) {
            const userId = typeof member === 'string' ? member : member.member;
            const score = typeof member === 'string' 
              ? (await redis.zScore(leaderboardKey, userId)) ?? 0
              : member.score ?? 0;

            entries.push({
              userId,
              score: typeof score === 'number' ? score : 0,
              rank: i + 1,
            });
          }
        }
      }

      console.log(`[leaderboard] ${today} has ${entries.length} entries`);
    } catch (error) {
      console.error(`Failed to read leaderboard for ${today}:`, error);
      entries = [];
    }

    const response: LeaderboardData = {
      entries,
    };

    return c.json<LeaderboardData>(response);
  } catch (error) {
    console.error('API leaderboard Error:', error);
    return c.json<LeaderboardData>(
      { entries: [] },
      200
    );
  }
});

// ──────────────────────────────────────────────────────────
//  GET /api/result-today
//  Returns shareBlocks for the current user's today result
// ──────────────────────────────────────────────────────────

api.get('/result-today', async (c) => {
  try {
    const user = await reddit.getCurrentUser();
    const userId = user?.id;

    if (!userId) {
      return c.json<ResultTodayResponse>(
        { shareBlocks: null },
        200
      );
    }

    const todayDate = new Date();
    const today = todayDate.toISOString().split('T')[0]!;
    const resultKey = `result:${userId}:${today}`;

    let shareBlocks: string[] | null = null;

    try {
      const raw = await redis.get(resultKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          shareBlocks = parsed as string[];
        }
      }
    } catch (error) {
      console.error(`Failed to read result for ${userId}:${today}:`, error);
      shareBlocks = null;
    }

    console.log(
      `[result-today] userId=${userId}, today=${today}, shareBlocks=${JSON.stringify(shareBlocks)}`
    );

    return c.json<ResultTodayResponse>({ shareBlocks });
  } catch (error) {
    console.error('API result-today Error:', error);
    return c.json<ResultTodayResponse>(
      { shareBlocks: null },
      200
    );
  }
});
