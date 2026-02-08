import express from 'express';
import { 
  InitResponse, 
  SubmitScoreRequest, 
  SubmitScoreResponse, 
  LeaderboardResponse,
  PlayerStats,
  PlayerScore,
  LeaderboardEntry,
  Puzzle,
  ShapeState,
  ShapeType,
  TransformType,
  SHAPE_COLORS,
  MORPHABLE_SHAPES
} from '../shared/types/api';
import { redis, reddit, createServer, context, getServerPort } from '@devvit/web/server';
import { createPost } from './core/post';

const app = express();

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

const router = express.Router();

// ============================================
// Helper Functions
// ============================================

// Seeded random number generator
class SeededRandom {
  private seed: number;

  constructor(seed: string) {
    this.seed = this.hashString(seed);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(arr: T[]): T {
    return arr[this.nextInt(0, arr.length - 1)] as T;
  }
}

function getTodayDateString(): string {
  const now = new Date();
  const parts = now.toISOString().split('T');
  return parts[0] ?? new Date().toDateString();
}

function canApplyTransform(shape: ShapeState, transform: TransformType): boolean {
  switch (transform) {
    case 'morph_up': {
      const idx = MORPHABLE_SHAPES.indexOf(shape.type);
      return idx !== -1 && idx < MORPHABLE_SHAPES.length - 1;
    }
    case 'morph_down': {
      const idx = MORPHABLE_SHAPES.indexOf(shape.type);
      return idx > 0;
    }
    default:
      return true;
  }
}

function applyTransform(shape: ShapeState, transform: TransformType): ShapeState {
  const newShape = { ...shape };

  switch (transform) {
    case 'rotate_cw':
      newShape.rotation = (shape.rotation + 90) % 360;
      break;
    case 'rotate_ccw':
      newShape.rotation = (shape.rotation - 90 + 360) % 360;
      break;
    case 'flip_h':
      newShape.flippedH = !shape.flippedH;
      break;
    case 'flip_v':
      newShape.flippedV = !shape.flippedV;
      break;
    case 'morph_up': {
      const currentIdx = MORPHABLE_SHAPES.indexOf(shape.type);
      if (currentIdx !== -1 && currentIdx < MORPHABLE_SHAPES.length - 1) {
        newShape.type = MORPHABLE_SHAPES[currentIdx + 1] as ShapeType;
      }
      break;
    }
    case 'morph_down': {
      const currentIdx = MORPHABLE_SHAPES.indexOf(shape.type);
      if (currentIdx > 0) {
        newShape.type = MORPHABLE_SHAPES[currentIdx - 1] as ShapeType;
      }
      break;
    }
  }

  return newShape;
}

// Helper to create expiration date
function getExpiration(seconds: number): Date {
  return new Date(Date.now() + seconds * 1000);
}

async function generatePuzzle(dateString: string): Promise<Puzzle> {
  // Try to get cached puzzle from Redis (v6 = shapes, rotation, flip only - no scaling/color, 5 moves max)
  const cacheKey = `puzzle:v6:${dateString}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached) as Puzzle;
  }

  const rng = new SeededRandom(dateString);
  
  // Calculate day number - start from launch date (Jan 31, 2026)
  const startDate = new Date('2026-01-31');
  const currentDate = new Date(dateString);
  const dayNumber = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Difficulty increases over time - starts challenging!
  const baseDifficulty = Math.min(7, 4 + Math.floor(dayNumber / 20));

  // Generate start shape - pick from middle of morphable range for more options
  const startShapeIdx = rng.nextInt(0, MORPHABLE_SHAPES.length - 1); // Any shape
  const shapeType = MORPHABLE_SHAPES[startShapeIdx] as ShapeType;
  const startShape: ShapeState = {
    type: shapeType,
    rotation: 0,
    scale: 1.0,
    flippedH: false,
    flippedV: false,
    colorIndex: rng.nextInt(0, SHAPE_COLORS.length - 1),
  };

  // Define transform categories to ensure variety (NO SCALING, NO COLOR)
  type TransformCategory = 'rotation' | 'flip' | 'morph';
  const transformsByCategory: Record<TransformCategory, TransformType[]> = {
    rotation: ['rotate_cw', 'rotate_ccw'],
    flip: ['flip_h', 'flip_v'],
    morph: ['morph_up', 'morph_down'],
  };

  // Ensure puzzle uses multiple categories for variety
  const categories: TransformCategory[] = ['rotation', 'flip', 'morph'];
  
  // Pick 2-3 different categories to use for variety
  const numCategories = rng.nextInt(2, 3);
  const shuffledCategories = [...categories].sort(() => rng.next() - 0.5);
  const selectedCategories = shuffledCategories.slice(0, numCategories);

  // Number of transforms: 3-5 to match the 5 move limit
  const numTransforms = rng.nextInt(3, Math.min(5, baseDifficulty + 2));

  let targetShape = { ...startShape };
  const appliedTransforms: TransformType[] = [];
  const usedCategories = new Set<TransformCategory>();

  // First pass: ensure we use each selected category at least once
  for (const category of selectedCategories) {
    if (appliedTransforms.length >= numTransforms) break;
    
    const transforms = transformsByCategory[category];
    const transform = rng.pick(transforms);
    
    if (canApplyTransform(targetShape, transform)) {
      const newShape = applyTransform(targetShape, transform);
      if (JSON.stringify(newShape) !== JSON.stringify(targetShape)) {
        targetShape = newShape;
        appliedTransforms.push(transform);
        usedCategories.add(category);
      }
    }
  }

  // Second pass: fill remaining transforms with variety
  let attempts = 0;
  while (appliedTransforms.length < numTransforms && attempts < 20) {
    attempts++;
    
    // Pick a random category, slightly favoring ones we haven't used much
    const category = rng.pick(selectedCategories);
    const transforms = transformsByCategory[category];
    const transform = rng.pick(transforms);
    
    if (canApplyTransform(targetShape, transform)) {
      const newShape = applyTransform(targetShape, transform);
      
      // Avoid no-op transforms (like double flip)
      if (JSON.stringify(newShape) !== JSON.stringify(targetShape)) {
        targetShape = newShape;
        appliedTransforms.push(transform);
      }
    }
  }

  // Ensure at least 2 transforms
  while (appliedTransforms.length < 2) {
    const fallbackTransforms: TransformType[] = ['rotate_cw', 'flip_h', 'morph_up'];
    for (const transform of fallbackTransforms) {
      if (appliedTransforms.length >= 2) break;
      if (canApplyTransform(targetShape, transform)) {
        const newShape = applyTransform(targetShape, transform);
        if (JSON.stringify(newShape) !== JSON.stringify(targetShape)) {
          targetShape = newShape;
          appliedTransforms.push(transform);
        }
      }
    }
    break; // Prevent infinite loop
  }

  const optimalMoves = appliedTransforms.length;
  const maxMoves = Math.max(12, optimalMoves + 6);

  const puzzle: Puzzle = {
    id: dateString,
    dayNumber,
    startShape,
    targetShape,
    optimalMoves,
    maxMoves,
  };

  console.log('Generated puzzle:', {
    day: dayNumber,
    transforms: appliedTransforms,
    categories: [...usedCategories],
    optimal: optimalMoves
  });

  // Cache for 24 hours
  await redis.set(cacheKey, JSON.stringify(puzzle), { expiration: getExpiration(86400) });

  return puzzle;
}

async function getPlayerStats(visitorId: string, username: string): Promise<PlayerStats> {
  const key = `player:${visitorId}`;
  const data = await redis.get(key);
  
  if (data) {
    return JSON.parse(data) as PlayerStats;
  }

  const newStats: PlayerStats = {
    visitorId,
    username,
    streak: 0,
    bestStreak: 0,
    gamesPlayed: 0,
    totalStars: 0,
    lastPlayedDate: null,
  };

  return newStats;
}

async function savePlayerStats(stats: PlayerStats): Promise<void> {
  const key = `player:${stats.visitorId}`;
  await redis.set(key, JSON.stringify(stats));
}

async function getTodayScore(visitorId: string, dateString: string): Promise<PlayerScore | null> {
  const key = `played:${dateString}:${visitorId}`;
  const data = await redis.get(key);
  
  if (data) {
    return JSON.parse(data) as PlayerScore;
  }
  
  return null;
}

async function saveTodayScore(visitorId: string, dateString: string, score: PlayerScore): Promise<void> {
  const key = `played:${dateString}:${visitorId}`;
  await redis.set(key, JSON.stringify(score), { expiration: getExpiration(172800) }); // 48 hours
}

async function addToLeaderboard(dateString: string, visitorId: string, score: number): Promise<void> {
  const key = `leaderboard:${dateString}`;
  await redis.zAdd(key, { member: visitorId, score });
  await redis.expire(key, 172800); // 48 hours
}

async function getLeaderboard(dateString: string, limit: number = 10): Promise<{ entries: LeaderboardEntry[], totalCount: number }> {
  const key = `leaderboard:${dateString}`;
  const results = await redis.zRange(key, 0, limit - 1, { reverse: true, by: 'rank' });
  const totalCount = await redis.zCard(key);

  const entries: LeaderboardEntry[] = [];
  let rank = 1;

  for (const item of results) {
    const visitorId = item.member;
    const playerKey = `player:${visitorId}`;
    const playerData = await redis.get(playerKey);
    const scoreKey = `played:${dateString}:${visitorId}`;
    const scoreData = await redis.get(scoreKey);

    let username = 'Anonymous';
    let moves = 0;
    let stars = 0;

    if (playerData) {
      const player = JSON.parse(playerData) as PlayerStats;
      username = player.username || 'Anonymous';
    }

    if (scoreData) {
      const playerScore = JSON.parse(scoreData) as PlayerScore;
      moves = playerScore.moves;
      stars = playerScore.stars;
    }

    entries.push({
      rank,
      username,
      score: item.score,
      moves,
      stars,
    });

    rank++;
  }

  return { entries, totalCount };
}

async function getPlayerRank(dateString: string, visitorId: string): Promise<number | null> {
  const key = `leaderboard:${dateString}`;
  const rank = await redis.zRank(key, visitorId);
  return rank !== undefined ? rank + 1 : null;
}

// ============================================
// API Routes
// ============================================

// Testing mode (playtest/dev subreddit) allows replaying and relaxes postId checks
const isDevSubreddit = context.subredditName === 'shapeswifter_dev';
const TESTING_MODE = process.env.TESTING_MODE === 'true' || isDevSubreddit;

router.get<object, InitResponse | { status: string; message: string }>(
  '/api/init',
  async (_req, res): Promise<void> => {
    const { postId } = context;

    if (!postId) {
      console.error('API Init Error: postId not found in devvit context');
      res.status(400).json({
        status: 'error',
        message: 'postId is required but missing from context',
      });
      return;
    }

    try {
      const username = await reddit.getCurrentUsername() ?? 'anonymous';
      // Use userId or generate a unique ID based on username
      const visitorId = context.userId ?? `user-${username}-${Date.now()}`;
      const dateString = getTodayDateString();

      const [puzzle, playerStats, todayScore] = await Promise.all([
        generatePuzzle(dateString),
        getPlayerStats(visitorId, username),
        getTodayScore(visitorId, dateString),
      ]);

      // Update username if changed
      if (playerStats.username !== username) {
        playerStats.username = username;
        await savePlayerStats(playerStats);
      }

      // In production installs, gate daily play to once per user; allow replays only in testing
      const alreadyPlayed = TESTING_MODE ? false : (todayScore !== null);

      res.json({
        type: 'init',
        postId,
        puzzle,
        playerStats,
        alreadyPlayedToday: alreadyPlayed,
        todayScore: alreadyPlayed ? todayScore : null,
      });
    } catch (error) {
      console.error(`API Init Error for post ${postId}:`, error);
      let errorMessage = 'Unknown error during initialization';
      if (error instanceof Error) {
        errorMessage = `Initialization failed: ${error.message}`;
      }
      res.status(400).json({ status: 'error', message: errorMessage });
    }
  }
);

router.post<object, SubmitScoreResponse | { status: string; message: string }, SubmitScoreRequest>(
  '/api/submit-score',
  async (req, res): Promise<void> => {
    const { postId } = context;

    // In testing / webview mode, allow submission even if postId is missing
    if (!postId && !TESTING_MODE) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    try {
      const { score, moves, time, stars, moveHistory } = req.body;
      const username = await reddit.getCurrentUsername() ?? 'anonymous';
      const visitorId = context.userId ?? `user-${username}-${Date.now()}`;
      const dateString = getTodayDateString();

      // Check if already played
      const existing = await getTodayScore(visitorId, dateString);
      if (existing && !TESTING_MODE) {
        res.status(400).json({
          status: 'error',
          message: 'Already played today',
        });
        return;
      }

      // Get player stats
      const playerStats = await getPlayerStats(visitorId, username);

      // Update streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const parts = yesterday.toISOString().split('T');
      const yesterdayString = parts[0] ?? '';

      if (playerStats.lastPlayedDate === yesterdayString) {
        playerStats.streak += 1;
      } else if (playerStats.lastPlayedDate !== dateString) {
        playerStats.streak = 1;
      }

      playerStats.bestStreak = Math.max(playerStats.bestStreak, playerStats.streak);
      playerStats.gamesPlayed += 1;
      playerStats.totalStars += stars;
      playerStats.lastPlayedDate = dateString;

      // Save player score
      const playerScore: PlayerScore = {
        visitorId,
        username,
        score,
        moves,
        time,
        stars,
        moveHistory,
      };

      await Promise.all([
        savePlayerStats(playerStats),
        saveTodayScore(visitorId, dateString, playerScore),
        addToLeaderboard(dateString, visitorId, score),
      ]);

      // Get rank
      const rank = await getPlayerRank(dateString, visitorId);
      const { totalCount } = await getLeaderboard(dateString, 1);

      res.json({
        type: 'score_saved',
        success: true,
        newStreak: playerStats.streak,
        rank: rank || 1,
        totalPlayers: totalCount,
        playerStats,
      });
    } catch (error) {
      console.error('Submit score error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to save score',
      });
    }
  }
);

router.get<object, LeaderboardResponse | { status: string; message: string }>(
  '/api/leaderboard',
  async (_req, res): Promise<void> => {
    try {
      const username = await reddit.getCurrentUsername() ?? '';
      const visitorId = context.userId ?? `user-${username}`;
      const dateString = getTodayDateString();

      const [{ entries }, playerRank] = await Promise.all([
        getLeaderboard(dateString, 10),
        visitorId ? getPlayerRank(dateString, visitorId) : null,
      ]);

      const todayScore = visitorId ? await getTodayScore(visitorId, dateString) : null;

      res.json({
        type: 'leaderboard',
        entries,
        playerRank,
        playerScore: todayScore?.score ?? null,
      });
    } catch (error) {
      console.error('Leaderboard error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch leaderboard',
      });
    }
  }
);

router.post('/internal/on-app-install', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      status: 'success',
      message: `Post created in subreddit ${context.subredditName} with id ${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

router.post('/internal/menu/post-create', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

// Use router middleware
app.use(router);

// Get port from environment variable with fallback
const port = getServerPort();

const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(port);
