import React from 'react';
import { Player as PlayerType } from '../../types';
import styles from './Player.module.css';

interface PlayerProps {
  player: PlayerType;
  onPlayerClick: (player: PlayerType) => void;
  onScore: (player: PlayerType) => void;
  isOnField: boolean;
  isRecommended?: boolean;
}

const Player: React.FC<PlayerProps> = ({ player, onPlayerClick, onScore, isOnField, isRecommended }) => {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const isTired = (player.fieldTime || 0) >= 30;

  if (player.isGoalie) {
    return (
      <div className={styles.goalie}>
        <span className={styles.playerName}>{player.name}</span>
        <span className={styles.playerNumber}>#{player.number.toString().padStart(2, '0')}</span>
      </div>
    );
  }

  const playerClasses = [
    styles.player,
    isOnField ? styles.onField : '',
    isOnField && !player.isGoalie ? styles.timedAnimation : '',
    isRecommended ? styles.recommended : '',
    isTired ? styles.isFlashing : ''
  ].filter(Boolean).join(' ');

  return (
    <div
      id={player.id}
      className={playerClasses}
      onClick={() => onPlayerClick(player)}
      draggable="true"
      style={{ animationDuration: '30s' }} // Corresponds to the animation
    >
      <span className={styles.playerName}>{player.name}</span>
      <span className={styles.playerNumber}>#{player.number.toString().padStart(2, '0')}</span>
      
      {isOnField && !player.isGoalie && (
        <button className={styles.scoreButton} onClick={(e) => {
          e.stopPropagation();
          onScore(player);
        }}>🥍</button>
      )}
      
      <div className={styles.playerStats}>
        <span> G: {player.goals ?? 0}</span>
        <span> T: {formatTime(player.totalFieldTime ?? 0)}</span>
      </div>
    </div>
  );
};

export default React.memo(Player); 