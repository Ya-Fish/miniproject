/* ═══════════════════════════════════════════════
   PERSONAL DASHBOARD  –  app.js
   ═══════════════════════════════════════════════ */

'use strict';

/* ───────────────────────────────────────────────
   HELPERS
─────────────────────────────────────────────── */
const $ = (id) => document.getElementById(id);
const ls = {
  get:    (k, d) => { try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : d; } catch { return d; } },
  set:    (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};

/* ───────────────────────────────────────────────
   THEME
─────────────────────────────────────────────── */
const themeToggle = $('theme-toggle');

function applyTheme(theme) {
  document.body.classList.toggle('light', theme === 'light');
  document.body.classList.toggle('dark',  theme === 'dark');
  themeToggle.textContent = theme === 'light' ? '* Dark mode' : 'o Light mode';
}

function initTheme() {
  const saved = ls.get('theme', 'dark');
  applyTheme(saved);
}

themeToggle.addEventListener('click', () => {
  const next = document.body.classList.contains('light') ? 'dark' : 'light';
  ls.set('theme', next);
  applyTheme(next);
});

/* ───────────────────────────────────────────────
   CLOCK + GREETING
─────────────────────────────────────────────── */
const clockEl    = $('clock');
const dateEl     = $('date-display');
const greetingEl = $('greeting-text');
const nameInput  = $('name-input');
const nameSave   = $('name-save');

function getGreeting(hour) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

function updateClock() {
  const now    = new Date();
  const hour   = now.getHours();
  const name   = ls.get('userName', '');

  // time
  clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // date
  dateEl.textContent = now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // greeting
  greetingEl.textContent = `${getGreeting(hour)}, ${name || 'Friend'}! :)`;
}

function initGreeting() {
  const saved = ls.get('userName', '');
  nameInput.value = saved;
  updateClock();
  setInterval(updateClock, 1000);
}

nameSave.addEventListener('click', () => {
  const val = nameInput.value.trim();
  ls.set('userName', val);
  updateClock();
  nameSave.textContent = '✓ Saved';
  setTimeout(() => (nameSave.textContent = 'Save'), 1500);
});

nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') nameSave.click(); });

/* ───────────────────────────────────────────────
   FOCUS TIMER
─────────────────────────────────────────────── */
const timerDisplay  = $('timer-display');
const ringFill      = $('ring-fill');
const CIRCUMFERENCE = 326.73; // 2 * π * 52
const startBtn      = $('timer-start');
const stopBtn       = $('timer-stop');
const resetBtn      = $('timer-reset');
const customMinutes = $('custom-minutes');
const setTimeBtn    = $('set-time-btn');

let timerDuration  = ls.get('timerMinutes', 25) * 60;  // seconds
let timeRemaining  = timerDuration;
let timerInterval  = null;
let timerRunning   = false;

function formatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function renderTimer() {
  timerDisplay.textContent = formatTime(timeRemaining);
  const pct = timerDuration > 0 ? (timeRemaining / timerDuration) : 1;
  ringFill.style.strokeDashoffset = CIRCUMFERENCE * (1 - pct);

  const warn = timeRemaining <= 60 && timerRunning;
  timerDisplay.classList.toggle('warning', warn);
  ringFill.classList.toggle('warning', warn);
}

function startTimer() {
  if (timerRunning) return;
  timerRunning = true;
  startBtn.disabled = true;
  stopBtn.disabled  = false;

  timerInterval = setInterval(() => {
    timeRemaining--;
    renderTimer();
    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      startBtn.disabled = false;
      stopBtn.disabled  = true;
      timerDisplay.textContent = 'Done! :D';
      timerDisplay.classList.remove('warning');
      ringFill.style.strokeDashoffset = CIRCUMFERENCE;
      ringFill.classList.remove('warning');
      // audio beep via Web Audio API
      playBeep();
    }
  }, 1000);
}

function pauseTimer() {
  if (!timerRunning) return;
  clearInterval(timerInterval);
  timerRunning  = false;
  startBtn.disabled = false;
  stopBtn.disabled  = true;
}

function resetTimer() {
  clearInterval(timerInterval);
  timerRunning      = false;
  timeRemaining     = timerDuration;
  startBtn.disabled = false;
  stopBtn.disabled  = true;
  timerDisplay.classList.remove('warning');
  ringFill.classList.remove('warning');
  renderTimer();
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 150, 300].forEach((delay) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime + delay / 1000);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay / 1000 + 0.4);
      osc.start(ctx.currentTime + delay / 1000);
      osc.stop(ctx.currentTime + delay / 1000 + 0.4);
    });
  } catch (e) { /* audio not available */ }
}

setTimeBtn.addEventListener('click', () => {
  const mins = parseInt(customMinutes.value, 10);
  if (!mins || mins < 1 || mins > 120) return;
  ls.set('timerMinutes', mins);
  timerDuration  = mins * 60;
  timeRemaining  = timerDuration;
  resetTimer();
});

startBtn.addEventListener('click', startTimer);
stopBtn.addEventListener('click',  pauseTimer);
resetBtn.addEventListener('click', resetTimer);

function initTimer() {
  const saved = ls.get('timerMinutes', 25);
  customMinutes.value = saved;
  timerDuration  = saved * 60;
  timeRemaining  = timerDuration;
  renderTimer();
}

/* ───────────────────────────────────────────────
   TO-DO LIST
─────────────────────────────────────────────── */
const todoInput  = $('todo-input');
const todoAdd    = $('todo-add');
const todoList   = $('todo-list');
const sortSelect = $('sort-select');
const taskCount  = $('task-count');
const editModal  = $('edit-modal');
const editInput  = $('edit-input');
const editSave   = $('edit-save');
const editCancel = $('edit-cancel');

let tasks       = [];
let editingId   = null;

function saveTasks()   { ls.set('tasks', tasks); }
function loadTasks()   { tasks = ls.get('tasks', []); }

function sortedTasks() {
  const mode = sortSelect.value;
  const copy = [...tasks];
  if (mode === 'az')     return copy.sort((a, b) => a.text.localeCompare(b.text));
  if (mode === 'za')     return copy.sort((a, b) => b.text.localeCompare(a.text));
  if (mode === 'done')   return copy.sort((a, b) => Number(a.done) - Number(b.done));
  if (mode === 'undone') return copy.sort((a, b) => Number(a.done) - Number(b.done)).reverse();
  return copy; // default: insertion order
}

function renderTasks() {
  todoList.innerHTML = '';
  const list = sortedTasks();
  const done = tasks.filter((t) => t.done).length;
  taskCount.textContent = `${done}/${tasks.length} done`;

  list.forEach((task) => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (task.done ? ' done' : '');
    li.dataset.id = task.id;

    const check = document.createElement('input');
    check.type = 'checkbox';
    check.className = 'todo-check';
    check.checked = task.done;
    check.addEventListener('change', () => toggleTask(task.id));

    const span = document.createElement('span');
    span.className = 'todo-text';
    span.textContent = task.text;

    const actions = document.createElement('div');
    actions.className = 'todo-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn-icon';
    editBtn.title = 'Edit';
    editBtn.textContent = '[/]';
    editBtn.addEventListener('click', () => openEditModal(task.id));

    const delBtn = document.createElement('button');
    delBtn.className = 'btn-icon';
    delBtn.title = 'Delete';
    delBtn.textContent = '[x]';
    delBtn.addEventListener('click', () => deleteTask(task.id));

    actions.append(editBtn, delBtn);
    li.append(check, span, actions);
    todoList.appendChild(li);
  });
}

function addTask() {
  const text = todoInput.value.trim();
  if (!text) return;

  // duplicate check (case-insensitive)
  const dup = tasks.some((t) => t.text.toLowerCase() === text.toLowerCase());
  if (dup) {
    todoInput.style.borderColor = 'var(--danger)';
    todoInput.placeholder = 'Task already exists!';
    setTimeout(() => {
      todoInput.style.borderColor = '';
      todoInput.placeholder = 'Add a new task…';
    }, 1800);
    return;
  }

  tasks.push({ id: Date.now(), text, done: false });
  saveTasks();
  renderTasks();
  todoInput.value = '';
  todoInput.focus();
}

function toggleTask(id) {
  const t = tasks.find((t) => t.id === id);
  if (t) { t.done = !t.done; saveTasks(); renderTasks(); }
}

function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  renderTasks();
}

function openEditModal(id) {
  editingId = id;
  const t = tasks.find((t) => t.id === id);
  editInput.value = t ? t.text : '';
  editModal.classList.remove('hidden');
  editInput.focus();
}

function closeEditModal() {
  editingId = null;
  editModal.classList.add('hidden');
}

function saveEdit() {
  const text = editInput.value.trim();
  if (!text) return;

  // duplicate check excluding current task
  const dup = tasks.some((t) => t.id !== editingId && t.text.toLowerCase() === text.toLowerCase());
  if (dup) {
    editInput.style.borderColor = 'var(--danger)';
    return;
  }
  editInput.style.borderColor = '';

  const t = tasks.find((t) => t.id === editingId);
  if (t) { t.text = text; saveTasks(); renderTasks(); }
  closeEditModal();
}

todoAdd.addEventListener('click', addTask);
todoInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTask(); });
sortSelect.addEventListener('change', renderTasks);
editSave.addEventListener('click', saveEdit);
editCancel.addEventListener('click', closeEditModal);
editInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') closeEditModal(); });
editModal.addEventListener('click', (e) => { if (e.target === editModal) closeEditModal(); });

function initTasks() { loadTasks(); renderTasks(); }

/* ───────────────────────────────────────────────
   QUICK LINKS
─────────────────────────────────────────────── */
const linkName  = $('link-name');
const linkUrl   = $('link-url');
const linkAdd   = $('link-add');
const linksGrid = $('links-grid');

let links = [];

function saveLinks()  { ls.set('quickLinks', links); }
function loadLinks()  { links = ls.get('quickLinks', []); }

function faviconUrl(url) {
  try {
    const origin = new URL(url).origin;
    return `https://www.google.com/s2/favicons?domain=${origin}&sz=16`;
  } catch { return ''; }
}

function renderLinks() {
  linksGrid.innerHTML = '';
  links.forEach((link) => {
    const chip = document.createElement('div');
    chip.className = 'link-chip';

    const img = document.createElement('img');
    img.src = faviconUrl(link.url);
    img.width = 16;
    img.height = 16;
    img.style.borderRadius = '3px';
    img.onerror = () => (img.style.display = 'none');

    const a = document.createElement('a');
    a.href   = link.url;
    a.target = '_blank';
    a.rel    = 'noopener noreferrer';
    a.textContent = link.name;

    const del = document.createElement('button');
    del.className = 'link-delete';
    del.title = 'Remove';
    del.textContent = '✕';
    del.addEventListener('click', () => deleteLink(link.id));

    chip.append(img, a, del);
    linksGrid.appendChild(chip);
  });
}

function addLink() {
  const name = linkName.value.trim();
  let   url  = linkUrl.value.trim();

  if (!name || !url) return;

  // auto-prepend protocol
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  // validate
  try { new URL(url); } catch {
    linkUrl.style.borderColor = 'var(--danger)';
    setTimeout(() => (linkUrl.style.borderColor = ''), 1800);
    return;
  }

  // duplicate check
  const dup = links.some((l) => l.url.toLowerCase() === url.toLowerCase());
  if (dup) {
    linkUrl.style.borderColor = 'var(--danger)';
    setTimeout(() => (linkUrl.style.borderColor = ''), 1800);
    return;
  }

  links.push({ id: Date.now(), name, url });
  saveLinks();
  renderLinks();
  linkName.value = '';
  linkUrl.value  = '';
  linkName.focus();
}

function deleteLink(id) {
  links = links.filter((l) => l.id !== id);
  saveLinks();
  renderLinks();
}

linkAdd.addEventListener('click', addLink);
linkUrl.addEventListener('keydown',  (e) => { if (e.key === 'Enter') addLink(); });
linkName.addEventListener('keydown', (e) => { if (e.key === 'Enter') addLink(); });

function initLinks() { loadLinks(); renderLinks(); }

/* ───────────────────────────────────────────────
   BOOT
─────────────────────────────────────────────── */
function init() {
  initTheme();
  initGreeting();
  initTimer();
  initTasks();
  initLinks();
}

init();
