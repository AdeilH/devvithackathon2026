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
  // Type must match
  if (a.type !== b.type) {
    console.log('Type mismatch:', a.type, '!=', b.type);
    return false;
  }

  // Color must match
  if (a.colorIndex !== b.colorIndex) {
    console.log('Color mismatch:', a.colorIndex, '!=', b.colorIndex);
    return false;
  }

  // Flip states must match
  if (a.flippedH !== b.flippedH) {
    console.log('FlippedH mismatch:', a.flippedH, '!=', b.flippedH);
    return false;
  }
  if (a.flippedV !== b.flippedV) {
    console.log('FlippedV mismatch:', a.flippedV, '!=', b.flippedV);
    return false;
  }

  // Rotation comparison with symmetry normalization
  const normalizedRotationA = normalizeRotation(a);
  const normalizedRotationB = normalizeRotation(b);
  if (normalizedRotationA !== normalizedRotationB) {
    console.log('Rotation mismatch:', normalizedRotationA, '!=', normalizedRotationB, '(raw:', a.rotation, b.rotation, ')');
    return false;
  }

  console.log('SHAPES MATCH!');
  return true;
}

function normalizeRotation(shape: ShapeState): number {
  // For square, 90-degree rotational symmetry (4-fold)
  if (shape.type === 'square') {
    return shape.rotation % 90;
  }
  // For hexagon, 60-degree rotational symmetry (6-fold)  
  if (shape.type === 'hexagon') {
    return shape.rotation % 60;
  }
  // For triangle, 120-degree rotational symmetry (3-fold)
  if (shape.type === 'triangle') {
    return shape.rotation % 120;
  }
  // Pentagon has 72-degree symmetry but we rotate by 90, so no simplification
  // Star and arrow have no rotational symmetry for our purposes
  return shape.rotation;
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

  // Define transform categories to ensure variety
  type TransformCategory = 'rotation' | 'flip' | 'scale' | 'morph' | 'color';
  const transformsByCategory: Record<TransformCategory, TransformType[]> = {
    rotation: ['rotate_cw', 'rotate_ccw'],
    flip: ['flip_h', 'flip_v'],
    scale: ['scale_up', 'scale_down'],
    morph: ['morph_up', 'morph_down'],
    color: ['color'],
  };

  // Ensure puzzle uses multiple categories for variety
  const categories: TransformCategory[] = ['rotation', 'flip', 'scale', 'morph', 'color'];
  
  // Pick 3-4 different categories to use
  const numCategories = rng.nextInt(3, 4);
  const shuffledCategories = rng.shuffle([...categories]);
  const selectedCategories = shuffledCategories.slice(0, numCategories);

  // Number of transforms: 4-6 for a good challenge
  const numTransforms = rng.nextInt(4, Math.min(6, baseDifficulty + 2));

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
    const fallbackTransforms: TransformType[] = ['rotate_cw', 'flip_h', 'color'];
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
