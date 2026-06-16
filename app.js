// ===== FIREBASE CONFIG =====
const firebaseConfig = {
  apiKey: "AIzaSyDjCk6mPThB8Ik6QD4kH7-CexHIacpo7tc",
  authDomain: "learn-8cef5.firebaseapp.com",
  projectId: "learn-8cef5",
  storageBucket: "learn-8cef5.firebasestorage.app",
  messagingSenderId: "962041908965",
  appId: "1:962041908965:web:c4a51cbedc8132d6a3ce0c",
  measurementId: "G-R5683NC1JJ",
  databaseURL: "https://learn-8cef5.firebaseio.com"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.firestore();

// ===== STATE =====
let currentUser  = null;
let catName      = 'החתול שלי';
let todayData    = { breakfast: null, dinner: null };   // null or ISO string
let allMeals     = [];   // last 30 days from Firestore
let pickerMeal   = null; // 'breakfast' | 'dinner'
let statusTimer  = null;
let charts       = {};

// ===== HELPERS =====
const $ = id => document.getElementById(id);

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function fmtTime(isoOrDate) {
  if (!isoOrDate) return '—';
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  return d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(dateStr) {
  // dateStr = 'YYYY-MM-DD'
  const [y, m, day] = dateStr.split('-').map(Number);
  const d = new Date(y, m-1, day);
  const today   = todayKey();
  const yest    = (() => { const t = new Date(); t.setDate(t.getDate()-1); return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`; })();
  if (dateStr === today) return 'היום';
  if (dateStr === yest)  return 'אתמול';
  return d.toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'numeric' });
}

function timeSince(isoStr) {
  if (!isoStr) return null;
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return 'לפני פחות מדקה';
  if (mins < 60)  return `לפני ${mins} דקות`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  if (hrs < 24) return rem > 0 ? `לפני ${hrs} שעות ו-${rem} דקות` : `לפני ${hrs} שעות`;
  return `לפני יותר מיום`;
}

function showToast(msg, duration=2800) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  t.classList.add('visible');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => {
    t.classList.remove('visible');
    setTimeout(() => t.classList.add('hidden'), 350);
  }, duration);
}

// ===== SCREEN ROUTING =====
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.add('hidden');
    s.classList.remove('active');
  });
  const s = $(id);
  s.classList.remove('hidden');
  s.classList.add('active');
  if (id === 'stats-screen') renderStats();
}

// ===== AUTH =====
function switchAuthTab(tab) {
  ['login','register'].forEach(t => {
    $(  `tab-${t}`    ).classList.toggle('active', t === tab);
    $(`${t}-form`     ).classList.toggle('active', t === tab);
    $(`${t}-form`     ).classList.toggle('hidden',  t !== tab);
    $(`${t}-error`    ).classList.add('hidden');
  });
}

async function doLogin() {
  const email = $('login-email').value.trim();
  const pass  = $('login-password').value;
  const errEl = $('login-error');
  errEl.classList.add('hidden');
  if (!email || !pass) { errEl.textContent = 'נא למלא אימייל וסיסמה'; errEl.classList.remove('hidden'); return; }
  $('login-btn').textContent = 'מתחבר...';
  try {
    await auth.signInWithEmailAndPassword(email, pass);
  } catch (e) {
    errEl.textContent = translateAuthError(e.code);
    errEl.classList.remove('hidden');
    $('login-btn').textContent = 'כניסה';
  }
}

async function doRegister() {
  const catN  = $('reg-cat-name').value.trim();
  const email = $('reg-email').value.trim();
  const pass  = $('reg-password').value;
  const errEl = $('register-error');
  errEl.classList.add('hidden');
  if (!catN)  { errEl.textContent = 'נא להזין את שם החתול'; errEl.classList.remove('hidden'); return; }
  if (!email) { errEl.textContent = 'נא להזין אימייל';      errEl.classList.remove('hidden'); return; }
  if (pass.length < 6) { errEl.textContent = 'הסיסמה חייבת להיות לפחות 6 תווים'; errEl.classList.remove('hidden'); return; }
  $('register-btn').textContent = 'יוצר חשבון...';
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, pass);
    await db.collection('users').doc(cred.user.uid).set({ catName: catN, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
  } catch (e) {
    errEl.textContent = translateAuthError(e.code);
    errEl.classList.remove('hidden');
    $('register-btn').textContent = 'הרשמה';
  }
}

async function doLogout() {
  if (!confirm('להתנתק?')) return;
  await auth.signOut();
}

function translateAuthError(code) {
  const map = {
    'auth/user-not-found':       'משתמש לא נמצא',
    'auth/wrong-password':       'סיסמה שגויה',
    'auth/invalid-email':        'אימייל לא תקין',
    'auth/email-already-in-use': 'אימייל כבר רשום',
    'auth/weak-password':        'הסיסמה חלשה מדי',
    'auth/too-many-requests':    'יותר מדי ניסיונות — נסה שוב מאוחר יותר',
    'auth/invalid-credential':   'אימייל או סיסמה שגויים',
  };
  return map[code] || `שגיאה: ${code}`;
}

// ===== FIREBASE AUTH STATE =====
auth.onAuthStateChanged(async user => {
  if (user) {
    currentUser = user;
    showScreen('app-screen');
    await loadUserProfile();
    await loadTodayMeals();
    await loadHistory();
    startStatusRefresh();
  } else {
    currentUser = null;
    clearStatusRefresh();
    showScreen('auth-screen');
    $('login-btn').textContent = 'כניסה';
    $('register-btn').textContent = 'הרשמה';
    $('login-email').value = '';
    $('login-password').value = '';
  }
});

// ===== PROFILE =====
async function loadUserProfile() {
  try {
    const doc = await db.collection('users').doc(currentUser.uid).get();
    if (doc.exists) {
      catName = doc.data().catName || 'החתול שלי';
      $('header-cat-name').textContent = `🐱 ${catName}`;
    }
  } catch {}
}

// ===== FIRESTORE PATHS =====
function mealsCol() {
  return db.collection('users').doc(currentUser.uid).collection('meals');
}
function todayDocRef() {
  return mealsCol().doc(todayKey());
}

// ===== LOAD TODAY =====
async function loadTodayMeals() {
  try {
    const doc = await todayDocRef().get();
    if (doc.exists) {
      const d = doc.data();
      todayData.breakfast = d.breakfast || null;
      todayData.dinner    = d.dinner    || null;
    } else {
      todayData = { breakfast: null, dinner: null };
    }
  } catch (e) {
    console.error('loadTodayMeals', e);
  }
  renderTodayUI();
}

// ===== LOAD HISTORY (last 30 days) =====
async function loadHistory() {
  try {
    const snap = await mealsCol().orderBy(firebase.firestore.FieldPath.documentId(), 'desc').limit(30).get();
    allMeals = [];
    snap.forEach(doc => {
      allMeals.push({ date: doc.id, ...doc.data() });
    });
  } catch (e) {
    console.error('loadHistory', e);
  }
  renderHistory();
  renderQuickStats();
}

// ===== SAVE MEAL =====
async function saveMeal(mealType, isoTime) {
  const update = {};
  update[mealType] = isoTime;
  update.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
  try {
    await todayDocRef().set(update, { merge: true });
    todayData[mealType] = isoTime;
    // also update allMeals for instant stats
    const idx = allMeals.findIndex(m => m.date === todayKey());
    if (idx >= 0) allMeals[idx][mealType] = isoTime;
    else allMeals.unshift({ date: todayKey(), breakfast: todayData.breakfast, dinner: todayData.dinner });
    renderTodayUI();
    renderHistory();
    renderQuickStats();
    updateStatus();
  } catch (e) {
    showToast('❌ שגיאה בשמירה: ' + e.message);
  }
}

// ===== QUICK FEED =====
function quickFeed(mealType) {
  const now = new Date().toISOString();
  saveMeal(mealType, now);
  const name = mealType === 'breakfast' ? 'ארוחת בוקר' : 'ארוחת ערב';
  showToast(`✅ ${name} נרשמה בהצלחה! 🐱`);
}

// ===== TIME PICKER =====
function openTimePicker(mealType) {
  pickerMeal = mealType;
  const label = mealType === 'breakfast' ? '🌅 ארוחת בוקר' : '🌙 ארוחת ערב';
  $('modal-meal-label').textContent = label;
  // Set default to now
  const now = new Date();
  $('time-picker-input').value = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  $('time-modal').classList.remove('hidden');
}

function closeTimePicker(e) {
  if (e && e.target !== $('time-modal')) return;
  $('time-modal').classList.add('hidden');
  pickerMeal = null;
}

function confirmTimePicker() {
  const val = $('time-picker-input').value; // "HH:MM"
  if (!val) { showToast('נא לבחור שעה'); return; }
  const [hh, mm] = val.split(':').map(Number);
  const d = new Date();
  d.setHours(hh, mm, 0, 0);
  // If selected time is in the future (maybe they meant yesterday) keep it as today
  const iso = d.toISOString();
  $('time-modal').classList.add('hidden');
  saveMeal(pickerMeal, iso);
  const name = pickerMeal === 'breakfast' ? 'ארוחת בוקר' : 'ארוחת ערב';
  showToast(`✅ ${name} נרשמה בשעה ${fmtTime(d)}! 🐱`);
  pickerMeal = null;
}

// ===== RENDER TODAY UI =====
function renderTodayUI() {
  renderMealCard('breakfast', '🌅', 'ארוחת בוקר');
  renderMealCard('dinner',    '🌙', 'ארוחת ערב');
  updateStatus();
}

function renderMealCard(mealType, icon, name) {
  const card     = $(`${mealType}-card`);
  const checkEl  = $(`${mealType}-check`);
  const timeEl   = $(`${mealType}-time-display`);
  const actionsEl = $(`${mealType}-actions`);
  const iso = todayData[mealType];

  if (iso) {
    card.classList.add('done');
    checkEl.textContent = '✅';
    timeEl.textContent  = `✔ ניתנה בשעה ${fmtTime(iso)}`;
    timeEl.classList.add('done');
    actionsEl.classList.add('hidden');
  } else {
    card.classList.remove('done');
    checkEl.textContent = '⭕';
    timeEl.textContent  = 'לא ניתנה עדיין';
    timeEl.classList.remove('done');
    actionsEl.classList.remove('hidden');
  }
}

// ===== STATUS CARD =====
function updateStatus() {
  const card     = $('status-card');
  const emojiEl  = $('status-emoji');
  const valEl    = $('status-value');
  const badgeEl  = $('status-badge');
  const lastEl   = $('last-meal-text');

  const bf = todayData.breakfast;
  const di = todayData.dinner;

  // Last meal overall
  let lastMealTime = null;
  let lastMealName = null;
  if (bf && di) {
    if (new Date(bf) > new Date(di)) { lastMealTime = bf; lastMealName = 'ארוחת בוקר'; }
    else                              { lastMealTime = di; lastMealName = 'ארוחת ערב'; }
  } else if (bf) { lastMealTime = bf; lastMealName = 'ארוחת בוקר'; }
  else if (di)   { lastMealTime = di; lastMealName = 'ארוחת ערב'; }
  else {
    // check yesterday
    const yestData = allMeals.find(m => {
      const t = new Date(); t.setDate(t.getDate()-1);
      const yk = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
      return m.date === yk;
    });
    if (yestData) {
      const bd = yestData.breakfast, dd = yestData.dinner;
      if (bd && dd) { lastMealTime = new Date(bd) > new Date(dd) ? bd : dd; lastMealName = lastMealTime === bd ? 'בוקר אתמול' : 'ערב אתמול'; }
      else if (dd)  { lastMealTime = dd; lastMealName = 'ארוחת ערב אתמול'; }
      else if (bd)  { lastMealTime = bd; lastMealName = 'ארוחת בוקר אתמול'; }
    }
  }

  const bothDone = bf && di;
  const oneDone  = (bf || di) && !bothDone;
  const noneDone = !bf && !di;

  if (bothDone) {
    card.className = 'status-card fed';
    emojiEl.textContent = '😸';
    valEl.textContent   = `${catName} שבע ומרוצה! 🎉`;
    badgeEl.textContent = 'היום הושלם ✓';
    badgeEl.className   = 'status-badge green';
  } else if (oneDone) {
    card.className = 'status-card';
    emojiEl.textContent = '😺';
    const missing = !bf ? 'ארוחת בוקר' : 'ארוחת ערב';
    valEl.textContent   = `חסרה ${missing}`;
    badgeEl.textContent = 'ארוחה אחת בוצעה';
    badgeEl.className   = 'status-badge';
  } else {
    card.className = 'status-card hungry';
    emojiEl.textContent = '🙀';
    valEl.textContent   = `${catName} מחכה לאוכל!`;
    badgeEl.textContent = 'לא האכיל היום';
    badgeEl.className   = 'status-badge red';
  }

  if (lastMealTime) {
    lastEl.textContent = `ארוחה אחרונה: ${lastMealName} — ${fmtTime(lastMealTime)} (${timeSince(lastMealTime)})`;
  } else {
    lastEl.textContent = 'אין רישום של ארוחה אחרונה';
  }
}

function startStatusRefresh() {
  clearStatusRefresh();
  statusTimer = setInterval(updateStatus, 60000);
}
function clearStatusRefresh() {
  if (statusTimer) clearInterval(statusTimer);
}

// ===== QUICK STATS =====
function renderQuickStats() {
  // Streak
  let streak = 0;
  const sorted = [...allMeals].sort((a,b) => b.date.localeCompare(a.date));
  const today = todayKey();
  for (let i = 0; i < sorted.length; i++) {
    const m = sorted[i];
    // skip today for streak calculation if incomplete
    if (m.date === today && !(m.breakfast && m.dinner)) continue;
    if (m.breakfast && m.dinner) streak++;
    else break;
  }
  $('qs-streak').textContent = streak;

  // Averages
  const { avgBreakfast, avgDinner } = calcAverages(allMeals);
  $('qs-avg-breakfast').textContent = avgBreakfast || '—';
  $('qs-avg-dinner').textContent    = avgDinner    || '—';

  // Total meals
  let total = 0;
  allMeals.forEach(m => { if (m.breakfast) total++; if (m.dinner) total++; });
  $('qs-total').textContent = total;
}

function calcAverages(meals) {
  const bfMins = [], diMins = [];
  meals.forEach(m => {
    if (m.breakfast) {
      const d = new Date(m.breakfast);
      bfMins.push(d.getHours()*60 + d.getMinutes());
    }
    if (m.dinner) {
      const d = new Date(m.dinner);
      diMins.push(d.getHours()*60 + d.getMinutes());
    }
  });
  const avg = arr => arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : null;
  const minsToTime = mins => {
    if (mins === null) return null;
    return `${String(Math.floor(mins/60)).padStart(2,'0')}:${String(mins%60).padStart(2,'0')}`;
  };
  return {
    avgBreakfast: minsToTime(avg(bfMins)),
    avgDinner:    minsToTime(avg(diMins)),
    bfMinsArr: bfMins,
    diMinsArr: diMins
  };
}

// ===== HISTORY =====
function renderHistory() {
  const list = $('history-list');
  const recent = [...allMeals].sort((a,b) => b.date.localeCompare(a.date)).slice(0, 10);
  if (!recent.length) {
    list.innerHTML = '<div class="history-empty">אין נתונים עדיין — התחל להאכיל! 🐱</div>';
    return;
  }
  list.innerHTML = recent.map(m => {
    const hasBf = !!m.breakfast, hasDi = !!m.dinner;
    const bothDone = hasBf && hasDi;
    const label = bothDone ? '2 ארוחות ✓' : (hasBf||hasDi) ? 'ארוחה אחת' : 'לא אכל';
    const cls   = bothDone ? 'full' : (hasBf||hasDi) ? 'partial' : 'empty';
    return `
      <div class="history-day">
        <div class="history-day-header">
          <span class="history-day-date">${fmtDate(m.date)}</span>
          <span class="history-day-badge ${cls}">${label}</span>
        </div>
        <div class="history-meals">
          <div class="history-meal-row">
            <span class="hm-icon">🌅</span>
            <span class="hm-name">ארוחת בוקר</span>
            <span class="hm-time">${hasBf ? fmtTime(m.breakfast) : '—'}</span>
          </div>
          <div class="history-meal-row">
            <span class="hm-icon">🌙</span>
            <span class="hm-name">ארוחת ערב</span>
            <span class="hm-time">${hasDi ? fmtTime(m.dinner) : '—'}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ===== STATS SCREEN =====
function renderStats() {
  const last14 = [...allMeals].sort((a,b) => a.date.localeCompare(b.date)).slice(-14);

  // Chart 1: Feeding times scatter
  const labels = last14.map(m => fmtDate(m.date));
  const bfPoints = last14.map(m => {
    if (!m.breakfast) return null;
    const d = new Date(m.breakfast);
    return +(d.getHours() + d.getMinutes()/60).toFixed(2);
  });
  const diPoints = last14.map(m => {
    if (!m.dinner) return null;
    const d = new Date(m.dinner);
    return +(d.getHours() + d.getMinutes()/60).toFixed(2);
  });

  destroyChart('feedingTimeChart');
  const ctx1 = $('feedingTimeChart').getContext('2d');
  charts['feedingTimeChart'] = new Chart(ctx1, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '🌅 ארוחת בוקר',
          data: bfPoints,
          borderColor: '#f97316',
          backgroundColor: 'rgba(249,115,22,0.12)',
          pointBackgroundColor: '#f97316',
          pointRadius: 6,
          spanGaps: true,
          tension: 0.3
        },
        {
          label: '🌙 ארוחת ערב',
          data: diPoints,
          borderColor: '#60a5fa',
          backgroundColor: 'rgba(96,165,250,0.12)',
          pointBackgroundColor: '#60a5fa',
          pointRadius: 6,
          spanGaps: true,
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: '#8ba5c0', font: { size: 12 } } },
        tooltip: {
          callbacks: {
            label: ctx => {
              const v = ctx.raw;
              if (v === null) return 'לא האכיל';
              const h = Math.floor(v), m = Math.round((v-h)*60);
              return `${ctx.dataset.label}: ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
            }
          }
        }
      },
      scales: {
        x: { ticks: { color: '#8ba5c0', font: { size: 10 } }, grid: { color: '#2a3f55' } },
        y: {
          ticks: {
            color: '#8ba5c0',
            callback: v => { const h=Math.floor(v),m=Math.round((v-h)*60); return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`; }
          },
          grid: { color: '#2a3f55' },
          min: 5, max: 23
        }
      }
    }
  });

  // Chart 2: Completion bar chart
  const completionData = last14.map(m => {
    const b = m.breakfast ? 1 : 0;
    const d = m.dinner    ? 1 : 0;
    return b + d;
  });
  destroyChart('completionChart');
  const ctx2 = $('completionChart').getContext('2d');
  charts['completionChart'] = new Chart(ctx2, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'ארוחות שניתנו',
        data: completionData,
        backgroundColor: completionData.map(v => v === 2 ? 'rgba(34,197,94,0.7)' : v === 1 ? 'rgba(249,115,22,0.7)' : 'rgba(239,68,68,0.5)'),
        borderColor:     completionData.map(v => v === 2 ? '#22c55e' : v === 1 ? '#f97316' : '#ef4444'),
        borderWidth: 1.5,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#8ba5c0', font: { size: 10 } }, grid: { color: '#2a3f55' } },
        y: { ticks: { color: '#8ba5c0', stepSize: 1 }, grid: { color: '#2a3f55' }, min: 0, max: 2 }
      }
    }
  });

  // Averages table
  const { avgBreakfast, avgDinner } = calcAverages(allMeals);
  $('avg-breakfast-detail').textContent = avgBreakfast || '—';
  $('avg-dinner-detail').textContent    = avgDinner    || '—';

  const bothDaysCount = allMeals.filter(m => m.breakfast && m.dinner).length;
  $('avg-both-days').textContent = `${bothDaysCount} מתוך ${allMeals.length} ימים`;

  // Best streak
  let bestStreak = 0, cur = 0;
  const sorted = [...allMeals].sort((a,b) => a.date.localeCompare(b.date));
  sorted.forEach(m => {
    if (m.breakfast && m.dinner) { cur++; bestStreak = Math.max(bestStreak, cur); }
    else cur = 0;
  });
  $('avg-best-streak').textContent = `${bestStreak} ימים`;
}

function destroyChart(id) {
  if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}