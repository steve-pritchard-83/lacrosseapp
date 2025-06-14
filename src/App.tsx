import { useEffect } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import useStore from './store';
import { Player } from './types';
import { getInitialState } from './data';
import styles from './App.module.css';

import Logo from './components/Logo/Logo';
import Timer from './components/Timer/Timer';
import PlayerList from './components/PlayerList/PlayerList';
import ActivityLog from './components/ActivityLog/ActivityLog';
import StatsDashboard from './components/StatsDashboard/StatsDashboard';
import Fireworks from './components/Fireworks/Fireworks';

const App = () => {
  const onField = useStore(state => state.onField);
  // @ts-ignore
  const onBench = useStore(state => state.onBench);
  const setPlayers = useStore(state => state.setPlayers);
  const movePlayer = useStore(state => state.movePlayer);
  const isTimerRunning = useStore(state => state.isTimerRunning);
  const tick = useStore(state => state.tick);
  const showFireworks = useStore(state => state.showFireworks);
  // const hideFireworks = useStore(state => state.hideFireworks);

  // Effect for the main game timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        tick();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, tick]);

  // Effect to load initial state from localStorage
  useEffect(() => {
    try {
      const savedStateJSON = localStorage.getItem('lacrosseGameState');
      if (savedStateJSON) {
        const restoredState = JSON.parse(savedStateJSON);
        
        // Validate the restored state to prevent loading corrupted data
        const isStateValid = 
          restoredState.onField &&
          restoredState.onField.every((p: Player) => p && p.id && p.name);

        if (!isStateValid) {
          throw new Error("Invalid or corrupted state in localStorage.");
        }
        
        useStore.getState().setInitialState(restoredState);
      } else {
        // If no state exists, throw to use the default state
        throw new Error("No saved state found, loading default players.");
      }
    } catch (e) {
      console.warn(`Could not load from localStorage, creating a fresh game state: ${e instanceof Error ? e.message : String(e)}`);
      // This catch block handles both corrupted state and first-time loads
      const { onField: initialOnField, onBench: initialOnBench, playerStats } = getInitialState();
      setPlayers(initialOnField, initialOnBench);
      // Also set the initial stats
      useStore.getState().setInitialState({ playerStats });
    }
  }, [setPlayers]);

  // Effect to save state to localStorage whenever it changes
  useEffect(() => {
    const unsubscribe = useStore.subscribe(
      (state) => {
        const stateToSave = {
          onField: state.onField,
          gameTimer: state.gameTimer,
          isTimerRunning: state.isTimerRunning,
          currentQuarter: state.currentQuarter,
          score: state.score,
          activityLog: state.activityLog,
          playerStats: state.playerStats,
          history: state.history
        };
        localStorage.setItem('lacrosseGameState', JSON.stringify(stateToSave));
      }
    );
    return unsubscribe;
  }, []);

  const onDragEnd = (result: DropResult) => {
    movePlayer(result);
  };
  
  const getRecommendedSub = () => {
    const fieldPlayers = onField.filter((p: Player) => !p.isGoalie);
    if (fieldPlayers.length === 0) return null;
    return fieldPlayers.reduce((longest: Player, player: Player) => (player.fieldTime || 0) > (longest.fieldTime || 0) ? player : longest);
  };
  
  const recommendedSub = getRecommendedSub();

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Logo />
        </header>
        <main className={styles.main}>
          <div className={styles.gameContent}>
            <div className={styles.gameArea}>
              <PlayerList 
                droppableId="field-players" 
                title="On Field" 
                recommendedSubId={recommendedSub?.id} 
              />
            </div>
            <div className={styles.controlsArea}>
              <Timer />
              <ActivityLog />
              <StatsDashboard />
            </div>
          </div>
        </main>
        {showFireworks && <Fireworks />}
      </div>
    </DragDropContext>
  );
};

export default App;