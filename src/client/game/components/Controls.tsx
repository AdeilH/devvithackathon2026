import { TransformType, ShapeState, TRANSFORMS, MORPHABLE_SHAPES } from '../../../shared/types/api';

interface ControlsProps {
  onTransform: (transform: TransformType) => void;
  onUndo: () => void;
  canUndo: boolean;
  disabled: boolean;
  currentShape: ShapeState | null;
}

// Check if a transform can be applied (no scaling anymore)
function canApplyTransform(shape: ShapeState | null, transform: TransformType): boolean {
  if (!shape) return false;
  
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

export function Controls({ onTransform, onUndo, canUndo, disabled, currentShape }: ControlsProps) {
  return (
    <div className="controls">
      <div className="control-grid">
        {TRANSFORMS.map((transform) => {
          const canApply = canApplyTransform(currentShape, transform.type);
          return (
            <button
              key={transform.type}
              className="control-button"
              onClick={() => onTransform(transform.type)}
              disabled={disabled || !canApply}
              title={transform.label}
            >
              <span className="control-icon">{transform.icon}</span>
              <span className="control-label">{transform.label}</span>
            </button>
          );
        })}
      </div>
      <button
        className="undo-button"
        onClick={onUndo}
        disabled={!canUndo || disabled}
        title="Undo (free)"
      >
        <span className="undo-icon">↩</span>
        <span className="undo-label">Undo</span>
      </button>
    </div>
  );
}

export default Controls;
