import { useEffect, useState } from 'react';
import { useGameState } from './useGameState';
import { 
  Header, 
  Controls, 
  StatusBar, 
  WinModal,
  LoseModal,
  Leaderboard, 
  GameBoard,
  AlreadyPlayed 
} from './components';
import { LeaderboardResponse } from '../../shared/types/api';
import './styles.css';

const MAX_MOVES = 5;

export const App = () => {
  const { state, actions, isMatch } = useGameState();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardResponse | null>(null);

  // Initialize on mount
  useEffect(() => {
    actions.initialize();
  }, []);

  // Handle view leaderboard
  const handleViewLeaderboard = async () => {
    const data = await actions.fetchLeaderboard();
    if (data) {
      setLeaderboardData(data);
      actions.setScreen('leaderboard');
    }
  };

  // Render loading screen
  if (state.screen === 'loading') {
    return (
      <div className="app loading-screen">
        <div className="loading-content">
          <div className="loading-logo">🔷</div>
          <h1>ShapeSwifter</h1>
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
          <p>Loading puzzle...</p>
        </div>
      </div>
    );
  }

  // Render already played screen
  if (state.screen === 'already-played' && state.puzzle && state.todayScore && state.playerStats) {
    return (
      <div className="app">
        <AlreadyPlayed
          dayNumber={state.puzzle.dayNumber}
          score={state.todayScore}
          streak={state.playerStats.streak}
          onViewLeaderboard={handleViewLeaderboard}
        />
        {leaderboardData && (
          <Leaderboard
            entries={state.leaderboard}
            playerRank={leaderboardData.playerRank}
            playerScore={leaderboardData.playerScore}
            dayNumber={state.puzzle.dayNumber}
            onClose={() => actions.setScreen('already-played')}
          />
        )}
      </div>
    );
  }

  // Ensure we have required data for game screens
  if (!state.puzzle || !state.currentShape || !state.playerStats) {
    return (
      <div className="app loading-screen">
        <div className="loading-content">
          <div className="loading-logo">🔷</div>
          <h1>ShapeSwifter</h1>
          <p>Something went wrong. Please refresh.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Header 
        dayNumber={state.puzzle.dayNumber} 
        streak={state.playerStats.streak} 
      />

      <main className="game-main">
        <GameBoard
          startShape={state.puzzle.startShape}
          targetShape={state.puzzle.targetShape}
          currentShape={state.currentShape}
          isMatch={isMatch}
        />

        <StatusBar
          movesUsed={state.movesUsed}
          maxMoves={MAX_MOVES}
          timeRemaining={state.timeRemaining}
        />

        <Controls
          onTransform={actions.transform}
          onUndo={actions.undo}
          canUndo={state.movesUsed > 0}
          disabled={state.screen !== 'game' || state.movesUsed >= MAX_MOVES || state.timeRemaining <= 0}
          currentShape={state.currentShape}
        />

        <button className="leaderboard-btn" onClick={handleViewLeaderboard}>
          🏆 Leaderboard
        </button>
      </main>

      {/* Win Modal */}
      {state.screen === 'win' && state.score !== null && state.stars !== null && (
        <WinModal
          dayNumber={state.puzzle.dayNumber}
          score={state.score}
          stars={state.stars}
          moves={state.movesUsed}
          optimalMoves={state.puzzle.optimalMoves}
          time={state.elapsedTime}
          streak={state.playerStats.streak}
          moveHistory={state.moveHistory}
          rank={null}
          totalPlayers={null}
          onViewLeaderboard={handleViewLeaderboard}
          onClose={() => actions.setScreen('game')}
        />
      )}

      {/* Lose Modal */}
      {state.screen === 'lose' && (
        <LoseModal
          reason={state.timeRemaining <= 0 ? 'time' : 'moves'}
          onRetry={() => actions.initialize()}
        />
      )}

      {/* Leaderboard Modal */}
      {state.screen === 'leaderboard' && leaderboardData && (
        <Leaderboard
          entries={state.leaderboard}
          playerRank={leaderboardData.playerRank}
          playerScore={leaderboardData.playerScore}
          dayNumber={state.puzzle.dayNumber}
          onClose={() => actions.setScreen(state.score !== null ? 'win' : 'game')}
        />
      )}
    </div>
  );
};

