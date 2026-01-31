import { TransformType } from '../../../shared/types/api';
import { generateShareText } from '../gameLogic';

interface WinModalProps {
  dayNumber: number;
  score: number;
  stars: number;
  moves: number;
  optimalMoves: number;
  time: number;
  streak: number;
  moveHistory: TransformType[];
  rank: number | null;
  totalPlayers: number | null;
  onViewLeaderboard: () => void;
  onClose: () => void;
}

export function WinModal({
  dayNumber,
  score,
  stars,
  moves,
  optimalMoves,
  time,
  streak,
  moveHistory,
  rank,
  totalPlayers,
  onViewLeaderboard,
  onClose,
}: WinModalProps) {
  const isPerfect = moves === optimalMoves;
  const starDisplay = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);

  const handleShare = async () => {
    const shareText = generateShareText(
      dayNumber,
      stars,
      moves,
      optimalMoves,
      streak,
      moveHistory
    );

    try {
      if (navigator.share) {
        await navigator.share({ text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        alert('Copied to clipboard!');
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="win-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="win-header">
          <h2>🎉 Puzzle Complete!</h2>
          {isPerfect && <div className="perfect-badge">✨ PERFECT ✨</div>}
        </div>

        <div className="win-stars">{starDisplay}</div>

        <div className="win-stats">
          <div className="stat">
            <span className="stat-label">Score</span>
            <span className="stat-value">{score}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Moves</span>
            <span className="stat-value">{moves}/{optimalMoves}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Time</span>
            <span className="stat-value">{Math.floor(time)}s</span>
          </div>
        </div>

        <div className="win-streak">
          <span className="streak-fire">🔥</span>
          <span className="streak-count">{streak} day streak</span>
        </div>

        {rank !== null && totalPlayers !== null && (
          <div className="win-rank">
            You ranked <strong>#{rank}</strong> of {totalPlayers} players today!
          </div>
        )}

        <div className="win-actions">
          <button className="share-button" onClick={handleShare}>
            📤 Share
          </button>
          <button className="leaderboard-button" onClick={onViewLeaderboard}>
            🏆 Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default WinModal;
