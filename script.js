document.addEventListener('DOMContentLoaded', () => {
  const fieldPlayers = document.getElementById('field-players');
  const benchPlayers = document.getElementById('bench-players');
  const activityLog = document.getElementById('activity-log');
  const pauseButton = document.getElementById('pause-timer');
  let timer;
  let timeLeft = 600; // 10 minutes in seconds
  let isPaused = false;
  let currentQuarter = 1;

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
    const totalGoals = document.getElementById('total-goals');
    const goalCount = document.querySelectorAll('.goal-icon').length;
    totalGoals.textContent = `(Total Goals: ${goalCount})`;
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

  document.querySelectorAll('.score-button').forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent triggering drag events
      const playerName = e.target.parentElement.textContent.replace('+', '').trim();
      addLogEntry(`${playerName} scored a goal!`, 'goal');
      createRandomFireworks();
    });
  });

  function handleDragStart(e) {
    if (e.target.classList.contains('red') || e.target.closest('#bench-players')) {
      e.dataTransfer.setData('text/plain', e.target.id);
    } else {
      e.preventDefault();
    }
  }

  function startPlayerTransition(player) {
    // Start with green and set up transition
    player.style.backgroundColor = '#28a745';
    player.style.transition = 'background-color 15s linear';
    
    // Immediately start transition to yellow
    requestAnimationFrame(() => {
      player.style.backgroundColor = '#ffc107'; // Yellow
      
      // After 15 seconds, transition to red
      setTimeout(() => {
        player.style.backgroundColor = '#dc3545'; // Red
        
        // After reaching red (15 more seconds), start flashing
        setTimeout(() => {
          player.style.transition = 'none';
          player.classList.add('red');
        }, 15000);
      }, 15000);
    });
  }

  function startCountdownAndTransition() {
    // Start the timer
    timer = setInterval(updateTimer, 1000);
    addLogEntry(`${getQuarterName(currentQuarter)} begins`, 'field');
    
    // Start transitions for all players on field
    const fieldPlayers = document.querySelectorAll('#field-players .player');
    fieldPlayers.forEach(player => startPlayerTransition(player));
  }

  function handleDrop(e) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const draggableElement = document.getElementById(id);
    const dropzone = e.target.closest('.dropzone');
    if (dropzone) {
      if (dropzone.id === 'field-players' && dropzone.children.length >= 4) {
        alert('Only 4 players are allowed on the field.');
        return;
      }
      dropzone.appendChild(draggableElement);
      if (dropzone.id === 'field-players') {
        draggableElement.classList.remove('red');
        draggableElement.style.transition = 'none';
        draggableElement.style.backgroundColor = '#28a745';
        draggableElement.classList.add('on-field');
        draggableElement.querySelector('.score-button').style.display = 'inline';
        
        // If timer is running, start the transition for the new player
        if (timer) {
          startPlayerTransition(draggableElement);
        }
        
        if (dropzone.children.length === 4 && !timer) {
          startCountdownAndTransition();
        }
      } else {
        draggableElement.classList.remove('red', 'on-field');
        draggableElement.style.transition = 'none';
        draggableElement.style.backgroundColor = '#28a745';
        draggableElement.querySelector('.score-button').style.display = 'none';
      }
      addLogEntry(`${draggableElement.textContent} moved to ${dropzone.id === 'field-players' ? 'field' : 'bench'}.`, dropzone.id === 'field-players' ? 'field' : 'bench');
      if (dropzone.id === 'bench-players') {
        recommendPlayer();
      }
    }
  }

  function recommendPlayer() {
    const benchPlayers = Array.from(document.querySelectorAll('#bench-players .player'));
    if (benchPlayers.length > 0) {
      const recommendedPlayer = benchPlayers[0].textContent;
      alert(`Recommend ${recommendedPlayer} to come on the field.`);
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  document.querySelectorAll('.player').forEach(player => {
    player.addEventListener('dragstart', handleDragStart);
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