import { ShapeState, MORPHABLE_SHAPES, SHAPE_COLORS } from '../../../shared/types/api';
import ShapeCanvas from '../ShapeCanvas';

interface GameBoardProps {
  startShape: ShapeState;
  targetShape: ShapeState;
  currentShape: ShapeState;
  isMatch: boolean;
}

// Generate hints about what's different (no color)
export function getDifferenceHints(current: ShapeState, target: ShapeState): string[] {
  const hints: string[] = [];

  const getSides = (shape: ShapeState): number | null => {
    switch (shape.type) {
      case 'triangle': return 3;
      case 'square': return 4;
      case 'pentagon': return 5;
      case 'hexagon': return 6;
      case 'octagon': return 8;
      default: return null; // star / arrow not part of morph hints
    }
  };
  
  if (current.type !== target.type) {
    const currentSides = getSides(current);
    const targetSides = getSides(target);
    if (currentSides && targetSides) {
      if (targetSides > currentSides) {
        hints.push(`⬡ +${targetSides - currentSides} sides`);
      } else {
        hints.push(`△ -${currentSides - targetSides} sides`);
      }
    }
  }
  
  if (current.rotation !== target.rotation) {
    const diff = ((target.rotation - current.rotation) + 360) % 360;
    if (diff === 90 || diff === 270) {
      hints.push(`↻ Rotate`);
    } else if (diff === 180) {
      hints.push(`↻ Rotate ×2`);
    }
  }
  
  if (current.flippedH !== target.flippedH) {
    hints.push('⇆ Flip H');
  }
  
  if (current.flippedV !== target.flippedV) {
    hints.push('⇅ Flip V');
  }
  
  return hints;
}

export function GameBoard({ startShape, targetShape, currentShape, isMatch }: GameBoardProps) {
  const hints = getDifferenceHints(currentShape, targetShape);
  
  return (
    <div className="game-board">
      <div className="reference-shapes">
        <div className="reference-shape">
          <ShapeCanvas
            shape={startShape}
            size={70}
            label="Start"
          />
        </div>
        <div className="arrow-indicator">→</div>
        <div className="reference-shape">
          <ShapeCanvas
            shape={targetShape}
            size={70}
            label="Target"
          />
        </div>
      </div>

      <div className={`main-shape-container ${isMatch ? 'match-glow' : ''}`}>
        <ShapeCanvas
          shape={currentShape}
          size={180}
          animated
        />
      </div>

      {isMatch && (
        <div className="match-indicator">
          ✓ Perfect Match!
        </div>
      )}
    </div>
  );
}

export default GameBoard;
