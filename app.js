/* PROMPTURE Web App v2.1 — Noir Couture & Rose-Champagne Atelier
   Includes: AQ/AIza key validation + full model discovery + 503 high-demand handling,
   2x3 Moodboard, Model 001/002/003 Switcher, 5 Primary Pills + Atelier Tools Popover,
   Couture Spec Sheet Prompt Cards, Indoor/Private Location Matching + Variety Shuffle, Verbatim BODY ANCHOR */
'use strict';

/* Crash-safe storage: falls back to memory if browser blocks localStorage */
const store = {
  _m: {},
  get(k){ try{ return localStorage.getItem(k); }catch(e){ return (k in this._m) ? this._m[k] : null; } },
  set(k,v){ try{ localStorage.setItem(k,v); }catch(e){ this._m[k]=v; } }
};
const VALID_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.6-flash',
  'gemini-4-hydrogen',
  'gemini-4-argon',
  'gemini-4-carbon',
  'gemini-3.1-pro-preview',
  'gemini-2.5-flash',
  'gemini-2.5-pro'
];

/* Canonical verbatim Body Anchors extracted from knowledge.js (SHORT + CHAR) */
const BODY_ANCHORS = {
  'MODEL-001': 'MODEL-001: 35-year-old Myanmar woman, height 5\'2" / 157 cm, weight 146 lbs / 66.2 kg, bust 39 in / 99.1 cm, waist 27 in / 68.6 cm, hips 44 in / 111.8 cm, shoe size US 7 / EU 37, plus-size curvy hyper-hourglass/pear physique, very narrow clearly defined waist, substantial natural hip/thigh/bust fullness, compact naturally proportioned torso. Preserve this exact body — do NOT slim, thin, elongate, or idealize; keep natural hip/thigh/bust fullness; garments drape naturally on THIS exact body.',
  'MODEL-002': 'MODEL-002: approximately 68-year-old Shan Myanmar gentleman, height 5\'8" / approximately 173 cm, weight 170 lb / approximately 77 kg, mature-athletic solid masculine physique with broad structurally strong shoulders, substantial upper torso, firm mature chest, mild mature abdominal fullness, strong thighs and sturdy calves, predominantly silver-gray neatly groomed contemporary executive hair, clean-shaven (no beard or mustache), natural moderate aging without frailty, strictly tattoo-free. Do NOT slim, bulk, de-age, or make frail.',
  'MODEL-003': 'MODEL-003: 28-year-old Myanmar male fashion model, height 5\'11" / 180 cm, weight 165 lb / 75 kg, lean athletic-muscular physique, chest 42 in / 107 cm, shoulders 49 in / 124 cm, arm length 25.5 in / 65 cm, bicep 15 in / 38 cm, waist 31 in / 79 cm, abdomen (navel) 33 in / 84 cm, hips 38 in / 97 cm, thigh 22 in / 56 cm, calf 15 in / 38 cm, inseam 34 in / 86 cm, shoe size US 10 / EU 44, broad shoulders, lean waist, clean fashion-editorial lines, Controlled Athletic Energy; tattoo layer inactive unless explicitly authorized.'
};
const MANDATORY_NEGATIVES = 'thin, thin body, slimmed, slimming, skinny, elongated body, model-thin, narrow hips, flat hips, wasp waist, idealized proportions, body slimming';

/* ---------- Delicate 1.4px SVG Line Icons ---------- */
const ICONS = {
  model: '<svg viewBox="0 0 24 24" class="svg-ico xs"><circle cx="12" cy="7.5" r="3.5"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/></svg>',
  outfit: '<svg viewBox="0 0 24 24" class="svg-ico xs"><path d="M12 6a2 2 0 1 0-2-2c0 1.5 2 2 2 2zm0 0l8 5.5H4L12 6z"/><path d="M7 11.5V19h10v-7.5"/></svg>',
  pose: '<svg viewBox="0 0 24 24" class="svg-ico xs"><circle cx="12" cy="4.5" r="2"/><path d="M12 7v6m0-4l-4.5 2.5M12 9l4.5-2M12 13l-3 7m3-7l3 7"/></svg>',
  makeup: '<svg viewBox="0 0 24 24" class="svg-ico xs"><path d="M9 20h6v-6H9v6zm1-6V9l4-3v8"/><path d="M7 20h10"/></svg>',
  location: '<svg viewBox="0 0 24 24" class="svg-ico xs"><path d="M12 21s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11z"/><circle cx="12" cy="10" r="2"/></svg>',
  furniture: '<svg viewBox="0 0 24 24" class="svg-ico xs"><path d="M5 12V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5"/><path d="M3 13a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4H3v-4zm2 4v3m14-3v3"/></svg>',
  spark: '<svg viewBox="0 0 24 24" class="svg-ico xs"><path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z"/></svg>',
  search: '<svg viewBox="0 0 24 24" class="svg-ico xs"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>',
  check: '<svg viewBox="0 0 24 24" class="svg-ico xs"><path d="M5 12.5l4.5 4.5L19 7"/></svg>',
  sun: '<svg viewBox="0 0 24 24" class="svg-ico xs"><circle cx="12" cy="12" r="4"/><path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4"/></svg>',
  frame: '<svg viewBox="0 0 24 24" class="svg-ico xs"><path d="M4 9V5h4M16 5h4v4M20 15v4h-4M8 19H4v-4"/></svg>',
  edit: '<svg viewBox="0 0 24 24" class="svg-ico xs"><path d="M4 20h4l10-10-4-4L4 16v4z"/></svg>',
  shield: '<svg viewBox="0 0 24 24" class="svg-ico xs"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/></svg>',
  copy: '<svg viewBox="0 0 24 24" class="svg-ico xs"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  layers: '<svg viewBox="0 0 24 24" class="svg-ico xs"><path d="M12 3l9 4.5-9 4.5-9-4.5L12 3z"/><path d="M3 12l9 4.5 9-4.5M3 16.5l9 4.5 9-4.5"/></svg>'
};

/* ---------- Bilingual UI strings ---------- */
const STR = {
  subtitle:{mm:'ဖက်ရှင် Prompt အလုပ်ရုံ',en:"Maison d'Éditorial"},
  st_upload:{mm:'ပုံတင်',en:'Upload'}, st_analyze:{mm:'စစ်ဆေး',en:'Analyze'},
  st_propose:{mm:'အကြံပြု',en:'Curate'}, st_build:{mm:'ဆောက်',en:'Compose'},
  active_models:{mm:'Active Models',en:'Active Models'},
  refs:{mm:'Moodboard ပုံများ',en:'Moodboard'},
  refs_hint:{mm:'အမျိုးအစားအလိုက် ခွဲတင်ပါ',en:'Place references by role'},
  selection:{mm:'ရွေးချယ်မှု',en:'Curated Selection'}, sel_loc:{mm:'နေရာ:',en:'Location:'}, sel_mk:{mm:'မိတ်ကပ်:',en:'Makeup:'},
  commands:{mm:'Atelier Tools',en:'Atelier Tools'},
  tools_btn:{mm:'Atelier Tools',en:'Atelier Tools'},
  new_session:{mm:'အသစ်စ',en:'New session'}, send:{mm:'ပို့',en:'Send'},
  placeholder:{mm:'စာရိုက်ပါ (သို့) command နှိပ်ပါ…',en:'Write a note or choose a tool…'},
  settings:{mm:'ဆက်တင်',en:'Atelier Settings'}, api_key:{mm:'Gemini API key',en:'Gemini API key'},
  test_key:{mm:'Key စမ်း',en:'Test key'}, model:{mm:'Model',en:'Model'},
  language:{mm:'ဘာသာစကား',en:'Language'}, clear_chat:{mm:'Chat ရှင်း',en:'Clear thread'},
  appearance:{mm:'အသွင်အပြင်',en:'Appearance'},
  theme_day:{mm:'Day — Silk Ivory',en:'Day — Silk Ivory'},
  theme_night:{mm:'Night — Noir Couture',en:'Night — Noir Couture'},
  theme_system:{mm:'System',en:'System'},
  done:{mm:'ပြီးပြီ',en:'Done'},
  key_note:{mm:'Key က ဒီ browser ထဲမှာပဲ သိမ်းထားတယ် — Google ဆီကိုပဲ သွားတယ်။',en:'Your key stays in this browser only — sent solely to Google.'},
  start:{mm:'စမယ်',en:'Enter Atelier'},
  need_key:{mm:'စဖို့ Settings (⚙) မှာ Gemini API key ထည့်ပါ။',en:'Enter your Gemini API key in Settings to begin.'},
  key_ok:{mm:'Key အလုပ်လုပ်တယ်',en:'Key verified'}, key_bad:{mm:'Key မမှန်ဘူး — ပြန်စစ်ပါ',en:'Key invalid — please check'},
  err:{mm:'အမှားဖြစ်သွားတယ် — ပြန်ကြိုးစားပါ။',en:'Something went wrong — please retry.'},
  copy:{mm:'ကူးမည်',en:'Copy'}, copied:{mm:'ကူးပြီး',en:'Copied'},
  slot_model:{mm:'Model',en:'Model'}, slot_outfit:{mm:'အဝတ်',en:'Outfit'},
  slot_pose:{mm:'Pose',en:'Pose'}, slot_makeup:{mm:'မိတ်ကပ်',en:'Makeup'},
  slot_location:{mm:'နေရာ',en:'Location'}, slot_furniture:{mm:'ပရိဘောဂ',en:'Furniture'},
  add_photo:{mm:'ထည့်',en:'Add'},
  build_now:{mm:'အပြီးသတ် Prompt ဆောက်မယ် →',en:'Compose Final Prompt →'},
  need_images:{mm:'အရင် Moodboard slot တွေမှာ ပုံတင်ပါ။',en:'Upload reference photos into the Moodboard first.'},
  both_selected:{mm:'နေရာနဲ့ မိတ်ကပ် ရွေးပြီးပြီ — Prompt ဆောက်လို့ရပါပြီ',en:'Location & Makeup curated — ready to compose'},
  tap_select:{mm:'ရွေးချယ်ရန် ကတ်ကို နှိပ်ပါ',en:'Select a card below'},
  selected_loc:{mm:'နေရာ ရွေးပြီး',en:'Location selected'}, selected_mk:{mm:'မိတ်ကပ် ရွေးပြီး',en:'Makeup selected'},
  need_both_sel:{mm:'နေရာနဲ့ မိတ်ကပ် နှစ်ခုလုံး အရင်ရွေးပါ (သို့) 03 အကြံပြု ကို နှိပ်ပါ။',en:'Select both a location and makeup look first (or run 03 Curate).'},
  step1:{mm:'Settings မှာ Gemini API key ထည့်ပါ',en:'Add your Gemini API key in Settings'},
  step2:{mm:'Moodboard မှာ Model / Outfit / Pose ပုံတွေ တင်ပါ',en:'Place Model / Outfit / Pose photos into the Moodboard'},
  step3:{mm:'Full Atelier ကို နှိပ်ပြီး workflow စလိုက်ပါ',en:'Tap Full Atelier to begin the workflow'},
  cat_cast:{mm:'Cast & References',en:'Cast & References'},
  cat_pose:{mm:'Pose & Styling',en:'Pose & Styling'},
  cat_scene:{mm:'Scene, Light & Output',en:'Scene, Light & Output'},
  spec_master:{mm:'FINAL MASTER PROMPT',en:'FINAL MASTER PROMPT'},
  spec_neg:{mm:'TASK-SPECIFIC NEGATIVE PROMPT',en:'TASK-SPECIFIC NEGATIVE PROMPT'},
  spec_default:{mm:'ATELIER MANUSCRIPT',en:'ATELIER MANUSCRIPT'},
};

/* ---------- 5 Primary Workflow Pills (Clean Chat Action Bar) ---------- */
const PRIMARY_CMDS = [
  ['search','ပုံစစ်','Analyze','Analyze these references and show me the layer map with your per-image classification. Don\'t build the prompt yet — wait for my go.','analyze', false],
  ['spark','Full Atelier','Full Atelier','Run the full workflow: analyze, propose 10 locations and 5 makeup looks, then pause for my selection.','workflow', true],
  ['location','နေရာ ၁၀ ခု','10 Locations','Propose 10 library locations that fit this outfit and pose.','propose_loc', false],
  ['makeup','မိတ်ကပ် ၅ မျိုး','5 Makeup','Propose 5 makeup looks that match this outfit.','propose_mk', false],
  ['check','Prompt ဆောက်','Compose','I select the location and makeup I tapped above. Build the final prompt now.','build', false],
];

/* ---------- Categorized Atelier Tools (Sidebar + Popover) ---------- */
const TOOL_GROUPS = [
  { key:'cat_cast', items:[
    ['spark','Auto-Curate & Build','Auto-Curate','Choose the best location and makeup from the libraries yourself based on the evidence (strictly matching indoor/private vs outdoor suitability) — mark them as SELECTED BY DELEGATION, and build the full detailed FINAL MASTER PROMPT (with verbatim BODY ANCHOR) and TASK-SPECIFIC NEGATIVE PROMPT now.','auto_build'],
    ['location','တင်ထားပုံ = နေရာ','Img as Location','Use the uploaded LOCATION slot image as the location reference. Don\'t propose library alternatives — analyze it and build the scene from it.'],
    ['makeup','တင်ထားပုံ = မိတ်ကပ်','Img as Makeup','Use the uploaded MAKEUP slot image as the makeup reference for the active model.'],
    ['furniture','ပရိဘောဂ ထည့်','Add Furniture','Include the furniture piece from the FURNITURE slot in the scene exactly as analyzed — type, style, materials and scale.'],
  ]},
  { key:'cat_pose', items:[
    ['pose','Pose ပဲလဲ','Pose Only','Change ONLY the pose to [describe new pose, e.g., seated gracefully on sofa edge, torso angled 3/4, looking toward camera]. Keep model identity, verbatim BODY ANCHOR measurements, outfit, makeup, location, camera and lighting identical, and return the full detailed FINAL MASTER PROMPT and TASK-SPECIFIC NEGATIVE PROMPT.','prefill'],
    ['spark','Pose ၅ မျိုး အကြံပြု','5 Pose Ideas','Suggest 5 distinct editorial poses that fit the active model(s), this exact outfit, and the selected environment while preserving natural body proportions and safe physical contact. Wait for my choice before rebuilding.'],
    ['outfit','အဝတ်ပဲလဲ','Outfit Only','Change ONLY the outfit to [describe new outfit]. Keep model identity, verbatim BODY ANCHOR measurements, pose, makeup, location, camera and lighting identical, and return the full updated prompt.','prefill'],
    ['edit','မိတ်ကပ်ပဲလဲ','Makeup Only','Change ONLY the makeup to [look name]. Do not touch facial identity or BODY ANCHOR proportions, and return the full updated prompt.','prefill'],
  ]},
  { key:'cat_scene', items:[
    ['location','နေရာပဲလဲ','Location Only','Change ONLY the location to [ID or name]. Re-check pose contact and lighting coherence with the new environment, keep verbatim BODY ANCHOR measurements, and return the full updated prompt.','prefill'],
    ['sun','အလင်းပြန်ပြင်','Re-light','Keep everything, but re-light the scene: soft golden-hour glow through windows, gentle rim light on hair. Return the updated full detailed FINAL MASTER PROMPT (with verbatim BODY ANCHOR) and TASK-SPECIFIC NEGATIVE PROMPT.'],
    ['frame','ဘောင်ပြန်ချိန်','Reframe','Reframe as a full-body wide shot with more environment visible. Everything else stays. Return the updated full detailed FINAL MASTER PROMPT (with verbatim BODY ANCHOR) and TASK-SPECIFIC NEGATIVE PROMPT.'],
    ['spark','Editorial Mood','Editorial Mood','Push the mood more editorial and high-fashion — stronger contrast, more attitude in the expression. Return the updated full detailed FINAL MASTER PROMPT (with verbatim BODY ANCHOR) and TASK-SPECIFIC NEGATIVE PROMPT.'],
    ['layers','Copy-Ready ထုတ်','Copy-Ready','Output the complete detailed FINAL MASTER PROMPT (with verbatim BODY ANCHOR) and TASK-SPECIFIC NEGATIVE PROMPT in two separate fenced code blocks, copy-ready, with no analysis inside.'],
    ['shield','Negative ခိုင်မာအောင်','Strengthen Neg','Strengthen the negative prompt against body-proportion drift, identity drift, garment drift, and anatomy errors for the active model(s), then show me the updated FINAL MASTER PROMPT and TASK-SPECIFIC NEGATIVE PROMPT blocks.'],
  ]}
];

/* ---------- Reference slots (2x3 Moodboard) ---------- */
const SLOT_DEFS = [
  {key:'model',     ico:'model',     label:'slot_model'},
  {key:'outfit',    ico:'outfit',    label:'slot_outfit'},
  {key:'pose',      ico:'pose',      label:'slot_pose'},
  {key:'makeup',    ico:'makeup',    label:'slot_makeup'},
  {key:'location',  ico:'location',  label:'slot_location'},
  {key:'furniture', ico:'furniture', label:'slot_furniture'},
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
  activeModels: ['MODEL-001'],
  lastProposedLocs: [],
  lastProposedMks: [],
  history: [],
  imagesSentSig: '',
  busy: false,
  ctaShown: false,
  abortCtrl: null,
};
const t = k => (STR[k] && STR[k][state.lang]) || k;
const $ = id => document.getElementById(id);
const K = () => window.PROMPTURE_KNOWLEDGE || {};
const SPEC_RAW = new Map();

/* ---------- Knowledge Parser, Setting Tagging & Shuffle ---------- */
let _parsedLocsCache = null;
function compactLocText(raw){
  if(!raw) return '';
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/<details>[\s\S]*?<\/details>/g, '')
    .replace(/^- Source reference:.*$/gm, '')
    .replace(/^- Data status:.*$/gm, '')
    .replace(/^LOCATION & ENVIRONMENT KNOWLEDGE.*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
function getParsedLocations(){
  if(_parsedLocsCache) return _parsedLocsCache;
  const k = K();
  const combined = [compactLocText(k.LOCA), compactLocText(k.LOCB), compactLocText(k.LOCC)]
    .filter(Boolean).join('\n');
  const blocks = combined.split(/\n(?=### )/);
  const list = [];
  blocks.forEach(b=>{
    if(!b.startsWith('### ') || !b.includes('Canonical ID:')) return;
    const grab = re => { const m = b.match(re); return m ? m[1].trim() : ''; };
    const name = grab(/^###\s+(.+)/);
    const id = grab(/- Canonical ID:\s*`([^`]+)`/);
    const sourceId = grab(/- Source Location ID:\s*`([^`]+)`/);
    const country = grab(/- Country:\s*(.+)/);
    const region = grab(/- Region \/ City:\s*(.+)/);
    const envType = grab(/- Environment Type:\s*(.+)/);
    const fashion = grab(/- Fashion Compatibility:\s*(.+)/);
    const pose = grab(/- Pose Compatibility:\s*(.+)/);
    const furniture = grab(/- Furniture \/ Fixtures \/ Background:\s*(.+)/);
    const elements = grab(/- Key Visual Elements:\s*(.+)/);
    const notes = grab(/- Generation Notes:\s*(.+)/);

    const hay = `${name} ${envType} ${furniture} ${elements}`.toLowerCase();
    const isIndoorRoom = /\b(living room|bedroom|dining room|dressing room|walk-in closet|study|home office|private suite|private lounge|foyer|staircase|fireplace lounge|penthouse|apartment|hotel lobby|ballroom|boutique|flagship store|beauty store|department store|shopping atrium|fashion mall|supercenter|café|cafe|restaurant|art gallery|editorial studio|workshop|monastery interior|sitting area)\b/.test(hay);
    const isPrivateRes = /\b(private|villa|residence|home|suite|bedroom|living room|dining room|dressing room|closet|study|home office|penthouse|apartment)\b/.test((name+' '+envType).toLowerCase());
    const isTerraceOrVeranda = /\b(veranda|terrace|balcony|courtyard)\b/.test(name.toLowerCase());

    let tag = 'OUTDOOR-PUBLIC';
    if(isIndoorRoom && isPrivateRes) tag = 'INDOOR-PRIVATE';
    else if(isIndoorRoom) tag = 'INDOOR-PUBLIC';
    else if(isPrivateRes && isTerraceOrVeranda) tag = 'PRIVATE-TERRACE';

    list.push({ id, sourceId, name, country, region, envType, fashion, pose, furniture, notes, tag, raw: b.trim() });
  });
  _parsedLocsCache = list;
  return list;
}
function shuffleArray(arr){
  const a = [...arr];
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function buildCompactLocationCatalog(){
  return shuffleArray(getParsedLocations()).map(l => {
    const parts = [
      `${l.id}${l.sourceId ? ' ('+l.sourceId+')' : ''} [${l.tag}]`,
      l.name,
      [l.country, l.region].filter(Boolean).join(', '),
      l.envType,
      l.fashion ? 'Fashion: ' + l.fashion : '',
      l.pose ? 'Pose: ' + l.pose : '',
      l.furniture ? 'Furn: ' + l.furniture.slice(0, 90) : ''
    ].filter(Boolean);
    return parts.join(' | ');
  }).join('\n');
}
function findLocationSnippet(loc){
  if(!loc) return '';
  const all = getParsedLocations();
  const id = (loc.id || '').trim();
  const name = (loc.name || '').trim().toLowerCase();
  const hit = all.find(l =>
    (id && (l.id === id || l.sourceId === id)) ||
    (name && l.name.toLowerCase() === name)
  );
  let matRow = '';
  if(K().MAT && hit){
    const rows = K().MAT.split('\n');
    const r = rows.find(line =>
      (hit.id && line.includes(hit.id)) ||
      (hit.sourceId && line.includes(','+hit.sourceId+',')) ||
      (hit.name && line.toLowerCase().includes(hit.name.toLowerCase()))
    );
    if(r) matRow = '\nProduction Matrix Row:\n' + r;
  }
  return (hit ? hit.raw : `${loc.id || ''} ${loc.name || ''}`) + matRow;
}

/* ---------- Body Anchor Helper ---------- */
function buildBodyAnchorInstruction(){
  const active = state.activeModels && state.activeModels.length ? state.activeModels : ['MODEL-001'];
  const blocks = active.map(m => BODY_ANCHORS[m]).filter(Boolean);
  return `MANDATORY BODY ANCHOR & NEGATIVE OVERRIDE (takes precedence over CHAR Sec 14/18):
ACTIVE MODEL(S) FOR THIS SHOOT: ${active.join(', ')}. Include ALL of the following verbatim BODY ANCHOR(S) inside the BODY ANCHOR section:
${blocks.map(b => '- ' + b).join('\n')}
Mandatory negative terms (ALL 12 MUST appear verbatim in TASK-SPECIFIC NEGATIVE PROMPT):
${MANDATORY_NEGATIVES}`;
}

function renderModelPills(){
  const box = $('modelPills'); if(!box) return;
  box.querySelectorAll('.mpill').forEach(btn=>{
    const m = btn.dataset.model;
    btn.classList.toggle('active', state.activeModels.includes(m));
  });
  const hint = $('activeModelHint');
  if(hint){
    hint.textContent = state.activeModels.map(m=>m.replace('MODEL-','')).join(' + ');
  }
}

/* ---------- Setting Suitability Hint Detector ---------- */
function detectSettingBias(){
  const historyText = state.history.map(m => m.parts.map(p => p.text || '').join(' ')).join(' ').toLowerCase();
  const hasFurn = state.refSlots.furniture.length > 0;
  const indoorHints = /\b(indoor-private|indoor_private|indoor|private residential|bedroom|living room|dining room|dressing room|nightwear|sleepwear|loungewear|lingerie|robe|pajama|silk slip|barefoot|sofa|couch|bed|armchair|desk|home office|penthouse|apartment|suite)\b/i;
  if(hasFurn || indoorHints.test(historyText)){
    return 'STRONG INDOOR / PRIVATE SETTING DETECTED (based on outfit/pose/furniture context): Prioritize [INDOOR-PRIVATE] and [PRIVATE-TERRACE] (or [INDOOR-PUBLIC] if appropriate) locations. Do NOT recommend [OUTDOOR-PUBLIC] streets, pagodas, temples, beaches, bridges, waterfalls, or markets unless truly compatible.';
  }
  return 'Inspect the uploaded Outfit + Pose + Furniture images carefully FIRST: if the outfit (e.g. nightwear, loungewear, sleepwear, homewear, delicate indoorwear, robe, silk slip) OR pose (bed, sofa, lounge chair, indoor floor, intimate sitting, mirror, desk) OR FURNITURE slot suits INDOOR/PRIVATE settings, recommend ONLY [INDOOR-PRIVATE] / [INDOOR-PUBLIC] locations and ZERO outdoor public locations.';
}

/* ---------- Language Instruction for AI ---------- */
function langGuide(){
  return state.lang === 'mm'
    ? '\n\nOUTPUT LANGUAGE RULE: Write explanations, headings, table notes, and guidance in natural Burmese (မြန်မာဘာသာ). Keep canonical IDs (LOC-XXXX, MAKEUP-XXX, MODEL-XXX), prompt section headers, and the copy-ready FINAL MASTER PROMPT + TASK-SPECIFIC NEGATIVE PROMPT strictly in English.'
    : '\n\nOUTPUT LANGUAGE RULE: Respond in clear English.';
}

/* ---------- Gemini API ---------- */
function currentImagesSig(){ return slotImages().map(x=>x.id).join(','); }
function buildUserPartsWithFreshImages(text){
  const sig = currentImagesSig();
  const parts = [];
  if(sig && sig !== state.imagesSentSig) slotImages().forEach(it => parts.push(imgPart(it)));
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
    generationConfig:{temperature:0.65, maxOutputTokens:8192}
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
  if(k==='LOCA'||k==='LOCB'||k==='LOCC') return '';
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
  lines.push(`ACTIVE MODEL SELECTION: ${state.activeModels.join(', ')}`);
  if(state.selections.loc || state.selections.mk){
    lines.push('CURRENT USER SELECTIONS:');
    if(state.selections.loc) lines.push(`- Selected Location: ${state.selections.loc.id || ''} ${state.selections.loc.name || ''}`);
    if(state.selections.mk) lines.push(`- Selected Makeup: ${state.selections.mk.id || ''} ${state.selections.mk.name || ''}`);
  }
  return lines.join('\n');
}

/* ---------- Editorial Markdown & Couture Spec Sheet Renderer ---------- */
function esc(s){ return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function deEnt(s){ return String(s ?? '').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'"); }

function formatSpecBody(escapedCode){
  return escapedCode
    .replace(/^(\d+\.\s*[A-Z][A-Z0-9\s\/&-]+:)/gm, '<span class="spec-sec">$1</span>')
    .replace(/^([A-Z][A-Z0-9\s\/&-]{3,}:)/gm, '<span class="spec-sec">$1</span>');
}

function renderMD(src){
  src = deEnt(src);
  let h = esc(src);
  const codes = {};
  h = h.replace(/```([\w-]*)\r?\n([\s\S]*?)```/g, (m,lang,code,offset)=>{
    const id = 'cb'+Math.random().toString(36).slice(2,8);
    const before = h.slice(Math.max(0, offset - 120), offset).toUpperCase();
    let title = t('spec_default');
    if(before.includes('NEGATIVE')) title = t('spec_neg');
    else if(before.includes('MASTER PROMPT') || before.includes('FINAL')) title = t('spec_master');
    codes[id] = { escaped: code.trim(), title };
    SPEC_RAW.set(id, deEnt(code.trim()));
    return `\x00${id}\x00`;
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
  h = h.replace(/\x00(cb\w+)\x00/g,(m,id)=>{
    const {escaped, title} = codes[id];
    return `<div class="spec-card"><div class="spec-head"><span class="spec-title">${esc(title)}</span><button class="copy-btn" data-copy="${id}">${ICONS.copy} <span>${esc(t('copy'))}</span></button></div><div class="spec-body">${formatSpecBody(escaped)}</div></div>`;
  });
  h = h.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/^### (.+)$/gm,'<h4>$1</h4>')
       .replace(/^## (.+)$/gm,'<h3>$1</h3>').replace(/\r?\n/g,'<br>');
  return h;
}
document.addEventListener('click',e=>{
  const b = e.target.closest('[data-copy]'); if(!b) return;
  const id = b.dataset.copy;
  const raw = SPEC_RAW.get(id) ?? b.closest('.spec-card')?.querySelector('.spec-body')?.innerText ?? '';
  navigator.clipboard.writeText(raw).then(()=>{
    const lbl = b.querySelector('span');
    if(lbl){ lbl.textContent = t('copied'); setTimeout(()=>{ lbl.textContent = t('copy'); }, 1500); }
  });
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

async function send(text, sysKeys=['CHAR','ADAPT','PR','FILT'], extraSys=''){
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
    const fullText = (text ? text + '\n\n' : '') + slotDesc() + '\n\n' + buildBodyAnchorInstruction();
    const {parts} = buildUserPartsWithFreshImages(fullText);
    const sys = [sysFor(...sysKeys), extraSys].filter(Boolean).join('\n\n');
    const reply = await gemini(parts, sys, {saveHistory:true, imagesSig:sig});
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
  if(/503|UNAVAILABLE|high demand|overloaded/i.test(reason))
    return state.lang==='mm'
      ? '⏳ ဒီ Model လက်ရှိ လူသုံးများနေလို့ ခဏစောင့်ပြီး ပြန်စမ်းပါ (သို့) Settings ထဲမှာ တခြား Model ပြောင်းသုံးကြည့်ပါ။'
      : '⏳ This model is temporarily busy (high demand) — retry shortly or switch to another model in Settings.';
  if(/quota|429|RESOURCE_EXHAUSTED/i.test(reason))
    return state.lang==='mm'
      ? '⏳ Quota ပြည့်သွားပြီ — မိနစ်အနည်းငယ် စောင့်ပြီး ပြန်စမ်းပါ။ Test ကို ဆက်တိုက် မနှိပ်ပါနဲ့ (နှိပ်တိုင်းလည်း quota ကုန်တယ်)။'
      : '⏳ Quota exceeded — wait a few minutes and retry. Avoid repeated Test clicks (each one also uses quota).';
  if(/denied access/i.test(reason))
    return state.lang==='mm'
      ? '🚫 ဒီ project ကို Google က block ထားတယ် — Google account တခြားတစ်ခုနဲ့ key အသစ် ထုတ်ပါ။'
      : '🚫 This project is blocked by Google — create a key from a different Google account.';
  if(/API key not valid|API_KEY_INVALID|ACCESS_TOKEN_TYPE_UNSUPPORTED/i.test(reason))
    return state.lang==='mm'
      ? '🔑 Key မမှန်ဘူး (သို့) API restriction ဖြစ်နေတယ် — Google AI Studio key ကို ပြန်စစ်ပါ။'
      : '🔑 API key not valid or restricted — check your Google AI Studio key.';
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
      addMsg('user', `${esc(it.id||it.name)} ${it.id && it.name ? '— '+esc(it.name) : ''}`);
      addMsg('assistant', esc(kind==='loc'?t('selected_loc'):t('selected_mk'))+': <b>'+esc((it.id?it.id+' ':'')+(it.name||''))+'</b>');
      renderPrimaryBar();
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
  if(sig !== state.imagesSentSig) addMsg('user', esc(state.lang==='mm'?'ပုံများကို စစ်ဆေး + Layer Map ဆွဲပါ':'Analyze references & build Layer Map'), imgs.map(r=>r.dataUrl));
  state.busy = true; typing(); setStage('analyze');
  try{
    const prompt = `${slotDesc()}\n\nTask: Produce the full Layer Map for these references (follow ADAPT & CHAR firewall rules):
1. Per-image classification table (Image # | Slot Role | Authorized Layer(s) | Visible Evidence | Confidence/Status).
2. Detailed Layer Cards:
   - ACTIVE MODEL(S) & IDENTITY (confirm active model(s): ${state.activeModels.join(', ')})
   - GARMENT / STYLING (exact cut, silhouette, coverage, fabric, color, details, footwear)
   - POSE GEOMETRY (body posture, limbs, hands, gaze, furniture/support contact)
   - ENVIRONMENT SUITABILITY: Explicitly tag as [INDOOR-PRIVATE], [INDOOR-PUBLIC], [OUTDOOR-PUBLIC], or [FLEXIBLE] based on garment coverage/formality (e.g. nightwear/loungewear/silk slip = INDOOR-PRIVATE) and pose contact (bed/sofa/armchair/desk = INDOOR-PRIVATE)
   - CAMERA / LIGHTING cues observed
3. Cross-reference conflict resolution (mark OBSERVED / USER-SPECIFIED / INFERRED / UNRESOLVED).
Do NOT propose locations or makeup yet. End by noting readiness for location & makeup proposals.`;
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
    const partsBase = buildUserPartsWithFreshImages('').parts.slice(0, -1);
    const priorSummary = state.history.length
      ? '\n\nPRIOR ANALYSIS SUMMARY:\n' + state.history.slice(-2).map(m => m.parts.map(p => p.text || '').join(' ')).join('\n').slice(0, 3500)
      : '';
    const reasonLang = state.lang==='mm' ? 'short Burmese explanation (outfit-fit + pose-fit)' : 'outfit-fit + pose-fit in one concise line';

    const locCatalog = buildCompactLocationCatalog();
    const settingGuidance = detectSettingBias();
    const avoidLocs = state.lastProposedLocs.length
      ? `\nVARIETY RULE: Avoid repeating these recently proposed Location IDs so the user sees fresh options: ${state.lastProposedLocs.join(', ')}.`
      : '';
    const avoidMks = state.lastProposedMks.length
      ? `\nVARIETY RULE: Prefer fresh Makeup IDs different from: ${state.lastProposedMks.join(', ')}.`
      : '';

    const locPrompt = `${K().LOCR || ''}\n\n${slotDesc()}${priorSummary}\n\nSETTING MATCH RULE (CRITICAL):\n${settingGuidance}${avoidLocs}\n- Select 10 genuinely compatible locations from the shuffled library catalog below across varied regions and room/environment types.\n- Preserve exact Canonical ID (LOC-XXXX) and exact Location Name.\n- Return ONLY a JSON array: [{"id":"LOC-0354","name":"Exact Location Name","reason":"${reasonLang}"}].\n\nLOCATION CATALOG (SHUFFLED):\n${locCatalog}`;

    const mkPrompt = `${slotDesc()}${priorSummary}${avoidMks}\n\nTask: Propose exactly 5 distinct outfit-compatible makeup looks from MAKEUP KNOWLEDGE UNITS (MAKEUP-001..028) for the active model(s) requiring makeup. Preserve exact ID and Name. Return ONLY a JSON array: [{"id":"MAKEUP-001","name":"Exact Look Name","reason":"${state.lang==='mm'?'short Burmese explanation':'one concise line'}"}].`;

    const calls = [];
    if(mode==='both' || mode==='loc') calls.push(gemini([...partsBase, {text:locPrompt}], sysFor('CHAR'), {jsonMode:true, saveHistory:false}).then(r=>({k:'loc',r})));
    if(mode==='both' || mode==='mk')  calls.push(gemini([...partsBase, {text:mkPrompt}],  sysFor('CHAR','MK'), {jsonMode:true, saveHistory:false}).then(r=>({k:'mk',r})));

    const res = await Promise.all(calls);
    untyping();
    const summary = [];
    res.forEach(({k, r})=>{
      const parsed = tryParseJSON(r);
      if(parsed){
        renderCards(k, parsed);
        const ids = parsed.map(x=>x.id).filter(Boolean);
        if(k==='loc' && ids.length) state.lastProposedLocs = [...new Set([...state.lastProposedLocs, ...ids])].slice(-30);
        if(k==='mk' && ids.length) state.lastProposedMks = [...new Set([...state.lastProposedMks, ...ids])].slice(-15);
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
    const bodyRule = buildBodyAnchorInstruction();
    const prompt = `${K().FILT || ''}\n\n${slotDesc()}\n\nSELECTED LOCATION RECORD (AUTHORITATIVE):\n${locDetails}\n\nSELECTED MAKEUP LOOK (AUTHORITATIVE):\n- ${mk.id||''} ${mk.name||''} (${mk.reason||''})\n\n${bodyRule}\n\nTASK: Compose a rich, production-grade, highly detailed FINAL MASTER PROMPT (450–800 words) and a comprehensive TASK-SPECIFIC NEGATIVE PROMPT. Do NOT summarize briefly — spell out every visual detail so an image generator has maximum photographic control.

Return ONLY two sections, each containing one fenced \`\`\`text code block (no extra prose inside the code blocks):

## FINAL MASTER PROMPT
Include ALL 13 labeled sections in order inside the fenced block:
1. TASK / IMAGE TYPE: High-end fashion editorial photograph, active model count, framing intent.
2. MODEL IDENTITY: Explicit instruction anchoring recognizable facial identity, facial structure, and current hairstyle to the uploaded Model Character Reference Photo(s), plus active Model ID(s).
3. BODY ANCHOR: Copy VERBATIM the full measurement & proportion protection line(s) provided above for every active model. Never omit or paraphrase any number.
4. CHARACTER / BODY: Age presentation, natural skin micro-texture (visible pores, natural tone without whitening/plastic smoothing), anatomical fullness/musculature protection.
5. MAKEUP / GROOMING: Full cosmetic breakdown from the selected Makeup ID / uploaded Makeup Reference (complexion finish, eye shadow/liner/lashes, blush/sculpt, lip color & finish, or clean executive grooming for MODEL-002/003).
6. OUTFIT / STYLING: Exhaustive detail observed from the uploaded Outfit Reference(s) — exact silhouette, neckline, sleeves/straps, bodice/waist construction, skirt/trouser cut & hemline, fabric weight/weave/sheen/opacity, natural drape and tension over the model's exact body curves, closures, trims/embroidery, footwear, and accessories.
7. POSE / INTERACTION: Exact joint-by-joint pose geometry from the uploaded Pose Reference(s) — body angle, weight distribution, spine/hip tilt, shoulder rotation, elbow/wrist/finger placement, leg/knee/foot positioning, head angle, eye gaze direction, and realistic physical contact with floor/bed/sofa/chair/prop.
8. SCENE / ENVIRONMENT: Rich architectural and spatial reconstruction of the selected Location (materials, textures, room geometry or landscape depth, furniture pieces with realistic scale and placement, foreground/midground/background layering; strictly obey NEG-ENV-001 exclusions if applicable).
9. CAMERA / COMPOSITION: Exact camera height, angle, framing, focal length range (e.g., 50mm or 85mm), depth of field, and focal plane.
10. LIGHTING: Key light source/direction/quality, fill ratio, rim/hair separation light, warm/cool color temperature, natural reflections and soft highlight roll-off on skin and fabric.
11. MOOD / EXPRESSION: Specific facial expression, eye energy, and editorial atmosphere.
12. STYLE / QUALITY: Authentic luxury editorial photography, natural color science, true-to-life fabrics and skin texture, zero CGI/airbrushed gloss.
13. IDENTITY / PROPORTION / REFERENCE PROTECTION: Layer firewall & non-contamination locks.

## TASK-SPECIFIC NEGATIVE PROMPT
Inside one fenced \`\`\`text code block, provide a thorough comma-separated negative prompt containing:
- ALL 12 mandatory body-protection terms verbatim (${MANDATORY_NEGATIVES})
- Identity/skin drift terms (generic face, identity blend, plastic skin, airbrushed skin, porcelain whitening, age drift)
- Garment/pose/anatomy error terms tailored to this outfit & pose (extra fingers, distorted hands, impossible limb angles, floating feet, altered neckline/hem/fabric)
- Environment exclusions (religious statues, shrines, pagodas, devotional objects when NEG-ENV-001 applies, tourists, watermarks, text).`;

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

/* ---------- 2x3 Moodboard Reference Slots ---------- */
function renderSlots(){
  const box = $('slotList'); if(!box) return; box.innerHTML='';
  SLOT_DEFS.forEach(def=>{
    const items = state.refSlots[def.key];
    const d = document.createElement('div'); d.className = 'slot'+(items.length?' filled':'');
    const head = document.createElement('div'); head.className='slot-head';
    head.innerHTML = `<span class="slot-title">${ICONS[def.ico]}<span>${esc(t(def.label))}</span></span><span class="slot-count">${items.length}</span>`;
    const th = document.createElement('div'); th.className='slot-thumbs';
    items.forEach(it=>{
      const w = document.createElement('div'); w.className='slot-thumb';
      w.innerHTML = `<img src="${it.dataUrl}"><button class="rm" title="Remove">×</button>`;
      w.querySelector('.rm').onclick = ()=>{
        state.refSlots[def.key] = state.refSlots[def.key].filter(x=>x.id!==it.id);
        state.imagesSentSig = '';
        state.lastProposedLocs = [];
        state.lastProposedMks = [];
        renderSlots();
      };
      th.appendChild(w);
    });
    const fi = document.createElement('input');
    fi.type='file'; fi.accept='image/*'; fi.multiple=true; fi.hidden=true;
    fi.onchange = e=>{ addFilesToSlot(def.key, e.target.files); e.target.value=''; };
    const add = document.createElement('button');
    add.type = 'button';
    add.className = items.length ? 'slot-add' : 'slot-add empty';
    add.innerHTML = items.length ? '+' : `+ <span>${esc(t('add_photo'))}</span>`;
    add.title = t('add_photo');
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
      state.lastProposedLocs = [];
      state.lastProposedMks = [];
      renderSlots();
    }
  });
}

/* ---------- Command Routing + Primary Bar + Atelier Tools ---------- */
function closePopover(){
  const pop = $('atelierPopover');
  const btn = $('toolsBtn');
  if(pop) pop.classList.add('hidden');
  if(btn) btn.setAttribute('aria-expanded','false');
}

function handleCommand(cmd, action){
  closePopover();
  if(action === 'analyze') return runAnalyze();
  if(action === 'workflow') return runFullWorkflow();
  if(action === 'build') return runBuild();
  if(action === 'propose_loc') return runPropose('loc');
  if(action === 'propose_mk') return runPropose('mk');
  if(action === 'auto_build'){
    const locCatalog = buildCompactLocationCatalog();
    return send(cmd, ['CHAR','ADAPT','LOCR','MK','PR','FILT'], 'LOCATION CATALOG:\n' + locCatalog);
  }
  if(action === 'prefill'){
    const ta = $('msgInput');
    ta.value = cmd;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
    ta.focus();
    const s = cmd.indexOf('['), e = cmd.indexOf(']');
    if(s !== -1 && e !== -1) ta.setSelectionRange(s, e + 1);
    return;
  }
  return send(cmd);
}

function renderPrimaryBar(){
  const bar = $('primaryBar'); if(!bar) return; bar.innerHTML='';
  const readyToBuild = !!(state.selections.loc && state.selections.mk);
  PRIMARY_CMDS.forEach(([ico,mmL,enL,cmd,action,isAccent])=>{
    const b = document.createElement('button');
    b.type = 'button';
    let cls = 'pri-chip';
    if(action === 'build' && readyToBuild) cls += ' ready';
    else if(isAccent) cls += ' accent';
    b.className = cls;
    b.innerHTML = `${ICONS[ico]||''}<span>${esc(state.lang==='mm'?mmL:enL)}</span>`;
    b.onclick = ()=>handleCommand(cmd, action);
    bar.appendChild(b);
  });
}

function renderToolGroups(host){
  if(!host) return; host.innerHTML='';
  TOOL_GROUPS.forEach(grp=>{
    const wrap = document.createElement('div');
    wrap.innerHTML = `<div class="cmd-group-title">${esc(t(grp.key))}</div>`;
    const pills = document.createElement('div'); pills.className = 'cmd-pills';
    grp.items.forEach(([ico,mmL,enL,cmd,action])=>{
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'tool-pill';
      b.innerHTML = `${ICONS[ico]||''}<span>${esc(state.lang==='mm'?mmL:enL)}</span>`;
      b.onclick = ()=>{
        if(window.innerWidth<=860) document.body.classList.remove('side-open');
        handleCommand(cmd, action);
      };
      pills.appendChild(b);
    });
    wrap.appendChild(pills);
    host.appendChild(wrap);
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
  renderPrimaryBar();
  renderToolGroups($('cmdGroups'));
  renderToolGroups($('atelierPopover'));
  renderSlots();
  renderModelPills();
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
    const res = await loadModels(k);
    if(!res || !res.ok){
      const reason = res?.reason || 'Network error';
      const f = friendlyErr(reason);
      $('keyStatus').textContent = (f===reason) ? t('key_bad')+' — '+reason.slice(0,140) : f;
      return;
    }
    state.apiKey = k; store.set('prompture_api_key', k);
    try{
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${state.model}:generateContent`;
      const r = await fetch(url,{method:'POST',
        headers:{'Content-Type':'application/json','x-goog-api-key':k},
        body:JSON.stringify({contents:[{parts:[{text:'OK'}]}]})});
      if(r.ok){
        $('keyStatus').textContent = `✅ ${t('key_ok')} (${res.count} models)`;
      } else {
        const ej = await r.json().catch(()=>null);
        const reason = ej?.error?.message || ('HTTP '+r.status);
        if(/503|UNAVAILABLE|high demand|overloaded/i.test(reason)){
          $('keyStatus').textContent = state.lang==='mm'
            ? `✅ Key မှန်ပါတယ် (${res.count} models ရပြီ) — ဒါပေမယ့် ${state.model} ခဏလူများနေလို့ တခြား model ပြောင်းသုံးကြည့်ပါ။`
            : `✅ Key verified (${res.count} models) — ${state.model} is temporarily busy; try another model.`;
        } else {
          const f = friendlyErr(reason);
          $('keyStatus').textContent = (f===reason) ? `✅ Key OK — ${reason.slice(0,120)}` : f;
        }
      }
    }catch(e){
      $('keyStatus').textContent = `✅ ${t('key_ok')} (${res.count} models)`;
    }
  }finally{ btn.disabled = false; }
}
async function loadModels(overrideKey){
  const k = overrideKey || state.apiKey || $('apiKeyInput').value.trim();
  if(!k) return null;
  try{
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models',{
      headers:{'x-goog-api-key':k}});
    if(!r.ok){
      const ej = await r.json().catch(()=>null);
      return { ok:false, reason: ej?.error?.message || ('HTTP '+r.status) };
    }
    const j = await r.json();
    const names = (j.models||[])
      .filter(m=>(m.supportedGenerationMethods||[]).includes('generateContent'))
      .map(m=>m.name.replace('models/',''));
    const usable = names.filter(n =>
      (VALID_MODELS.includes(n) || /^gemini-(3|4)/.test(n)) &&
      !/(live|tts|audio|omni|nano|image|embedding|robotics|computer-use|customtools)/i.test(n)
    );
    if(usable.length){
      const sel = $('modelSelect'); sel.innerHTML='';
      usable.forEach(n=>{ const o=document.createElement('option'); o.value=n; o.textContent=n; sel.appendChild(o); });
      if(usable.includes(state.model)) sel.value = state.model;
      else { state.model = usable[0]; sel.value = state.model; store.set('prompture_model', state.model); }
    }
    return { ok:true, count: usable.length };
  }catch(e){
    return { ok:false, reason: String(e.message||e) };
  }
}

/* ---------- Onboarding / greet ---------- */
function greet(){
  addMsg('assistant', state.lang==='mm'
    ? 'မင်္ဂလာပါ <b>PROMPTURE</b> Maison d\'Éditorial မှ ကြိုဆိုပါတယ်။<br>Moodboard ထဲမှာ Model / Outfit / Pose ပုံတွေ တင်ပြီး <b>Full Atelier</b> ကို နှိပ်လိုက်ပါ။'
    : 'Welcome to <b>PROMPTURE</b> — Maison d\'Éditorial.<br>Place your Model / Outfit / Pose photos into the Moodboard, then tap <b>Full Atelier</b>.');
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

  /* Model 001 / 002 / 003 Toggle Pills */
  $('modelPills').querySelectorAll('.mpill').forEach(btn=>{
    btn.onclick = ()=>{
      const m = btn.dataset.model;
      const idx = state.activeModels.indexOf(m);
      if(idx !== -1){
        if(state.activeModels.length > 1) state.activeModels.splice(idx, 1);
      } else {
        state.activeModels.push(m);
        state.activeModels.sort();
      }
      renderModelPills();
    };
  });

  /* Atelier Tools Popover */
  $('toolsBtn').onclick = e=>{
    e.stopPropagation();
    const pop = $('atelierPopover');
    const open = pop.classList.toggle('hidden');
    $('toolsBtn').setAttribute('aria-expanded', String(!open));
  };
  document.addEventListener('click', e=>{
    const pop = $('atelierPopover');
    if(pop && !pop.classList.contains('hidden') && !pop.contains(e.target) && e.target !== $('toolsBtn')){
      closePopover();
    }
  });

  $('sendBtn').onclick = ()=>{ const v=$('msgInput').value.trim(); $('msgInput').value=''; $('msgInput').style.height='auto'; send(v); };
  const ta = $('msgInput');
  ta.addEventListener('input', ()=>{ ta.style.height='auto'; ta.style.height=Math.min(ta.scrollHeight,200)+'px'; });
  ta.addEventListener('keydown', e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); $('sendBtn').click(); } });
  $('langSelect').onchange = e=>{ state.lang = e.target.value; store.set('prompture_lang',state.lang); applyLang(); };
  $('themeSelect').onchange = e=>{ state.theme = e.target.value; store.set('prompture_theme',state.theme); applyTheme(); };
  if(window.matchMedia){
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', ()=>{ if(state.theme==='system') applyTheme(); });
  }
  $('settingsBtn').onclick = openSettings;
  $('closeSettingsBtn').onclick = closeSettings;
  $('settingsModal').addEventListener('click', e=>{ if(e.target===$('settingsModal')) closeSettings(); });
  document.addEventListener('keydown', e=>{
    if(e.key==='Escape'){
      closePopover();
      if(!$('settingsModal').classList.contains('hidden')) closeSettings();
    }
  });
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
    state.selections={loc:null,mk:null}; state.activeModels=['MODEL-001'];
    state.lastProposedLocs=[]; state.lastProposedMks=[];
    state.history=[]; state.imagesSentSig=''; state.ctaShown=false;
    $('selLoc').textContent='—'; $('selMk').textContent='—';
    $('thread').innerHTML=''; renderSlots(); renderModelPills(); renderPrimaryBar(); setStage('upload'); greet();
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