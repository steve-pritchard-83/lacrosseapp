if (window.CSS && CSS.registerProperty) {
  try {
    CSS.registerProperty({
      name: '--color-start',
      syntax: '<color>',
      inherits: false,
      initialValue: '#2ecc71',
    });
    CSS.registerProperty({
      name: '--color-end',
      syntax: '<color>',
      inherits: false,
      initialValue: '#27ae60',
    });
  } catch (err) {
    console.error('Failed to register CSS properties:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const fieldPlayers = document.getElementById('field-players');
  const benchPlayers = document.getElementById('bench-players');
  const activityLog = document.getElementById('activity-log');
  const pauseButton = document.getElementById('pause-timer');
  let timer;
  let timeLeft = 600; // 10 minutes in seconds
  let isPaused = false;
  let currentQuarter = 1;
  let totalGoals = 0;

  // Add action history tracking
  const actionHistory = [];
  
  // Player stats tracking
  const playerStats = new Map(); // Map to store player statistics

  // Initialize player stats
  document.querySelectorAll('.player').forEach(player => {
    playerStats.set(player, {
      goals: 0,
      totalFieldTime: 0,
      fieldEntryTime: null
    });
  });

  // Action types
  const ACTION_TYPES = {
    PLAYER_MOVE: 'player_move',
    GOAL_SCORE: 'goal_score'
  };

  function getQuarterName(quarter) {
    const quarters = {
      1: '1st Quarter',
      2: '2nd Quarter',
      3: '3rd Quarter',
      4: '4th Quarter'
    };
    return quarters[quarter] || '';
  }

  function updateTimer() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timerDisplay = document.getElementById('timer');
    timerDisplay.textContent = `(${getQuarterName(currentQuarter)} ${minutes}:${seconds < 10 ? '0' : ''}${seconds})`;
    
    if (timeLeft > 0 && !isPaused) {
      timeLeft--;
      if (timeLeft === 0 && currentQuarter < 4) {
        currentQuarter++;
        timeLeft = 600; // Reset to 10 minutes for next quarter
        addLogEntry(`${getQuarterName(currentQuarter)} begins`, 'field');
      } else if (timeLeft === 0) {
        clearInterval(timer);
        addLogEntry('Game finished', 'field');
      }
    }
  }

  function updateTotalGoals() {
    const totalGoalsDisplay = document.createElement('span');
    totalGoalsDisplay.textContent = ` (Total Goals: ${totalGoals})`;
    const logHeading = document.querySelector('#log h2');
    // Remove existing total if present
    const existingTotal = logHeading.querySelector('span');
    if (existingTotal) {
      logHeading.removeChild(existingTotal);
    }
    logHeading.appendChild(totalGoalsDisplay);
  }

  function addLogEntry(message, type) {
    const logEntry = document.createElement('li');
    const timestamp = new Date().toLocaleString();
    const icon = document.createElement('span');
    icon.classList.add('icon', type === 'goal' ? 'goal-icon' : type === 'bench' ? 'bench-icon' : 'field-icon');
    logEntry.appendChild(icon);
    logEntry.appendChild(document.createTextNode(`[${timestamp}] ${message}`));
    activityLog.insertBefore(logEntry, activityLog.firstChild);
  }

  function createFirework(x, y) {
    const firework = document.createElement('div');
    firework.className = 'firework';
    firework.style.left = x + 'px';
    firework.style.top = y + 'px';
    document.body.appendChild(firework);

    // Create sparks
    for (let i = 0; i < 12; i++) {
      const spark = document.createElement('div');
      spark.className = 'spark';
      const angle = (i * 30) * Math.PI / 180;
      const velocity = 50;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity;
      
      spark.style.setProperty('--x', `${vx}px`);
      spark.style.setProperty('--y', `${vy}px`);
      
      firework.appendChild(spark);
    }

    // Remove the firework after animation
    setTimeout(() => {
      document.body.removeChild(firework);
    }, 1000);
  }

  function createRandomFireworks() {
    const numFireworks = Math.floor(Math.random() * 3) + 2; // 2-4 fireworks
    for (let i = 0; i < numFireworks; i++) {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * (window.innerHeight * 0.7); // Keep in top 70% of screen
      setTimeout(() => createFirework(x, y), i * 200); // Stagger the fireworks
    }
  }

  function updatePlayerStats() {
    if (!isPaused) {
      document.querySelectorAll('#field-players .player').forEach(player => {
        const stats = playerStats.get(player);
        if (stats && stats.fieldEntryTime !== null) {
          stats.totalFieldTime = Math.floor((Date.now() - stats.fieldEntryTime) / 1000);
          updatePlayerDisplay(player);
        }
      });
    }
  }

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  function updatePlayerDisplay(player) {
    const stats = playerStats.get(player);
    if (!stats) return;

    // Get or create the stats display element
    let statsDisplay = player.querySelector('.player-stats');
    if (!statsDisplay) {
      statsDisplay = document.createElement('span');
      statsDisplay.className = 'player-stats';
      player.appendChild(statsDisplay);
    }

    const timeDisplay = stats.fieldEntryTime !== null ? 
      formatTime(stats.totalFieldTime) : 
      formatTime(stats.totalFieldTime);

    statsDisplay.textContent = ` (🥍${stats.goals} ⏱️${timeDisplay})`;
  }

  // Start stats update interval
  setInterval(updatePlayerStats, 1000);

  function getFieldPlayerCount() {
    return fieldPlayers.querySelectorAll('.player').length;
  }

  function startPlayerTransition(player) {
    if (!player.closest('#field-players') || !timer) return;

    // Reset any existing animation/color states
    player.classList.remove('red', 'g-y-r-transition');
    player.style.animation = ''; // Clear inline animation styles to allow re-triggering

    // Force reflow to restart animation
    void player.offsetWidth;

    // Add class to start the 30-second transition
    player.classList.add('g-y-r-transition');

    // After 30 seconds, switch to flashing red
    const transitionTimeout = setTimeout(() => {
        if (player.closest('#field-players')) {
            player.classList.remove('g-y-r-transition');
            player.classList.add('red');
        }
    }, 30000);

    player.dataset.transitionTimeout = transitionTimeout;
  }

  function startCountdownAndTransition() {
    // Start the timer
    timer = setInterval(updateTimer, 1000);
    addLogEntry(`${getQuarterName(currentQuarter)} begins`, 'field');
    
    // Start transitions for all players on field
    document.querySelectorAll('#field-players .player').forEach(player => {
      startPlayerTransition(player);
    });
  }

  function handlePlayerClick(e) {
    // Ignore clicks on the score button
    if (e.target.classList.contains('score-button')) {
      return;
    }

    const player = e.currentTarget;
    const isOnField = player.closest('#field-players');
    const targetZone = isOnField ? benchPlayers : fieldPlayers;
    const sourceZone = isOnField ? fieldPlayers : benchPlayers;

    // Get player name with number
    const playerName = player.querySelector('.player-name').textContent.trim();

    // Update field time tracking
    const stats = playerStats.get(player);
    if (stats) {
      if (isOnField) {
        // Moving to bench - update total time
        if (stats.fieldEntryTime !== null) {
          stats.totalFieldTime += Math.floor((Date.now() - stats.fieldEntryTime) / 1000);
          stats.fieldEntryTime = null;
        }
      } else {
        // Moving to field - start timing
        stats.fieldEntryTime = Date.now();
      }
      updatePlayerDisplay(player);
    }

    // Check 4-player limit when moving to field
    if (!isOnField && getFieldPlayerCount() >= 4) {
      alert('Only 4 players are allowed on the field.');
      return;
    }

    // Track action before making the change
    actionHistory.push({
      type: ACTION_TYPES.PLAYER_MOVE,
      player: player,
      fromZone: sourceZone,
      toZone: targetZone,
      wasOnField: isOnField,
      hadRedClass: player.classList.contains('red'),
      hadYellowClass: player.classList.contains('yellow'),
      hadSolidRedClass: player.classList.contains('solid-red'),
      hadOnFieldClass: player.classList.contains('on-field'),
      previousBackground: player.style.background,
      scoreButtonDisplay: player.querySelector('.score-button').style.display,
      playerStats: { ...playerStats.get(player) } // Save stats state
    });

    // Move player to target zone
    targetZone.appendChild(player);

    // Update player styling and state
    if (!isOnField) {
      // Moving to field
      player.classList.remove('red', 'yellow', 'solid-red');
      player.style.background = 'linear-gradient(135deg, #2ecc71, #27ae60)';
      player.classList.add('on-field');
      
      // If timer is running, start the transition for the new player
      if (timer) {
        startPlayerTransition(player);
      }
      
      // Start the game if we now have 4 players on the field
      if (getFieldPlayerCount() === 4 && !timer) {
        startCountdownAndTransition();
      }
    } else {
      // Moving to bench - reset to green and stop any animations
      const timeoutId = player.dataset.transitionTimeout;
      if (timeoutId) {
        clearTimeout(timeoutId);
        delete player.dataset.transitionTimeout;
      }
      player.classList.remove('red', 'g-y-r-transition', 'on-field');
      player.style.animation = ''; // Clear any inline animation properties
      recommendPlayer();
    }

    // Log the movement with player number
    addLogEntry(`${playerName} moved to ${!isOnField ? 'field' : 'bench'}.`, !isOnField ? 'field' : 'bench');
  }

  function recommendPlayer() {
    const benchPlayers = Array.from(document.querySelectorAll('#bench-players .player'));
    if (benchPlayers.length > 0) {
      const recommendedPlayer = benchPlayers[0].querySelector('.player-name').textContent.trim();
      alert(`Recommend ${recommendedPlayer} to come on the field.`);
    }
  }

  function handleDragStart(e) {
    if (e.target.classList.contains('red') || e.target.closest('#bench-players')) {
      e.dataTransfer.setData('text/plain', e.target.id);
    } else {
      e.preventDefault();
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function handleDrop(e) {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    const draggable = document.getElementById(data);
    const targetZone = e.target.closest('.dropzone');
    if (targetZone) {
      targetZone.appendChild(draggable);
    }
  }

  document.querySelectorAll('.score-button').forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent triggering drag events
      const playerElement = e.target.parentElement;
      const playerName = playerElement.querySelector('.player-name').textContent.trim();

      // Update player's goal count
      const stats = playerStats.get(playerElement);
      if (stats) {
        stats.goals++;
        updatePlayerDisplay(playerElement);
      }

      // Track action before making the change
      actionHistory.push({
        type: ACTION_TYPES.GOAL_SCORE,
        player: playerElement,
        previousTotalGoals: totalGoals,
        previousPlayerStats: { ...playerStats.get(playerElement) }
      });

      addLogEntry(`${playerName} scored a goal!`, 'goal');
      totalGoals++;
      updateTotalGoals();
      createRandomFireworks();
    });
  });

  // Remove the duplicate undo button creation and keep the event listener
  document.getElementById('undo-action').addEventListener('click', undoLastAction);

  // Undo functionality
  function undoLastAction() {
    if (actionHistory.length === 0) {
      alert('Nothing to undo!');
      return;
    }

    const lastAction = actionHistory.pop();
    const lastLogEntry = activityLog.firstChild;

    if (lastAction.type === ACTION_TYPES.PLAYER_MOVE) {
      // Restore player to previous zone
      lastAction.fromZone.appendChild(lastAction.player);

      // Restore previous state by re-running the transition logic if they were on field
      if (lastAction.wasOnField) {
        startPlayerTransition(lastAction.player);
      } else {
        player.classList.remove('red', 'g-y-r-transition', 'on-field');
        player.style.animation = '';
      }

      // Restore player stats
      if (lastAction.playerStats) {
        playerStats.set(lastAction.player, lastAction.playerStats);
        updatePlayerDisplay(lastAction.player);
      }

      // Remove the log entry for this action
      if (lastLogEntry) activityLog.removeChild(lastLogEntry);

    } else if (lastAction.type === ACTION_TYPES.GOAL_SCORE) {
      // Restore previous total goals
      totalGoals = lastAction.previousTotalGoals;
      updateTotalGoals();

      // Restore player stats
      if (lastAction.previousPlayerStats) {
        playerStats.set(lastAction.player, lastAction.previousPlayerStats);
        updatePlayerDisplay(lastAction.player);
      }

      // Remove the log entry for this action
      if (lastLogEntry) activityLog.removeChild(lastLogEntry);
    }
  }

  document.querySelectorAll('.player').forEach(player => {
    player.addEventListener('dragstart', handleDragStart);
    player.addEventListener('click', handlePlayerClick);
  });

  document.querySelectorAll('.dropzone').forEach(zone => {
    zone.addEventListener('dragover', handleDragOver);
    zone.addEventListener('drop', handleDrop);
  });

  document.getElementById('export-log').addEventListener('click', () => {
    let logContent = 'Activity Log:\n';
    document.querySelectorAll('#activity-log li').forEach(item => {
      logContent += item.textContent + '\n';
    });

    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lacrosse_log.txt';
    a.click();
    URL.revokeObjectURL(url);
  });

  const container = document.body;

  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    const afterElement = getDragAfterElement(container, e.clientY);
    const draggable = document.querySelector('.dragging');
    if (afterElement == null) {
      container.appendChild(draggable);
    } else {
      container.insertBefore(draggable, afterElement);
    }
  });

  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.widget:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  pauseButton.addEventListener('click', () => {
    isPaused = !isPaused;
    pauseButton.textContent = isPaused ? '▶️' : '⏸️';
    addLogEntry(`Game ${isPaused ? 'paused' : 'resumed'}`, 'field');
  }); 
}); 