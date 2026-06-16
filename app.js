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

// ── STATE ──────────────────────────────────────────
let me       = null;   // current user
let allMeals = [];     // [{date,feedings:[{id,type,time,by}]}]
let today    = {};     // {breakfast:[...], dinner:[...]}
let pickerType = null;
let charts   = {};

// ── UTILS ──────────────────────────────────────────
const $  = id => document.getElementById(id);
const TS = firebase.firestore.FieldValue.serverTimestamp;

function todayKey(){
  const d=new Date();
  return `${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}`;
}
function p2(n){return String(n).padStart(2,'0')}
function fmtTime(iso){
  if(!iso) return '—';
  const d=iso instanceof Date?iso:new Date(iso);
  return `${p2(d.getHours())}:${p2(d.getMinutes())}`;
}
function timeSince(iso){
  if(!iso) return '';
  const m=Math.floor((Date.now()-new Date(iso))/60000);
  if(m<1)   return 'עכשיו';
  if(m<60)  return `לפני ${m} דק׳`;
  const h=Math.floor(m/60), r=m%60;
  return r?`לפני ${h} שע׳ ${r} דק׳`:`לפני ${h} שע׳`;
}
function fmtDate(s){
  const [y,mo,d]=s.split('-').map(Number);
  const dt=new Date(y,mo-1,d);
  const tk=todayKey();
  const yk=(()=>{const t=new Date();t.setDate(t.getDate()-1);return `${t.getFullYear()}-${p2(t.getMonth()+1)}-${p2(t.getDate())}`})();
  if(s===tk) return 'היום';
  if(s===yk) return 'אתמול';
  return dt.toLocaleDateString('he-IL',{weekday:'short',day:'numeric',month:'numeric'});
}
function toast(msg,dur=2600){
  const t=$('toast');
  t.textContent=msg;
  t.classList.remove('hide');
  clearTimeout(t._t);
  t._t=setTimeout(()=>t.classList.add('hide'),dur);
}
function showErr(id,msg){const e=$(id);e.textContent=msg;e.classList.remove('hide')}
function hideErr(id){$(id).classList.add('hide')}

// ── SCREENS ────────────────────────────────────────
function showScreen(id){
  ['s-auth','s-app','s-stats'].forEach(s=>{
    const el=$(s);
    el.classList.remove('show');
    el.classList.add('hide');
  });
  $(id).classList.remove('hide');
  $(id).classList.add('show');
}
function showApp(){showScreen('s-app')}
function showStats(){renderStats();showScreen('s-stats')}

// ── AUTH TABS ───────────────────────────────────────
function switchTab(t){
  ['login','reg'].forEach(x=>{
    $(`t-${x}`).classList.toggle('active',x===t);
    $(`f-${x}`).classList.toggle('hide',x!==t);
  });
  hideErr('li-err'); hideErr('re-err');
}

async function doLogin(){
  hideErr('li-err');
  const e=$('li-email').value.trim(), p=$('li-pass').value;
  if(!e||!p){showErr('li-err','נא למלא אימייל וסיסמה');return}
  try{ await auth.signInWithEmailAndPassword(e,p) }
  catch(ex){ showErr('li-err',authMsg(ex.code)) }
}
async function doRegister(){
  hideErr('re-err');
  const e=$('re-email').value.trim(), p=$('re-pass').value;
  if(!e){showErr('re-err','נא להזין אימייל');return}
  if(p.length<6){showErr('re-err','סיסמה חייבת להיות לפחות 6 תווים');return}
  try{ await auth.createUserWithEmailAndPassword(e,p) }
  catch(ex){ showErr('re-err',authMsg(ex.code)) }
}
async function doLogout(){
  if(!confirm('להתנתק?'))return;
  await auth.signOut();
}
function authMsg(c){
  return({
    'auth/user-not-found':'משתמש לא נמצא',
    'auth/wrong-password':'סיסמה שגויה',
    'auth/invalid-email':'אימייל לא תקין',
    'auth/email-already-in-use':'אימייל כבר רשום',
    'auth/weak-password':'סיסמה חלשה מדי',
    'auth/invalid-credential':'אימייל או סיסמה שגויים',
    'auth/too-many-requests':'יותר מדי ניסיונות, נסה שוב מאוחר יותר',
  })[c]||'שגיאה: '+c;
}

// ── FIRESTORE ──────────────────────────────────────
// Structure: /shared/cat/days/{YYYY-MM-DD}/feedings/{id}
// feeding doc: { type:'breakfast'|'dinner', time: ISO string, by: email, createdAt }

function feedingsCol(dayKey){
  return db.collection('shared').doc('cat').collection('days').doc(dayKey).collection('feedings');
}

async function loadToday(){
  today={breakfast:[],dinner:[]};
  try{
    const snap=await feedingsCol(todayKey()).get();
    snap.forEach(doc=>{
      const d=doc.data();
      const t=d.type;
      if(t==='breakfast'||t==='dinner'){
        today[t].push({id:doc.id,time:d.time||new Date().toISOString(),by:d.by||'?'});
      }
    });
    today.breakfast.sort((a,b)=>a.time.localeCompare(b.time));
    today.dinner.sort((a,b)=>a.time.localeCompare(b.time));
  }catch(e){console.error('loadToday',e);toast('שגיאה: '+e.message)}
  renderTodayUI();
}

async function loadHistory(){
  allMeals=[];
  try{
    const days=await db.collection('shared').doc('cat').collection('days').get();
    const promises=[];
    days.forEach(dayDoc=>{
      promises.push(
        feedingsCol(dayDoc.id).get().then(fsnap=>{
          const feedings=[];
          fsnap.forEach(f=>feedings.push({id:f.id,...f.data()}));
          feedings.sort((a,b)=>(a.time||'').localeCompare(b.time||''));
          if(feedings.length>0) allMeals.push({date:dayDoc.id,feedings});
        })
      );
    });
    await Promise.all(promises);
    allMeals.sort((a,b)=>b.date.localeCompare(a.date));
    if(allMeals.length>20) allMeals=allMeals.slice(0,20);
  }catch(e){console.error('loadHistory',e)}
  renderHistory();
  renderQuickStats();
}

// ── FEED ───────────────────────────────────────────
async function feedNow(type){
  await addFeeding(type,new Date().toISOString());
}

async function addFeeding(type,isoTime){
  try{
    await feedingsCol(todayKey()).add({
      type, time:isoTime, by: me.email||'אנונימי',
      createdAt: TS()
    });
    // reload
    await loadToday();
    await loadHistory();
    const name=type==='breakfast'?'ארוחת בוקר':'ארוחת ערב';
    toast(`✓ ${name} נרשמה — ${fmtTime(isoTime)}`);
  }catch(e){toast('שגיאה: '+e.message)}
}

async function deleteFeeding(dayKey,id){
  try{
    await feedingsCol(dayKey).doc(id).delete();
    if(dayKey===todayKey()){
      await loadToday();
    }
    await loadHistory();
    toast('ארוחה בוטלה');
  }catch(e){toast('שגיאה: '+e.message)}
}

// ── DRUM PICKER ────────────────────────────────────
let drumH=new Date().getHours(), drumM=new Date().getMinutes();

function buildDrum(){
  // Build hours 0-23
  const dh=$('drum-h');
  // keep first pad
  const hPad=dh.children[0];
  dh.innerHTML='';
  dh.appendChild(hPad.cloneNode());
  for(let i=0;i<24;i++){
    const d=document.createElement('div');
    d.className='drum-item';
    d.dataset.val=i;
    d.textContent=p2(i);
    d.onclick=()=>scrollDrumTo('h',i);
    dh.appendChild(d);
  }
  const hPad2=document.createElement('div');
  hPad2.className='drum-pad';
  dh.appendChild(hPad2);

  // Build minutes 0-59
  const dm=$('drum-m');
  const mPad=dm.children[0];
  dm.innerHTML='';
  dm.appendChild(mPad.cloneNode());
  for(let i=0;i<60;i++){
    const d=document.createElement('div');
    d.className='drum-item';
    d.dataset.val=i;
    d.textContent=p2(i);
    d.onclick=()=>scrollDrumTo('m',i);
    dm.appendChild(d);
  }
  const mPad2=document.createElement('div');
  mPad2.className='drum-pad';
  dm.appendChild(mPad2);
}

function scrollDrumTo(which, val, animate=true){
  const el=$(which==='h'?'drum-h':'drum-m');
  el.scrollTo({top: val*56, behavior: animate?'smooth':'instant'});
}

function drumScroll(which){
  const el=$(which==='h'?'drum-h':'drum-m');
  const idx=Math.round(el.scrollTop/56);
  const max=which==='h'?23:59;
  const val=Math.min(Math.max(idx,0),max);
  if(which==='h') drumH=val; else drumM=val;
  updateDrumUI(which,val);
  updatePreview();
}

function updateDrumUI(which, val){
  const el=$(which==='h'?'drum-h':'drum-m');
  el.querySelectorAll('.drum-item').forEach(item=>{
    const v=parseInt(item.dataset.val);
    const diff=Math.abs(v-val);
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
  $('sheet-title').textContent='בחר שעה';
  $('sheet-subtitle').textContent=isBf?'🌅 ארוחת בוקר':'🌙 ארוחת ערב';
  // set to now
  const now=new Date();
  drumH=now.getHours(); drumM=now.getMinutes();
  buildDrum();
  // scroll after paint
  requestAnimationFrame(()=>{
    scrollDrumTo('h',drumH,false);
    scrollDrumTo('m',drumM,false);
    updateDrumUI('h',drumH);
    updateDrumUI('m',drumM);
    updatePreview();
  });
  $('sheet-overlay').classList.remove('hide');
}

function closeSheet(e){
  if(e&&e.target!==$('sheet-overlay'))return;
  $('sheet-overlay').classList.add('hide');
  pickerType=null;
}

function confirmPicker(){
  const d=new Date(); d.setHours(drumH,drumM,0,0);
  $('sheet-overlay').classList.add('hide');
  addFeeding(pickerType,d.toISOString());
  pickerType=null;
}

// ── RENDER TODAY ────────────────────────────────────
function renderTodayUI(){
  renderMealBlock('breakfast');
  renderMealBlock('dinner');
  renderStatus();
}

function renderMealBlock(type){
  const list=$(`fl-${type}`);
  const feedings=today[type]||[];
  list.innerHTML='';

  feedings.forEach(f=>{
    const row=document.createElement('div');
    row.className='feeding-row';
    row.innerHTML=`
      <svg class="fr-check" viewBox="0 0 24 24" fill="none" stroke="${type==='breakfast'?'#F59E0B':'#6366F1'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/>
      </svg>
      <span class="fr-who">${f.by}</span>
      <span class="fr-time">${fmtTime(f.time)}</span>
      <button class="fr-del" onclick="deleteFeeding('${todayKey()}','${f.id}')" title="בטל ארוחה">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;
    list.appendChild(row);
  });

  const block=$(`mb-${type}`);
  block.classList.toggle('done',feedings.length>0);
}

// ── STATUS ─────────────────────────────────────────
function renderStatus(){
  const pill=$('status-pill');
  const txt=$('sp-text');
  const bf=today.breakfast||[], di=today.dinner||[];
  const bfDone=bf.length>0, diDone=di.length>0;

  // last feeding time
  const all=[...bf,...di].sort((a,b)=>new Date(b.time)-new Date(a.time));
  const last=all[0];

  if(bfDone&&diDone){
    pill.className='status-pill ok';
    txt.textContent=`שבע ומרוצה ✓  ${last?'• האכלה אחרונה: '+fmtTime(last.time):''}`;
  } else if(bfDone||diDone){
    pill.className='status-pill warn';
    const missing=!bfDone?'ארוחת בוקר':'ארוחת ערב';
    txt.textContent=`חסרה ${missing}  ${last?'• לפני '+timeSince(last.time):''}`;
  } else {
    pill.className='status-pill hungry';
    txt.textContent='עוד לא קיבל אוכל היום';
  }
}

// ── QUICK STATS ─────────────────────────────────────
function renderQuickStats(){
  // streak
  let streak=0;
  const sorted=[...allMeals].sort((a,b)=>b.date.localeCompare(a.date));
  for(const m of sorted){
    const bf=m.feedings.some(f=>f.type==='breakfast');
    const di=m.feedings.some(f=>f.type==='dinner');
    if(bf&&di) streak++;
    else break;
  }
  $('qs-streak').textContent=streak;

  // averages
  const {avgBf,avgDi}=calcAvg(allMeals);
  $('qs-bf').textContent=avgBf||'—';
  $('qs-di').textContent=avgDi||'—';
}

function calcAvg(meals){
  const bfM=[],diM=[];
  meals.forEach(m=>{
    m.feedings.forEach(f=>{
      const d=new Date(f.time), mins=d.getHours()*60+d.getMinutes();
      if(f.type==='breakfast') bfM.push(mins);
      else diM.push(mins);
    });
  });
  const avg=arr=>arr.length?Math.round(arr.reduce((a,b)=>a+b,0)/arr.length):null;
  const m2t=m=>{if(m===null)return null;return `${p2(Math.floor(m/60))}:${p2(m%60)}`};
  return{avgBf:m2t(avg(bfM)),avgDi:m2t(avg(diM)),bfM,diM};
}

// ── HISTORY ─────────────────────────────────────────
function renderHistory(){
  const el=$('history');
  const show=allMeals.slice(0,12);
  if(!show.length){el.innerHTML='<div class="hempty">עוד אין היסטוריה</div>';return}

  el.innerHTML=show.map(m=>{
    const bf=m.feedings.filter(f=>f.type==='breakfast');
    const di=m.feedings.filter(f=>f.type==='dinner');
    const full=bf.length>0&&di.length>0;
    const half=(bf.length>0||di.length>0)&&!full;
    const badge=full?'full':half?'half':'none';
    const badgeTxt=full?'יום שלם':half?'חלקי':'לא האכיל';

    const bfTimes=bf.map(f=>fmtTime(f.time)).join(', ')||'—';
    const diTimes=di.map(f=>fmtTime(f.time)).join(', ')||'—';

    return `<div class="hday">
      <div class="hday-hdr">
        <span class="hday-date">${fmtDate(m.date)}</span>
        <span class="hbadge ${badge}">${badgeTxt}</span>
      </div>
      <div class="hday-meals">
        <div class="hm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2.2" stroke-linecap="round">
            <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
          </svg>
          <span class="hm-name">בוקר</span>
          <span class="hm-times">${bfTimes}</span>
        </div>
        <div class="hm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366F1" stroke-width="2.2" stroke-linecap="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
          <span class="hm-name">ערב</span>
          <span class="hm-times">${diTimes}</span>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ── STATS ───────────────────────────────────────────
function renderStats(){
  const last14=[...allMeals].sort((a,b)=>a.date.localeCompare(b.date)).slice(-14);
  const labels=last14.map(m=>fmtDate(m.date));

  // Chart 1: times
  const bfPoints=last14.map(m=>{
    const f=m.feedings.filter(x=>x.type==='breakfast');
    if(!f.length)return null;
    const d=new Date(f[0].time);
    return +(d.getHours()+d.getMinutes()/60).toFixed(2);
  });
  const diPoints=last14.map(m=>{
    const f=m.feedings.filter(x=>x.type==='dinner');
    if(!f.length)return null;
    const d=new Date(f[0].time);
    return +(d.getHours()+d.getMinutes()/60).toFixed(2);
  });

  destroyChart('chart-times');
  const c1=$('chart-times').getContext('2d');
  charts['chart-times']=new Chart(c1,{
    type:'line',
    data:{labels,datasets:[
      {label:'בוקר',data:bfPoints,borderColor:'#F59E0B',backgroundColor:'rgba(245,158,11,.08)',
       pointBackgroundColor:'#F59E0B',pointRadius:6,spanGaps:true,tension:.3},
      {label:'ערב', data:diPoints,borderColor:'#6366F1',backgroundColor:'rgba(99,102,241,.08)',
       pointBackgroundColor:'#6366F1',pointRadius:6,spanGaps:true,tension:.3}
    ]},
    options:{responsive:true,plugins:{legend:{labels:{color:'#7A6E65',font:{size:12}}}},
      scales:{
        x:{ticks:{color:'#B0A89E',font:{size:10}},grid:{color:'#E5DED5'}},
        y:{min:5,max:23,ticks:{color:'#B0A89E',callback:v=>{const h=Math.floor(v),m=Math.round((v-h)*60);return`${p2(h)}:${p2(m)}`}},grid:{color:'#E5DED5'}}
      }}
  });

  // Chart 2: completion bars
  const counts=last14.map(m=>({
    bf:m.feedings.some(f=>f.type==='breakfast')?1:0,
    di:m.feedings.some(f=>f.type==='dinner')?1:0
  }));
  destroyChart('chart-compl');
  const c2=$('chart-compl').getContext('2d');
  charts['chart-compl']=new Chart(c2,{
    type:'bar',
    data:{labels,datasets:[
      {label:'בוקר',data:counts.map(c=>c.bf),backgroundColor:'rgba(245,158,11,.7)',borderRadius:4},
      {label:'ערב', data:counts.map(c=>c.di),backgroundColor:'rgba(99,102,241,.7)',borderRadius:4}
    ]},
    options:{responsive:true,plugins:{legend:{labels:{color:'#7A6E65',font:{size:12}}}},
      scales:{
        x:{stacked:true,ticks:{color:'#B0A89E',font:{size:10}},grid:{color:'#E5DED5'}},
        y:{stacked:true,max:2,ticks:{color:'#B0A89E',stepSize:1},grid:{color:'#E5DED5'}}
      }}
  });

  // avg table
  const {avgBf,avgDi}=calcAvg(allMeals);
  $('av-bf').textContent=avgBf||'—';
  $('av-di').textContent=avgDi||'—';
  const full=allMeals.filter(m=>m.feedings.some(f=>f.type==='breakfast')&&m.feedings.some(f=>f.type==='dinner')).length;
  $('av-full').textContent=`${full} / ${allMeals.length} ימים`;

  let best=0,cur=0;
  [...allMeals].sort((a,b)=>a.date.localeCompare(b.date)).forEach(m=>{
    const bf=m.feedings.some(f=>f.type==='breakfast');
    const di=m.feedings.some(f=>f.type==='dinner');
    if(bf&&di){cur++;best=Math.max(best,cur)}else cur=0;
  });
  $('av-streak').textContent=best+' ימים';
}

function destroyChart(id){if(charts[id]){charts[id].destroy();delete charts[id]}}

// ── AUTH STATE ──────────────────────────────────────
auth.onAuthStateChanged(async user=>{
  me=user;
  if(user){
    showScreen('s-app');
    await loadToday();
    await loadHistory();
    // refresh status every minute
    setInterval(renderStatus,60000);
  } else {
    showScreen('s-auth');
    $('li-email').value=''; $('li-pass').value='';
  }
});