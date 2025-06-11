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

// Cache DOM elements to avoid repeated queries
const DOM_CACHE = {
  fieldPlayers: null,
  benchPlayers: null,
  activityLog: null,
  pauseButton: null,
  timer: null,
  logHeading: null
};

// Initialize DOM cache
function initDOMCache() {
  DOM_CACHE.fieldPlayers = document.getElementById('field-players');
  DOM_CACHE.benchPlayers = document.getElementById('bench-players');
  DOM_CACHE.activityLog = document.getElementById('activity-log');
  DOM_CACHE.pauseButton = document.getElementById('pause-timer');
  DOM_CACHE.timer = document.getElementById('timer');
  DOM_CACHE.logHeading = document.querySelector('#log h2');
}

document.addEventListener('DOMContentLoaded', () => {
  initDOMCache();
  
  const fieldPlayers = DOM_CACHE.fieldPlayers;
  const benchPlayers = DOM_CACHE.benchPlayers;
  const activityLog = DOM_CACHE.activityLog;
  const pauseButton = DOM_CACHE.pauseButton;
  let timer;
  let timeLeft = 600; // 10 minutes in seconds
  let isPaused = false;
  let currentQuarter = 1;
  let totalGoals = 0;

  // Hide score buttons by default
  document.querySelectorAll('.score-button').forEach(button => {
    button.style.display = 'none';
  });

  // Add action history tracking
  const actionHistory = [];
  
  // Player stats tracking
  const playerStats = new Map(); // Map to store player statistics
  
  // Game statistics tracking
  let substitutionCount = 0;
  let gameStartTime = null;

  // Initialize player stats
  document.querySelectorAll('.player').forEach(player => {
    playerStats.set(player, {
      goals: 0,
      totalFieldTime: 0,
      fieldEntryTime: null
    });

    const playerName = player.querySelector('.player-name').textContent.trim();

    if (!playerName.toLowerCase().includes('ben')) {
      const removeButton = document.createElement('button');
      removeButton.textContent = '✖';
      removeButton.className = 'remove-player-button';
      removeButton.title = 'Remove player from game';
      removeButton.style.cssText = `
        position: absolute;
        top: 2px;
        right: 2px;
        border: none;
        background: transparent;
        color: #c0392b;
        cursor: pointer;
        font-size: 16px;
        font-weight: bold;
        line-height: 1;
      `;

      removeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        if (timer) {
          alert('Cannot remove players after the game has started.');
          return;
        }
        
        if (confirm(`Are you sure you want to remove ${playerName}? This cannot be undone.`)) {
          playerStats.delete(player);
          player.remove();
          addLogEntry(`${playerName} was removed from the game.`, 'bench');
          saveGameState();
        }
      });

      player.appendChild(removeButton);
    }
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
    const timerDisplay = DOM_CACHE.timer;
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
    const logHeading = DOM_CACHE.logHeading;
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

  // Optimized player stats update with reduced frequency and better caching
  let statsUpdateCounter = 0;
  function updatePlayerStats() {
    if (!isPaused) {
      // Only update every 5 seconds instead of every second for better performance
      statsUpdateCounter++;
      if (statsUpdateCounter % 5 === 0) {
        const fieldPlayersNodes = DOM_CACHE.fieldPlayers.querySelectorAll('.player');
        fieldPlayersNodes.forEach(player => {
          const stats = playerStats.get(player);
          if (stats && stats.fieldEntryTime !== null) {
            updatePlayerDisplay(player);
          }
        });
      }
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

    let timeToDisplay = stats.totalFieldTime;
    if (stats.fieldEntryTime !== null && !isPaused) {
      timeToDisplay += Math.floor((Date.now() - stats.fieldEntryTime) / 1000);
    }

    const timeDisplay = formatTime(timeToDisplay);

    statsDisplay.textContent = ` (🥍${stats.goals} ⏱️${timeDisplay})`;
  }

  // Start stats update interval
  setInterval(updatePlayerStats, 1000);
  
  // Update statistics dashboard
  function updateStatsDashboard() {
    // Top scorer
    let topScorer = null;
    let maxGoals = 0;
    playerStats.forEach((stats, player) => {
      if (stats.goals > maxGoals) {
        maxGoals = stats.goals;
        topScorer = player.querySelector('.player-name').textContent.trim();
      }
    });
    document.getElementById('top-scorer').textContent = topScorer ? `${topScorer} (${maxGoals})` : '-';

    // Most field time
    let mostFieldTimePlayer = null;
    let maxFieldTime = 0;
    playerStats.forEach((stats, player) => {
      let totalTime = stats.totalFieldTime;
      if (stats.fieldEntryTime !== null && !isPaused) {
        totalTime += Math.floor((Date.now() - stats.fieldEntryTime) / 1000);
      }
      if (totalTime > maxFieldTime) {
        maxFieldTime = totalTime;
        mostFieldTimePlayer = player.querySelector('.player-name').textContent.trim();
      }
    });
    document.getElementById('most-field-time').textContent = mostFieldTimePlayer ? 
      `${mostFieldTimePlayer} (${formatTime(maxFieldTime)})` : '-';

    // Game duration
    if (gameStartTime) {
      const gameDuration = Math.floor((Date.now() - gameStartTime) / 1000);
      document.getElementById('game-duration').textContent = formatTime(gameDuration);
    }

    // Substitution count
    document.getElementById('substitution-count').textContent = substitutionCount.toString();
  }

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
    gameStartTime = Date.now();
    addLogEntry(`${getQuarterName(currentQuarter)} begins`, 'field');
    
    // Hide remove player buttons
    document.querySelectorAll('.remove-player-button').forEach(button => {
      button.style.display = 'none';
    });

    // Start transitions for all players on field
    document.querySelectorAll('#field-players .player').forEach(player => {
      const stats = playerStats.get(player);
      if (stats) {
        stats.fieldEntryTime = Date.now();
      }
      startPlayerTransition(player);
      const scoreButton = player.querySelector('.score-button');
      if (scoreButton) {
        scoreButton.style.display = 'inline-block';
      }
    });
    saveGameState();
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
        // Moving to field - start timing if game is already running
        if (timer) {
          stats.fieldEntryTime = Date.now();
        }
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
        const scoreButton = player.querySelector('.score-button');
        if (scoreButton) {
          scoreButton.style.display = 'inline-block';
        }
      }
      
      // Start the game if we now have 4 players on the field
      if (getFieldPlayerCount() === 4 && !timer) {
        if (confirm('Ready to start the game?')) {
          startCountdownAndTransition();
        }
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
      const scoreButton = player.querySelector('.score-button');
      if (scoreButton) {
        scoreButton.style.display = 'none';
      }
      recommendPlayer();
    }

    // Log the movement with player number
    addLogEntry(`${playerName} moved to ${!isOnField ? 'field' : 'bench'}.`, !isOnField ? 'field' : 'bench');
    
    // Track substitutions
    if (timer) { // Only count if game has started
      substitutionCount++;
      updateStatsDashboard();
    }
    
    saveGameState();
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
      updateStatsDashboard();
      createRandomFireworks();
      saveGameState();
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
        lastAction.player.classList.remove('red', 'g-y-r-transition', 'on-field');
        lastAction.player.style.animation = '';
      }

      // Restore score button display
      const scoreButton = lastAction.player.querySelector('.score-button');
      if (scoreButton) {
        scoreButton.style.display = lastAction.scoreButtonDisplay;
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
    saveGameState();
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

    document.querySelectorAll('#field-players .player').forEach(player => {
      const stats = playerStats.get(player);
      if (stats) {
        if (isPaused) {
          // Pausing
          if (stats.fieldEntryTime !== null) {
            stats.totalFieldTime += Math.floor((Date.now() - stats.fieldEntryTime) / 1000);
            stats.fieldEntryTime = null;
            updatePlayerDisplay(player);
          }
        } else {
          // Resuming
          stats.fieldEntryTime = Date.now();
        }
      }
    });
    saveGameState();
  });

  // --- State Persistence ---

  function saveGameState() {
    try {
      const fieldPlayersData = Array.from(document.querySelectorAll('#field-players .player')).map(p => p.id);
      const benchPlayersData = Array.from(document.querySelectorAll('#bench-players .player')).map(p => p.id);

      const playerStatsData = {};
      playerStats.forEach((stats, player) => {
        playerStatsData[player.id] = stats;
      });

      const state = {
        hasStarted: !!timer,
        fieldPlayers: fieldPlayersData,
        benchPlayers: benchPlayersData,
        playerStats: playerStatsData,
        timeLeft,
        currentQuarter,
        isPaused,
        totalGoals,
        substitutionCount,
        gameStartTime,
        activityLogHtml: activityLog.innerHTML,
        version: '1.1' // Version tracking for future compatibility
      };

      localStorage.setItem('lacrosseGameState', JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save game state:', error);
      alert('Failed to save game progress. Please ensure you have sufficient storage space.');
    }
  }

  function loadGameState() {
    try {
      const savedStateJSON = localStorage.getItem('lacrosseGameState');
      if (!savedStateJSON) return;

      const savedState = JSON.parse(savedStateJSON);
      
      // Version compatibility check
      if (savedState.version && savedState.version !== '1.1') {
        console.warn('Loading game state from different version:', savedState.version);
      }

      const allPlayersById = new Map();
      document.querySelectorAll('.player').forEach(p => allPlayersById.set(p.id, p));

      // Correctly handle removed players
      const savedPlayerIds = new Set([...savedState.fieldPlayers, ...savedState.benchPlayers]);
      allPlayersById.forEach((player, id) => {
        if (!savedPlayerIds.has(id)) {
          player.remove();
        }
      });

      // Restore player positions
      const fieldPlayersContainer = document.getElementById('field-players');
      fieldPlayersContainer.innerHTML = '';
      savedState.fieldPlayers.forEach(id => {
        const player = allPlayersById.get(id);
        if (player) fieldPlayersContainer.appendChild(player);
      });

      const benchPlayersContainer = document.getElementById('bench-players');
      benchPlayersContainer.innerHTML = '';
      savedState.benchPlayers.forEach(id => {
        const player = allPlayersById.get(id);
        if (player) benchPlayersContainer.appendChild(player);
      });

      // Restore player stats
      playerStats.clear();
      for (const [playerId, stats] of Object.entries(savedState.playerStats)) {
        const player = allPlayersById.get(playerId);
        if (player) {
          playerStats.set(player, stats);
          updatePlayerDisplay(player);
        }
      }

      // Restore game state
      timeLeft = savedState.timeLeft;
      currentQuarter = savedState.currentQuarter;
      isPaused = savedState.isPaused;
      totalGoals = savedState.totalGoals;
      substitutionCount = savedState.substitutionCount || 0;
      gameStartTime = savedState.gameStartTime || null;
      updateTotalGoals();
      updateStatsDashboard();

      // Restore log
      activityLog.innerHTML = savedState.activityLogHtml;

      // If game had started, restore timer and UI state
      if (savedState.hasStarted) {
        document.querySelectorAll('.remove-player-button').forEach(b => b.style.display = 'none');
        document.querySelectorAll('#field-players .player .score-button').forEach(b => b.style.display = 'inline-block');

        pauseButton.textContent = isPaused ? '▶️' : '⏸️';

        if (!isPaused) {
          timer = setInterval(updateTimer, 1000);
          document.querySelectorAll('#field-players .player').forEach(player => {
            startPlayerTransition(player);
          });
        }
        updateTimer();
      }
    } catch (error) {
      console.error('Failed to load game state:', error);
      alert('Failed to load previous game state. Starting fresh.');
      localStorage.removeItem('lacrosseGameState');
    }
  }

  // Add Reset Button
  const resetButton = document.createElement('button');
  resetButton.id = 'reset-game';
  resetButton.textContent = 'Reset Game';
  resetButton.style.marginLeft = '10px';
  document.getElementById('export-log').after(resetButton);

  resetButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset the game? This will erase all progress.')) {
      localStorage.removeItem('lacrosseGameState');
      if (timer) clearInterval(timer);
      window.location.reload();
    }
  });

  loadGameState();
}); 