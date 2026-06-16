// ── FIREBASE ───────────────────────────────────────
firebase.initializeApp({
  apiKey:"AIzaSyDjCk6mPThB8Ik6QD4kH7-CexHIacpo7tc",
  authDomain:"learn-8cef5.firebaseapp.com",
  projectId:"learn-8cef5",
  storageBucket:"learn-8cef5.firebasestorage.app",
  messagingSenderId:"962041908965",
  appId:"1:962041908965:web:c4a51cbedc8132d6a3ce0c",
  databaseURL:"https://learn-8cef5.firebaseio.com"
});
const auth = firebase.auth();
const db   = firebase.firestore();

// ── CONSTANTS ──────────────────────────────────────
const MEAL_TIMES = { breakfast: 8, dinner: 20 }; // target hours
const MEAL_WINDOW = 2; // hours before/after target = "on time"

// ── STATE ──────────────────────────────────────────
let me         = null;
let allMeals   = []; // [{date:'YYYY-MM-DD', feedings:[{id,type,time,by}]}]
let todayData  = { breakfast:[], dinner:[] };
let pickerType = null;
let drumH      = 8;
let drumM      = 0;
let charts     = {};
let statusInterval = null;

// ── UTILS ──────────────────────────────────────────
const $   = id => document.getElementById(id);
const TS  = () => firebase.firestore.FieldValue.serverTimestamp();
const p2  = n  => String(n).padStart(2,'0');

function todayKey(){
  const d=new Date();
  return `${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}`;
}
function dateKey(d){
  return `${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}`;
}
function fmtTime(iso){
  if(!iso) return '—';
  const d = new Date(iso);
  if(isNaN(d)) return '—';
  return `${p2(d.getHours())}:${p2(d.getMinutes())}`;
}
function fmtDate(s){
  const [y,mo,d] = s.split('-').map(Number);
  const dt = new Date(y, mo-1, d);
  const tk = todayKey();
  const yest = dateKey(new Date(Date.now()-86400000));
  if(s===tk)   return 'היום';
  if(s===yest) return 'אתמול';
  return dt.toLocaleDateString('he-IL',{weekday:'short',day:'numeric',month:'numeric'});
}
function timeSince(iso){
  if(!iso) return '';
  const m = Math.floor((Date.now()-new Date(iso))/60000);
  if(m<1)  return 'עכשיו';
  if(m<60) return `לפני ${m} דק׳`;
  const h=Math.floor(m/60), r=m%60;
  return r ? `לפני ${h}:${p2(r)} שע׳` : `לפני ${h} שע׳`;
}
function toast(msg, dur=2800){
  const t=$('toast');
  t.textContent=msg;
  t.classList.remove('hide');
  clearTimeout(t._t);
  t._t=setTimeout(()=>t.classList.add('hide'),dur);
}
function showErr(id,msg){ const e=$(id); if(e){e.textContent=msg;e.classList.remove('hide');} }
function hideErr(id){ const e=$(id); if(e) e.classList.add('hide'); }

// ── SMART STATUS ALGORITHM ─────────────────────────
// Returns {emoji, headline, sub, cls}
function calcStatus(){
  const now    = new Date();
  const hour   = now.getHours() + now.getMinutes()/60;
  const bfDone = todayData.breakfast.length > 0;
  const diDone = todayData.dinner.length    > 0;

  // Last feeding time across all of today's feedings
  const allToday = [...todayData.breakfast, ...todayData.dinner];
  allToday.sort((a,b) => new Date(b.time) - new Date(a.time));
  const lastFed = allToday[0]?.time || null;

  // Both done
  if(bfDone && diDone){
    return { cls:'ok', headline:'שבע ומרוצה', sub:`ארוחה אחרונה: ${fmtTime(lastFed)} · ${timeSince(lastFed)}` };
  }

  // Check if now is near breakfast time (6:00–10:00)
  const nearBreakfast = hour >= 6 && hour <= 10;
  // Check if now is near dinner time (18:00–22:00)
  const nearDinner = hour >= 18 && hour <= 22;
  // Morning period before dinner
  const morning = hour >= 0 && hour < 14;
  // Afternoon
  const afternoon = hour >= 14 && hour < 18;

  if(!bfDone && !diDone){
    if(nearBreakfast) return { cls:'hungry', headline:'זמן ארוחת בוקר!', sub:`יעד: ${p2(MEAL_TIMES.breakfast)}:00 · עכשיו ${p2(now.getHours())}:${p2(now.getMinutes())}` };
    if(morning)       return { cls:'warn',   headline:'בוקר — עדיין לא אכל', sub:'ארוחת בוקר טרם ניתנה' };
    if(afternoon)     return { cls:'warn',   headline:'אחר הצהריים — לא אכל', sub:'שכחת ארוחת בוקר?' };
    if(nearDinner)    return { cls:'hungry', headline:'זמן ארוחת ערב!', sub:'גם ארוחת בוקר חסרה!' };
    return { cls:'hungry', headline:'רעב מאוד!', sub:'לא קיבל אוכל היום כלל' };
  }

  if(bfDone && !diDone){
    if(hour < 18)     return { cls:'ok',     headline:'בוקר ✓ · ערב ממתין', sub:`ארוחת ערב יעד: ${p2(MEAL_TIMES.dinner)}:00` };
    if(nearDinner)    return { cls:'hungry', headline:'זמן ארוחת ערב!', sub:`בוקר ניתן ב-${fmtTime(todayData.breakfast[0]?.time)}` };
    return { cls:'warn', headline:'ערב — חסרה ארוחת ערב', sub:`בוקר ניתן ב-${fmtTime(todayData.breakfast[0]?.time)}` };
  }

  if(!bfDone && diDone){
    return { cls:'warn', headline:'ערב ✓ · בוקר לא ניתן', sub:`ערב ניתן ב-${fmtTime(todayData.dinner[0]?.time)}` };
  }

  return { cls:'ok', headline:'מעודכן', sub:'' };
}

function renderStatus(){
  const s = calcStatus();
  const pill = $('status-pill');
  const txt  = $('sp-text');
  const sub  = $('sp-sub');
  if(!pill) return;
  pill.className = `status-pill ${s.cls}`;
  if(txt) txt.textContent = s.headline;
  if(sub) sub.textContent = s.sub;
}

// ── SCREENS ────────────────────────────────────────
function showScreen(id){
  ['s-auth','s-app','s-stats'].forEach(s=>{
    const el=$(s);
    if(!el) return;
    el.classList.add('hide');
    el.classList.remove('show');
  });
  const target=$(id);
  if(target){ target.classList.remove('hide'); target.classList.add('show'); }
}
function showApp(){ showScreen('s-app'); }
function showStats(){
  showScreen('s-stats');
  requestAnimationFrame(()=>setTimeout(renderStats,60));
}

// ── AUTH ───────────────────────────────────────────
function switchTab(t){
  ['login','reg'].forEach(x=>{
    $(`t-${x}`).classList.toggle('active', x===t);
    $(`f-${x}`).classList.toggle('hide',   x!==t);
  });
  hideErr('li-err'); hideErr('re-err');
}
async function doLogin(){
  hideErr('li-err');
  const e=$('li-email').value.trim(), p=$('li-pass').value;
  if(!e||!p){ showErr('li-err','נא למלא אימייל וסיסמה'); return; }
  try{ await auth.signInWithEmailAndPassword(e,p); }
  catch(ex){ showErr('li-err', authMsg(ex.code)); }
}
async function doRegister(){
  hideErr('re-err');
  const e=$('re-email').value.trim(), p=$('re-pass').value;
  if(!e){ showErr('re-err','נא להזין אימייל'); return; }
  if(p.length<6){ showErr('re-err','סיסמה לפחות 6 תווים'); return; }
  try{ await auth.createUserWithEmailAndPassword(e,p); }
  catch(ex){ showErr('re-err', authMsg(ex.code)); }
}
async function doLogout(){
  if(!confirm('להתנתק?')) return;
  await auth.signOut();
}
function authMsg(c){
  return({
    'auth/user-not-found':      'משתמש לא נמצא',
    'auth/wrong-password':      'סיסמה שגויה',
    'auth/invalid-email':       'אימייל לא תקין',
    'auth/email-already-in-use':'אימייל כבר רשום',
    'auth/weak-password':       'סיסמה חלשה מדי',
    'auth/invalid-credential':  'אימייל או סיסמה שגויים',
    'auth/too-many-requests':   'יותר מדי ניסיונות',
  })[c] || 'שגיאה: '+c;
}

// ── FIRESTORE PATHS ────────────────────────────────
function catRef(){ return db.collection('shared').doc('cat'); }
function feedingsCol(dayKey){ return catRef().collection('days').doc(dayKey).collection('feedings'); }

// ── LOAD TODAY ─────────────────────────────────────
async function loadToday(){
  todayData = { breakfast:[], dinner:[] };
  try{
    const snap = await feedingsCol(todayKey()).get();
    snap.forEach(doc=>{
      const d = doc.data();
      const t = d.type;
      if(t==='breakfast'||t==='dinner'){
        todayData[t].push({ id:doc.id, type:t, time:d.time||'', by:d.by||'?' });
      }
    });
    todayData.breakfast.sort((a,b)=>a.time.localeCompare(b.time));
    todayData.dinner.sort((a,b)=>a.time.localeCompare(b.time));
  }catch(e){ console.error('loadToday',e); }
  renderTodayUI();
  renderStatus();
}

// ── LOAD HISTORY ───────────────────────────────────
async function loadHistory(){
  allMeals = [];
  try{
    // ensure parent doc exists
    const ref = catRef();
    const catDoc = await ref.get();
    if(!catDoc.exists) await ref.set({ init: true });

    const daysSnap = await ref.collection('days').get();
    const promises = [];
    daysSnap.forEach(dayDoc=>{
      promises.push(
        ref.collection('days').doc(dayDoc.id).collection('feedings').get()
          .then(fsnap=>{
            const feedings=[];
            fsnap.forEach(f=>{
              const d=f.data();
              feedings.push({ id:f.id, type:d.type||'', time:d.time||'', by:d.by||'?' });
            });
            feedings.sort((a,b)=>a.time.localeCompare(b.time));
            if(feedings.length>0) allMeals.push({ date:dayDoc.id, feedings });
          })
      );
    });
    await Promise.all(promises);
    allMeals.sort((a,b)=>b.date.localeCompare(a.date));
    if(allMeals.length>30) allMeals = allMeals.slice(0,30);
  }catch(e){ console.error('loadHistory',e); toast('שגיאה בטעינה: '+e.message); }
  renderHistory();
  renderQuickStats();
}

// ── ADD / DELETE FEEDING ───────────────────────────
async function addFeeding(type, isoTime){
  try{
    // ensure day doc exists
    const dayRef = catRef().collection('days').doc(todayKey());
    const dayDoc = await dayRef.get();
    if(!dayDoc.exists) await dayRef.set({ date: todayKey() });

    await feedingsCol(todayKey()).add({
      type, time: isoTime,
      by: me?.email || 'אנונימי',
      createdAt: TS()
    });
    await loadToday();
    await loadHistory();
    const name = type==='breakfast' ? 'ארוחת בוקר' : 'ארוחת ערב';
    toast(`✓ ${name} נרשמה בשעה ${fmtTime(isoTime)}`);
  }catch(e){ toast('שגיאה: '+e.message); }
}

async function deleteFeeding(dayKey, id){
  try{
    await catRef().collection('days').doc(dayKey).collection('feedings').doc(id).delete();
    await loadToday();
    await loadHistory();
    toast('ארוחה בוטלה');
  }catch(e){ toast('שגיאה: '+e.message); }
}

function feedNow(type){ addFeeding(type, new Date().toISOString()); }

// ── RENDER TODAY ────────────────────────────────────
function renderTodayUI(){
  renderMealBlock('breakfast');
  renderMealBlock('dinner');
}

function renderMealBlock(type){
  const list    = $(`fl-${type}`);
  const block   = $(`mb-${type}`);
  if(!list||!block) return;
  const feedings = todayData[type] || [];

  list.innerHTML = feedings.map(f=>`
    <div class="feeding-row">
      <svg class="fr-check" viewBox="0 0 24 24" fill="none"
        stroke="${type==='breakfast'?'#F59E0B':'#6366F1'}"
        stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/>
      </svg>
      <span class="fr-who">${f.by}</span>
      <span class="fr-time">${fmtTime(f.time)}</span>
      <button class="fr-del" onclick="deleteFeeding('${todayKey()}','${f.id}')" title="בטל">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>`).join('');

  block.classList.toggle('done', feedings.length>0);
}

// ── QUICK STATS ─────────────────────────────────────
function renderQuickStats(){
  if(!allMeals.length){
    $('qs-streak').textContent = '0';
    $('qs-bf').textContent     = '—';
    $('qs-di').textContent     = '—';
    return;
  }
  // streak: consecutive days (most recent first) with at least one feeding
  let streak = 0;
  const sorted = [...allMeals].sort((a,b)=>b.date.localeCompare(a.date));
  // build set of days that have feedings
  const daySet = new Set(allMeals.map(m=>m.date));
  // check today, yesterday, day before... until gap
  let check = new Date();
  while(true){
    const key = dateKey(check);
    if(daySet.has(key)) streak++;
    else break;
    check = new Date(check.getTime() - 86400000);
    if(streak > 365) break;
  }
  $('qs-streak').textContent = streak;

  const { avgBf, avgDi } = calcAvg(allMeals);
  $('qs-bf').textContent = avgBf || '—';
  $('qs-di').textContent = avgDi || '—';
}

function calcAvg(meals){
  const bfMins=[], diMins=[];
  meals.forEach(m=>{
    if(!m.feedings) return;
    m.feedings.forEach(f=>{
      if(!f.time) return;
      const d = new Date(f.time);
      if(isNaN(d)) return;
      const mins = d.getHours()*60 + d.getMinutes();
      if(f.type==='breakfast') bfMins.push(mins);
      else if(f.type==='dinner') diMins.push(mins);
    });
  });
  const avg = arr => arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : null;
  const m2t = m => m===null ? null : `${p2(Math.floor(m/60))}:${p2(m%60)}`;
  return { avgBf: m2t(avg(bfMins)), avgDi: m2t(avg(diMins)), bfMins, diMins };
}

// ── HISTORY ─────────────────────────────────────────
function renderHistory(){
  const el = $('history');
  if(!el) return;
  if(!allMeals.length){
    el.innerHTML='<div class="hempty">עוד אין היסטוריה — האכלה ראשונה תופיע כאן</div>';
    return;
  }
  el.innerHTML = allMeals.slice(0,14).map(m=>{
    const bf = m.feedings.filter(f=>f.type==='breakfast');
    const di = m.feedings.filter(f=>f.type==='dinner');
    const full = bf.length>0 && di.length>0;
    const half = (bf.length>0 || di.length>0) && !full;
    const cls  = full?'full':half?'half':'none';
    const lbl  = full?'יום שלם':half?'חלקי':'לא אכל';
    return `
    <div class="hday">
      <div class="hday-hdr">
        <span class="hday-date">${fmtDate(m.date)}</span>
        <span class="hbadge ${cls}">${lbl}</span>
      </div>
      <div class="hday-meals">
        <div class="hm">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2.2" stroke-linecap="round">
            <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
          </svg>
          <span class="hm-name">בוקר</span>
          <span class="hm-times">${bf.map(f=>fmtTime(f.time)).join(', ')||'—'}</span>
        </div>
        <div class="hm">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6366F1" stroke-width="2.2" stroke-linecap="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
          <span class="hm-name">ערב</span>
          <span class="hm-times">${di.map(f=>fmtTime(f.time)).join(', ')||'—'}</span>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ── STATS SCREEN ────────────────────────────────────
function renderStats(){
  // Avg table
  const { avgBf, avgDi, bfMins, diMins } = calcAvg(allMeals);
  const set = id => { const e=$(id); if(e) e.textContent='—'; };
  if(!allMeals.length){
    ['av-bf','av-di','av-full','av-streak'].forEach(set);
    return;
  }

  if($('av-bf')) $('av-bf').textContent = avgBf||'—';
  if($('av-di')) $('av-di').textContent = avgDi||'—';

  const fullDays = allMeals.filter(m=>
    m.feedings.some(f=>f.type==='breakfast') &&
    m.feedings.some(f=>f.type==='dinner')
  ).length;
  if($('av-full')) $('av-full').textContent = `${fullDays} / ${allMeals.length} ימים`;

  // Best streak
  let best=0, cur=0;
  [...allMeals].sort((a,b)=>a.date.localeCompare(b.date)).forEach(m=>{
    if(m.feedings.length>0){ cur++; best=Math.max(best,cur); } else cur=0;
  });
  if($('av-streak')) $('av-streak').textContent = best+' ימים';

  // Charts
  const last14 = [...allMeals].sort((a,b)=>a.date.localeCompare(b.date)).slice(-14);
  const labels  = last14.map(m=>fmtDate(m.date));

  // Chart 1 — feeding times line chart
  const bfPts = last14.map(m=>{
    const f = m.feedings.find(x=>x.type==='breakfast');
    if(!f||!f.time) return null;
    const d=new Date(f.time);
    return isNaN(d)?null:+(d.getHours()+d.getMinutes()/60).toFixed(2);
  });
  const diPts = last14.map(m=>{
    const f = m.feedings.find(x=>x.type==='dinner');
    if(!f||!f.time) return null;
    const d=new Date(f.time);
    return isNaN(d)?null:+(d.getHours()+d.getMinutes()/60).toFixed(2);
  });

  destroyChart('chart-times');
  const cvs1=$('chart-times');
  if(cvs1){
    charts['chart-times'] = new Chart(cvs1.getContext('2d'),{
      type:'line',
      data:{ labels, datasets:[
        { label:'בוקר', data:bfPts, borderColor:'#F59E0B', backgroundColor:'rgba(245,158,11,.08)',
          pointBackgroundColor:'#F59E0B', pointRadius:5, spanGaps:true, tension:.3 },
        { label:'ערב',  data:diPts, borderColor:'#6366F1', backgroundColor:'rgba(99,102,241,.08)',
          pointBackgroundColor:'#6366F1', pointRadius:5, spanGaps:true, tension:.3 }
      ]},
      options:{ responsive:true,
        plugins:{ legend:{ labels:{ color:'#7A6E65', font:{size:12} } } },
        scales:{
          x:{ ticks:{color:'#B0A89E',font:{size:10}}, grid:{color:'#E5DED5'} },
          y:{ min:5, max:23,
            ticks:{ color:'#B0A89E',
              callback: v=>{ const h=Math.floor(v),m=Math.round((v-h)*60); return`${p2(h)}:${p2(m)}`; }
            },
            grid:{ color:'#E5DED5' }
          }
        }
      }
    });
  }

  // Chart 2 — completion stacked bar
  const counts = last14.map(m=>({
    bf: m.feedings.some(f=>f.type==='breakfast')?1:0,
    di: m.feedings.some(f=>f.type==='dinner')?1:0
  }));
  destroyChart('chart-compl');
  const cvs2=$('chart-compl');
  if(cvs2){
    charts['chart-compl'] = new Chart(cvs2.getContext('2d'),{
      type:'bar',
      data:{ labels, datasets:[
        { label:'בוקר', data:counts.map(c=>c.bf), backgroundColor:'rgba(245,158,11,.75)', borderRadius:4 },
        { label:'ערב',  data:counts.map(c=>c.di), backgroundColor:'rgba(99,102,241,.75)',  borderRadius:4 }
      ]},
      options:{ responsive:true,
        plugins:{ legend:{ labels:{ color:'#7A6E65', font:{size:12} } } },
        scales:{
          x:{ stacked:true, ticks:{color:'#B0A89E',font:{size:10}}, grid:{color:'#E5DED5'} },
          y:{ stacked:true, max:2, ticks:{color:'#B0A89E',stepSize:1}, grid:{color:'#E5DED5'} }
        }
      }
    });
  }
}
function destroyChart(id){ if(charts[id]){ charts[id].destroy(); delete charts[id]; } }

// ── DRUM PICKER ─────────────────────────────────────
function buildDrum(){
  buildDrumCol('drum-h', 24, drumH);
  buildDrumCol('drum-m', 60, drumM);
  updatePreview();
}
function buildDrumCol(elId, count, selected){
  const el=$(elId);
  if(!el) return;
  el.innerHTML='';
  // top padding
  const pad1=document.createElement('div'); pad1.className='drum-pad'; el.appendChild(pad1);
  for(let i=0;i<count;i++){
    const d=document.createElement('div');
    d.className='drum-item';
    d.dataset.val=i;
    d.textContent=p2(i);
    d.onclick=()=>scrollDrumTo(elId, i);
    el.appendChild(d);
  }
  const pad2=document.createElement('div'); pad2.className='drum-pad'; el.appendChild(pad2);
  // scroll after paint
  requestAnimationFrame(()=>{
    el.scrollTop = selected*56;
    updateDrumStyle(elId, selected);
  });
}
function scrollDrumTo(elId, val, smooth=true){
  const el=$(elId);
  if(!el) return;
  el.scrollTo({ top:val*56, behavior:smooth?'smooth':'instant' });
}
function drumScroll(which){
  const elId = which==='h'?'drum-h':'drum-m';
  const el=$(elId);
  if(!el) return;
  const val = Math.round(el.scrollTop/56);
  const max  = which==='h'?23:59;
  const clamped = Math.min(Math.max(val,0),max);
  if(which==='h') drumH=clamped; else drumM=clamped;
  updateDrumStyle(elId, clamped);
  updatePreview();
}
function updateDrumStyle(elId, selected){
  const el=$(elId);
  if(!el) return;
  el.querySelectorAll('.drum-item').forEach(item=>{
    const v=parseInt(item.dataset.val);
    const diff=Math.abs(v-selected);
    item.className='drum-item'+(diff===0?' selected':diff===1?' near':'');
  });
}
function updatePreview(){
  const el=$('sheet-preview');
  if(el) el.textContent=`${p2(drumH)}:${p2(drumM)}`;
}
function openPicker(type){
  pickerType=type;
  const isBf=type==='breakfast';
  if($('sheet-title'))    $('sheet-title').textContent='בחר שעה';
  if($('sheet-subtitle')) $('sheet-subtitle').textContent=isBf?'🌅 ארוחת בוקר':'🌙 ארוחת ערב';
  const now=new Date();
  drumH=now.getHours(); drumM=now.getMinutes();
  buildDrum();
  $('sheet-overlay').classList.remove('hide');
}
function closeSheet(e){
  if(e && e.target!==$('sheet-overlay')) return;
  $('sheet-overlay').classList.add('hide');
  pickerType=null;
}
function confirmPicker(){
  const d=new Date(); d.setHours(drumH,drumM,0,0);
  $('sheet-overlay').classList.add('hide');
  if(pickerType) addFeeding(pickerType, d.toISOString());
  pickerType=null;
}

// ── AUTH STATE ──────────────────────────────────────
auth.onAuthStateChanged(async user=>{
  me=user;
  if(user){
    showScreen('s-app');
    await loadToday();
    await loadHistory();
    if(statusInterval) clearInterval(statusInterval);
    statusInterval = setInterval(renderStatus, 60000);
  } else {
    if(statusInterval){ clearInterval(statusInterval); statusInterval=null; }
    showScreen('s-auth');
    const le=$('li-email'), lp=$('li-pass');
    if(le) le.value=''; if(lp) lp.value='';
  }
});