import { ShapeState, ShapeType, TransformType, Puzzle, SHAPE_COLORS, MORPHABLE_SHAPES } from '../../shared/types/api';

// ============================================
// Seeded Random Number Generator
// ============================================

export class SeededRandom {
  private seed: number;

  constructor(seed: string) {
    // Simple hash function for string seed
    this.seed = this.hashString(seed);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  // Linear Congruential Generator
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextBool(): boolean {
    return this.next() < 0.5;
  }

  pick<T>(arr: T[]): T {
    return arr[this.nextInt(0, arr.length - 1)] as T;
  }

  shuffle<T>(arr: T[]): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [result[i], result[j]] = [result[j]!, result[i]!];
    }
    return result;
  }
}

// ============================================
// Shape Transformations
// ============================================

// Get the inverse of a transform
export function getInverseTransform(transform: TransformType): TransformType {
  const inverses: Record<TransformType, TransformType> = {
    'rotate_cw': 'rotate_ccw',
    'rotate_ccw': 'rotate_cw',
    'flip_h': 'flip_h',
    'flip_v': 'flip_v',
    'morph_up': 'morph_down',
    'morph_down': 'morph_up',
  };
  return inverses[transform];
}

// Check if a transform can be applied to a shape
export function canApplyTransform(shape: ShapeState, transform: TransformType): boolean {
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

export function applyTransform(shape: ShapeState, transform: TransformType): ShapeState {
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
      // Add a side: triangle → square → pentagon → hexagon
      const currentIdx = MORPHABLE_SHAPES.indexOf(shape.type);
      if (currentIdx !== -1 && currentIdx < MORPHABLE_SHAPES.length - 1) {
        newShape.type = MORPHABLE_SHAPES[currentIdx + 1] as ShapeType;
      }
      break;
    }
    case 'morph_down': {
      // Remove a side: hexagon → pentagon → square → triangle
      const currentIdx = MORPHABLE_SHAPES.indexOf(shape.type);
      if (currentIdx > 0) {
        newShape.type = MORPHABLE_SHAPES[currentIdx - 1] as ShapeType;
      }
      break;
    }
  }

  return newShape;
}

// ============================================
// Shape Comparison
// ============================================

export function shapesMatch(a: ShapeState, b: ShapeState): boolean {
  // Structural checks
  if (a.type !== b.type) return false;
  if (a.colorIndex !== b.colorIndex) return false;

  // Normalize flips for symmetric shapes (flips are visually invariant)
  const normA = normalizeFlips(a);
  const normB = normalizeFlips(b);
  if (normA.flippedH !== normB.flippedH) return false;
  if (normA.flippedV !== normB.flippedV) return false;

  // Scale tolerance (visual scale only, no scale transforms exist currently)
  if (Math.abs(a.scale - b.scale) > 0.005) return false;

  // Rotation normalized to shape symmetry and rounded to avoid float jitter
  const rotA = Math.round(normalizeRotation(a) * 1000) / 1000;
  const rotB = Math.round(normalizeRotation(b) * 1000) / 1000;
  if (rotA !== rotB) return false;

  return true;
}

function normalizeFlips(shape: ShapeState): { flippedH: boolean; flippedV: boolean } {
  const symmetricTypes: ShapeType[] = ['square', 'hexagon', 'octagon'];
  if (symmetricTypes.includes(shape.type)) {
    return { flippedH: false, flippedV: false };
  }
  return { flippedH: shape.flippedH, flippedV: shape.flippedV };
}

function normalizeRotation(shape: ShapeState): number {
  if (shape.type === 'square') return shape.rotation % 90;
  if (shape.type === 'hexagon') return shape.rotation % 60;
  if (shape.type === 'octagon') return shape.rotation % 45;
  if (shape.type === 'triangle') return shape.rotation % 120;
  return shape.rotation % 360;
}

function getBasePolygon(type: ShapeType): number[][] {
  switch (type) {
    case 'triangle':
      return [
        [0, -1],
        [0.866, 0.5],
        [-0.866, 0.5],
      ];
    case 'square':
      return [
        [-0.707, -0.707],
        [0.707, -0.707],
        [0.707, 0.707],
        [-0.707, 0.707],
      ];
    case 'pentagon': {
      const pts: number[][] = [];
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        pts.push([Math.cos(angle), Math.sin(angle)]);
      }
      return pts;
    }
    case 'hexagon': {
      const pts: number[][] = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i * 2 * Math.PI) / 6;
        pts.push([Math.cos(angle), Math.sin(angle)]);
      }
      return pts;
    }
    case 'octagon': {
      const pts: number[][] = [];
      for (let i = 0; i < 8; i++) {
        const angle = (i * 2 * Math.PI) / 8 + Math.PI / 8;
        pts.push([Math.cos(angle), Math.sin(angle)]);
      }
      return pts;
    }
    case 'star': {
      const pts: number[][] = [];
      for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        const radius = i % 2 === 0 ? 1 : 0.5;
        pts.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
      }
      return pts;
    }
    case 'arrow':
      return [
        [0, -1],
        [0.5, 0],
        [0.25, 0],
        [0.25, 1],
        [-0.25, 1],
        [-0.25, 0],
        [-0.5, 0],
      ];
  }
}

// ============================================
// Puzzle Generation (Mathematically Guaranteed Solvable)
// ============================================

export function generatePuzzle(dateString: string): Puzzle {
  const rng = new SeededRandom(dateString);
  
  // Calculate day number from a start date
  const startDate = new Date('2025-01-01');
  const currentDate = new Date(dateString);
  const dayNumber = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Difficulty increases slightly over time
  const baseDifficulty = Math.min(5, 3 + Math.floor(dayNumber / 30));

  // Generate start shape - pick from middle of morphable range for more options
  const startShapeIdx = rng.nextInt(1, MORPHABLE_SHAPES.length - 2);
  const startShapeType = MORPHABLE_SHAPES[startShapeIdx] as ShapeType;
  const startColorIndex = rng.nextInt(0, SHAPE_COLORS.length - 1);
  
  const startShape: ShapeState = {
    type: startShapeType,
    rotation: 0,
    scale: 1.0,
    flippedH: false,
    flippedV: false,
    colorIndex: startColorIndex,
  };

  // Define transform categories to ensure variety (only moves the UI supports)
  type TransformCategory = 'rotation' | 'flip' | 'morph';
  const transformsByCategory: Record<TransformCategory, TransformType[]> = {
    rotation: ['rotate_cw', 'rotate_ccw'],
    flip: ['flip_h', 'flip_v'],
    morph: ['morph_up', 'morph_down'],
  };

  // Ensure puzzle uses multiple categories for variety
  const categories: TransformCategory[] = ['rotation', 'flip', 'morph'];
  
  // Pick 2-3 different categories to use (fits move limit/UI)
  const numCategories = rng.nextInt(2, 3);
  const shuffledCategories = rng.shuffle([...categories]);
  const selectedCategories = shuffledCategories.slice(0, numCategories);

  // Number of transforms: 3-5 for a good challenge within controls
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
    
    const category = rng.pick(selectedCategories);
    const transforms = transformsByCategory[category];
    const transform = rng.pick(transforms);
    
    if (canApplyTransform(targetShape, transform)) {
      const newShape = applyTransform(targetShape, transform);
      
      if (JSON.stringify(newShape) !== JSON.stringify(targetShape)) {
        targetShape = newShape;
        appliedTransforms.push(transform);
      }
    }
  }

  // Ensure at least 3 transforms
  while (appliedTransforms.length < 3) {
    const fallbackTransforms: TransformType[] = ['rotate_cw', 'flip_h', 'morph_up'];
    for (const transform of fallbackTransforms) {
      if (appliedTransforms.length >= 3) break;
      if (canApplyTransform(targetShape, transform)) {
        const newShape = applyTransform(targetShape, transform);
        if (JSON.stringify(newShape) !== JSON.stringify(targetShape)) {
          targetShape = newShape;
          appliedTransforms.push(transform);
        }
      }
    }
    break;
  }

  const optimalMoves = appliedTransforms.length;
  const maxMoves = Math.max(12, optimalMoves + 6);

  console.log('Generated puzzle:', {
    day: dayNumber,
    transforms: appliedTransforms,
    categories: [...usedCategories],
    optimal: optimalMoves
  });

  return {
    id: dateString,
    dayNumber,
    startShape,
    targetShape,
    optimalMoves,
    maxMoves,
  };
}

// ============================================
// Scoring
// ============================================

export function calculateScore(
  moves: number, 
  timeSeconds: number, 
  optimalMoves: number
): { score: number; stars: number } {
  // Base score
  let score = 1000;
  
  // Deduct for moves (50 per move over optimal)
  const extraMoves = Math.max(0, moves - optimalMoves);
  score -= extraMoves * 50;
  
  // Time penalty: -1 point per second after first 30 seconds
  const timePenalty = Math.max(0, timeSeconds - 30);
  score -= timePenalty;
  
  // Ensure minimum score of 100
  score = Math.max(100, score);
  
  // Calculate stars
  let stars = 1; // Solved = 1 star
  if (moves <= optimalMoves + 2) stars = 2; // Near optimal = 2 stars
  if (moves <= optimalMoves) stars = 3; // Optimal = 3 stars
  
  return { score, stars };
}

// ============================================
// Date Utilities
// ============================================

export function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0] ?? '';
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ============================================
// Share Text Generation
// ============================================

const TRANSFORM_EMOJI: Record<TransformType, string> = {
  rotate_cw: '🔄',
  rotate_ccw: '🔃',
  flip_h: '↔️',
  flip_v: '↕️',
  scale_up: '⬆️',
  scale_down: '⬇️',
  color: '🎨',
  morph_up: '➕',
  morph_down: '✂️',
};

export function generateShareText(
  dayNumber: number,
  stars: number,
  moves: number,
  optimalMoves: number,
  streak: number,
  moveHistory: TransformType[]
): string {
  const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
  const moveEmojis = moveHistory.slice(0, 8).map(m => TRANSFORM_EMOJI[m]).join(' ');
  const perfect = moves === optimalMoves ? '✨ PERFECT' : '';
  
  return `🔷 ShapeSwifter Day #${dayNumber}
${starStr}
${moveEmojis}
Moves: ${moves}/${optimalMoves} ${perfect}
🔥 ${streak} day streak

Play at reddit.com/r/ShapeSwifter`;
}

// ============================================
// Initial Shape State
// ============================================

export function createInitialShape(puzzle: Puzzle): ShapeState {
  return { ...puzzle.startShape };
}
