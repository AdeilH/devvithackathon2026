interface LoseModalProps {
  reason: 'time' | 'moves';
  onRetry: () => void;
  hints?: string[];
}

export function LoseModal({ reason, onRetry, hints }: LoseModalProps) {
  return (
    <div className="modal-overlay">
      <div className="modal lose-modal">
        <div className="lose-emoji">😔</div>
        <h2 className="lose-title">
          {reason === 'time' ? "Time's Up!" : "Out of Moves!"}
        </h2>
        <p className="lose-message">
          {reason === 'time' 
            ? "You ran out of time. Try again tomorrow!"
            : "You used all 5 moves without matching. Try again tomorrow!"}
        </p>

        {hints && hints.length > 0 && (
          <div className="difference-hints" style={{ marginTop: '0.5rem' }}>
            <span className="hints-label">Possible solution:</span>
            {hints.map((hint, i) => (
              <span key={i} className="hint-badge">{hint}</span>
            ))}
          </div>
        )}

        <button className="retry-button" onClick={onRetry}>
          🔄 Try Again Tomorrow
        </button>
      </div>
    </div>
  );
}

export default LoseModal;
