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

  function handlePlayerClick(e) {
    // Ignore clicks on the score button
    if (e.target.classList.contains('score-button')) {
      return;
    }

    const player = e.currentTarget;
    const isOnField = player.closest('#field-players');
    const targetZone = isOnField ? benchPlayers : fieldPlayers;
    const sourceZone = isOnField ? fieldPlayers : benchPlayers;

    // Check 4-player limit when moving to field
    if (!isOnField && fieldPlayers.children.length >= 4) {
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
      hadOnFieldClass: player.classList.contains('on-field'),
      previousTransition: player.style.transition,
      previousBackgroundColor: player.style.backgroundColor,
      scoreButtonDisplay: player.querySelector('.score-button').style.display
    });

    // Move player to target zone
    targetZone.appendChild(player);

    // Update player styling and state
    if (!isOnField) {
      // Moving to field
      player.classList.remove('red');
      player.style.transition = 'none';
      player.style.backgroundColor = '#28a745';
      player.classList.add('on-field');
      player.querySelector('.score-button').style.display = 'inline';
      
      // If timer is running, start the transition for the new player
      if (timer) {
        startPlayerTransition(player);
      }
      
      // Start the game if we now have 4 players on the field
      if (fieldPlayers.children.length === 4 && !timer) {
        startCountdownAndTransition();
      }
    } else {
      // Moving to bench - reset to green without transitions
      player.classList.remove('red', 'on-field');
      player.style.transition = 'none';
      player.style.backgroundColor = '#28a745';
      player.querySelector('.score-button').style.display = 'none';
      
      // Clear any ongoing transitions or timeouts
      player.style.transition = 'none';
      recommendPlayer();
    }

    // Log the movement
    addLogEntry(`${player.textContent.replace('+', '').trim()} moved to ${!isOnField ? 'field' : 'bench'}.`, !isOnField ? 'field' : 'bench');
  }

  function recommendPlayer() {
    const benchPlayers = Array.from(document.querySelectorAll('#bench-players .player'));
    if (benchPlayers.length > 0) {
      const recommendedPlayer = benchPlayers[0].textContent.replace('+', '').trim();
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

  function startPlayerTransition(player) {
    // Only start transitions for players on the field
    if (!player.closest('#field-players')) return;

    // Start with green and set up transition
    player.style.backgroundColor = '#28a745';
    player.style.transition = 'background-color 15s linear';
    
    // Immediately start transition to yellow
    requestAnimationFrame(() => {
      player.style.backgroundColor = '#ffc107'; // Yellow
      
      // After 15 seconds, transition to red
      setTimeout(() => {
        // Check if player is still on field before continuing transition
        if (player.closest('#field-players')) {
          player.style.backgroundColor = '#dc3545'; // Red
          
          // After reaching red (15 more seconds), start flashing
          setTimeout(() => {
            // Final check if player is still on field
            if (player.closest('#field-players')) {
              player.style.transition = 'none';
              player.classList.add('red');
            }
          }, 15000);
        }
      }, 15000);
    });
  }

  function startCountdownAndTransition() {
    // Start the timer
    timer = setInterval(updateTimer, 1000);
    addLogEntry(`${getQuarterName(currentQuarter)} begins`, 'field');
    
    // Start transitions only for players on field
    const fieldPlayers = document.querySelectorAll('#field-players .player');
    fieldPlayers.forEach(player => startPlayerTransition(player));
  }

  document.querySelectorAll('.score-button').forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent triggering drag events
      const playerElement = e.target.parentElement;
      const playerName = playerElement.textContent.replace('+', '').trim();

      // Track action before making the change
      actionHistory.push({
        type: ACTION_TYPES.GOAL_SCORE,
        player: playerElement,
        previousTotalGoals: totalGoals
      });

      addLogEntry(`${playerName} scored a goal!`, 'goal');
      totalGoals++;
      updateTotalGoals();
      createRandomFireworks();
    });
  });

  // Add undo button next to export log button
  const exportLogButton = document.getElementById('export-log');
  const undoButton = document.createElement('button');
  undoButton.id = 'undo-action';
  undoButton.textContent = '↩️ Undo';
  undoButton.style.marginLeft = '10px';
  exportLogButton.parentNode.insertBefore(undoButton, exportLogButton.nextSibling);

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

      // Restore previous state
      if (lastAction.hadRedClass) lastAction.player.classList.add('red');
      else lastAction.player.classList.remove('red');

      if (lastAction.hadOnFieldClass) lastAction.player.classList.add('on-field');
      else lastAction.player.classList.remove('on-field');

      lastAction.player.style.transition = lastAction.previousTransition;
      lastAction.player.style.backgroundColor = lastAction.previousBackgroundColor;
      lastAction.player.querySelector('.score-button').style.display = lastAction.scoreButtonDisplay;

      // Remove the log entry for this action
      if (lastLogEntry) activityLog.removeChild(lastLogEntry);

    } else if (lastAction.type === ACTION_TYPES.GOAL_SCORE) {
      // Restore previous total goals
      totalGoals = lastAction.previousTotalGoals;
      updateTotalGoals();

      // Remove the log entry for this action
      if (lastLogEntry) activityLog.removeChild(lastLogEntry);
    }
  }

  undoButton.addEventListener('click', undoLastAction);

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