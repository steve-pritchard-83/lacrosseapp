import { Player } from './types';

export const initialPlayers: Player[] = [
  { id: 'player-callum', name: 'Callum', number: 7, goals: 0, totalFieldTime: 0, fieldEntryTime: null },
  { id: 'player-ethan', name: 'Ethan', number: 10, goals: 0, totalFieldTime: 0, fieldEntryTime: null },
  { id: 'player-oliver', name: 'Oliver', number: 13, goals: 0, totalFieldTime: 0, fieldEntryTime: null },
  { id: 'player-abraham', name: 'Abraham', number: 16, goals: 0, totalFieldTime: 0, fieldEntryTime: null },
  { id: 'player-henry', name: 'Henry', number: 2, goals: 0, totalFieldTime: 0, fieldEntryTime: null },
  { id: 'player-henryb', name: 'Henry B', number: 4, goals: 0, totalFieldTime: 0, fieldEntryTime: null },
  { id: 'player-arlo', name: 'Arlo', number: 9, goals: 0, totalFieldTime: 0, fieldEntryTime: null },
  { id: 'player-newkid', name: 'New Kid', number: 18, goals: 0, totalFieldTime: 0, fieldEntryTime: null },
  { id: 'player-ben', name: 'Goalie Ben', number: 1, goals: 0, totalFieldTime: 0, fieldEntryTime: null, isGoalie: true },
];

export const getInitialState = () => {
  const goalie = initialPlayers.find((p: Player) => p.isGoalie);
  const fieldPlayers = initialPlayers.filter((p: Player) => !p.isGoalie);
  
  const initialOnField = goalie ? [goalie] : [];
  const benchPlayers = fieldPlayers;
  
  const initialPlayerStats = initialPlayers.reduce((acc, player) => {
    acc[player.id] = { goals: 0, totalFieldTime: 0 };
    return acc;
  }, {} as { [key: string]: { goals: number; totalFieldTime: number } });

  return {
    onField: initialOnField,
    onBench: benchPlayers,
    playerStats: initialPlayerStats,
  }
} 