'use strict';

// ── State ──────────────────────────────────────────────────────────────────
const state = {
  running: false,
  startTime: null,
  timerInterval: null,
  counts: {
    dialled:    0,
    picked:     0,
    voicemail:  0,
    unanswered: 0,
    callback:   0,
    dnc:        0,
  },
};

// ── Config: label, colour class, log verb ──────────────────────────────────
const CONFIG = {
  dialled:    { label: 'Call Dialled',           color: 'blue',   verb: '+' },
  picked:     { label: 'Call Picked Up',          color: 'green',  verb: '+' },
  voicemail:  { label: 'Went to Voicemail',       color: 'yellow', verb: '+' },
  unanswered: { label: 'Not Answered',            color: 'red',    verb: '+' },
  callback:   { label: 'Call Back Scheduled',     color: 'purple', verb: '+' },
  dnc:        { label: 'Do Not Call',             color: 'teal',   verb: '+' },
};

// ── DOM refs ───────────────────────────────────────────────────────────────
const startBtn      = document.getElementById('startBtn');
const resetBtn      = document.getElementById('resetBtn');
const clearLogBtn   = document.getElementById('clearLogBtn');
const sessionStart  = document.getElementById('sessionStart');
const elapsedTime   = document.getElementById('elapsedTime');
const callLog       = document.getElementById('callLog');
const pickupRate    = document.getElementById('pickupRate');
const voicemailRate = document.getElementById('voicemailRate');
const callsPerMin   = document.getElementById('callsPerMin');

// ── Helpers ────────────────────────────────────────────────────────────────
function pad(n) { return String(n).padStart(2, '0'); }

function formatDuration(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDate(date) {
  return date.toLocaleString([], {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

// ── Timer ──────────────────────────────────────────────────────────────────
function tickTimer() {
  const elapsed = Date.now() - state.startTime;
  elapsedTime.textContent = formatDuration(elapsed);
  updateSummary();
}

// ── Counter display ────────────────────────────────────────────────────────
function setCount(type, value) {
  state.counts[type] = Math.max(0, value);
  document.getElementById(`count-${type}`).textContent = state.counts[type];
}

// ── Summary stats ──────────────────────────────────────────────────────────
function updateSummary() {
  const { dialled, picked, voicemail } = state.counts;

  if (dialled > 0) {
    pickupRate.textContent    = `${Math.round((picked / dialled) * 100)}%`;
    voicemailRate.textContent = `${Math.round((voicemail / dialled) * 100)}%`;
  } else {
    pickupRate.textContent    = '—';
    voicemailRate.textContent = '—';
  }

  if (state.startTime) {
    const mins = (Date.now() - state.startTime) / 60000;
    callsPerMin.textContent = mins > 0 ? (dialled / mins).toFixed(1) : '—';
  }
}

// ── Activity log ───────────────────────────────────────────────────────────
function addLogEntry(type, delta) {
  const cfg     = CONFIG[type];
  const now     = new Date();
  const elapsed = state.startTime ? Date.now() - state.startTime : 0;
  const sign    = delta > 0 ? '+1' : '−1';
  const action  = delta > 0 ? cfg.label : `Removed — ${cfg.label}`;

  // Remove placeholder if present
  const placeholder = callLog.querySelector('.log-empty');
  if (placeholder) placeholder.remove();

  const li = document.createElement('li');
  li.className = 'log-entry';
  li.innerHTML = `
    <span class="log-dot ${cfg.color}"></span>
    <span class="log-time">${formatTime(now)}</span>
    <span class="log-text">${sign} &nbsp;${action}</span>
    <span class="log-elapsed">+${formatDuration(elapsed)}</span>
  `;

  callLog.prepend(li);
}

// ── Tally button handler ───────────────────────────────────────────────────
function handleTally(e) {
  const btn = e.target.closest('.tally-btn');
  if (!btn) return;

  if (!state.running) {
    alert('Please start a session first.');
    return;
  }

  const type  = btn.dataset.type;
  const delta = btn.classList.contains('plus') ? 1 : -1;

  setCount(type, state.counts[type] + delta);
  addLogEntry(type, delta);
  updateSummary();

  // Pulse animation on the count element
  const countEl = document.getElementById(`count-${type}`);
  countEl.classList.remove('pulse');
  void countEl.offsetWidth; // reflow
  countEl.classList.add('pulse');
}

// ── Session control ────────────────────────────────────────────────────────
function startSession() {
  state.running   = true;
  state.startTime = Date.now();

  sessionStart.textContent = formatDate(new Date());
  startBtn.textContent     = 'Session Active';
  startBtn.disabled        = true;
  resetBtn.disabled        = false;

  state.timerInterval = setInterval(tickTimer, 500);
  tickTimer();
}

function resetSession() {
  if (!confirm('Reset the session? All counts and logs will be cleared.')) return;

  clearInterval(state.timerInterval);
  state.running      = false;
  state.startTime    = null;
  state.timerInterval = null;

  Object.keys(state.counts).forEach(t => setCount(t, 0));

  sessionStart.textContent  = '—';
  elapsedTime.textContent   = '00:00:00';
  pickupRate.textContent    = '—';
  voicemailRate.textContent = '—';
  callsPerMin.textContent   = '—';

  startBtn.textContent = 'Start Session';
  startBtn.disabled    = false;
  resetBtn.disabled    = true;

  callLog.innerHTML = '<li class="log-empty">No activity yet. Start a session and begin logging calls.</li>';
}

// ── Clear log ──────────────────────────────────────────────────────────────
function clearLog() {
  callLog.innerHTML = '<li class="log-empty">Log cleared.</li>';
}

// ── Event listeners ────────────────────────────────────────────────────────
startBtn.addEventListener('click', startSession);
resetBtn.addEventListener('click', resetSession);
clearLogBtn.addEventListener('click', clearLog);
document.querySelector('.counters-grid').addEventListener('click', handleTally);

// ── Pulse style (injected once) ────────────────────────────────────────────
const style = document.createElement('style');
style.textContent = `
  @keyframes countPulse {
    0%   { transform: scale(1); }
    40%  { transform: scale(1.22); }
    100% { transform: scale(1); }
  }
  .pulse { animation: countPulse .28s ease; }
`;
document.head.appendChild(style);
