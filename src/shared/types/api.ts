// ============================================
// Shape Types
// ============================================

export type ShapeType = 'triangle' | 'square' | 'pentagon' | 'hexagon' | 'star' | 'arrow';

export type ShapeColor = '#FF6B6B' | '#4ECDC4' | '#FFE66D' | '#A29BFE' | '#55EFC4' | '#FD79A8';

export const SHAPE_COLORS: ShapeColor[] = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A29BFE', '#55EFC4', '#FD79A8'];

export const SHAPE_TYPES: ShapeType[] = ['triangle', 'square', 'pentagon', 'hexagon', 'star', 'arrow'];

export interface ShapeState {
  type: ShapeType;
  rotation: number; // 0, 90, 180, 270
  scale: number; // 0.5 to 2.0
  flippedH: boolean;
  flippedV: boolean;
  colorIndex: number; // Index into SHAPE_COLORS
}

// ============================================
// Transform Types
// ============================================

export type TransformType = 
  | 'rotate_cw' 
  | 'rotate_ccw' 
  | 'flip_h' 
  | 'flip_v' 
  | 'morph_up'
  | 'morph_down';

export interface Transform {
  type: TransformType;
  label: string;
  emoji: string;
  icon: string;
}

// Shape morphing order: triangle ↔ square ↔ pentagon ↔ hexagon
export const MORPHABLE_SHAPES: ShapeType[] = ['triangle', 'square', 'pentagon', 'hexagon'];

export const TRANSFORMS: Transform[] = [
  { type: 'rotate_cw', label: 'Rotate CW', emoji: '🔄', icon: '↻' },
  { type: 'rotate_ccw', label: 'Rotate CCW', emoji: '🔃', icon: '↺' },
  { type: 'flip_h', label: 'Flip H', emoji: '↔️', icon: '⇆' },
  { type: 'flip_v', label: 'Flip V', emoji: '↕️', icon: '⇅' },
  { type: 'morph_up', label: 'Add Side', emoji: '➕', icon: '⬡' },
  { type: 'morph_down', label: 'Cut Side', emoji: '✂️', icon: '△' },
];

// ============================================
// Puzzle Types
// ============================================

export interface Puzzle {
  id: string; // YYYY-MM-DD
  dayNumber: number;
  startShape: ShapeState;
  targetShape: ShapeState;
  optimalMoves: number;
  maxMoves: number;
}

// ============================================
// Player Types
// ============================================

export interface PlayerStats {
  visitorId: string;
  username: string;
  streak: number;
  bestStreak: number;
  gamesPlayed: number;
  totalStars: number;
  lastPlayedDate: string | null;
}

export interface PlayerScore {
  visitorId: string;
  username: string;
  score: number;
  moves: number;
  time: number;
  stars: number;
  moveHistory: TransformType[];
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  moves: number;
  stars: number;
}

// ============================================
// Game State Types
// ============================================

export type GameScreen = 'loading' | 'game' | 'win' | 'lose' | 'leaderboard' | 'already-played';

export interface GameState {
  screen: GameScreen;
  puzzle: Puzzle | null;
  currentShape: ShapeState | null;
  moveHistory: TransformType[];
  movesUsed: number;
  startTime: number | null;
  elapsedTime: number;
  timeRemaining: number; // Countdown timer
  playerStats: PlayerStats | null;
  score: number | null;
  stars: number | null;
  leaderboard: LeaderboardEntry[];
  alreadyPlayedToday: boolean;
  todayScore: PlayerScore | null;
}

// ============================================
// API Request/Response Types
// ============================================

// Init
export interface InitRequest {
  type: 'init';
}

export interface InitResponse {
  type: 'init';
  postId: string;
  puzzle: Puzzle;
  playerStats: PlayerStats;
  alreadyPlayedToday: boolean;
  todayScore: PlayerScore | null;
}

// Submit Score
export interface SubmitScoreRequest {
  type: 'submit_score';
  score: number;
  moves: number;
  time: number;
  stars: number;
  moveHistory: TransformType[];
}

export interface SubmitScoreResponse {
  type: 'score_saved';
  success: boolean;
  newStreak: number;
  rank: number;
  totalPlayers: number;
  playerStats: PlayerStats;
}

// Leaderboard
export interface LeaderboardRequest {
  type: 'get_leaderboard';
}

export interface LeaderboardResponse {
  type: 'leaderboard';
  entries: LeaderboardEntry[];
  playerRank: number | null;
  playerScore: number | null;
}

// Error
export interface ErrorResponse {
  type: 'error';
  message: string;
}

// Union types
export type ApiRequest = InitRequest | SubmitScoreRequest | LeaderboardRequest;
export type ApiResponse = InitResponse | SubmitScoreResponse | LeaderboardResponse | ErrorResponse;
