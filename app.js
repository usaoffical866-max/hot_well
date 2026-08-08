// app.js — HOTWELL Telegram Mini App (backend-integrated)
// Calls backend endpoints at window.HOTWELL_BACKEND_URL
// No secrets are stored here.

(function() {
  'use strict';

  // Config: backend URL (set in index.html meta or env during deploy)
  const BACKEND = window.HOTWELL_BACKEND_URL || location.origin;

  // Initialize Telegram Web App
  const tg = window.Telegram?.WebApp;
  if (tg) {
    try { tg.ready(); tg.expand(); } catch(e){/* ignore */ }
  }

  // Local demo storage key
  const DEMO_KEY = 'hotwell_demo_v1';

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
    leaderboard: [],
    recentResults: []
  };

  // DOM Elements
  const page = document.getElementById('page');
  const userShort = document.getElementById('userShort');
  const toast = document.getElementById('toast');
  const navButtons = document.querySelectorAll('.nav-btn');

  // Utility: show toast
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.visibility = 'visible';
    setTimeout(() => { toast.style.opacity = '0'; toast.style.visibility = 'hidden'; }, 2000);
  }

  // Render helpers
  function updateUserShort() {
    const initial = (state.user.firstName || 'P')[0].toUpperCase();
    if (userShort) {
      userShort.textContent = initial;
      userShort.title = state.user.firstName || 'Player';
    }
  }

  function updateLeaderboard(list) {
    state.leaderboard = list || [];
  }

  function updateRecent(list) {
    state.recentResults = list || [];
  }

  // Backend fetch helpers
  async function fetchJson(path) {
    const url = `${BACKEND}${path}`;
    const res = await fetch(url, { credentials: 'same-origin' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  // Local demo fallback
  function loadLocalDemo() {
    const raw = localStorage.getItem(DEMO_KEY);
    if (raw) {
      try {
        const data = JSON.parse(raw);
        state.user = Object.assign({}, state.user, data.user || {});
        updateRecent(data.recent || []);
        updateLeaderboard(data.leaderboard || []);
        renderPage(state.currentPage);
        updateUserShort();
        showToast('Using local demo');
        return;
      } catch (e) {
        localStorage.removeItem(DEMO_KEY);
      }
    }
    // Seed demo
    const demo = {
      user: { firstName: 'Demo', points: 25, coins: 200, level: 1, totalRewards: 0 },
      recent: [
        { emoji: '🎲', value: 6, points_awarded: 10, first_name: 'Alice', timestamp: Math.floor(Date.now()/1000) - 60 },
        { emoji: '🎯', value: 4, points_awarded: 1, first_name: 'Bob', timestamp: Math.floor(Date.now()/1000) - 120 }
      ],
      leaderboard: [
        { first_name: 'Alice', points: 120 },
        { first_name: 'Bob', points: 80 }
      ]
    };
    localStorage.setItem(DEMO_KEY, JSON.stringify(demo));
    state.user = Object.assign({}, state.user, demo.user);
    updateRecent(demo.recent);
    updateLeaderboard(demo.leaderboard);
    renderPage(state.currentPage);
    updateUserShort();
    showToast('Initialized local demo');
  }

  // Attempt to initialize from backend, otherwise fallback to local demo
  async function initializeData() {
    // Try backend only if tg.initData exists
    if (!tg || !tg.initData) {
      setBackendStatus('No Telegram WebApp initData — using demo');
      loadLocalDemo();
      return;
    }
    setBackendStatus('Connecting to backend...');
    try {
      // Try GET /api/me
      const encoded = encodeURIComponent(tg.initData);
      const meRes = await fetch(`${BACKEND}/api/me?initData=${encoded}`, { credentials: 'same-origin' });
      if (!meRes.ok) throw new Error('backend /api/me failed');
      const meJson = await meRes.json();
      if (!meJson.ok) throw new Error('backend /api/me returned error');
      // apply user + other data
      state.user = Object.assign({}, state.user, meJson.user || {});
      updateRecent(meJson.recent || []);
      updateLeaderboard(meJson.leaderboard || []);
      renderPage(state.currentPage);
      updateUserShort();
      setBackendStatus('Connected');
    } catch (err) {
      console.warn('Backend /api/me failed:', err);
      setBackendStatus('Backend unavailable — using demo');
      loadLocalDemo();
    }
  }

  // UI: backend status
  function setBackendStatus(text) {
    const el = document.getElementById('toast');
    if (el) el.textContent = text;
  }

  // Page rendering (home/games/tasks/leaderboard/profile)
  function renderPage(pageName) {
    state.currentPage = pageName;
    if (!page) return;
    page.innerHTML = '';
    switch(pageName) {
      case 'home': renderHome(); break;
      case 'games': renderGames(); break;
      case 'tasks': renderTasks(); break;
      case 'leaderboard': renderLeaderboard(); break;
      case 'profile': renderProfile(); break;
      default: renderHome(); break;
    }
  }

  function renderHome() {
    const recentHtml = (state.recentResults || []).slice(0,5).map(r => {
      const ts = new Date(r.timestamp*1000).toLocaleString();
      return `<div class="recent-row">${r.emoji} ${r.value} — ${r.points_awarded}pt — ${r.first_name||r.username||'User'} — <small>${ts}</small></div>`;
    }).join('');
    page.innerHTML = `
      <div class="card user-card">
        <img class="avatar" src="${state.user.photoUrl || 'https://i.pravatar.cc/48?img=' + state.user.id}" alt="Avatar">
        <div class="user-info"><div class="name">${state.user.firstName}</div><div class="username">Level ${state.user.level}</div></div>
      </div>
      <div class="card balance-card">
        <div class="balance-item"><div class="label">⭐ Points</div><div class="value">${state.user.points || 0}</div></div>
        <div class="balance-item"><div class="label">🎁 Free chances</div><div class="value">${state.user.free_chances ?? 0}</div></div>
      </div>
      <div class="card"><h3>Recent Group Results</h3>${recentHtml || '<div class="muted">No results yet</div>'}</div>
    `;
  }

  function renderGames() {
    page.innerHTML = `<div style="padding:12px">${state.games.map(g=>`<div class="card"><strong>${g.icon} ${g.name}</strong></div>`).join('')}</div>`;
  }
  function renderTasks() {
    page.innerHTML = `<div style="padding:12px"><h3>Daily Tasks (demo)</h3><ul>${state.tasks.map(t=>`<li>${t.icon} ${t.title} — +${t.reward}</li>`).join('')}</ul></div>`;
  }
  function renderLeaderboard() {
    const html = (state.leaderboard || []).map(u => `<li>${u.username||u.first_name||'User'} — ${u.points} pts</li>`).join('');
    page.innerHTML = `<div class="card"><h3>Leaderboard</h3><ol>${html || '<li class="muted">No leaderboard</li>'}</ol></div>`;
  }
  function renderProfile() {
    page.innerHTML = `<div class="card"><h3>${state.user.firstName}</h3><p>User ID: ${state.user.id}</p><p>Points: ${state.user.points || 0}</p></div>`;
  }

  // Navigation
  function attachNav() {
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const p = btn.getAttribute('data-page');
        renderPage(p);
        navButtons.forEach(b => b.classList.toggle('active', b === btn));
      });
    });
  }

  // Demo simulation button (keeps fallback)
  window.simulateLocalDice = function() {
    const emojis = ['🎲','🎯','🏀','⚽','🎳','🎰'];
    const emoji = emojis[Math.floor(Math.random()*emojis.length)];
    const valueMap = {
      '🎲': () => 1+Math.floor(Math.random()*6),
      '🎯': () => 1+Math.floor(Math.random()*6),
      '🏀': () => 1+Math.floor(Math.random()*5),
      '⚽': () => 1+Math.floor(Math.random()*5),
      '🎳': () => 1+Math.floor(Math.random()*6),
      '🎰': () => (Math.random()<0.05?64:Math.floor(Math.random()*64))
    };
    const value = (valueMap[emoji]||(()=>1))();
    const points = (emoji==='🎲' && value===6)?10 : (emoji==='🎯' && value===6)?15 : (emoji==='🏀' && value===5)?10 : (emoji==='⚽' && value===3)?10 : (emoji==='🎳' && value===6)?20 : (emoji==='🎰' && value===64)?50 : 1;
    const entry = { emoji, value, points_awarded: points, first_name: state.user.firstName, timestamp: Math.floor(Date.now()/1000) };
    const raw = JSON.parse(localStorage.getItem(DEMO_KEY) || '{}');
    raw.recent = raw.recent || [];
    raw.recent.unshift(entry);
    raw.recent = raw.recent.slice(0,50);
    raw.user = raw.user || state.user;
    raw.user.points = (raw.user.points || 0) + points;
    raw.leaderboard = raw.leaderboard || [];
    raw.leaderboard.unshift({ first_name: raw.user.firstName || 'You', points: raw.user.points });
    localStorage.setItem(DEMO_KEY, JSON.stringify(raw));
    loadLocalDemo();
  };

  // Init
  function init() {
    updateUserShort();
    attachNav();
    renderPage('home');
    initializeData(); // try backend -> fallback to demo
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

})();
