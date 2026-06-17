// ============================================================
//  REQUIREMENTS MAP — סעיפים 6-10
//  כל רשומה: { section, sub, description, patterns[] }
//  patterns = מחרוזות regex לחיפוש בקוד Java/Kotlin
// ============================================================
const REQUIREMENTS = [
  // ── סעיף 6 ──────────────────────────────────────────────
  { section:'6', sub:'6.1',  description:'Job Scheduler / Work Manager',
    patterns:['JobScheduler','WorkManager','JobInfo','JobService','PeriodicWorkRequest','OneTimeWorkRequest'] },
  { section:'6', sub:'6.2',  description:'הורדת נתוני מידע מהאינטרנט (API)',
    patterns:['Retrofit','OkHttp','HttpURLConnection','Volley','JsonObject','URL\\s*\\(\\s*["\']http'] },
  { section:'6', sub:'6.3',  description:'מחלקת Service משמעותית',
    patterns:['extends\\s+Service','extends\\s+IntentService','extends\\s+JobIntentService','extends\\s+ForegroundService'] },
  { section:'6', sub:'6.4',  description:'DB יחסים מורכבים (@Relation, @Embedded, JOIN, GROUP BY)',
    patterns:['@Relation','@Embedded','JOIN','GROUP BY','@Dao','@Entity','@Database'] },
  { section:'6', sub:'6.5',  description:'ContentProvider (כ-provider ב-Manifest)',
    patterns:['extends\\s+ContentProvider'] },
  { section:'6', sub:'6.6',  description:'שימוש ב-Thread / Handler (Maui)',
    patterns:['extends\\s+Thread','new\\s+Thread\\s*\\(','new\\s+Handler\\s*\\(','Looper\\.','HandlerThread'] },
  { section:'6', sub:'6.7',  description:'הקפצת והאזנה לאירועים (Invoke)',
    patterns:['\\.invoke\\s*\\(','EventBus','@Subscribe','EventListener','setOn.*Listener'] },
  { section:'6', sub:'6.8',  description:'DataBinding / Convertor',
    patterns:['DataBindingUtil','import.*databinding','@BindingAdapter','@TypeConverter','Converter'] },
  { section:'6', sub:'6.9',  description:'RecyclerView / ObservableCollection',
    patterns:['RecyclerView','extends.*Adapter','RecyclerView\\.Adapter','ListAdapter','DiffUtil'] },
  { section:'6', sub:'6.10', description:'ViewPager בשילוב Fragment / ContentView',
    patterns:['ViewPager','ViewPager2','FragmentPagerAdapter','FragmentStatePagerAdapter','TabLayout'] },
  { section:'6', sub:'6.11', description:'MVVM מקיף בכל הפרויקט',
    patterns:['ViewModel','LiveData','MutableLiveData','extends.*ViewModel','Repository','StateFlow'] },
  { section:'6', sub:'6.12', description:'בינה מלאכותית — GenAI / API / Agents',
    patterns:['GenerativeModel','GeminiModel','gemini','openai','ChatGPT','BuildConfig.*API_KEY','GenerativeAI'] },
  { section:'6', sub:'6.13', description:'Notification + AlarmManager',
    patterns:['NotificationCompat','AlarmManager','createNotificationChannel','setAlarm','NotificationManager'] },
  { section:'6', sub:'6.14', description:'ActivityResultContract',
    patterns:['ActivityResultContract','registerForActivityResult','ActivityResultLauncher'] },
  { section:'6', sub:'6.16', description:'יצירת אנימציה (לא מחלקת Animation)',
    patterns:['ObjectAnimator','ValueAnimator','AnimatorSet','TransitionManager','MotionLayout','PropertyAnimator'] },

  // ── סעיף 7 ──────────────────────────────────────────────
  { section:'7', sub:'7',    description:'אחסון בבסיס נתונים (SQLite / Firebase / Room / Firestore)',
    patterns:['SQLiteDatabase','SQLiteOpenHelper','FirebaseFirestore','FirebaseDatabase','@Database','RoomDatabase'] },

  // ── סעיף 9 ──────────────────────────────────────────────
  { section:'9', sub:'9.1',  description:'SurfaceView',
    patterns:['extends\\s+SurfaceView','SurfaceHolder','SurfaceView'] },
  { section:'9', sub:'9.2',  description:'AlarmManager + Notification',
    patterns:['AlarmManager','NotificationCompat','createNotificationChannel'] },
  { section:'9', sub:'9.3',  description:'ירושה ממחלקת View / IDrawable',
    patterns:['extends\\s+View[^Model^Pager]','extends\\s+ImageView','implements.*Drawable','extends\\s+Canvas'] },
  { section:'9', sub:'9.4',  description:'GoogleMaps ונתוני מיקום',
    patterns:['GoogleMap','SupportMapFragment','FusedLocationProviderClient','OnMapReadyCallback','MapView'] },
  { section:'9', sub:'9.5',  description:'ContentView / Fragments',
    patterns:['extends\\s+Fragment','FragmentManager','FragmentTransaction','addToBackStack'] },
  { section:'9', sub:'9.6',  description:'מאזיני מיקום / תנועה',
    patterns:['LocationListener','SensorEventListener','LocationManager','requestLocationUpdates','onSensorChanged'] },
  { section:'9', sub:'9.7',  description:'Bluetooth',
    patterns:['BluetoothAdapter','BluetoothSocket','BluetoothDevice','BluetoothGatt','BluetoothLeScanner'] },
  { section:'9', sub:'9.8',  description:'NFC',
    patterns:['NfcAdapter','NdefMessage','NdefRecord','ACTION_NDEF_DISCOVERED'] },
  { section:'9', sub:'9.9',  description:'רשתות מחשבים',
    patterns:['ServerSocket','new\\s+Socket\\s*\\(','DatagramSocket','DatagramPacket'] },
  { section:'9', sub:'9.12', description:'בינה מלאכותית — מנוע למידת מכונה',
    patterns:['TensorFlowLite','MLKit','FirebaseMLModel','Interpreter\\s*\\(','tflite'] },
  { section:'9', sub:'9.13', description:'טכנולוגיה חדשה (CameraX, ARCore, עיבוד תמונה, זיהוי קול)',
    patterns:['CameraX','ProcessCameraProvider','ARCore','ArSession','TextRecognizer','FaceDetector','ImageAnalysis'] },
  { section:'9', sub:'9.14', description:'שימוש בחיישנים',
    patterns:['SensorManager','Sensor\\.TYPE_','SensorEvent','registerListener.*Sensor'] },
  { section:'9', sub:'9.15', description:'אפליקציית רב-משתתפים',
    patterns:['onChildAdded','ValueEventListener','addChildEventListener','DatabaseReference.*addValueEventListener'] },

  // ── סעיף 10 ─────────────────────────────────────────────
  { section:'10', sub:'10.1', description:'Messaging / BroadcastReceiver',
    patterns:['BroadcastReceiver','registerReceiver','sendBroadcast','onReceive'] },
  { section:'10', sub:'10.2', description:'SharedPreferences',
    patterns:['SharedPreferences','getSharedPreferences','PreferenceManager','putString.*commit\\|apply'] },
  { section:'10', sub:'10.3', description:'Camera & Gallery',
    patterns:['ACTION_IMAGE_CAPTURE','ACTION_PICK','MediaStore','CameraX','ProcessCameraProvider','takePicture'] },
  { section:'10', sub:'10.4', description:'AsyncTask',
    patterns:['extends\\s+AsyncTask','doInBackground','onPostExecute'] },
  { section:'10', sub:'10.5', description:'Microphone',
    patterns:['MediaRecorder','AudioRecord','RECORD_AUDIO','startRecording','AudioManager'] },
  { section:'10', sub:'10.6', description:'GPS',
    patterns:['GPS_PROVIDER','getLastKnownLocation','requestLocationUpdates','FusedLocationProviderClient','LocationRequest'] },
  { section:'10', sub:'10.7', description:'CountDownTimer',
    patterns:['CountDownTimer','onTick\\s*\\(','onFinish\\s*\\('] },
  { section:'10', sub:'10.8', description:'TextToSpeech',
    patterns:['TextToSpeech','tts\\.speak','TextToSpeech\\.OnInitListener'] },
  { section:'10', sub:'10.9', description:'SpeechToText',
    patterns:['SpeechRecognizer','RecognizerIntent','RECOGNIZE_SPEECH','startListening'] },
  { section:'10', sub:'10.10', description:'Sensors',
    patterns:['SensorManager','SensorEvent','TYPE_ACCELEROMETER','TYPE_GYROSCOPE'] },
  { section:'10', sub:'10.11', description:'Calendar with filter logic',
    patterns:['CalendarContract','ContentResolver.*calendar','CalendarProvider','DTSTART','DTEND'] },
  { section:'10', sub:'10.12', description:'ContentProvider',
    patterns:['getContentResolver\\s*\\(','ContentResolver','ContentUris','query.*ContentResolver'] },
];


// ============================================================
//  PROJECT SOURCE FILTER
//  רק קבצים מנתיב הפרויקט האמיתי
// ============================================================
const PROJECT_PATH = 'app/src/main/java/com/shiftis/';

function isProjectFile(path) {
  // תמיכה גם ב-backslash וגם ב-slash
  const normalized = path.replace(/\\/g, '/');
  return normalized.includes('app/src/main/java/com/shiftis/') &&
         (normalized.endsWith('.java') || normalized.endsWith('.kt'));
}

// ============================================================
//  ANALYZER — מנתח קוד ומחזיר תוצאות
// ============================================================
async function analyzeZip(zipFile) {
  const zip = await JSZip.loadAsync(zipFile);
  const results = [];   // { req, classes: [className] }

  // אסוף את כל קבצי Java/Kotlin
  const sourceFiles = [];
  zip.forEach((path, entry) => {
    if (isProjectFile(path)) {
      sourceFiles.push({ path, entry });
    }
  });

  if (sourceFiles.length === 0) {
    throw new Error('לא נמצאו קבצי Java/Kotlin ב-ZIP. ודא שזהו פרויקט Android Studio.');
  }

  // קרא תוכן כל קובץ
  const fileContents = await Promise.all(
    sourceFiles.map(async ({ path, entry }) => {
      const text = await entry.async('text');
      // חלץ שם המחלקה מהנתיב
      const parts = path.split('/');
      const filename = parts[parts.length - 1].replace(/\.(java|kt)$/, '');
      return { path, filename, text };
    })
  );

  // לכל דרישה — חפש בכל הקבצים
  for (const req of REQUIREMENTS) {
    const matchedClasses = [];

    for (const { filename, text } of fileContents) {
      const matched = req.patterns.some(pattern => {
        try { return new RegExp(pattern, 'i').test(text); }
        catch { return false; }
      });
      if (matched) matchedClasses.push(filename);
    }

    results.push({
      req,
      found: matchedClasses.length > 0,
      classes: matchedClasses,
    });
  }

  return results;
}

window.analyzeZip = analyzeZip;

// ============================================================
//  SCREEN ORDER ANALYZER
// ============================================================
async function analyzeScreenOrder(zipFile) {
  const zip = await JSZip.loadAsync(zipFile);

  // --- 1. מצא AndroidManifest.xml ---
  const manifestEntry = Object.values(zip.files).find(
    e => !e.dir && e.name.endsWith('AndroidManifest.xml')
  );
  if (!manifestEntry) return [];
  const manifestText = await manifestEntry.async('text');

  // --- 2. חלץ כל Activities מהמניפסט ---
  // תומך גם ב-<activity ... /> וגם ב-<activity ...>...</activity>
  // android:name יכול להיות בכל מקום בתוך התג
  const allActivities  = [];
  let   launcherActivity = null;

  // פצל לפי תגיות activity (self-closing ורגיל)
  const tagRe = /<activity([\s\S]*?)(?:\/>|>([\s\S]*?)<\/activity>)/g;
  let m;
  while ((m = tagRe.exec(manifestText)) !== null) {
    const attrs = m[1];
    const body  = m[2] || '';

    // שלוף android:name
    const nameMatch = attrs.match(/android:name="([^"]+)"/);
    if (!nameMatch) continue;
    const fullName = nameMatch[1];
    const simpleName = fullName.split('.').pop();

    // בדוק אם LAUNCHER
    const isLauncher = /android\.intent\.action\.MAIN/.test(body) ||
                       /android\.intent\.action\.MAIN/.test(attrs);
    if (isLauncher) launcherActivity = simpleName;

    allActivities.push(simpleName);
  }

  // --- 3. קרא כל קבצי Java/Kotlin ---
  const sourceFiles = [];
  zip.forEach((path, entry) => {
    if (isProjectFile(path))
      sourceFiles.push(entry);
  });
  const fileContents = await Promise.all(
    sourceFiles.map(async entry => {
      const text = await entry.async('text');
      const name = entry.name.split('/').pop().replace(/\.(java|kt)$/, '');
      return { name, text };
    })
  );

  // --- 4. בנה גרף Intent (מי פותח את מי) ---
  // דפוסים: new Intent(x, Foo.class) | Intent(x, Foo::class.java) | startActivity(new Intent(x, Foo.class))
  const intentGraph = {};
  const intentRe = /(?:new\s+)?Intent\s*\([^)]*?([A-Z][A-Za-z0-9_]+)\.class/g;
  const intentReKt = /Intent\s*\([^)]*?([A-Z][A-Za-z0-9_]+)::class/g;

  for (const { name, text } of fileContents) {
    const targets = new Set();
    let im;
    while ((im = intentRe.exec(text))   !== null) { const t = im[1]; if (t !== name && allActivities.includes(t)) targets.add(t); }
    while ((im = intentReKt.exec(text)) !== null) { const t = im[1]; if (t !== name && allActivities.includes(t)) targets.add(t); }
    if (targets.size > 0) intentGraph[name] = [...targets];
  }

  // --- 4.5 סנן: רק Activities שיש להן קובץ קוד בפרויקט ---
  const sourceNames = new Set(fileContents.map(f => f.name));
  const projectActivities = allActivities.filter(a => sourceNames.has(a));

  // ← החלף allActivities ב-projectActivities מכאן והלאה
  const filteredActivities = projectActivities;

  // עדכן גרף Intent — הסר targets שלא בפרויקט
  for (const key of Object.keys(intentGraph)) {
    intentGraph[key] = intentGraph[key].filter(t => filteredActivities.includes(t));
  }

  // --- 5. סיווג ---
  const AUTH   = /splash|loading|load|login|signin|sign_in|register|signup|sign_up|forgot|reset|welcome|onboard/i;
  const MAIN   = /main|home|dashboard|hub|menu/i;

  const authActs  = filteredActivities.filter(a =>  AUTH.test(a));
  const mainActs  = filteredActivities.filter(a => !AUTH.test(a) &&  MAIN.test(a));
  const otherActs = filteredActivities.filter(a => !AUTH.test(a) && !MAIN.test(a));

  // launcher ראשון בקבוצתו
  const prioritize = (arr) => launcherActivity
    ? [ ...arr.filter(a => a === launcherActivity), ...arr.filter(a => a !== launcherActivity) ]
    : arr;

  // --- 6. BFS לפי גרף Intent ---
  const visited = new Set();
  const ordered = [];
  const bfs = (start) => {
    if (!start || visited.has(start)) return;
    const q = [start];
    while (q.length) {
      const curr = q.shift();
      if (visited.has(curr)) continue;
      visited.add(curr); ordered.push(curr);
      for (const nxt of (intentGraph[curr] || [])) if (!visited.has(nxt)) q.push(nxt);
    }
  };

  for (const a of prioritize(authActs))  bfs(a);
  for (const a of prioritize(mainActs))  bfs(a);
  if (launcherActivity) bfs(launcherActivity);
  for (const a of otherActs) bfs(a);
  // כל מה שנשאר (חייב להופיע — כולל מה שלא נפתח ע"י Intent)
  for (const a of filteredActivities) if (!visited.has(a)) ordered.push(a);

  return ordered;
}

window.analyzeScreenOrder = analyzeScreenOrder;

// ============================================================
//  CODE STRUCTURE ANALYZER v2
//  זיהוי חכם לפי שם + תוכן הקובץ
// ============================================================

// ── קטגוריות וסדר תצוגה ─────────────────────────────────────
const CAT_ORDER = [
  'ACTIVITY', 'FRAGMENT', 'DIALOG', 'ADAPTER', 'VIEWHOLDER',
  'MODEL', 'ENTITY', 'DAO', 'DATABASE',
  'VIEWMODEL', 'REPOSITORY', 'WORKER', 'SERVICE',
  'HELPER', 'INTERFACE', 'ENUM', 'OTHER'
];

const CAT_LABELS_MAP = {
  ACTIVITY:   'Activities',
  FRAGMENT:   'Fragments',
  DIALOG:     'Dialogs & Bottom Sheets',
  ADAPTER:    'Adapters',
  VIEWHOLDER: 'ViewHolders',
  MODEL:      'Models & Data Classes',
  ENTITY:     'Room Entities',
  DAO:        'DAOs (Database Access Objects)',
  DATABASE:   'Database Classes',
  VIEWMODEL:  'ViewModels',
  REPOSITORY: 'Repositories',
  WORKER:     'Workers & Background Tasks',
  SERVICE:    'Services',
  HELPER:     'Helpers, Utilities & Managers',
  INTERFACE:  'Interfaces & Callbacks',
  ENUM:       'Enums',
  OTHER:      'קבצים נוספים',
};

// ── זיהוי לפי שם ────────────────────────────────────────────
const NAME_RULES = [
  { cat: 'ACTIVITY',   re: /Activity$/i },
  { cat: 'FRAGMENT',   re: /Fragment$/i },
  { cat: 'DIALOG',     re: /Dialog$|BottomSheet$|DialogFragment$/i },
  { cat: 'ADAPTER',    re: /Adapter$|RecyclerAdapter$/i },
  { cat: 'VIEWHOLDER', re: /ViewHolder$|Holder$/i },
  { cat: 'DAO',        re: /Dao$|DAO$/i },
  { cat: 'DATABASE',   re: /Database$|Db$/i },
  { cat: 'VIEWMODEL',  re: /ViewModel$/i },
  { cat: 'REPOSITORY', re: /Repository$/i },
  { cat: 'WORKER',     re: /Worker$/i },
  { cat: 'SERVICE',    re: /Service$/i },
  { cat: 'MODEL',      re: /Model$|Entity$|Dto$|Pojo$|Item$|Data$|Response$|Request$/i },
  { cat: 'HELPER',     re: /Helper$|Util$|Utils$|Manager$|Handler$|Provider$|Builder$|Factory$/i },
];

// ── זיהוי לפי תוכן (fallback) ──────────────────────────────
function detectByContent(text) {
  if (/extends\s+AppCompatActivity|extends\s+Activity|setContentView\s*\(/.test(text))  return 'ACTIVITY';
  if (/extends\s+Fragment|onCreateView\s*\(|inflater\.inflate\s*\(/.test(text))         return 'FRAGMENT';
  if (/extends\s+DialogFragment|extends\s+BottomSheetDialogFragment/.test(text))        return 'DIALOG';
  if (/extends\s+.*Adapter|RecyclerView\.Adapter|extends\s+BaseAdapter/.test(text))     return 'ADAPTER';
  if (/extends\s+RecyclerView\.ViewHolder/.test(text))                                  return 'VIEWHOLDER';
  if (/@Dao\b/.test(text))                                                              return 'DAO';
  if (/@Database\b/.test(text))                                                         return 'DATABASE';
  if (/@Entity\b/.test(text))                                                           return 'ENTITY';
  if (/extends\s+ViewModel|extends\s+AndroidViewModel/.test(text))                      return 'VIEWMODEL';
  if (/extends\s+Worker|extends\s+ListenableWorker/.test(text))                         return 'WORKER';
  if (/extends\s+Service|extends\s+IntentService/.test(text))                           return 'SERVICE';
  if (/^public\s+enum\s+/m.test(text))                                                  return 'ENUM';
  if (/^public\s+interface\s+/m.test(text))                                             return 'INTERFACE';
  // Room Entity without annotation (has @PrimaryKey)
  if (/@PrimaryKey|@ColumnInfo|@Embedded/.test(text))                                   return 'ENTITY';
  // POJO: mostly fields + getters/setters, no Android imports
  if (/import\s+android\./m.test(text) === false && /private\s+\w+\s+\w+\s*;/.test(text)) return 'MODEL';
  return 'OTHER';
}

function categorizeFile(name, text) {
  // 1. שם
  for (const { cat, re } of NAME_RULES) {
    if (re.test(name)) return cat;
  }
  // 2. תוכן
  return detectByContent(text);
}

// ── חילוץ עצמים (fields) ─────────────────────────────────────
function extractFields(text) {
  const fields = [];
  const seen   = new Set();

  // Java fields: [modifiers] Type[<Generic>] name [= value];
  const fieldRe = /^([ \t]{1,12})((?:(?:@\w+(?:\([^)]*\))?\s+)?(?:private|public|protected|static|final|volatile|transient)\s+)+)([\w$][\w$.<>\[\], ?]*?)\s+([\w$]+)\s*(?:=\s*([^;\n{]+?))?;/gm;

  let m;
  while ((m = fieldRe.exec(text)) !== null) {
    const indent    = m[1].length;
    const modifiers = m[2].trim().replace(/@\w+(\([^)]*\))?\s*/g, '').trim();
    const type      = m[3].trim();
    const name      = m[4].trim();
    const value     = m[5] ? m[5].trim() : '';

    // דלג על: הזחה עמוקה מדי (פנים פונקציה), מילות מפתח, כפילויות
    if (indent > 8) continue;
    if (/^(return|new|if|else|for|while|case|break|continue|throw|final)$/.test(name)) continue;
    if (/^(return|void|class|interface)$/.test(type)) continue;
    if (seen.has(name)) continue;
    seen.add(name);

    const decl = `${modifiers} ${type} ${name}${value ? ' = ' + value : ''}`;
    fields.push(decl.replace(/\s+/g, ' ').trim());
  }

  // Kotlin val/var
  const kotlinRe = /^([ \t]{0,8})(?:private\s+|protected\s+|internal\s+|public\s+)?(val|var)\s+([\w$]+)\s*(?::\s*([\w$.<>\[\]?, ?]+?))?\s*(?:=\s*([^\n{]+?))?$/gm;
  while ((m = kotlinRe.exec(text)) !== null) {
    const indent = m[1].length;
    if (indent > 4) continue;
    const keyword = m[2];
    const name    = m[3].trim();
    const type    = m[4] ? m[4].trim() : '';
    const value   = m[5] ? m[5].trim() : '';
    if (seen.has(name)) continue;
    seen.add(name);
    const decl = `${keyword} ${name}${type ? ': ' + type : ''}${value ? ' = ' + value : ''}`;
    fields.push(decl.replace(/\s+/g, ' ').trim());
  }

  return fields;
}

// ── חילוץ פונקציות ───────────────────────────────────────────
function extractMethods(text) {
  const methods = [];
  const seen    = new Set();

  // Java methods
  const javaRe = /^[ \t]{0,8}((?:@\w+(?:\([^)]*\))?\s+)*)((?:public|private|protected|static|final|synchronized|abstract|override|native)\s+)+([\w$][\w$.<>\[\]?, ]*?)\s+([\w$]+)\s*\(([^)]*)\)\s*(?:throws\s+[\w$,\s]+)?\s*\{/gm;
  let m;
  while ((m = javaRe.exec(text)) !== null) {
    const annotations = m[1] ? m[1].trim().replace(/\s+/g,' ') : '';
    const modifiers   = m[2].trim();
    const retType     = m[3].trim();
    const name        = m[4].trim();
    const params      = m[5].replace(/\s+/g,' ').trim();

    const SKIP = /^(if|else|while|for|switch|try|catch|finally|synchronized|new|class|interface|enum)$/;
    if (SKIP.test(name)) continue;
    if (SKIP.test(retType)) continue;
    if (seen.has(name + params)) continue;
    seen.add(name + params);

    const sig = `${annotations ? annotations + ' ' : ''}${modifiers} ${retType} ${name}(${params})`
      .replace(/\s+/g,' ').trim();
    methods.push(sig);
  }

  // Kotlin fun
  const kotlinFun = /^[ \t]{0,8}(?:@\w+(?:\([^)]*\))?\s+)*(?:private\s+|protected\s+|internal\s+|public\s+|override\s+|suspend\s+|inline\s+|open\s+)*(fun)\s+([\w$]+)\s*\(([^)]*)\)(?:\s*:\s*([\w$.<>\[\]?, ?]+?))?\s*\{/gm;
  while ((m = kotlinFun.exec(text)) !== null) {
    const name   = m[2].trim();
    const params = m[3].replace(/\s+/g,' ').trim();
    const ret    = m[4] ? ': ' + m[4].trim() : '';
    if (seen.has(name + params)) continue;
    seen.add(name + params);
    methods.push(`fun ${name}(${params})${ret}`.replace(/\s+/g,' ').trim());
  }

  return methods;
}

// ── analyzeCodeStructure ─────────────────────────────────────
async function analyzeCodeStructure(zipFile) {
  const zip = await JSZip.loadAsync(zipFile);

  const sourceEntries = [];
  zip.forEach((path, entry) => {
    if (isProjectFile(path)) sourceEntries.push(entry);
  });

  const files = await Promise.all(
    sourceEntries.map(async entry => {
      const text = await entry.async('text');
      const name = entry.name.split('/').pop().replace(/\.(java|kt)$/, '');
      const cat  = categorizeFile(name, text);
      return { name, cat, fields: extractFields(text), methods: extractMethods(text), rawText: text };
    })
  );

  // מיין: לפי סדר קטגוריה → לפי שם
  files.sort((a, b) => {
    const oi = CAT_ORDER.indexOf(a.cat) - CAT_ORDER.indexOf(b.cat);
    return oi !== 0 ? oi : a.name.localeCompare(b.name);
  });

  // קבץ
  const grouped = {};
  for (const f of files) {
    if (!grouped[f.cat]) grouped[f.cat] = [];
    grouped[f.cat].push(f);
  }

  return {
    grouped,
    order:  CAT_ORDER.filter(c => grouped[c]),
    labels: CAT_LABELS_MAP,
  };
}

window.analyzeCodeStructure = analyzeCodeStructure;
window.CAT_LABELS_MAP       = CAT_LABELS_MAP;

// ============================================================
//  RESOURCE FILES ANALYZER
//  איסוף קבצי Layout XML ו-Drawable
// ============================================================
async function analyzeResources(zipFile) {
  const zip = await JSZip.loadAsync(zipFile);

  const layouts   = [];  // res/layout/
  const drawables = [];  // res/drawable/ (XML בלבד)
  const values    = [];  // res/values/

  zip.forEach((path, entry) => {
    if (entry.dir) return;
    const norm = path.replace(/\\/g, '/');

    // layout
    if (/res\/layout\/.+\.xml$/i.test(norm)) {
      layouts.push({ path: norm, entry });
    }
    // drawable XML
    else if (/res\/drawable\/.+\.xml$/i.test(norm)) {
      drawables.push({ path: norm, entry });
    }
    // values
    else if (/res\/values\/.+\.xml$/i.test(norm)) {
      values.push({ path: norm, entry });
    }
  });

  const readAll = async (arr) => Promise.all(
    arr.map(async ({ path, entry }) => ({
      name: path.split('/').pop(),
      path,
      text: await entry.async('text'),
    }))
  );

  return {
    layouts:   (await readAll(layouts)).sort((a,b) => a.name.localeCompare(b.name)),
    drawables: (await readAll(drawables)).sort((a,b) => a.name.localeCompare(b.name)),
    values:    (await readAll(values)).sort((a,b) => a.name.localeCompare(b.name)),
  };
}

window.analyzeResources = analyzeResources;