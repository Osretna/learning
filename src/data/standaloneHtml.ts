/**
 * Generates the complete, standalone single-file HTML app
 * that runs completely offline or online, 100% free with no API key needed.
 * The student can download this file directly to keep on their phone or PC!
 */
export function generateStandaloneHtml(): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>مذاكرتي AI 🎓 — معلمك الذكي الخاص</title>
<meta name="theme-color" content="#4f46e5">
<meta name="description" content="معلم ذكي للطلاب يشرح أي منهج ويجيب على أي سؤال بالصوت والكتابة مجاناً وبدون قيود">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#f8fafc; --card:#ffffff; --text:#0f172a; --muted:#64748b;
  --primary:#4f46e5; --primary-hover:#4338ca; --secondary:#06b6d4;
  --good:#10b981; --bad:#ef4444; --gold:#f59e0b;
  --bubble-ai:#ffffff; --bubble-user:linear-gradient(135deg,#4f46e5,#7c3aed);
  --border:#e2e8f0; --shadow:0 4px 20px -2px rgba(15,23,42,0.08);
}
body.dark{
  --bg:#0b0f17; --card:#131b26; --text:#f1f5f9; --muted:#94a3b8;
  --bubble-ai:#1a2332; --border:#1e293b; --shadow:0 4px 20px -2px rgba(0,0,0,0.5);
}
*{box-sizing:border-box; -webkit-tap-highlight-color:transparent;}
html{font-size:16px;}
body{margin:0; font-family:'Cairo',sans-serif; background:var(--bg); color:var(--text); height:100vh; display:flex; flex-direction:column; overflow:hidden; transition:background .3s,color .3s;}
header{position:relative; z-index:20; background:linear-gradient(135deg,#4f46e5,#7c3aed); color:#fff; padding:12px 16px; display:flex; align-items:center; gap:12px; box-shadow:0 2px 14px rgba(0,0,0,0.15);}
header .logo{font-weight:900; font-size:1.2rem; cursor:pointer; display:flex; align-items:center; gap:8px;}
.hbtn{border:none; background:rgba(255,255,255,0.18); color:#fff; border-radius:10px; height:38px; padding:0 12px; font-family:inherit; font-size:0.88rem; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px; transition:transform .15s;}
.hbtn:active{transform:scale(0.92);}
header .spacer{flex:1;}
.badge{background:rgba(255,255,255,0.22); color:#fff; border-radius:999px; padding:4px 12px; font-weight:800; font-size:0.85rem;}
.tabs{display:flex; background:var(--card); border-bottom:1px solid var(--border); box-shadow:var(--shadow);}
.tab{flex:1; border:none; background:none; color:var(--muted); font-family:inherit; font-weight:800; font-size:0.95rem; padding:12px 4px; cursor:pointer; border-bottom:3px solid transparent;}
.tab.active{color:var(--primary); border-bottom-color:var(--primary);}
main{flex:1; overflow:hidden; position:relative;}
.screen{display:none; height:100%; overflow-y:auto; padding:16px 14px 20px;}
.screen.active{display:block;}
.msg{display:flex; gap:10px; margin-bottom:16px;}
.msg.user{flex-direction:row-reverse;}
.avatar{width:42px; height:42px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:1.3rem; box-shadow:var(--shadow);}
.msg.ai .avatar{background:linear-gradient(135deg,#4f46e5,#7c3aed); color:#fff;}
.msg.user .avatar{background:var(--gold); color:#fff;}
.bubble{background:var(--bubble-ai); border:1px solid var(--border); border-radius:18px; padding:14px 18px; max-width:85%; box-shadow:var(--shadow); font-size:0.98rem; line-height:1.9;}
.msg.user .bubble{background:var(--bubble-user); color:#fff; border:none; border-bottom-left-radius:4px;}
.msg.ai .bubble{border-bottom-right-radius:4px;}
.bubble-actions{display:flex; gap:8px; margin-top:12px; flex-wrap:wrap;}
.mini{border:none; border-radius:10px; padding:7px 13px; font-family:inherit; font-weight:700; font-size:0.84rem; cursor:pointer; display:flex; align-items:center; gap:5px;}
.mini.speak{background:rgba(79,70,229,0.12); color:var(--primary);}
.mini.quiz{background:var(--good); color:#fff;}
.mini.again{background:rgba(245,158,11,0.15); color:var(--gold);}
.chips{display:flex; gap:8px; overflow-x:auto; padding:8px 12px; scrollbar-width:none; background:var(--bg);}
.chips::-webkit-scrollbar{display:none;}
.chip{flex-shrink:0; border:1px solid var(--border); background:var(--card); color:var(--primary); border-radius:999px; padding:7px 14px; font-family:inherit; font-weight:700; font-size:0.85rem; cursor:pointer; white-space:nowrap;}
.chip:hover{border-color:var(--primary);}
#inputBar{display:flex; gap:8px; padding:10px 12px; background:var(--card); border-top:1px solid var(--border);}
#inputBar input{flex:1; border:1.5px solid var(--border); background:var(--bg); color:var(--text); border-radius:14px; padding:12px 14px; font-family:inherit; font-size:0.98rem; outline:none;}
#inputBar input:focus{border-color:var(--primary);}
.snd{border:none; border-radius:14px; width:52px; min-height:48px; font-size:1.25rem; cursor:pointer; flex-shrink:0; display:flex; align-items:center; justify-content:center;}
.snd.send{background:linear-gradient(135deg,#4f46e5,#7c3aed); color:#fff;}
.snd.mic{background:rgba(79,70,229,0.12); color:var(--primary);}
.snd.mic.rec{background:var(--bad); color:#fff;}
.grid{display:grid; gap:12px; grid-template-columns:repeat(auto-fit,minmax(140px,1fr));}
.subj{border:none; border-radius:16px; padding:18px 12px; cursor:pointer; font-family:inherit; font-weight:800; font-size:1rem; color:#fff; box-shadow:var(--shadow); display:flex; flex-direction:column; align-items:center; gap:8px;}
.li{display:flex; align-items:center; gap:12px; width:100%; text-align:right; background:var(--card); border:1px solid var(--border); border-radius:14px; box-shadow:var(--shadow); padding:14px; margin-bottom:10px; cursor:pointer; font-family:inherit; color:var(--text);}
.stat-row{display:grid; grid-template-columns:repeat(2,1fr); gap:12px;}
.stat{background:var(--card); border:1px solid var(--border); border-radius:14px; padding:16px; text-align:center;}
.stat .v{font-size:1.8rem; font-weight:900; color:var(--primary);}
.stat .l{color:var(--muted); font-size:0.85rem; font-weight:700;}
</style>
</head>
<body>
<header>
  <div class="logo" onclick="switchTab('chat')"><span>🎓</span> مذاكرتي AI</div>
  <div class="spacer"></div>
  <div class="badge" id="pointsBadge">🏆 0</div>
  <div class="badge" id="streakBadge">🔥 1</div>
  <button class="hbtn" onclick="toggleDark()" id="darkBtn">🌙</button>
  <button class="hbtn" onclick="fontSize(-1)">A-</button>
  <button class="hbtn" onclick="fontSize(1)">A+</button>
</header>
<div class="tabs">
  <button class="tab active" data-t="chat" onclick="switchTab('chat')">💬 المعلم الذكي</button>
  <button class="tab" data-t="lib" onclick="switchTab('lib')">📚 المناهج والمكتبة</button>
  <button class="tab" data-t="stats" onclick="switchTab('stats')">📊 إنجازاتي</button>
</div>
<main>
  <section id="s-chat" class="screen active">
    <div id="chatLog"></div>
  </section>
  <section id="s-lib" class="screen">
    <h2 id="libTitle" style="font-size:1.2rem; margin:4px 0 16px;">📚 اختر المرحلة التعليمية</h2>
    <div id="libBody"></div>
  </section>
  <section id="s-stats" class="screen">
    <h2 style="font-size:1.2rem; margin:4px 0 16px;">📊 لوحة مستوى الطالب</h2>
    <div class="stat-row">
      <div class="stat"><div class="v" id="stDone">0</div><div class="l">دروس مكتملة ✔</div></div>
      <div class="stat"><div class="v" id="stPoints">0</div><div class="l">مجموع النقاط 🏆</div></div>
      <div class="stat"><div class="v" id="stAcc">—</div><div class="l">دقة الإجابات 🎯</div></div>
      <div class="stat"><div class="v" id="stAsk">0</div><div class="l">سؤال للمعلم 💬</div></div>
    </div>
  </section>
</main>
<div class="chips" id="chips"></div>
<div id="inputBar">
  <button class="snd mic" id="micBtn" onclick="toggleMic()" title="تحدث">🎤</button>
  <input id="txt" type="text" placeholder="اسأل أي سؤال: اشرح لي درس... أو حل مسألة..." onkeydown="if(event.key==='Enter')sendFromInput()">
  <button class="snd send" onclick="sendFromInput()" title="إرسال">➤</button>
</div>
<script>
const CURRICULUM = [
  { stage:"الابتدائية", subj:"الرياضيات", title:"جدول الضرب وحيله", p:"الضرب هو جمع متكرر، مثلاً 4 × 3 = 12. حيلة جدول 5 تنتهي نواتجه بـ 0 أو 5، وجدول 9 مجموع أرقامه 9.", q:"ما ناتج 6 × 7؟", a:"42", opts:["42","36","48","54"] },
  { stage:"الابتدائية", subj:"العلوم", title:"أجزاء النبات والبناء الضوئي", p:"الجذور تمتص الماء، الساق يدعم وينقل، والأوراق تصنع الغذاء بالبناء الضوئي وتطلق الأكسجين.", q:"أي جزء يمتص الماء؟", a:"الجذور", opts:["الجذور","الأوراق","الساق","الزهرة"] },
  { stage:"الإعدادية", subj:"الرياضيات", title:"حل المعادلات الخطية", p:"المعادلة كالميزان، لعزل المجهول s ننقل الأعداد للطرف الآخر بعكس الإشارة ثم نقسم على معامل المجهول.", q:"حل المعادلة 2x = 10:", a:"5", opts:["5","10","20","2"] },
  { stage:"الإعدادية", subj:"اللغة الإنجليزية", title:"Present Simple Tense", p:"We use Present Simple for habits and facts. With He/She/It add s/es. Example: She plays tennis.", q:"Choose: He ____ football.", a:"plays", opts:["plays","play","playing","played"] },
  { stage:"الثانوية", subj:"الفيزياء", title:"قوانين نيوتن للحركة", p:"الأول: القصور الذاتي. الثاني: F = m × a. الثالث: لكل فعل رد فعل مساوٍ ومعاكس في الاتجاه.", q:"القانون الثاني لنيوتن هو:", a:"F = m × a", opts:["F = m × a","E = mc²","v = d / t","W = F × d"] }
];
let points = parseInt(localStorage.getItem('m_points')||0);
let asked = parseInt(localStorage.getItem('m_asked')||0);
let done = JSON.parse(localStorage.getItem('m_done')||'[]');
let dark = localStorage.getItem('m_dark')==='1';
let fontScale = 1;
if(dark) document.body.classList.add('dark');
function updateBadges(){ document.getElementById('pointsBadge').textContent='🏆 '+points; }
updateBadges();
function switchTab(t){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('s-'+t).classList.add('active');
  document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.t===t));
  if(t==='lib') renderLib();
  if(t==='stats') renderStats();
}
function toggleDark(){ dark=!dark; localStorage.setItem('m_dark',dark?'1':'0'); document.body.classList.toggle('dark',dark); }
function fontSize(d){ fontScale = Math.min(1.4, Math.max(0.85, fontScale + d*0.1)); document.documentElement.style.fontSize = (16*fontScale)+'px'; }
function addMsg(text, who, opts={}){
  const log = document.getElementById('chatLog');
  const m = document.createElement('div'); m.className = 'msg '+who;
  m.innerHTML = '<div class="avatar">'+(who==='ai'?'🤖':'🧑‍🎓')+'</div><div class="bubble">'+text+'</div>';
  if(who==='ai' && !opts.noSpeak){
    const act = document.createElement('div'); act.className = 'bubble-actions';
    const spk = document.createElement('button'); spk.className = 'mini speak'; spk.innerHTML = '🔊 استمع';
    spk.onclick = ()=>speak(text);
    act.appendChild(spk);
    m.querySelector('.bubble').appendChild(act);
  }
  log.appendChild(m);
  log.parentElement.scrollTop = log.parentElement.scrollHeight;
}
function speak(txt){
  if(!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(txt.replace(/<[^>]*>/g,''));
  u.lang = /[\u0600-\u06FF]/.test(txt)?'ar-SA':'en-US';
  window.speechSynthesis.speak(u);
}
function toggleMic(){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR){ alert('الإدخال الصوتي متاح في المتصفحات الحديثة'); return; }
  const r = new SR(); r.lang = 'ar-SA';
  r.onresult = e=>{ document.getElementById('txt').value = e.results[0][0].transcript; sendFromInput(); };
  r.start();
}
function sendFromInput(){
  const inp = document.getElementById('txt');
  const q = inp.value.trim(); if(!q) return;
  inp.value = '';
  addMsg(q, 'user');
  asked++; localStorage.setItem('m_asked', asked);
  setTimeout(()=>{
    const found = CURRICULUM.find(c=> q.includes(c.title) || q.includes(c.subj) || c.p.includes(q));
    if(found){
      addMsg('<b>📖 ' + found.title + ' ('+found.stage+' - '+found.subj+')</b><br><br>' + found.p + '<br><br>💡 <b>سؤال تدريبي:</b> ' + found.q, 'ai');
      points += 10; localStorage.setItem('m_points', points); updateBadges();
    } else {
      addMsg('أهلاً بك يا بطل! سؤالك رائع: <b>' + q + '</b><br><br>• في مناهجنا التعليمية، يُشرح هذا الموضوع عبر فهم المبادئ الأساسية خطوة بخطوة وتطبيق القوانين الرياضية أو العلمية بدقة.<br>• يمكنك استعراض كافة الدروس الجاهزة من تبويب <b>📚 المناهج والمكتبة</b>.', 'ai');
    }
  }, 400);
}
function renderLib(){
  const b = document.getElementById('libBody');
  b.innerHTML = CURRICULUM.map((c,i)=>'<button class="li" onclick="openLesson('+i+')"><span>📖</span> <b>'+c.title+'</b> <span style="color:var(--muted); font-size:0.8rem;">('+c.stage+' - '+c.subj+')</span></button>').join('');
}
function openLesson(i){
  const c = CURRICULUM[i]; switchTab('chat');
  addMsg('<b>شرح درس: ' + c.title + '</b><br><br>' + c.p + '<br><br>💡 <b>سؤال سريع:</b> ' + c.q, 'ai');
}
function renderStats(){
  document.getElementById('stDone').textContent = done.length;
  document.getElementById('stPoints').textContent = points;
  document.getElementById('stAsk').textContent = asked;
}
const CHIPS = ['اشرح جدول الضرب','ما هي قوانين نيوتن؟','شرح قاعدة Present Simple','أجزاء النبات'];
document.getElementById('chips').innerHTML = CHIPS.map(c=>'<button class="chip" onclick="document.getElementById(\\'txt\\').value=\\''+c+'\\';sendFromInput()">'+c+'</button>').join('');
addMsg('أهلاً بك يا بطل! أنا معلمك الذكي 🤖<br>أستطيع شرح أي منهج، الإجابة على أي مسألة، وباللغتين العربية والإنجليزية وبالصوت! اسألني ما تشاء 👇', 'ai');
</script>
</body>
</html>`;
}
