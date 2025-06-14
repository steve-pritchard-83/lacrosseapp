import React from 'react';
import useStore from '../../store';
import styles from './ActivityLog.module.css';

const ActivityLog = () => {
  const { activityLog, undo } = useStore();

  const getIcon = (type: string) => {
    switch (type) {
      case 'goal': return '🎯';
      case 'field': return '➡️';
      case 'bench': return '⬅️';
      case 'timer': return '⏱️';
      case 'quarter': return '🚩';
      case 'game': return '🔄';
      default: return '🔹';
    }
  };

  return (
    <div className={styles.activityLogWidget}>
      <h2>
        <span>📜</span> Activity Log
      </h2>
      <div className={styles.logControls}>
        <button onClick={undo}>Undo Last Action</button>
      </div>
      <ul className={styles.activityLog}>
        {activityLog.map((entry, index) => (
          <li key={index}>
            <span className={styles.logIcon}>{getIcon(entry.type)}</span>
            {entry.message}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default React.memo(ActivityLog); 