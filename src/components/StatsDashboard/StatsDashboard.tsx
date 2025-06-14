import useStore from '../../store';
import styles from './StatsDashboard.module.css';
import React from 'react';

const StatsDashboard = () => {
  const { playerStats, score } = useStore();

  const { onField, onBench, resetGame } = useStore();

  const allPlayers = [...onField, ...onBench].sort((a, b) => a.number - b.number);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.statsWidget}>
      <h2>
        <span>📊</span> Game Statistics
      </h2>
      <div className={styles.mainStats}>
        <div className={styles.statCard}>
          <h3>Total Score</h3>
          <p>{score}</p>
        </div>
      </div>
      <h3>Player Stats</h3>
      <div className={styles.playerStatsGrid}>
        {allPlayers.map((player) => (
          <div key={player.id} className={styles.playerStatCard}>
            <strong>{player.name} #{player.number}</strong>
            <span>G: {playerStats[player.id]?.goals || 0}</span>
            <span>T: {formatTime(playerStats[player.id]?.totalFieldTime || 0)}</span>
          </div>
        ))}
      </div>
      <button onClick={resetGame} className={styles.resetButton}>Reset Game</button>
    </div>
  );
};

export default React.memo(StatsDashboard); 