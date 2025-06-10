document.addEventListener('DOMContentLoaded', () => {
  const fieldPlayers = document.getElementById('field-players');
  const benchPlayers = document.getElementById('bench-players');
  const timerDisplay = document.getElementById('timer');
  const startTimerButton = document.getElementById('start-timer');
  const addScoreButton = document.getElementById('add-score');
  const scorerSelect = document.getElementById('scorer');
  const activityLog = document.getElementById('activity-log');
  let timer;
  let timeLeft = 600; // 10 minutes in seconds

  function updateTimer() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    if (timeLeft > 0) {
      timeLeft--;
    } else {
      clearInterval(timer);
    }
  }

  startTimerButton.addEventListener('click', () => {
    if (timer) {
      clearInterval(timer);
    }
    timer = setInterval(updateTimer, 1000);
  });

  function addLogEntry(message, type) {
    const logEntry = document.createElement('li');
    const timestamp = new Date().toLocaleString();
    const icon = document.createElement('span');
    icon.classList.add('icon', type === 'goal' ? 'goal-icon' : type === 'bench' ? 'bench-icon' : 'field-icon');
    logEntry.appendChild(icon);
    logEntry.appendChild(document.createTextNode(`[${timestamp}] ${message}`));
    activityLog.insertBefore(logEntry, activityLog.firstChild);
  }

  addScoreButton.addEventListener('click', () => {
    const scorer = scorerSelect.value;
    if (scorer) {
      const scoreA = document.getElementById('score-a');
      scoreA.value = parseInt(scoreA.value) + 1;
      addLogEntry(`${scorer} scored a goal!`, 'goal');
      alert(`${scorer} scored a goal!`);
      scorerSelect.value = '';
    } else {
      alert('Please select a player who scored.');
    }
  });

  function handleDragStart(e) {
    if (e.target.classList.contains('red') || e.target.closest('#bench-players')) {
      e.dataTransfer.setData('text/plain', e.target.id);
    } else {
      e.preventDefault();
    }
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
        draggableElement.classList.add('on-field');
        setTimeout(() => {
          draggableElement.classList.add('red');
        }, 30000); // 30 seconds
      } else {
        draggableElement.classList.remove('red', 'on-field');
        draggableElement.style.backgroundColor = '#ff9500';
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
    logContent += `\nFinal Score:\nTeam A: ${document.getElementById('score-a').value}\nTeam B: ${document.getElementById('score-b').value}`;

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
}); 