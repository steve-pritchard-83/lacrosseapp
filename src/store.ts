import { create } from 'zustand';
import { Player } from './types';
import { getInitialState } from './data';

// Define the shape of the store's state
interface GameState {
  onField: Player[];
  onBench: Player[];
  gameTimer: number;
  isTimerRunning: boolean;
  currentQuarter: number;
  score: number;
  activityLog: { type: string; message: string }[];
  playerStats: { [key: string]: { goals: number; totalFieldTime: number } };
  history: Partial<GameState>[];
  showFireworks: boolean;

  // Actions
  setInitialState: (initialState: Partial<GameState>) => void;
  togglePlayerPosition: (player: Player) => void;
  handleGoal: (player: Player) => void;
  tick: () => void;
  toggleTimer: () => void;
  resetTimer: () => void;
  nextQuarter: () => void;
  undo: () => void;
  resetGame: () => void;
  hideFireworks: () => void;
  setPlayers: (onField: Player[], onBench: Player[]) => void;
  logActivity: (type: string, message: string) => void;
  saveStateToHistory: () => void;
  movePlayer: (result: any) => void;
}

const useStore = create<GameState>((set, get) => ({
  // Initial State
  onField: [],
  onBench: [],
  gameTimer: 0,
  isTimerRunning: false,
  currentQuarter: 1,
  score: 0,
  activityLog: [],
  playerStats: {},
  history: [],
  showFireworks: false,

  // Actions
  setInitialState: (initialState) => set(initialState),
  
  togglePlayerPosition: (player) => {
    const { onField, onBench, logActivity, saveStateToHistory } = get();
    let newOnField = [...onField];
    let newOnBench = [...onBench];

    saveStateToHistory();

    if (newOnField.some(p => p.id === player.id)) {
      newOnField = newOnField.filter(p => p.id !== player.id);
      newOnBench = [...newOnBench, { ...player, fieldTime: 0 }];
      logActivity('bench', `${player.name} moved to bench.`);
    } else {
      newOnBench = newOnBench.filter(p => p.id !== player.id);
      newOnField = [...newOnField, { ...player, fieldTime: 0 }];
      logActivity('field', `${player.name} moved to field.`);
    }
    set({ onField: newOnField, onBench: newOnBench });
  },

  handleGoal: (player) => {
    const { playerStats, logActivity, saveStateToHistory, score } = get();
    saveStateToHistory();
    const newStats = { ...playerStats };
    if (!newStats[player.id]) {
      newStats[player.id] = { goals: 0, totalFieldTime: 0 };
    }
    newStats[player.id].goals += 1;
    logActivity('goal', `Goal by ${player.name}!`);
    set({ playerStats: newStats, score: score + 1, showFireworks: true });
  },

  tick: () => {
    if (!get().isTimerRunning) return;
    set((state) => {
      const newPlayerStats = { ...state.playerStats };
      const newOnField = state.onField.map(p => {
        const newTime = (p.fieldTime || 0) + 1;
        if (!newPlayerStats[p.id]) {
          newPlayerStats[p.id] = { goals: 0, totalFieldTime: 0 };
        }
        newPlayerStats[p.id].totalFieldTime = (newPlayerStats[p.id].totalFieldTime || 0) + 1;
        return { ...p, fieldTime: newTime };
      });
      return { gameTimer: state.gameTimer + 1, onField: newOnField, playerStats: newPlayerStats };
    });
  },

  toggleTimer: () => {
    const { isTimerRunning, logActivity, saveStateToHistory } = get();
    saveStateToHistory();
    logActivity('timer', `Timer ${!isTimerRunning ? 'started' : 'paused'}.`);
    set({ isTimerRunning: !isTimerRunning });
  },

  resetTimer: () => {
    get().saveStateToHistory();
    get().logActivity('timer', 'Timer reset.');
    set({ gameTimer: 0, isTimerRunning: false });
  },

  nextQuarter: () => {
    const { currentQuarter, logActivity, saveStateToHistory } = get();
    saveStateToHistory();
    logActivity('quarter', `Quarter ${currentQuarter + 1} started.`);
    set({ currentQuarter: currentQuarter + 1 });
  },
  
  undo: () => {
    const { history } = get();
    if (history.length > 0) {
      const previousState = history[history.length - 1];
      const newHistory = history.slice(0, -1);
      set({ ...previousState, history: newHistory });
    }
  },

  resetGame: () => {
    get().saveStateToHistory();
    get().logActivity('game', 'Game has been reset.');
    const { onField, onBench, playerStats } = getInitialState();
    set({
      onField,
      onBench,
      gameTimer: 0,
      isTimerRunning: false,
      currentQuarter: 1,
      score: 0,
      activityLog: [],
      playerStats,
    });
  },
  
  hideFireworks: () => set({ showFireworks: false }),

  setPlayers: (onField, onBench) => {
    const newOnBench = onBench.map(player => ({ ...player, fieldTime: 0 }));

    const newPlayerStats = { ...get().playerStats };
    [...onField, ...newOnBench].forEach(p => {
      if (!newPlayerStats[p.id]) {
        newPlayerStats[p.id] = { goals: 0, totalFieldTime: 0 };
      }
    });
    set({ onField, onBench: newOnBench, playerStats: newPlayerStats });
  },

  logActivity: (type, message) => {
    set((state) => ({
      activityLog: [{ type, message }, ...state.activityLog].slice(0, 50)
    }));
  },

  saveStateToHistory: () => {
    set(state => {
      const stateToSave = { ...state };
      // Omit history from the saved state to prevent recursion
      delete (stateToSave as Partial<GameState>).history;
      return { history: [...state.history, stateToSave] };
    });
  },

  movePlayer: (result) => {
    const { source, destination } = result;
    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }
    
    get().saveStateToHistory();

    const { onField, onBench, setPlayers, logActivity } = get();

    const sourceList = source.droppableId === 'field-players' ? [...onField] : [...onBench];
    const [movedPlayer] = sourceList.splice(source.index, 1);

    if (movedPlayer.isGoalie) {
      logActivity('error', 'Goalie cannot be moved.');
      return;
    }

    if (destination.droppableId === 'field-players' && onField.length >= 7) {
      logActivity('error', 'Field is full (max 6 players + goalie).');
      return;
    }
    
    logActivity('game', `${movedPlayer.name} moved from ${source.droppableId.split('-')[0]} to ${destination.droppableId.split('-')[0]}`);

    if (source.droppableId === destination.droppableId) {
      // Reordering in the same list
      const list = source.droppableId === 'field-players' ? [...onField] : [...onBench];
      const [reorderedItem] = list.splice(source.index, 1);
      list.splice(destination.index, 0, reorderedItem);
      if (source.droppableId === 'field-players') {
        setPlayers(list, onBench);
      } else {
        setPlayers(onField, list);
      }
    } else {
      // Moving between lists
      const destList = destination.droppableId === 'field-players' ? [...onField] : [...onBench];
      destList.splice(destination.index, 0, movedPlayer);
      if (destination.droppableId === 'field-players') {
        setPlayers(destList, sourceList);
      } else {
        setPlayers(sourceList, destList);
      }
    }
  }
}));

export default useStore; 