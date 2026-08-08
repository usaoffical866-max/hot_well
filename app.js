// app.js — HOTWELL Telegram Mini App
// Main application logic for Play • Collect Points • Win Rewards

(function() {
  'use strict';

  // Initialize Telegram Web App
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
  }

  // Application State
  const state = {
    currentPage: 'home',
    user: {
      id: tg?.initDataUnsafe?.user?.id || Math.floor(Math.random() * 1000000),
      firstName: tg?.initDataUnsafe?.user?.first_name || 'Player',
      photoUrl: tg?.initDataUnsafe?.user?.photo_url || '',
      coins: 1000,
      points: 250,
      level: 5,
      totalRewards: 12,
    },
    games: [
      { id: 1, name: '🎰 Slots', points: 50, icon: '🎰' },
      { id: 2, name: '🎯 Dart', points: 30, icon: '🎯' },
      { id: 3, name: '🎲 Dice', points: 20, icon: '🎲' },
      { id: 4, name: '🎪 Spin', points: 40, icon: '🎪' },
    ],
    tasks: [
      { id: 1, title: 'Daily Login', reward: 10, completed: true, icon: '📅' },
      { id: 2, title: 'Invite Friends', reward: 50, completed: false, icon: '👥' },
      { id: 3, title: 'Share Story', reward: 25, completed: false, icon: '📢' },
      { id: 4, title: 'Watch Ad', reward: 5, completed: false, icon: '📺' },
    ],
    leaderboard: [
      { rank: 1, name: 'TechGuru', score: 5420, emoji: '🥇' },
      { rank: 2, name: 'GamerPro', score: 4890, emoji: '🥈' },
      { rank: 3, name: 'StarHunter', score: 4210, emoji: '🥉' },
      { rank: 4, name: 'YourName', score: 3150, emoji: '4️⃣' },
      { rank: 5, name: 'NovaKing', score: 2980, emoji: '5️⃣' },
    ],
  };

  // DOM Elements
  const app = document.getElementById('app');
  const page = document.getElementById('page');
  const userShort = document.getElementById('userShort');
  const toast = document.getElementById('toast');
  const navButtons = document.querySelectorAll('.nav-btn');

  // Initialize App
  function init() {
    updateUserShort();
    renderPage('home');
    attachNavListeners();
  }

  // Update User Short Display
  function updateUserShort() {
    const initial = state.user.firstName.charAt(0).toUpperCase();
    userShort.textContent = initial;
    userShort.title = state.user.firstName;
  }

  // Page Navigation
  function attachNavListeners() {
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const page = btn.getAttribute('data-page');
        renderPage(page);
        updateNavActive(page);
      });
    });
  }

  function updateNavActive(pageName) {
    navButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-page') === pageName);
    });
  }

  // Page Rendering
  function renderPage(pageName) {
    state.currentPage = pageName;
    page.innerHTML = '';
    updateNavActive(pageName);

    switch(pageName) {
      case 'home':
        renderHomePage();
        break;
      case 'games':
        renderGamesPage();
        break;
      case 'tasks':
        renderTasksPage();
        break;
      case 'leaderboard':
        renderLeaderboardPage();
        break;
      case 'profile':
        renderProfilePage();
        break;
    }
  }

  // HOME PAGE
  function renderHomePage() {
    const html = `
      <div class="card user-card">
        <img class="avatar" src="${state.user.photoUrl || 'https://i.pravatar.cc/48?img=' + state.user.id}" alt="Avatar">
        <div class="user-info">
          <div class="name">${state.user.firstName}</div>
          <div class="username">Level ${state.user.level}</div>
        </div>
      </div>

      <div class="card balance-card">
        <div class="balance-item">
          <div class="label">💰 Coins</div>
          <div class="value">${state.user.coins.toLocaleString()}</div>
        </div>
        <div class="balance-item">
          <div class="label">⭐ Points</div>
          <div class="value">${state.user.points}</div>
        </div>
        <div class="balance-item">
          <div class="label">🎁 Rewards</div>
          <div class="value">${state.user.totalRewards}</div>
        </div>
      </div>

      <div class="card games-card">
        <h3>Quick Play</h3>
        <div class="games-grid">
          ${state.games.map(game => `
            <button class="game-btn" onclick="window.playGame(${game.id})">
              ${game.icon}<br>${game.name}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="card daily-card">
        <div class="daily-left">
          <div class="gift">🎁</div>
          <div>
            <div style="font-weight:700">Daily Bonus</div>
            <div class="username">Tap for 50 coins</div>
          </div>
        </div>
        <button class="btn primary" onclick="window.claimDaily()" style="margin:0">Claim</button>
      </div>
    `;
    page.innerHTML = html;
  }

  // GAMES PAGE
  function renderGamesPage() {
    const html = `
      <div style="padding: 12px 0">
        <h2 style="margin: 0 12px 12px; font-size: 20px">Play & Earn</h2>
        ${state.games.map(game => `
          <div class="card" style="margin-bottom: 10px; cursor: pointer" onclick="window.playGame(${game.id})">
            <div style="display: flex; align-items: center; justify-content: space-between">
              <div style="display: flex; align-items: center; gap: 10px">
                <span style="font-size: 24px">${game.icon}</span>
                <div>
                  <div style="font-weight: 700">${game.name}</div>
                  <div class="username">+${game.points} points per win</div>
                </div>
              </div>
              <span>→</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    page.innerHTML = html;
  }

  // TASKS PAGE
  function renderTasksPage() {
    const html = `
      <div style="padding: 12px 0">
        <h2 style="margin: 0 12px 12px; font-size: 20px">Daily Tasks</h2>
        <ul class="tasks-list">
          ${state.tasks.map(task => `
            <li class="task-item">
              <div style="display: flex; align-items: center; gap: 10px; flex: 1">
                <span style="font-size: 20px">${task.icon}</span>
                <div style="flex: 1">
                  <div class="task-title">${task.title}</div>
                  <div class="task-meta">+${task.reward} coins</div>
                </div>
              </div>
              <button class="btn ${task.completed ? 'warn' : 'primary'}" onclick="window.completeTask(${task.id})" style="padding: 6px 12px; font-size: 12px">
                ${task.completed ? '✓' : 'Do'}
              </button>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
    page.innerHTML = html;
  }

  // LEADERBOARD PAGE
  function renderLeaderboardPage() {
    const html = `
      <div style="padding: 12px 0">
        <h2 style="margin: 0 12px 12px; font-size: 20px">🏆 Top Players</h2>
        <ol class="leaderboard-list" style="padding: 12px">
          ${state.leaderboard.map(entry => `
            <li style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center">
              <div>
                <span style="font-size: 18px; margin-right: 8px">${entry.emoji}</span>
                <strong>${entry.name}</strong>
              </div>
              <span style="color: var(--accent); font-weight: 700">${entry.score.toLocaleString()}</span>
            </li>
          `).join('')}
        </ol>
      </div>
    `;
    page.innerHTML = html;
  }

  // PROFILE PAGE
  function renderProfilePage() {
    const html = `
      <div style="padding: 12px">
        <div class="card" style="text-align: center; margin-bottom: 16px">
          <img class="avatar big" src="${state.user.photoUrl || 'https://i.pravatar.cc/96?img=' + state.user.id}" alt="Avatar" style="margin-bottom: 12px">
          <h2 style="margin: 0">${state.user.firstName}</h2>
          <div class="username">User ID: ${state.user.id}</div>
        </div>

        <div class="card" style="margin-bottom: 12px">
          <div style="font-weight: 700; margin-bottom: 8px">Statistics</div>
          <div class="profile-stats">
            <div>
              <div class="username">Level</div>
              <div style="font-weight: 700; font-size: 18px; color: var(--accent)">${state.user.level}</div>
            </div>
            <div>
              <div class="username">Total Coins</div>
              <div style="font-weight: 700; font-size: 18px; color: var(--accent)">${state.user.coins.toLocaleString()}</div>
            </div>
            <div>
              <div class="username">Points</div>
              <div style="font-weight: 700; font-size: 18px; color: var(--accent)">${state.user.points}</div>
            </div>
            <div>
              <div class="username">Rewards</div>
              <div style="font-weight: 700; font-size: 18px; color: var(--accent)">${state.user.totalRewards}</div>
            </div>
          </div>
        </div>

        <button class="btn primary" style="width: 100%" onclick="window.shareProfile()">📤 Share Profile</button>
      </div>
    `;
    page.innerHTML = html;
  }

  // Game Actions
  window.playGame = function(gameId) {
    const game = state.games.find(g => g.id === gameId);
    if (!game) return;
    
    showToast(`🎮 Playing ${game.name.split(' ')[1]}...`);
    
    // Simulate game result after 1.5 seconds
    setTimeout(() => {
      const won = Math.random() > 0.4;
      if (won) {
        state.user.coins += game.points;
        state.user.points += Math.floor(game.points / 2);
        showToast(`✅ Won ${game.points} coins!`);
      } else {
        showToast(`❌ Try again!`);
      }
    }, 1500);
  };

  window.claimDaily = function() {
    state.user.coins += 50;
    showToast('✅ Claimed 50 coins!');
  };

  window.completeTask = function(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;
    if (task.completed) return;
    
    task.completed = true;
    state.user.coins += task.reward;
    showToast(`✅ Task complete! +${task.reward} coins`);
    renderTasksPage();
  };

  window.shareProfile = function() {
    if (tg?.shareToChat) {
      tg.shareToChat(`I'm playing HotWell! 🔥 Level ${state.user.level}, ${state.user.coins} coins. Join me! 🎮`);
    } else {
      showToast('Share feature available in Telegram');
    }
  };

  // Toast Notifications
  function showToast(message) {
    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.visibility = 'visible';
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.visibility = 'hidden';
    }, 2000);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
