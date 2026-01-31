import { PlayerScore } from '../../../shared/types/api';
import { generateShareText } from '../gameLogic';

interface AlreadyPlayedProps {
  dayNumber: number;
  score: PlayerScore;
  streak: number;
  onViewLeaderboard: () => void;
}

export function AlreadyPlayed({ 
  dayNumber, 
  score, 
  streak,
  onViewLeaderboard 
}: AlreadyPlayedProps) {
  const starDisplay = '⭐'.repeat(score.stars) + '☆'.repeat(3 - score.stars);

  const handleShare = async () => {
    const shareText = generateShareText(
      dayNumber,
      score.stars,
      score.moves,
      score.moves, // We don't have optimal here, so use moves
      streak,
      score.moveHistory
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
    <div className="already-played">
      <div className="already-played-content">
        <h1>🔷 ShapeSwifter</h1>
        <p className="day-info">Day #{dayNumber}</p>
        
        <div className="completed-badge">
          ✅ Already Completed!
        </div>

        <div className="today-score">
          <div className="score-stars">{starDisplay}</div>
          <div className="score-details">
            <span>Score: <strong>{score.score}</strong></span>
            <span>Moves: <strong>{score.moves}</strong></span>
            <span>Time: <strong>{Math.floor(score.time)}s</strong></span>
          </div>
        </div>

        <div className="streak-display">
          <span className="streak-fire">🔥</span>
          <span>{streak} day streak</span>
        </div>

        <p className="comeback-message">
          Come back tomorrow for a new puzzle!
        </p>

        <div className="already-played-actions">
          <button className="share-button" onClick={handleShare}>
            📤 Share Results
          </button>
          <button className="leaderboard-button" onClick={onViewLeaderboard}>
            🏆 View Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default AlreadyPlayed;
