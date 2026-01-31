import { useState } from 'react';
import { ShapeState, MORPHABLE_SHAPES, SHAPE_COLORS } from '../../../shared/types/api';
import ShapeCanvas from '../ShapeCanvas';

interface GameBoardProps {
  startShape: ShapeState;
  targetShape: ShapeState;
  currentShape: ShapeState;
  isMatch: boolean;
}

// Generate hints about what's different (no color)
function getDifferenceHints(current: ShapeState, target: ShapeState): string[] {
  const hints: string[] = [];
  
  if (current.type !== target.type) {
    const currentSides = MORPHABLE_SHAPES.indexOf(current.type) + 3;
    const targetSides = MORPHABLE_SHAPES.indexOf(target.type) + 3;
    if (targetSides > currentSides) {
      hints.push(`⬡ +${targetSides - currentSides} sides`);
    } else {
      hints.push(`△ -${currentSides - targetSides} sides`);
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
  const [showHints, setShowHints] = useState(false);
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

      {/* Helpful hints - only shown when hint button is pressed */}
      {!isMatch && hints.length > 0 && (
        <div className="hint-section">
          <button 
            className={`hint-button ${showHints ? 'active' : ''}`}
            onClick={() => setShowHints(!showHints)}
          >
            💡 {showHints ? 'Hide Hints' : 'Show Hints'}
          </button>
          {showHints && (
            <div className="difference-hints">
              <span className="hints-label">Need:</span>
              {hints.map((hint, i) => (
                <span key={i} className="hint-badge">{hint}</span>
              ))}
            </div>
          )}
        </div>
      )}
      
      {isMatch && (
        <div className="match-indicator">
          ✓ Perfect Match!
        </div>
      )}
    </div>
  );
}

export default GameBoard;
