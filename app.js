/* PROMPTURE Web App v1.4 — prompt-only fashion atelier (browser + Gemini API)
   Fixes: multi-turn chat history, runBuild image/location context, command routing,
   runtime location compaction (token savings), renderMD double-escape, AbortController */
'use strict';

/* Crash-safe storage: falls back to memory if browser blocks localStorage */
const store = {
  _m: {},
  get(k){ try{ return localStorage.getItem(k); }catch(e){ return (k in this._m) ? this._m[k] : null; } },
  set(k,v){ try{ localStorage.setItem(k,v); }catch(e){ this._m[k]=v; } }
};
const VALID_MODELS = ['gemini-3.8-flash','gemini-3.1-pro-preview','gemini-3.5-flash-lite','gemini-4-argon','gemini-2.5-flash','gemini-2.5-pro'];

/* ---------- Bilingual UI strings ---------- */
const STR = {
  subtitle:{mm:'ဖက်ရှင် Prompt အလုပ်ရုံ',en:'Fashion Prompt Atelier'},
  st_upload:{mm:'ပုံတင်',en:'Upload'}, st_analyze:{mm:'စစ်ဆေး',en:'Analyze'},
  st_propose:{mm:'အကြံပြု',en:'Propose'}, st_build:{mm:'ဆောက်',en:'Build'},
  refs:{mm:'Reference ပုံများ',en:'References'},
  refs_hint:{mm:'အမျိုးအစားအလိုက် ခွဲတင်ပါ',en:'Upload into each category'},
  selection:{mm:'ရွေးချယ်မှု',en:'Selection'}, sel_loc:{mm:'နေရာ:',en:'Location:'}, sel_mk:{mm:'မိတ်ကပ်:',en:'Makeup:'},
  commands:{mm:'အသင့်သုံး command များ',en:'Instant commands'},
  new_session:{mm:'အသစ်စ',en:'New session'}, send:{mm:'ပို့',en:'Send'},
  placeholder:{mm:'စာရိုက်ပါ (သို့) command နှိပ်ပါ…',en:'Type a message or tap a command…'},
  settings:{mm:'ဆက်တင်',en:'Settings'}, api_key:{mm:'Gemini API key',en:'Gemini API key'},
  test_key:{mm:'Key စမ်း',en:'Test key'}, model:{mm:'Model',en:'Model'},
  language:{mm:'ဘာသာစကား',en:'Language'}, clear_chat:{mm:'Chat ရှင်း',en:'Clear chat'},
  appearance:{mm:'အသွင်အပြင်',en:'Appearance'},
  theme_day:{mm:'☀️ နေ့',en:'☀️ Day'}, theme_night:{mm:'🌙 ည',en:'🌙 Night'}, theme_system:{mm:'⚙️ System',en:'⚙️ System'},
  done:{mm:'ပြီးပြီ',en:'Done'},
  key_note:{mm:'Key က ဒီ browser ထဲမှာပဲ သိမ်းထားတယ် — Google ဆီကိုပဲ သွားတယ်။',en:'Your key stays in this browser only — it goes to Google alone.'},
  start:{mm:'စမယ်',en:'Start'},
  need_key:{mm:'စဖို့ Settings (⚙) မှာ Gemini API key ထည့်ပါ။',en:'Enter your Gemini API key in Settings (⚙) to begin.'},
  key_ok:{mm:'✅ Key အလုပ်လုပ်တယ်',en:'✅ Key works'}, key_bad:{mm:'❌ Key မမှန်ဘူး — ပြန်စစ်ပါ',en:'❌ Key invalid — check again'},
  err:{mm:'အမှားဖြစ်သွားတယ် — ပြန်ကြိုးစားပါ။',en:'Something went wrong — please retry.'},
  copied:{mm:'ကူးပြီးပြီ ✓',en:'Copied ✓'},
  slot_model:{mm:'Model',en:'Model'}, slot_outfit:{mm:'အဝတ်အစား',en:'Outfit'},
  slot_pose:{mm:'Pose',en:'Pose'}, slot_makeup:{mm:'မိတ်ကပ်',en:'Makeup'},
  slot_location:{mm:'နေရာ',en:'Location'}, slot_furniture:{mm:'ပရိဘောဂ',en:'Furniture'},
  add_photo:{mm:'ပုံထည့်',en:'Add photo'},
  build_now:{mm:'အပြီးသတ် prompt ဆောက်မယ် →',en:'Build final prompt →'},
  need_images:{mm:'အရင် slot တွေမှာ ပုံတင်ပါ 🖼',en:'Upload images into the slots first 🖼'},
  both_selected:{mm:'နှစ်ခုလုံး ရွေးပြီးပြီ — ဆောက်လို့ရပြီ 👇',en:'Both selected — ready to build 👇'},
  tap_select:{mm:'ရွေးဖို့ နှိပ်ပါ 👇',en:'Tap to select 👇'},
  selected_loc:{mm:'နေရာ ရွေးပြီးပြီ',en:'Location selected'}, selected_mk:{mm:'မိတ်ကပ် ရွေးပြီးပြီ',en:'Makeup selected'},
  need_both_sel:{mm:'နေရာနဲ့ မိတ်ကပ် နှစ်ခုလုံး အရင်ရွေးပါ (သို့) 3️⃣ အကြံပြု ကို နှိပ်ပါ။',en:'Select both a location and a makeup look first (or tap step 3 Propose).'},
  step1:{mm:'Settings (⚙) မှာ Gemini API key ထည့်ပါ',en:'Add your Gemini API key in Settings (⚙)'},
  step2:{mm:'Slot တွေမှာ Model / Outfit / Pose ပုံတွေ ခွဲတင်ပါ',en:'Place Model / Outfit / Pose photos into their slots'},
  step3:{mm:'🚀 ကို နှိပ်ပြီး workflow စလိုက်ပါ',en:'Tap 🚀 to run the workflow'},
};

/* ---------- 20 instant commands ---------- */
/* Optional action tag: 'analyze' | 'workflow' | 'build' | 'propose_loc' | 'propose_mk' | 'prefill' */
const COMMANDS = [
 ['🔍','ပုံစစ် + layer map','Analyze + layer map','Analyze these references and show me the layer map with your per-image classification. Don\'t build the prompt yet — wait for my go.','analyze'],
 ['🚀','အစအဆုံး workflow','Full workflow','Here are my Model, Outfit and Pose references. Run the full workflow: analyze, propose 10 locations and 5 makeup looks, then pause for my selection.','workflow'],
 ['✅','ရွေးပြီး prompt ဆောက်','Build final prompt','I select the location and makeup I tapped above. Build the final prompt now.','build'],
 ['📍','နေရာ ၁၀ ခု အကြံပြု','10 locations','Propose 10 library locations that fit this outfit and pose, with outfit-fit and pose-fit reasons for each.','propose_loc'],
 ['💄','မိတ်ကပ် ၅ မျိုး အကြံပြု','5 makeup looks','Propose 5 makeup looks that match this outfit.','propose_mk'],
 ['🤲','အကောင်းဆုံးရွေးခိုင်း','Auto-select best','Choose the best location and makeup from the libraries yourself based on the evidence — mark them as SELECTED BY DELEGATION, and build the final master prompt and negative prompt now.','auto_build'],
 ['👤','တစ်ယောက်တည်း (001)','Single model','Single model only — MODEL-001. If the pose reference shows another person, use the pose geometry only, not their identity.'],
 ['👫','နှစ်ယောက် (001+002)','Couple','Couple shoot — MODEL-001 and MODEL-002. Map each model to the correct figure in the pose reference and confirm the mapping before building.'],
 ['👥','သုံးယောက် (001-003)','Three models','Three-model editorial — MODEL-001, MODEL-002 and MODEL-003. Confirm who is who before building.'],
 ['🖼️📍','ဒီပုံကို နေရာအဖြစ်သုံး','Image as location','Use the uploaded LOCATION slot image as the location reference. Don\'t propose library alternatives — analyze it and build the scene from it.'],
 ['🖼️💄','ဒီပုံကို မိတ်ကပ်အဖြစ်သုံး','Image as makeup','Use the uploaded MAKEUP slot image as the makeup reference for the active model.'],
 ['🪑','ပရိဘောဂ ထည့်ခိုင်း','Add furniture','Include the furniture piece from the FURNITURE slot in the scene exactly as analyzed — type, style, materials and scale.'],
 ['💡','အလင်းပြန်ပြင်','Re-light','Keep everything, but re-light the scene: soft golden-hour glow through windows, gentle rim light on hair. Return the updated full FINAL MASTER PROMPT and TASK-SPECIFIC NEGATIVE PROMPT.'],
 ['📷','ဘောင်ပြန်ချိန်','Reframe','Reframe as a full-body wide shot with more environment visible. Everything else stays. Return the updated full FINAL MASTER PROMPT and TASK-SPECIFIC NEGATIVE PROMPT.'],
 ['🔥','mood ပို editorial ဆန်','Editorial mood','Push the mood more editorial and high-fashion — stronger contrast, more attitude in the expression. Return the updated full FINAL MASTER PROMPT and TASK-SPECIFIC NEGATIVE PROMPT.'],
 ['👗✏️','အဝတ်ပဲလဲ','Outfit only','Change ONLY the outfit to [describe new outfit]. Keep model, pose, makeup, location, camera and lighting identical, and return the full updated prompt.','prefill'],
 ['📍✏️','နေရာပဲလဲ','Location only','Change ONLY the location to [ID or name]. Re-check pose contact and lighting coherence with the new environment, and return the full updated prompt.','prefill'],
 ['💄✏️','မိတ်ကပ်ပဲလဲ','Makeup only','Change ONLY the makeup to [look name]. Do not touch facial identity or proportions, and return the full updated prompt.','prefill'],
 ['📦','copy-ready ထုတ်','Copy-ready output','Output the current FINAL MASTER PROMPT and TASK-SPECIFIC NEGATIVE PROMPT in two separate fenced code blocks, copy-ready, with no analysis inside.'],
 ['🛡️','negative ပိုခိုင်မာအောင်','Strengthen negative','Strengthen the negative prompt against body-proportion drift and identity drift for the active model(s), then show me the updated FINAL MASTER PROMPT and TASK-SPECIFIC NEGATIVE PROMPT blocks.'],
];

/* ---------- Reference slots (authoritative roles) ---------- */
const SLOT_DEFS = [
  {key:'model',     em:'👤', label:'slot_model'},
  {key:'outfit',    em:'👗', label:'slot_outfit'},
  {key:'pose',      em:'🧍', label:'slot_pose'},
  {key:'makeup',    em:'💄', label:'slot_makeup'},
  {key:'location',  em:'📍', label:'slot_location'},
  {key:'furniture', em:'🪑', label:'slot_furniture'},
];

/* ---------- State ---------- */
const storedModel = store.get('prompture_model');
const state = {
  lang: store.get('prompture_lang') || 'mm',
  theme: store.get('prompture_theme') || 'night',
  apiKey: store.get('prompture_api_key') || '',
  model: storedModel || 'gemini-3.8-flash',
  refSlots: {model:[], outfit:[], pose:[], makeup:[], location:[], furniture:[]},
  selections: {loc:null, mk:null},
  history: [],          // Multi-turn Gemini conversation history
  imagesSentSig: '',    // Tracks which slot images are already inside history
  busy: false,
  ctaShown: false,
  abortCtrl: null,
};
const t = k => (STR[k] && STR[k][state.lang]) || k;
const $ = id => document.getElementById(id);
const K = () => window.PROMPTURE_KNOWLEDGE || {};

/* ---------- Runtime Knowledge Compaction (reduces tokens ~70%) ---------- */
let _compactLocCache = null;
function compactLocText(raw){
  if(!raw) return '';
  return raw
    .replace(/<details>[\s\S]*?<\/details>/g, '')
    .replace(/^- Source reference:.*$/gm, '')
    .replace(/^- Data status:.*$/gm, '')
    .replace(/^LOCATION & ENVIRONMENT KNOWLEDGE.*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
function getCompactLocations(){
  if(_compactLocCache !== null) return _compactLocCache;
  const k = K();
  _compactLocCache = [compactLocText(k.LOCA), compactLocText(k.LOCB), compactLocText(k.LOCC)]
    .filter(Boolean).join('\n\n');
  return _compactLocCache;
}
function findLocationSnippet(loc){
  if(!loc) return '';
  const all = getCompactLocations();
  const blocks = all.split(/\n---\n|\n(?=### )/);
  const id = (loc.id || '').trim();
  const name = (loc.name || '').trim().toLowerCase();
  const hit = blocks.find(b => (id && b.includes(id)) || (name && b.toLowerCase().includes('### ' + name)));
  let matRow = '';
  if(K().MAT && (id || name)){
    const rows = K().MAT.split('\n');
    const r = rows.find(line => (id && line.includes(id)) || (name && line.toLowerCase().includes(name)));
    if(r) matRow = '\nProduction Matrix Row:\n' + r;
  }
  return (hit ? hit.trim() : `${loc.id || ''} ${loc.name || ''}`) + matRow;
}

/* ---------- Language Instruction for AI ---------- */
function langGuide(){
  return state.lang === 'mm'
    ? '\n\nOUTPUT LANGUAGE RULE: Write explanations, headings, table notes, and guidance in natural Burmese (မြန်မာဘာသာ). Keep canonical IDs (LOC-XXXX, MAKEUP-XXX, MODEL-XXX), prompt section headers, and the copy-ready FINAL MASTER PROMPT + TASK-SPECIFIC NEGATIVE PROMPT strictly in English.'
    : '\n\nOUTPUT LANGUAGE RULE: Respond in clear English.';
}

/* ---------- Gemini API ---------- */
function currentImagesSig(){
  return slotImages().map(x=>x.id).join(',');
}
function buildUserPartsWithFreshImages(text){
  const sig = currentImagesSig();
  const parts = [];
  if(sig && sig !== state.imagesSentSig){
    slotImages().forEach(it => parts.push(imgPart(it)));
  }
  parts.push({text});
  return {parts, sig};
}

async function gemini(userParts, systemText, opts={}){
  const {jsonMode=false, saveHistory=true, imagesSig=null} = opts;
  if(!state.apiKey) throw new Error('need_key');
  state.abortCtrl = new AbortController();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${state.model}:generateContent`;
  const contents = saveHistory
    ? [...state.history, {role:'user', parts:userParts}]
    : [{role:'user', parts:userParts}];
  const body = {
    systemInstruction:{parts:[{text:systemText + (jsonMode ? '' : langGuide())}]},
    contents,
    generationConfig:{temperature:0.6, maxOutputTokens:8192}
  };
  if(jsonMode) body.generationConfig.responseMimeType = 'application/json';
  const r = await fetch(url,{method:'POST',
    signal: state.abortCtrl.signal,
    headers:{'Content-Type':'application/json','x-goog-api-key':state.apiKey},
    body:JSON.stringify(body)});
  if(!r.ok){ const e = await r.text().catch(()=> ''); throw new Error('api_'+r.status+': '+e.slice(0,200)); }
  const j = await r.json();
  const txt = j?.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('') || '';
  if(!txt) throw new Error('empty');
  if(saveHistory){
    state.history.push({role:'user', parts:userParts}, {role:'model', parts:[{text:txt}]});
    if(state.history.length > 16) state.history = state.history.slice(-16);
    if(imagesSig !== null) state.imagesSentSig = imagesSig;
  }
  return txt;
}

const SYS = () => K().SHORT || '';
const sysFor = (...keys) => [SYS(), ...keys.map(k=>{
  if(k==='LOCA'||k==='LOCB'||k==='LOCC') return compactLocText(K()[k]);
  return K()[k] || '';
})].filter(Boolean).join('\n\n');

/* Flatten slots → numbered images, in slot order */
function slotImages(){
  const out = []; let n = 0;
  SLOT_DEFS.forEach(def=>{
    state.refSlots[def.key].forEach(it=>{ n++; out.push({...it, slot:def.key, n}); });
  });
  return out;
}
const imgPart = it => ({inlineData:{mimeType:it.mime, data:it.dataUrl.split(',')[1]}});
const totalImages = () => SLOT_DEFS.reduce((a,d)=>a+state.refSlots[d.key].length, 0);
function slotDesc(){
  const imgs = slotImages();
  const lines = ['REFERENCE SLOTS — roles are authoritative (the user placed each image deliberately):'];
  SLOT_DEFS.forEach(def=>{
    const items = state.refSlots[def.key];
    lines.push(`- ${def.key.toUpperCase()}: ` + (items.length
      ? items.map(it=>`Image ${imgs.find(x=>x.id===it.id)?.n ?? '?'}`).join(', ')
      : 'none'));
  });
  if(state.selections.loc || state.selections.mk){
    lines.push('CURRENT USER SELECTIONS:');
    if(state.selections.loc) lines.push(`- Selected Location: ${state.selections.loc.id || ''} ${state.selections.loc.name || ''}`);
    if(state.selections.mk) lines.push(`- Selected Makeup: ${state.selections.mk.id || ''} ${state.selections.mk.name || ''}`);
  }
  return lines.join('\n');
}

/* ---------- Markdown-lite renderer ---------- */
function esc(s){ return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function deEnt(s){ return String(s ?? '').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'"); }
function renderMD(src){
  src = deEnt(src);
  let h = esc(src);
  const codes = {};
  h = h.replace(/```([\w-]*)\r?\n([\s\S]*?)```/g, (m,lang,code)=>{
    const id = 'cb'+Math.random().toString(36).slice(2,8);
    codes[id]=code; return `\x00${id}\x00`;
  });
  h = h.replace(/^(\|.+\|\r?\n\|[\s:|-]+\|\r?\n(?:\|.+\|\r?\n?)+)/gm, m=>{
    const rows = m.trim().split(/\r?\n/).map(r=>r.trim().replace(/^\||\|$/g,'').split('|').map(c=>c.trim()));
    rows.splice(1,1);
    return '\x00TABLE:'+encodeURIComponent(JSON.stringify(rows))+'\x00';
  });
  h = h.replace(/\x00TABLE:([^\x00]+)\x00/g,(m,d)=>{
    const rows = JSON.parse(decodeURIComponent(d));
    return '<table>'+rows.map((r,i)=>'<tr>'+r.map(c=>`<${i?'td':'th'}>${c}</${i?'td':'th'}>`).join('')+'</tr>').join('')+'</table>';
  });
  h = h.replace(/\x00(cb\w+)\x00/g,(m,id)=>`<pre><button class="copy-btn" data-copy="${id}">⧉ ${esc(t('copied').replace(' ✓',''))}</button><code>${codes[id]}</code></pre>`);
  h = h.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/^### (.+)$/gm,'<h4>$1</h4>')
       .replace(/^## (.+)$/gm,'<h3>$1</h3>').replace(/\r?\n/g,'<br>');
  return h;
}
document.addEventListener('click',e=>{
  const b = e.target.closest('[data-copy]'); if(!b) return;
  const code = b.parentElement.querySelector('code').innerText;
  navigator.clipboard.writeText(code).then(()=>{b.textContent=t('copied'); setTimeout(()=>b.textContent='⧉ '+t('copied').replace(' ✓',''),1500);});
});

/* ---------- Chat UI ---------- */
function addMsg(role, html, images=[]){
  const d = document.createElement('div');
  d.className = 'msg '+role;
  if(images.length) d.innerHTML = images.map(s=>`<img class="thumb" src="${s}">`).join('') + html;
  else d.innerHTML = html;
  $('thread').appendChild(d);
  $('thread').scrollTop = $('thread').scrollHeight;
  return d;
}
function typing(){ untyping(); const d=document.createElement('div'); d.className='msg assistant typing'; d.id='typing';
  d.innerHTML='<span></span><span></span><span></span>'; $('thread').appendChild(d);
  $('thread').scrollTop=$('thread').scrollHeight; }
function untyping(){ const el=$('typing'); if(el) el.remove(); }

async function send(text, sysKeys=['CHAR','ADAPT','PR','FILT']){
  if(state.busy) return;
  if(!state.apiKey){ addMsg('assistant', esc(t('need_key'))); openSettings(); return; }
  const imgs = slotImages();
  const sig = currentImagesSig();
  const imagesChanged = sig && sig !== state.imagesSentSig;
  const thumbs = imagesChanged ? imgs.map(r=>r.dataUrl) : [];
  if(text) addMsg('user', esc(text), thumbs);
  else if(thumbs.length) addMsg('user','',thumbs);
  else return;
  state.busy = true; typing();
  try{
    const fullText = (text ? text + '\n\n' : '') + slotDesc();
    const {parts} = buildUserPartsWithFreshImages(fullText);
    const reply = await gemini(parts, sysFor(...sysKeys), {saveHistory:true, imagesSig:sig});
    untyping(); addMsg('assistant', renderMD(reply));
    setStage('analyze', true);
  }catch(err){
    untyping();
    if(err.name === 'AbortError'){ state.busy = false; return; }
    if(err.message==='need_key'){ addMsg('assistant', esc(t('need_key'))); }
    else addMsg('assistant', esc(t('err'))+' <span class="tiny muted">'+esc(friendlyErr(err.message))+'</span>');
  }
  state.busy = false;
}

/* ---------- Friendly error mapping ---------- */
function friendlyErr(reason){
  if(/quota|429|RESOURCE_EXHAUSTED/i.test(reason))
    return state.lang==='mm'
      ? '⏳ Quota ပြည့်သွားပြီ — မိနစ်အနည်းငယ် စောင့်ပြီး ပြန်စမ်းပါ။ Test ကို ဆက်တိုက် မနှိပ်ပါနဲ့ (နှိပ်တိုင်းလည်း quota ကုန်တယ်)။'
      : '⏳ Quota exceeded — wait a few minutes and retry. Avoid repeated Test clicks (each one also uses quota).';
  if(/denied access/i.test(reason))
    return state.lang==='mm'
      ? '🚫 ဒီ project ကို Google က block ထားတယ် — Google account တခြားတစ်ခုနဲ့ key အသစ် ထုတ်ပါ။'
      : '🚫 This project is blocked by Google — create a key from a different Google account.';
  if(/API key not valid|API_KEY_INVALID/i.test(reason))
    return state.lang==='mm'
      ? '🔑 Key မမှန်ဘူး — copy လွဲမလွဲ ပြန်စစ်ပါ။'
      : '🔑 API key not valid — check for copy mistakes.';
  return reason;
}

/* ---------- Proposal cards ---------- */
function renderCards(kind, items){
  const wrap = document.createElement('div'); wrap.className='cards';
  items.forEach((it,i)=>{
    const c = document.createElement('div'); c.className='pcard';
    c.innerHTML = `<span class="pid">${esc(it.id||('#'+(i+1)))}</span><h4>${esc(it.name||'')}</h4><p>${esc(it.reason||it.desc||'')}</p>`;
    c.onclick = ()=>{
      wrap.querySelectorAll('.pcard').forEach(x=>x.classList.remove('selected'));
      c.classList.add('selected');
      if(kind==='loc'){ state.selections.loc = it; $('selLoc').textContent = `${it.id||''} ${it.name||''}`.trim(); }
      else { state.selections.mk = it; $('selMk').textContent = `${it.id||''} ${it.name||''}`.trim(); }
      addMsg('user', `✅ ${esc(it.id||it.name)} ${it.id && it.name ? '— '+esc(it.name) : ''}`);
      addMsg('assistant', esc(kind==='loc'?t('selected_loc'):t('selected_mk'))+': <b>'+esc((it.id?it.id+' ':'')+(it.name||''))+'</b>');
      maybeShowBuildCta();
    };
    wrap.appendChild(c);
  });
  const d = document.createElement('div'); d.className='msg assistant';
  d.innerHTML = `<div>${esc(t('tap_select'))}</div>`; d.appendChild(wrap);
  $('thread').appendChild(d); $('thread').scrollTop=$('thread').scrollHeight;
}
function maybeShowBuildCta(){
  if(!state.selections.loc || !state.selections.mk) return;
  document.querySelectorAll('.build-cta-msg').forEach(el=>el.remove());
  state.ctaShown = true;
  const d = document.createElement('div'); d.className='msg assistant build-cta-msg';
  d.innerHTML = `<div>${esc(t('both_selected'))}</div><div class="cta-row"><button class="cta-btn">${esc(t('build_now'))}</button></div>`;
  d.querySelector('.cta-btn').onclick = runBuild;
  $('thread').appendChild(d); $('thread').scrollTop=$('thread').scrollHeight;
}
function tryParseJSON(txt){
  try{
    const p = JSON.parse(txt);
    if(Array.isArray(p)) return p;
    if(p && typeof p === 'object'){
      for(const v of Object.values(p)) if(Array.isArray(v)) return v;
    }
  }catch(e){}
  try{ const m = txt.match(/\[[\s\S]*\]/); return m ? JSON.parse(m[0]) : null; }catch(e){ return null; }
}

/* ---------- Workflow steps ---------- */
function setStage(name, done=false){
  document.querySelectorAll('#stepper .step').forEach(s=>{
    const active = s.dataset.stage===name;
    s.classList.toggle('active', active);
    if(done) s.classList.add('done');
  });
}

async function runAnalyze(){
  if(state.busy) return false;
  if(!state.apiKey){ addMsg('assistant', esc(t('need_key'))); openSettings(); return false; }
  if(totalImages()===0){ addMsg('assistant', esc(t('need_images'))); openSidebar(); return false; }
  const imgs = slotImages();
  const sig = currentImagesSig();
  if(sig !== state.imagesSentSig) addMsg('user', '🔍 ' + esc(state.lang==='mm'?'ပုံများကို စစ်ဆေး + Layer Map ဆွဲပါ':'Analyze references & build Layer Map'), imgs.map(r=>r.dataUrl));
  state.busy = true; typing(); setStage('analyze');
  try{
    const prompt = `${slotDesc()}\n\nTask: Produce the full Layer Map for these references (follow ADAPT & CHAR firewall rules):\n1. Per-image classification table (Image # | Slot Role | Authorized Layer(s) | Visible Evidence | Confidence/Status).\n2. Layer cards: ACTIVE MODEL(S) & IDENTITY, GARMENT/STYLING, POSE GEOMETRY, ENVIRONMENT/FURNITURE, CAMERA/LIGHTING.\n3. Cross-reference conflict resolution (mark OBSERVED / USER-SPECIFIED / INFERRED / UNRESOLVED).\nDo NOT propose locations or makeup yet. End by noting readiness for location & makeup proposals.`;
    const {parts} = buildUserPartsWithFreshImages(prompt);
    const reply = await gemini(parts, sysFor('CHAR','ADAPT'), {saveHistory:true, imagesSig:sig});
    untyping(); addMsg('assistant', renderMD(reply));
    setStage('analyze', true);
    state.busy = false;
    return true;
  }catch(err){
    untyping();
    state.busy = false;
    if(err.name === 'AbortError') return false;
    addMsg('assistant', esc(t('err'))+' <span class="tiny muted">'+esc(friendlyErr(err.message))+'</span>');
    return false;
  }
}

async function runPropose(mode='both'){
  if(state.busy) return false;
  if(!state.apiKey){ addMsg('assistant', esc(t('need_key'))); openSettings(); return false; }
  if(totalImages()===0){ addMsg('assistant', esc(t('need_images'))); openSidebar(); return false; }
  state.busy = true; typing(); setStage('propose');
  try{
    const sig = currentImagesSig();
    const partsBase = buildUserPartsWithFreshImages('').parts.slice(0, -1); // fresh images only if not yet in history
    const priorContext = state.history.length
      ? '\n\nUse the prior reference analysis in our conversation alongside the uploaded images.'
      : '';
    const reasonLang = state.lang==='mm' ? 'short Burmese explanation (outfit-fit + pose-fit)' : 'outfit-fit + pose-fit in one concise line';
    const locPrompt = `${K().LOCR || ''}\n\n${slotDesc()}${priorContext}\n\nTask: Propose exactly 10 genuine entries from the Location Knowledge library that best fit this outfit, pose, and active model(s). Preserve exact Canonical ID (LOC-XXXX) and exact Location Name. Return ONLY a JSON array: [{"id":"LOC-0001","name":"Exact Location Name","reason":"${reasonLang}"}].`;
    const mkPrompt = `${slotDesc()}${priorContext}\n\nTask: Propose exactly 5 distinct outfit-compatible makeup looks from MAKEUP KNOWLEDGE UNITS (MAKEUP-001..028) for the active model(s) requiring makeup. Preserve exact ID and Name. Return ONLY a JSON array: [{"id":"MAKEUP-001","name":"Exact Look Name","reason":"${state.lang==='mm'?'short Burmese explanation':'one concise line'}"}].`;

    const calls = [];
    if(mode==='both' || mode==='loc') calls.push(gemini([...partsBase, {text:locPrompt}], sysFor('CHAR','LOCA','LOCB','LOCC'), {jsonMode:true, saveHistory:false}).then(r=>({k:'loc',r})));
    if(mode==='both' || mode==='mk')  calls.push(gemini([...partsBase, {text:mkPrompt}],  sysFor('CHAR','MK'), {jsonMode:true, saveHistory:false}).then(r=>({k:'mk',r})));

    const res = await Promise.all(calls);
    untyping();
    const summary = [];
    res.forEach(({k, r})=>{
      const parsed = tryParseJSON(r);
      if(parsed){
        renderCards(k, parsed);
        summary.push(`${k==='loc'?'Proposed Locations':'Proposed Makeup'}: ` + parsed.map(x=>`${x.id} ${x.name}`).join('; '));
      } else {
        addMsg('assistant', renderMD(r));
        summary.push(r.slice(0,800));
      }
    });
    if(summary.length){
      if(partsBase.length) state.imagesSentSig = sig;
      state.history.push(
        {role:'user', parts:[...partsBase, {text:`Propose compatible ${mode} options for:\n${slotDesc()}`}]},
        {role:'model', parts:[{text:summary.join('\n')}]}
      );
      if(state.history.length > 16) state.history = state.history.slice(-16);
    }
    setStage('propose', true);
    state.busy = false;
    return true;
  }catch(err){
    untyping();
    state.busy = false;
    if(err.name === 'AbortError') return false;
    addMsg('assistant', esc(t('err'))+' <span class="tiny muted">'+esc(friendlyErr(err.message))+'</span>');
    return false;
  }
}

async function runFullWorkflow(){
  const ok = await runAnalyze();
  if(ok) await runPropose('both');
}

async function runBuild(){
  if(state.busy) return;
  if(!state.apiKey){ addMsg('assistant', esc(t('need_key'))); openSettings(); return; }
  const {loc, mk} = state.selections;
  if(!loc || !mk){ addMsg('assistant', esc(t('need_both_sel'))); return; }
  state.busy = true; typing(); setStage('build');
  try{
    const sig = currentImagesSig();
    const locDetails = findLocationSnippet(loc);
    const prompt = `${K().FILT || ''}\n\n${slotDesc()}\n\nSELECTED LOCATION RECORD (AUTHORITATIVE):\n${locDetails}\n\nSELECTED MAKEUP LOOK (AUTHORITATIVE):\n- ${mk.id||''} ${mk.name||''} (${mk.reason||''})\n\nTask: Compose the complete copy-ready FINAL MASTER PROMPT using the layered template from MASTER PROMPT GENERATION RULES, followed by the TASK-SPECIFIC NEGATIVE PROMPT. Return exactly two sections, each with a single fenced text code block:\n\n## FINAL MASTER PROMPT\n(fenced code block)\n\n## TASK-SPECIFIC NEGATIVE PROMPT\n(fenced code block)\n\nCritical rules:\n- Inspect the uploaded reference images and our prior Layer Map for exact garment construction, pose geometry, and active model(s).\n- Include the verbatim BODY ANCHOR and all 12 mandatory negative terms for the active model(s) (default MODEL-001 if single female model; include MODEL-002 / MODEL-003 when active).\n- Keep identity, body, garment fidelity, pose geometry, makeup, environment/furniture, camera, and lighting separated and source-grounded.`;
    const {parts} = buildUserPartsWithFreshImages(prompt);
    const reply = await gemini(parts, sysFor('CHAR','ADAPT','LOCR','MK','PR'), {saveHistory:true, imagesSig:sig});
    untyping(); addMsg('assistant', renderMD(reply));
    setStage('build', true);
  }catch(err){
    untyping();
    if(err.name === 'AbortError'){ state.busy = false; return; }
    addMsg('assistant', esc(t('err'))+' <span class="tiny muted">'+esc(friendlyErr(err.message))+'</span>');
  }
  state.busy = false;
}

/* ---------- Reference slots ---------- */
function renderSlots(){
  const box = $('slotList'); if(!box) return; box.innerHTML='';
  SLOT_DEFS.forEach(def=>{
    const items = state.refSlots[def.key];
    const d = document.createElement('div'); d.className = 'slot'+(items.length?' filled':'');
    const head = document.createElement('div'); head.className='slot-head';
    head.innerHTML = `<span class="slot-title"><span class="em">${def.em}</span>${esc(t(def.label))}</span><span class="slot-count">${items.length}</span>`;
    const th = document.createElement('div'); th.className='slot-thumbs';
    items.forEach(it=>{
      const w = document.createElement('div'); w.className='slot-thumb';
      w.innerHTML = `<img src="${it.dataUrl}"><button class="rm" title="✕">✕</button>`;
      w.querySelector('.rm').onclick = ()=>{
        state.refSlots[def.key] = state.refSlots[def.key].filter(x=>x.id!==it.id);
        state.imagesSentSig = ''; // force re-send updated image set on next call
        renderSlots();
      };
      th.appendChild(w);
    });
    const fi = document.createElement('input');
    fi.type='file'; fi.accept='image/*'; fi.multiple=true; fi.hidden=true;
    fi.onchange = e=>{ addFilesToSlot(def.key, e.target.files); e.target.value=''; };
    const add = document.createElement('button'); add.className='slot-add'; add.textContent='+'; add.title=t('add_photo');
    add.onclick = ()=>fi.click();
    th.appendChild(add); th.appendChild(fi);
    d.appendChild(head); d.appendChild(th);
    box.appendChild(d);
  });
}
let _uid = 0;
function addFilesToSlot(slotKey, files){
  const list = [...files].filter(f=>f.type.startsWith('image/'));
  if(!list.length) return;
  Promise.all(list.map(f => new Promise(resolve=>{
    const rd = new FileReader();
    rd.onload = ()=>{
      const img = new Image();
      img.onload = ()=>{
        const c = document.createElement('canvas');
        const s = Math.min(1, 1024/Math.max(img.width,img.height));
        c.width = Math.round(img.width*s); c.height = Math.round(img.height*s);
        c.getContext('2d').drawImage(img,0,0,c.width,c.height);
        resolve({id:'r'+(++_uid)+Date.now(), dataUrl:c.toDataURL('image/jpeg',0.85), mime:'image/jpeg'});
      };
      img.onerror = ()=>resolve(null);
      img.src = rd.result;
    };
    rd.onerror = ()=>resolve(null);
    rd.readAsDataURL(f);
  }))).then(results=>{
    const valid = results.filter(Boolean);
    if(valid.length){
      state.refSlots[slotKey].push(...valid);
      state.imagesSentSig = '';
      renderSlots();
    }
  });
}

/* ---------- Chips & Command Routing ---------- */
function handleCommand(cmd, action){
  if(action === 'analyze') return runAnalyze();
  if(action === 'workflow') return runFullWorkflow();
  if(action === 'build') return runBuild();
  if(action === 'propose_loc') return runPropose('loc');
  if(action === 'propose_mk') return runPropose('mk');
  if(action === 'auto_build') return send(cmd, ['CHAR','ADAPT','LOCR','LOCA','LOCB','LOCC','MK','PR','FILT']);
  if(action === 'prefill'){
    const ta = $('msgInput');
    ta.value = cmd;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 220) + 'px';
    ta.focus();
    const s = cmd.indexOf('['), e = cmd.indexOf(']');
    if(s !== -1 && e !== -1) ta.setSelectionRange(s, e + 1);
    return;
  }
  return send(cmd);
}

function renderChips(){
  const row = $('chipsRow'); if(row) row.innerHTML='';
  const grid = $('cmdGrid'); if(grid) grid.innerHTML='';
  COMMANDS.forEach(([em,mmL,enL,cmd,action])=>{
    const label = state.lang==='mm'?mmL:enL;
    const mk = (host, cls)=>{
      const b = document.createElement('button'); b.className=cls;
      b.innerHTML = `<span class="em">${em}</span>${esc(label)}`;
      b.onclick = ()=>{
        if(window.innerWidth<=860) document.body.classList.remove('side-open');
        handleCommand(cmd, action);
      };
      host.appendChild(b);
    };
    if(row) mk(row,'cmd-chip');
    if(grid) mk(grid,'cmd-chip');
  });
}

/* ---------- Language ---------- */
function applyLang(){
  document.querySelectorAll('[data-i18n]').forEach(el=>{ el.innerHTML = esc(t(el.dataset.i18n)); });
  document.querySelectorAll('[data-i18n-ph]').forEach(el=>{ el.placeholder = t(el.dataset.i18nPh); });
  $('langSelect').value = state.lang;
  const ts = $('themeSelect');
  if(ts){
    ts.options[0].textContent = t('theme_day');
    ts.options[1].textContent = t('theme_night');
    ts.options[2].textContent = t('theme_system');
    ts.value = state.theme;
  }
  renderChips(); renderSlots();
}

/* ---------- Theme (Day / Night / System) ---------- */
function applyTheme(){
  let eff = state.theme;
  if(eff==='system' && window.matchMedia){
    eff = window.matchMedia('(prefers-color-scheme: light)').matches ? 'day' : 'night';
  }
  document.body.dataset.theme = eff;
  const ts = $('themeSelect'); if(ts) ts.value = state.theme;
}

/* ---------- Sidebar open/close ---------- */
function openSidebar(){
  if(window.innerWidth<=860) document.body.classList.add('side-open');
  else document.body.classList.remove('side-collapsed');
}
function toggleSidebar(){
  if(window.innerWidth<=860) document.body.classList.toggle('side-open');
  else document.body.classList.toggle('side-collapsed');
}

/* ---------- Settings ---------- */
function openSettings(){
  $('apiKeyInput').value = state.apiKey || '';
  const sel = $('modelSelect');
  if(![...sel.options].some(o=>o.value===state.model)){
    const o = document.createElement('option'); o.value=state.model; o.textContent=state.model; sel.appendChild(o);
  }
  sel.value = state.model;
  $('themeSelect').value = state.theme;
  $('settingsModal').classList.remove('hidden');
  if(state.apiKey) loadModels();
}
function closeSettings(){
  state.apiKey = $('apiKeyInput').value.trim();
  store.set('prompture_api_key', state.apiKey);
  state.model = $('modelSelect').value;
  store.set('prompture_model', state.model);
  $('settingsModal').classList.add('hidden');
}
async function testKey(){
  const btn = $('testKeyBtn');
  if(btn.disabled) return;
  btn.disabled = true;
  try{
    const k = $('apiKeyInput').value.trim();
    if(!k){ $('keyStatus').textContent = t('need_key'); return; }
    $('keyStatus').textContent = '…';
    try{
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${state.model}:generateContent`;
      const r = await fetch(url,{method:'POST',
        headers:{'Content-Type':'application/json','x-goog-api-key':k},
        body:JSON.stringify({contents:[{parts:[{text:'Reply with exactly: OK'}]}]})});
      if(r.ok){
        $('keyStatus').textContent = t('key_ok');
        state.apiKey=k; store.set('prompture_api_key',k);
        loadModels();
      } else {
        const ej = await r.json().catch(()=>null);
        const reason = ej?.error?.message || ('HTTP '+r.status);
        const f = friendlyErr(reason);
        $('keyStatus').textContent = (f===reason) ? t('key_bad')+' — '+reason.slice(0,140) : f;
      }
    }catch(e){ $('keyStatus').textContent = t('key_bad') + ' — ' + String(e.message||e).slice(0,120); }
  }finally{ btn.disabled = false; }
}
async function loadModels(){
  const k = state.apiKey || $('apiKeyInput').value.trim();
  if(!k) return;
  try{
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models',{
      headers:{'x-goog-api-key':k}});
    if(!r.ok) return;
    const j = await r.json();
    const names = (j.models||[])
      .filter(m=>(m.supportedGenerationMethods||[]).includes('generateContent'))
      .map(m=>m.name.replace('models/',''));
    const usable = names.filter(n=>VALID_MODELS.includes(n) || /^gemini-(3|4)/.test(n));
    if(!usable.length) return;
    const sel = $('modelSelect'); sel.innerHTML='';
    usable.forEach(n=>{ const o=document.createElement('option'); o.value=n; o.textContent=n; sel.appendChild(o); });
    if(usable.includes(state.model)) sel.value = state.model;
    else { state.model = usable[0]; sel.value = state.model; store.set('prompture_model', state.model); }
  }catch(e){ /* keep static options */ }
}

/* ---------- Onboarding / greet ---------- */
function greet(){
  addMsg('assistant', state.lang==='mm'
    ? 'မင်္ဂလာပါ! 🌸 <b>PROMPTURE</b> မှ ကြိုဆိုပါတယ်။<br>Sidebar က <b>Slot</b> တွေမှာ Model / Outfit / Pose ပုံတွေ ခွဲတင်ပြီး <b>🚀</b> ကို နှိပ်လိုက်ပါ။'
    : 'Welcome to <b>PROMPTURE</b> 🌸<br>Place Model / Outfit / Pose photos into the sidebar <b>slots</b>, then tap <b>🚀</b>.');
}

function resetInFlight(){
  if(state.abortCtrl){ state.abortCtrl.abort(); state.abortCtrl = null; }
  state.busy = false;
  untyping();
}

/* ---------- Init ---------- */
function init(){
  window.__prompture_booted = true;
  $('menuBtn').onclick = toggleSidebar;
  $('sideScrim').onclick = ()=>document.body.classList.remove('side-open');
  $('attachBtn').onclick = openSidebar;
  $('sendBtn').onclick = ()=>{ const v=$('msgInput').value.trim(); $('msgInput').value=''; $('msgInput').style.height='auto'; send(v); };
  const ta = $('msgInput');
  ta.addEventListener('input', ()=>{ ta.style.height='auto'; ta.style.height=Math.min(ta.scrollHeight,220)+'px'; });
  ta.addEventListener('keydown', e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); $('sendBtn').click(); } });
  $('langSelect').onchange = e=>{ state.lang = e.target.value; store.set('prompture_lang',state.lang); applyLang(); };
  $('themeSelect').onchange = e=>{ state.theme = e.target.value; store.set('prompture_theme',state.theme); applyTheme(); };
  if(window.matchMedia){
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', ()=>{ if(state.theme==='system') applyTheme(); });
  }
  $('settingsBtn').onclick = openSettings;
  $('closeSettingsBtn').onclick = closeSettings;
  $('settingsModal').addEventListener('click', e=>{ if(e.target===$('settingsModal')) closeSettings(); });
  document.addEventListener('keydown', e=>{ if(e.key==='Escape' && !$('settingsModal').classList.contains('hidden')) closeSettings(); });
  $('showKeyBtn').onclick = ()=>{ const i=$('apiKeyInput'); i.type = i.type==='password'?'text':'password'; };
  $('testKeyBtn').onclick = testKey;
  $('modelSelect').onchange = e=>{ state.model=e.target.value; store.set('prompture_model',state.model); };
  $('clearChatBtn').onclick = ()=>{
    resetInFlight();
    state.history = []; state.imagesSentSig = ''; state.ctaShown = false;
    $('thread').innerHTML=''; greet();
  };
  $('newSessionBtn').onclick = ()=>{
    resetInFlight();
    SLOT_DEFS.forEach(d=>state.refSlots[d.key]=[]);
    state.selections={loc:null,mk:null}; state.history=[]; state.imagesSentSig=''; state.ctaShown=false;
    $('selLoc').textContent='—'; $('selMk').textContent='—';
    $('thread').innerHTML=''; renderSlots(); setStage('upload'); greet();
    document.body.classList.remove('side-open');
  };
  document.querySelectorAll('#stepper .step').forEach(s=>{
    s.onclick = ()=>{
      const st = s.dataset.stage;
      if(st==='upload') openSidebar();
      else if(st==='analyze') runAnalyze();
      else if(st==='propose') runPropose('both');
      else if(st==='build') runBuild();
    };
  });
  applyLang();
  applyTheme();
  if(window.innerWidth<=860) document.body.classList.remove('side-open');
  if(!store.get('prompture_seen')){
    const steps = [t('step1'), t('step2'), t('step3')];
    $('onboardSteps').innerHTML = steps.map(s=>`<li>${esc(s)}</li>`).join('');
    $('onboard').classList.remove('hidden');
    $('onboardGo').onclick = ()=>{ $('onboard').classList.add('hidden'); store.set('prompture_seen','1'); greet(); };
  } else greet();
}
document.addEventListener('DOMContentLoaded', init);