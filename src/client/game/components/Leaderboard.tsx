import { LeaderboardEntry } from '../../../shared/types/api';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  playerRank: number | null;
  playerScore: number | null;
  dayNumber: number;
  onClose: () => void;
}

export function Leaderboard({ 
  entries, 
  playerRank, 
  playerScore, 
  dayNumber, 
  onClose 
}: LeaderboardProps) {
  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getStarDisplay = (stars: number) => {
    return '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="leaderboard-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="leaderboard-header">
          <h2>🏆 Leaderboard</h2>
          <p className="leaderboard-subtitle">Day #{dayNumber}</p>
        </div>

        {playerRank !== null && playerScore !== null && (
          <div className="your-rank">
            Your rank: <strong>#{playerRank}</strong> ({playerScore} pts)
          </div>
        )}

        <div className="leaderboard-list">
          {entries.length === 0 ? (
            <div className="no-entries">No scores yet. Be the first!</div>
          ) : (
            entries.map((entry) => (
              <div 
                key={`${entry.rank}-${entry.username}`} 
                className={`leaderboard-entry ${entry.rank === playerRank ? 'highlight' : ''}`}
              >
                <span className="entry-rank">{getRankEmoji(entry.rank)}</span>
                <span className="entry-name">{entry.username}</span>
                <span className="entry-stars">{getStarDisplay(entry.stars)}</span>
                <span className="entry-score">{entry.score}</span>
              </div>
            ))
          )}
        </div>

        <button className="leaderboard-close-btn" onClick={onClose}>
          Back to Game
        </button>
      </div>
    </div>
  );
}

export default Leaderboard;
