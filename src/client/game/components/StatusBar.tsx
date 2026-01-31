import { formatTime } from '../gameLogic';

interface StatusBarProps {
  movesUsed: number;
  maxMoves: number;
  timeRemaining: number;
}

export function StatusBar({ movesUsed, maxMoves, timeRemaining }: StatusBarProps) {
  const isLowTime = timeRemaining <= 10;
  const isCriticalTime = timeRemaining <= 5;
  
  return (
    <div className="status-bar">
      <div className="move-counter">
        <span className="move-label">Moves:</span>
        <div className="move-dots">
          {Array.from({ length: maxMoves }, (_, i) => (
            <span
              key={i}
              className={`move-dot ${i < movesUsed ? 'used' : 'available'}`}
            >
              {i < movesUsed ? '●' : '○'}
            </span>
          ))}
        </div>
        <span className="move-count">
          {movesUsed}/{maxMoves}
        </span>
      </div>
      <div className={`timer countdown ${isLowTime ? 'low-time' : ''} ${isCriticalTime ? 'critical-time' : ''}`}>
        <span className="timer-icon">⏱️</span>
        <span className="timer-value">{timeRemaining}s</span>
      </div>
    </div>
  );
}

export default StatusBar;
