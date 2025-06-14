import useStore from '../../store';
import styles from './Timer.module.css';
import React from 'react';

const Timer = () => {
  const { gameTimer, currentQuarter, isTimerRunning, toggleTimer, resetTimer, nextQuarter } = useStore();

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.timerWidget}>
      <h2>
        <span>⏱️</span> Game Clock
      </h2>
      <div className={styles.timeDisplay}>{formatTime(gameTimer)}</div>
      <div className={styles.quarterDisplay}>Quarter: {currentQuarter}</div>
      <div className={styles.timerControls}>
        <button onClick={toggleTimer}>{isTimerRunning ? 'Pause' : 'Start'}</button>
        <button onClick={resetTimer}>Reset</button>
        <button onClick={nextQuarter}>Next Quarter</button>
      </div>
    </div>
  );
};

export default React.memo(Timer); 