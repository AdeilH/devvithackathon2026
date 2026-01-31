import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  GameState, 
  GameScreen, 
  TransformType, 
  InitResponse,
  SubmitScoreResponse,
  LeaderboardResponse,
  ShapeState
} from '../../shared/types/api';
import { applyTransform, shapesMatch, calculateScore, createInitialShape } from './gameLogic';

const initialState: GameState = {
  screen: 'loading',
  puzzle: null,
  currentShape: null,
  moveHistory: [],
  movesUsed: 0,
  startTime: null,
  elapsedTime: 0,
  timeRemaining: 30, // 30 second countdown
  playerStats: null,
  score: null,
  stars: null,
  leaderboard: [],
  alreadyPlayedToday: false,
  todayScore: null,
};

const MAX_MOVES = 5; // Limit transformations to 5
const TIME_LIMIT = 30; // 30 seconds

export function useGameState() {
  const [state, setState] = useState<GameState>(initialState);
  const timerRef = useRef<number | null>(null);
  const shapeHistoryRef = useRef<ShapeState[]>([]);

  // Start countdown timer
  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    
    setState(prev => ({
      ...prev,
      startTime: prev.startTime || Date.now(),
    }));

    timerRef.current = window.setInterval(() => {
      setState(prev => {
        if (!prev.startTime) return prev;
        const elapsed = Math.floor((Date.now() - prev.startTime) / 1000);
        const remaining = Math.max(0, TIME_LIMIT - elapsed);
        return { ...prev, elapsedTime: elapsed, timeRemaining: remaining };
      });
    }, 1000);
  }, []);

  // Stop timer
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Initialize game
  const initialize = useCallback(async () => {
    try {
      const response = await fetch('/api/init');
      if (!response.ok) throw new Error('Failed to initialize');
      
      const data: InitResponse = await response.json();
      
      if (data.alreadyPlayedToday && data.todayScore) {
        setState(prev => ({
          ...prev,
          screen: 'already-played',
          puzzle: data.puzzle,
          playerStats: data.playerStats,
          alreadyPlayedToday: true,
          todayScore: data.todayScore,
        }));
      } else {
        const currentShape = createInitialShape(data.puzzle);
        shapeHistoryRef.current = [currentShape];
        
        setState(prev => ({
          ...prev,
          screen: 'game',
          puzzle: data.puzzle,
          currentShape,
          playerStats: data.playerStats,
          alreadyPlayedToday: false,
          moveHistory: [],
          movesUsed: 0,
          startTime: null,
          elapsedTime: 0,
          timeRemaining: TIME_LIMIT,
        }));
      }
    } catch (error) {
      console.error('Init failed:', error);
      setState(prev => ({ ...prev, screen: 'loading' }));
    }
  }, []);

  // Apply transform
  const transform = useCallback((transformType: TransformType) => {
    setState(prev => {
      if (!prev.currentShape || !prev.puzzle) return prev;
      if (prev.movesUsed >= MAX_MOVES) return prev;
      if (prev.timeRemaining <= 0) return prev; // Can't move if time is up

      const newShape = applyTransform(prev.currentShape, transformType);
      shapeHistoryRef.current.push(newShape);

      return {
        ...prev,
        currentShape: newShape,
        moveHistory: [...prev.moveHistory, transformType],
        movesUsed: prev.movesUsed + 1,
      };
    });

    // Start timer on first move
    startTimer();
  }, [startTimer]);

  // Undo last move
  const undo = useCallback(() => {
    setState(prev => {
      if (prev.movesUsed === 0 || !prev.currentShape) return prev;
      
      // Pop the last shape from history
      shapeHistoryRef.current.pop();
      const previousShape = shapeHistoryRef.current[shapeHistoryRef.current.length - 1];
      
      if (!previousShape) return prev;
      
      return {
        ...prev,
        currentShape: previousShape,
        moveHistory: prev.moveHistory.slice(0, -1),
        movesUsed: prev.movesUsed - 1,
      };
    });
  }, []);

  // Check for win or lose (time out / moves exhausted)
  useEffect(() => {
    const { currentShape, puzzle, movesUsed, screen, elapsedTime, moveHistory, timeRemaining } = state;
    
    if (screen !== 'game' || !currentShape || !puzzle) return;
    
    console.log('Checking win - current:', currentShape, 'target:', puzzle.targetShape);
    
    const isWin = shapesMatch(currentShape, puzzle.targetShape);
    console.log('Is win:', isWin, 'movesUsed:', movesUsed, 'timeRemaining:', timeRemaining);
    
    if (isWin && movesUsed > 0) {
      console.log('WIN DETECTED!');
      stopTimer();
      
      const { score, stars } = calculateScore(
        movesUsed,
        elapsedTime,
        puzzle.optimalMoves
      );

      // Submit score
      void submitScore(score, movesUsed, elapsedTime, stars, moveHistory);
    } else if (timeRemaining <= 0 && state.startTime) {
      // Time's up - lose!
      console.log('TIME UP - LOSE!');
      stopTimer();
      setState(prev => ({ ...prev, screen: 'lose' }));
    } else if (movesUsed >= MAX_MOVES && !isWin) {
      // Out of moves - lose!
      console.log('OUT OF MOVES - LOSE!');
      stopTimer();
      setState(prev => ({ ...prev, screen: 'lose' }));
    }
  }, [state, stopTimer]);

  // Submit score to server
  const submitScore = async (
    score: number,
    moves: number,
    time: number,
    stars: number,
    moveHistory: TransformType[]
  ) => {
    try {
      const response = await fetch('/api/submit-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'submit_score',
          score,
          moves,
          time,
          stars,
          moveHistory,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit score');

      const data: SubmitScoreResponse = await response.json();

      setState(prev => ({
        ...prev,
        screen: 'win',
        score,
        stars,
        playerStats: data.playerStats,
      }));
    } catch (error) {
      console.error('Submit score failed:', error);
      // Still show win screen even if submission fails
      setState(prev => ({
        ...prev,
        screen: 'win',
        score,
        stars,
      }));
    }
  };

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await fetch('/api/leaderboard');
      if (!response.ok) throw new Error('Failed to fetch leaderboard');

      const data: LeaderboardResponse = await response.json();

      setState(prev => ({
        ...prev,
        leaderboard: data.entries,
      }));

      return data;
    } catch (error) {
      console.error('Fetch leaderboard failed:', error);
      return null;
    }
  }, []);

  // Set screen
  const setScreen = useCallback((screen: GameScreen) => {
    setState(prev => ({ ...prev, screen }));
  }, []);

  // Check if current shape matches target
  const isMatch = state.currentShape && state.puzzle 
    ? shapesMatch(state.currentShape, state.puzzle.targetShape)
    : false;

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    state,
    actions: {
      initialize,
      transform,
      undo,
      setScreen,
      fetchLeaderboard,
    },
    isMatch,
  };
}

export default useGameState;
