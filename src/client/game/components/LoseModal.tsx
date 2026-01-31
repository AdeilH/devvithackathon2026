interface LoseModalProps {
  reason: 'time' | 'moves';
  onRetry: () => void;
}

export function LoseModal({ reason, onRetry }: LoseModalProps) {
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
        <button className="retry-button" onClick={onRetry}>
          🔄 Try Again Tomorrow
        </button>
      </div>
    </div>
  );
}

export default LoseModal;
