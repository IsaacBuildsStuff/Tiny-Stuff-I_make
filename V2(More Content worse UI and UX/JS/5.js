// ================================================================
// JSON FREEDOM SYSTEM
// ================================================================
const JSON_FREEDOM_KEY='__unitforge_jf_v1';
const JSON_DRAFT_KEY='__unitforge_json_draft_v2';
const JSON_RANKS=[
  {name:'LOCKED', tier:'TIER 0',icon:'\u2E61',desc:'No JSON access',          minLessons:0},
  {name:'READER', tier:'TIER 1',icon:'\u25C8',desc:'View & syntax highlight',  minLessons:2},
  {name:'STUDENT',tier:'TIER 2',icon:'\u25C7',desc:'Format & basic editing',   minLessons:5},
  {name:'CODER',  tier:'TIER 3',icon:'\u2E62',desc:'Load & edit any unit',     minLessons:8},
  {name:'MASTER', tier:'TIER 4',icon:'\u26A1',desc:'Full sandbox + GLITCH tab',minLessons:12},
];
const JSON_FEATURES=[
  {label:'View JSON lessons',      minRank:0},{label:'Syntax highlighting', minRank:1},
  {label:'Copy unit JSON',         minRank:1},{label:'Format JSON',         minRank:2},
  {label:'Basic text editing',     minRank:2},{label:'Load any unit JSON',  minRank:3},
  {label:'Full editor access',     minRank:3},{label:'Import custom units', minRank:4},
  {label:'Create from scratch',    minRank:4},{label:'GLITCH ability tab',  minRank:4},
];
const STORY_FIRED_KEY='__unitforge_story_fired_v1';
const STORY_CHAPTERS=[
  {rank:1,id:'story_ch1',cs:'story_reader'},
  {rank:2,id:'story_ch2',cs:'story_student'},
  {rank:3,id:'story_ch3',cs:'story_coder'},
  {rank:4,id:'story_ch4',cs:'story_master'},
];
const StoryProgress={
  getFired(){try{return new Set(JSON.parse(localStorage.getItem(STORY_FIRED_KEY)||'[]'));}catch{return new Set();}},
  mark(id){const s=this.getFired();s.add(id);localStorage.setItem(STORY_FIRED_KEY,JSON.stringify([...s]));},
  reset(){localStorage.removeItem(STORY_FIRED_KEY);},
  nextChapter(){const fired=this.getFired();return STORY_CHAPTERS.find(c=>!fired.has(c.id))||null;},
};
function checkStoryProgress(){
  const rank=JsonFreedom.getRank();const fired=StoryProgress.getFired();
  const chapter=STORY_CHAPTERS.find(c=>c.rank===rank&&!fired.has(c.id));
  if(chapter){
    StoryProgress.mark(chapter.id);
    setTimeout(()=>{
      if(!CS.active) playCutscene(chapter.cs);
      else setTimeout(()=>playCutscene(chapter.cs), 2000);
    }, 900);
  }
}
const JsonFreedom={
  getCompleted(){try{return new Set(JSON.parse(localStorage.getItem(JSON_FREEDOM_KEY)||'[]'));}catch{return new Set();}},
  complete(id){const s=this.getCompleted();s.add(id);localStorage.setItem(JSON_FREEDOM_KEY,JSON.stringify([...s]));},
  getRank(){const n=this.getCompleted().size;for(let i=JSON_RANKS.length-1;i>=0;i--){if(n>=JSON_RANKS[i].minLessons)return i;}return 0;},
  canSyntaxHighlight(){return this.getRank()>=1;},
  canFormat(){return this.getRank()>=2;},
  canEdit(){return this.getRank()>=2;},
  canLoadUnit(){return this.getRank()>=3;},
  canImport(){return this.getRank()>=4;},
  reset(){localStorage.removeItem(JSON_FREEDOM_KEY);localStorage.removeItem(JSON_DRAFT_KEY);StoryProgress.reset();},
};

class UndoStack{constructor(m=60){this.s=[];this.i=-1;this.m=m;this._sk=false;}push(v){if(this._sk){this._sk=false;return;}if(this.s[this.i]===v)return;this.s.splice(this.i+1);this.s.push(v);if(this.s.length>this.m)this.s.shift();this.i=this.s.length-1;}undo(){if(this.i>0){this.i--;this._sk=true;return this.s[this.i];}return null;}redo(){if(this.i<this.s.length-1){this.i++;this._sk=true;return this.s[this.i];}return null;}reset(v){this.s=[v];this.i=0;}}
const jIdeUndo=new UndoStack();
const JIS={lesson:'intro',code:(()=>{try{return localStorage.getItem(JSON_DRAFT_KEY)||'';}catch{return '';}})(),validation:null,errLine:null};

// ================================================================
// SYNTAX HIGHLIGHTER
// ================================================================
function jsonHL(raw){
  const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  let out='',i=0;const s=String(raw);
  while(i<s.length){
    const c=s[i];
    if(c==='\n'){out+='\n';i++;continue;}
    if(c===' '||c==='\t'){out+=c;i++;continue;}
    if(c==='"'){
      let tok='"';i++;
      while(i<s.length){const ch=s[i];if(ch==='\\'){tok+=ch+(s[i+1]||'');i+=2;}else{tok+=ch;i++;if(ch==='"')break;}}
      let la=i;while(la<s.length&&(s[la]===' '||s[la]==='\t'))la++;
      out+=s[la]===':'?`<span class="jhl-key">${esc(tok)}</span>`:`<span class="jhl-str">${esc(tok)}</span>`;
      continue;
    }
    if(c==='-'||(c>='0'&&c<='9')){
      let tok='';
      if(c==='-'){tok='-';i++;if(!(i<s.length&&s[i]>='0'&&s[i]<='9')){out+=esc(tok);continue;}}
      while(i<s.length&&/[\d.eE+\-]/.test(s[i]))tok+=s[i++];
      out+=`<span class="jhl-num">${esc(tok)}</span>`;continue;
    }
    if(s.startsWith('true',i)){out+='<span class="jhl-kw">true</span>';i+=4;continue;}
    if(s.startsWith('false',i)){out+='<span class="jhl-kw">false</span>';i+=5;continue;}
    if(s.startsWith('null',i)){out+='<span class="jhl-kw">null</span>';i+=4;continue;}
    if('{}[]:,'.includes(c)){out+=`<span class="jhl-punc">${esc(c)}</span>`;i++;continue;}
    out+=esc(c);i++;
  }
  return out;
}
function jsonEsc(v){return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function jsonLineNumbers(text){const n=Math.max(1,String(text||'').split('\n').length);return Array.from({length:n},(_,i)=>i+1).join('\n');}
function jsonGutterHtml(text,errLine,activeLine){
  const lines=String(text||'').split('\n');
  return lines.map((_,i)=>{
    const n=i+1;
    let cls='';
    if(n===activeLine)cls=' class="active-line"';
    else if(n===errLine)cls=' class="error-line"';
    return `<div${cls}>${n}</div>`;
  }).join('');
}
function jsonSyntaxMessage(code,err){
  const raw=(err&&err.message)?String(err.message):'Invalid JSON';
  const clean=raw.replace(/\s*at position \d+/i,'').trim();
  const m=raw.match(/position (\d+)/i);
  if(!m)return clean;
  const pos=Math.max(0,Number(m[1])||0);
  const head=String(code||'').slice(0,pos);
  const line=head.split('\n').length;
  const col=pos-(head.lastIndexOf('\n')+1)+1;
  return `Line ${line}, Col ${col}: ${clean}`;
}
function jsonPreviewHtml(vr){
  const parsed=vr&&vr.parsed;
  if(!parsed)return`<div style="font-size:9px;color:#3a4a70;line-height:1.75">Valid JSON will show a field summary here.</div>`;
  const isObj=parsed&&typeof parsed==='object'&&!Array.isArray(parsed);
  const keys=isObj?Object.keys(parsed):[];
  const type=Array.isArray(parsed)?'ARRAY':(isObj?'OBJECT':typeof parsed).toUpperCase();
  const chips=isObj?keys.slice(0,16).map(k=>`<span style="display:inline-block;border:1px solid #1a2040;border-radius:2px;padding:2px 5px;margin:0 4px 4px 0;color:#7799ff;font-size:8px">${jsonEsc(k)}</span>`).join(''):'';
  const important=isObj?['id','name','school','hp','spd','armor','desc'].map(k=>{if(parsed[k]===undefined)return'';const v=parsed[k];const txt=Array.isArray(v)?`[${v.length}]`:(v&&typeof v==='object'?`{${Object.keys(v).length}}`:String(v));return`<div style="display:flex;justify-content:space-between;gap:10px;padding:3px 0;border-bottom:1px solid #0a1020"><span style="color:#6677aa">${jsonEsc(k)}</span><span style="color:#b8ccdd;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${jsonEsc(txt)}</span></div>`;}).filter(Boolean).join(''):'';
  return`<div style="font-size:8px;color:#3a4a70;letter-spacing:2px;margin-bottom:6px">LIVE PREVIEW</div><div style="font-size:10px;color:#44ffaa;letter-spacing:1px;margin-bottom:10px">TYPE: ${type}</div>${important||`<div style="font-size:9px;color:#6677aa;line-height:1.7">Parsed successfully.</div>`}<div style="font-size:8px;color:#3a4a70;letter-spacing:1px;margin-top:10px;margin-bottom:4px">TOP-LEVEL KEYS (${keys.length})</div><div>${chips||'<span style="font-size:9px;color:#3a4a70">None</span>'}</div>`;
}
function jsonSaveDraft(text){try{localStorage.setItem(JSON_DRAFT_KEY,String(text||''));}catch{}}

// ================================================================
// LESSONS  (12 total — READER@2, STUDENT@5, CODER@8, MASTER@12)
// ================================================================
const JSON_LESSONS=[
  // ── 01 ─────────────────────────────────────────────────────────
  {id:'intro',title:'WHAT IS JSON?',icon:'01',exercise:false,initialCode:'',
    render(){return`<div class="jl-h1">WHAT IS JSON?</div><div class="jl-sub">LESSON 1 / 12 — FOUNDATION</div><div class="jl-p"><strong>JSON</strong> (JavaScript Object Notation) is the text format this game uses to define every unit, spell, and AI behavior. It's readable by both humans and machines.</div><div class="jl-p">Mastering JSON gives you <span style="color:#aabbff">direct access to the unit engine</span> — every number you see in battle is a JSON field you can edit.</div><div class="jl-rule"><div class="jl-rule-hdr">THE CORE IDEA</div><div class="jl-rule-body">JSON has two structures: <strong>objects</strong> (named fields in <code>{}</code>) and <strong>arrays</strong> (ordered lists in <code>[]</code>). Everything else is a value inside one of these.</div></div><div class="jl-code">${jsonHL('{\n  "name": "PYROS",\n  "school": "fire",\n  "hp": 310,\n  "active": true\n}')}</div><div class="jl-rule"><div class="jl-rule-hdr">WHY IT MATTERS</div><div class="jl-rule-body">Every unit in Combat Forge is a JSON object. When you edit a unit in the Editor, you are changing these exact fields. The JSON IDE lets you edit them directly — giving you precision the UI sliders cannot.</div></div>`;},validator:null},
  // ── 02 ─────────────────────────────────────────────────────────
  {id:'objects',title:'OBJECTS & KEYS',icon:'02',exercise:true,initialCode:'{\n  \n}',
    render(){return`<div class="jl-h1">OBJECTS & KEYS</div><div class="jl-sub">LESSON 2 / 12 — OBJECTS</div><div class="jl-p">An <strong>object</strong> is a set of key-value pairs wrapped in <code style="color:#7799ff">{}</code>. Each key names a field; each value is the data stored in it.</div><div class="jl-code">${jsonHL('{\n  "id":   "shadow_wraith",\n  "name": "WRAITH",\n  "hp":   280\n}')}</div><div class="jl-rule"><div class="jl-rule-hdr">RULES</div><div class="jl-rule-body">• Keys must be in <strong>double quotes</strong>: <code>"key"</code> not <code>key</code><br>• Key and value are joined by a colon: <code>"key": value</code><br>• Pairs are separated by commas — but <strong>no trailing comma</strong> after the last one</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Write a valid JSON object with at least <strong>2 key-value pairs</strong>. Hit SUBMIT when it validates.</div></div>`;},
    validator(p){if(typeof p!=='object'||Array.isArray(p)||!p)return'Must be a JSON object {}';if(Object.keys(p).length<2)return'Need at least 2 key-value pairs';return null;}},
  // ── 03 ─────────────────────────────────────────────────────────
  {id:'types',title:'VALUE TYPES',icon:'03',exercise:true,initialCode:'{\n  \n}',
    render(){return`<div class="jl-h1">VALUE TYPES</div><div class="jl-sub">LESSON 3 / 12 — DATA TYPES</div><div class="jl-p">JSON values can be one of 6 types. Recognizing them is essential for reading unit definitions.</div><div class="jl-code">${jsonHL('{\n  "name":    "VORTEX",\n  "hp":      220,\n  "spd":     2.4,\n  "enabled": true,\n  "target":  null,\n  "schools": ["fire","frost"]\n}')}</div><div class="jl-rule"><div class="jl-rule-hdr">THE 6 TYPES</div><div class="jl-rule-body"><span style="color:#44cc88">String</span> — text in double quotes: <code>"VORTEX"</code><br><span style="color:#ffaa44">Number</span> — integer or decimal: <code>220</code>, <code>2.4</code><br><span style="color:#cc77ff">Boolean</span> — <code>true</code> or <code>false</code> (no quotes)<br><span style="color:#cc77ff">Null</span> — intentional empty: <code>null</code><br><span style="color:#7799ff">Object</span> — nested <code>{}</code><br><span style="color:#7799ff">Array</span> — ordered list <code>[]</code></div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Write a JSON object that contains at least one <strong>string</strong>, one <strong>number</strong>, and one <strong>boolean</strong> value.</div></div>`;},
    validator(p){if(typeof p!=='object'||Array.isArray(p)||!p)return'Must be a JSON object {}';const vs=Object.values(p);if(!vs.some(v=>typeof v==='string'))return'Missing a string value';if(!vs.some(v=>typeof v==='number'))return'Missing a number value';if(!vs.some(v=>typeof v==='boolean'))return'Missing a boolean (true or false)';return null;}},
  // ── 04 ─────────────────────────────────────────────────────────
  {id:'arrays',title:'ARRAYS',icon:'04',exercise:true,initialCode:'{\n  \n}',
    render(){return`<div class="jl-h1">ARRAYS</div><div class="jl-sub">LESSON 4 / 12 — ORDERED LISTS</div><div class="jl-p">Arrays store ordered sequences of values using square brackets <code style="color:#7799ff">[]</code>. They appear constantly in unit definitions — spell patterns, passive lists, effect chains.</div><div class="jl-code">${jsonHL('{\n  "schools":  ["fire", "void", "storm"],\n  "passives": ["berserker", "vampiric"],\n  "damages":  [10, 25, 50]\n}')}</div><div class="jl-rule"><div class="jl-rule-hdr">ARRAY RULES</div><div class="jl-rule-body">• Use square brackets: <code>[]</code><br>• Items are comma-separated<br>• Can hold any type — strings, numbers, objects, even other arrays<br>• Order matters: index <code>0</code> is first</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Write a JSON object with at least one array that contains <strong>3 or more items</strong>.</div></div>`;},
    validator(p){if(typeof p!=='object'||Array.isArray(p)||!p)return'Must be a JSON object {}';const arrs=Object.values(p).filter(v=>Array.isArray(v));if(!arrs.length)return'Need at least one array []';if(!arrs.some(a=>a.length>=3))return'Array must have at least 3 items';return null;}},
  // ── 05 ─────────────────────────────────────────────────────────
  {id:'nested',title:'NESTED OBJECTS',icon:'05',exercise:true,initialCode:'{\n  \n}',
    render(){return`<div class="jl-h1">NESTED OBJECTS</div><div class="jl-sub">LESSON 5 / 12 — DEEP STRUCTURE</div><div class="jl-p">Objects can contain other objects. This is how Combat Forge organizes complex units — the top-level object holds sections like <code>magic</code>, <code>melee</code>, and <code>ai</code>, each of which is its own nested object.</div><div class="jl-code">${jsonHL('{\n  "name": "PYROS",\n  "magic": {\n    "school": "fire",\n    "spell": {\n      "dmg":   45,\n      "cd":    800,\n      "range": 200\n    }\n  },\n  "ai": {\n    "stance": "aggressive",\n    "aggression": 0.75\n  }\n}')}</div><div class="jl-rule"><div class="jl-rule-hdr">DOT-PATH NOTATION</div><div class="jl-rule-body">To refer to a nested value, join keys with dots:<br><code>magic.spell.dmg</code> → the damage value inside the spell object inside magic.</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Write a JSON object containing at least one <strong>nested object</strong> (an object inside an object).</div></div>`;},
    validator(p){if(typeof p!=='object'||Array.isArray(p)||!p)return'Must be a JSON object {}';const hasNested=Object.values(p).some(v=>v&&typeof v==='object'&&!Array.isArray(v));if(!hasNested)return'Need a nested object — a {} inside the outer {}';return null;}},
  // ── 06 ─────────────────────────────────────────────────────────
  {id:'errors',title:'READING ERRORS',icon:'06',exercise:true,initialCode:'{\n  "name": "GLITCH\n  "hp": 200\n  "enabled" true\n}',
    render(){return`<div class="jl-h1">READING ERRORS</div><div class="jl-sub">LESSON 6 / 12 — DEBUGGING</div><div class="jl-p">The validation bar at the bottom of the editor tells you exactly where your JSON broke. Learning to read error messages is a core skill.</div><div class="jl-rule"><div class="jl-rule-hdr">COMMON MISTAKES</div><div class="jl-rule-body"><strong>Missing closing quote</strong> — <code>"fire</code> not closed<br><strong>Missing comma</strong> — pairs must be comma-separated<br><strong>Missing colon</strong> — between key and value<br><strong>Trailing comma</strong> — <code>"hp": 200,</code> with nothing after<br><strong>Wrong quotes</strong> — must use <code>"double"</code> not <code>'single'</code></div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE — FIX THE BROKEN JSON</div><div class="jl-ex-body">The editor is pre-loaded with 3 errors. Fix all of them so it validates. The error bar will guide you.</div></div>`;},
    validator(p){if(typeof p!=='object'||!p)return'Must be a JSON object';if(!p.name||typeof p.name!=='string')return'Missing valid "name" string';if(typeof p.hp!=='number')return'"hp" must be a number';if(typeof p.enabled!=='boolean')return'"enabled" must be a boolean (true or false)';return null;}},
  // ── 07 ─────────────────────────────────────────────────────────
  {id:'schema',title:'UNIT SCHEMA',icon:'07',exercise:false,initialCode:'',
    render(){return`<div class="jl-h1">UNIT SCHEMA</div><div class="jl-sub">LESSON 7 / 12 — COMBAT FORGE FORMAT</div><div class="jl-p">Every unit in this game is a JSON object with a specific structure. This is the schema — the blueprint every unit follows.</div><div class="jl-code" style="max-height:320px;overflow-y:auto">${jsonHL('{\n  "id":     "unit_id",\n  "name":   "UNIT NAME",\n  "school": "fire",\n  "hp":     200,\n  "armor":  5,\n  "spd":    2.0,\n  "passive":  { "id": "berserker", "power": 1.0 },\n  "passive2": { "id": "none",      "power": 1.0 },\n  "magic": {\n    "enabled": true,\n    "school":  "fire",\n    "mana":    { "max": 100, "regen": 8, "cost": 18 },\n    "spell":   { "type": "bolt", "pattern": "single",\n                 "dmg": 35, "cd": 900, "range": 200,\n                 "critChance": 0.12, "critMult": 1.8 },\n    "bolt":    { "speed": 4.5, "count": 1, "homing": 0 },\n    "effect":  { "type": "burn", "power": 5, "duration": 2000 },\n    "sig":     { "type": "nova", "chargeRate": 1.0, "power": 80 }\n  },\n  "melee":  { "enabled": false },\n  "ranged": { "enabled": false },\n  "ai": {\n    "stance":     "aggressive",\n    "aggression": 0.75,\n    "priority":   { "magic": 1, "melee": 0, "ranged": 0 }\n  }\n}')}</div><div class="jl-rule"><div class="jl-rule-hdr">KEY SECTIONS</div><div class="jl-rule-body"><strong>hp / armor / spd</strong> — base combat stats<br><strong>passive / passive2</strong> — two passive ability slots<br><strong>magic</strong> — full spell system with mana, bolts, effects, signature<br><strong>melee / ranged</strong> — alternate attack modes<br><strong>ai</strong> — personality, stance, and priority weights</div></div>`;},validator:null},
  // ── 08 ─────────────────────────────────────────────────────────
  {id:'paths',title:'DOT PATHS',icon:'08',exercise:true,
    initialCode:'{\n  "hp": 200,\n  "magic": {\n    "spell": {\n      "dmg": 30,\n      "cd": 900\n    }\n  }\n}',
    render(){return`<div class="jl-h1">DOT PATHS</div><div class="jl-sub">LESSON 8 / 12 — NAVIGATION</div><div class="jl-p">Dot-path notation is how Combat Forge refers to deeply nested fields. The Editor uses paths like <code>magic.spell.dmg</code> when you move a slider.</div><div class="jl-code">${jsonHL('// These dot paths all refer to fields in a unit object:\n// "hp"               → root level\n// "magic.enabled"    → magic section, enabled field\n// "magic.spell.dmg"  → spell damage inside magic\n// "ai.priority.magic"→ magic priority inside ai.priority')}</div><div class="jl-rule"><div class="jl-rule-hdr">HOW TO READ IT</div><div class="jl-rule-body">Split on dots: <code>magic.spell.dmg</code> means:<br>→ open the <code>magic</code> object<br>→ open the <code>spell</code> object inside it<br>→ find the <code>dmg</code> field</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">The editor has a unit with <code>magic.spell.dmg: 30</code>. Change it to <strong>60</strong> and change <code>magic.spell.cd</code> to <strong>600</strong>. Keep all other fields intact.</div></div>`;},
    validator(p){
      if(typeof p!=='object'||!p)return'Must be a JSON object';
      if(typeof p.hp!=='number')return'Keep the "hp" field';
      if(!p.magic||typeof p.magic!=='object')return'Keep the "magic" object';
      if(!p.magic.spell||typeof p.magic.spell!=='object')return'Keep the "magic.spell" object';
      if(p.magic.spell.dmg!==60)return`"magic.spell.dmg" must be 60 — you wrote ${p.magic.spell.dmg}`;
      if(p.magic.spell.cd!==600)return`"magic.spell.cd" must be 600 — you wrote ${p.magic.spell.cd}`;
      return null;
    }},
  // ── 09 ─────────────────────────────────────────────────────────
  {id:'spells',title:'SPELL CONFIG',icon:'09',exercise:true,
    initialCode:'{\n  "magic": {\n    "enabled": true,\n    "school": "fire",\n    "spell": {\n      "type": "bolt",\n      "pattern": "single",\n      "dmg": 20,\n      "cd": 1000,\n      "range": 200,\n      "critChance": 0.10\n    },\n    "bolt": {\n      "speed": 4.0,\n      "count": 1,\n      "spread": 0.1,\n      "homing": 0.0\n    },\n    "sig": {\n      "type": "nova",\n      "power": 80,\n      "chargeRate": 1.0\n    }\n  }\n}',
    render(){return`<div class="jl-h1">SPELL CONFIG</div><div class="jl-sub">LESSON 9 / 12 — MAGIC SYSTEM</div><div class="jl-p">The <code>magic</code> section is the most powerful part of a unit's JSON. It controls spells, bolts, and signature abilities.</div><div class="jl-rule"><div class="jl-rule-hdr">SPELL TYPES</div><div class="jl-rule-body"><code>bolt</code> — projectile that travels to the enemy<br><code>aoe</code> — instant area burst around caster<br><code>drain</code> — hits enemy and heals caster</div></div><div class="jl-rule"><div class="jl-rule-hdr">PATTERNS</div><div class="jl-rule-body"><code>single</code> · <code>spread</code> · <code>wave</code> · <code>spiral</code> · <code>burst</code> · <code>ring</code></div></div><div class="jl-rule"><div class="jl-rule-hdr">SIGNATURE TYPES</div><div class="jl-rule-body"><code>none</code> · <code>nova</code> · <code>beam</code> · <code>barrage</code> · <code>zone</code> · <code>chain</code> · <code>meteor</code></div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Change the spell <code>pattern</code> to <code>"spread"</code>, set <code>bolt.count</code> to <strong>3</strong>, and set <code>bolt.homing</code> to <strong>0.3</strong>. Keep everything else valid.</div></div>`;},
    validator(p){
      if(!p||!p.magic)return'Must have a "magic" object';
      if(!p.magic.spell)return'Must have "magic.spell"';
      if(!p.magic.bolt)return'Must have "magic.bolt"';
      if(p.magic.spell.pattern!=='spread')return`"magic.spell.pattern" must be "spread" — you wrote "${p.magic.spell.pattern}"`;
      if(p.magic.bolt.count!==3)return`"magic.bolt.count" must be 3 — you wrote ${p.magic.bolt.count}`;
      if(typeof p.magic.bolt.homing!=='number'||p.magic.bolt.homing<0.25)return`"magic.bolt.homing" must be at least 0.25 (you wrote ${p.magic.bolt.homing})`;
      return null;
    }},
  // ── 10 ─────────────────────────────────────────────────────────
  {id:'modify',title:'MODIFY A UNIT',icon:'10',exercise:true,
    initialCode:'{\n  "id": "template",\n  "name": "TEMPLATE",\n  "school": "fire",\n  "desc": "A starter unit. Edit me.",\n  "hp": 200,\n  "armor": 5,\n  "spd": 2.0,\n  "magic": {\n    "enabled": true,\n    "school": "fire",\n    "spell": { "dmg": 35, "cd": 900, "range": 200 },\n    "effect": { "type": "burn" },\n    "sig": { "type": "nova", "chargeRate": 1.0 }\n  },\n  "melee":  { "enabled": false },\n  "ranged": { "enabled": false },\n  "passive": { "id": "berserker", "power": 1.0 },\n  "ai": { "stance": "aggressive", "aggression": 0.75 }\n}',
    render(){return`<div class="jl-h1">MODIFY A UNIT</div><div class="jl-sub">LESSON 10 / 12 — HANDS-ON EDIT</div><div class="jl-p">Time to edit a real unit. The template below is a valid Combat Forge unit. Change it to make it your own.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">1. Change <code>"name"</code> to anything except <code>"TEMPLATE"</code><br>2. Change <code>"hp"</code> to a value between 50 and 800<br>3. Change <code>"school"</code> to any valid school<br>4. Keep the JSON valid — then hit SUBMIT</div></div><div class="jl-rule"><div class="jl-rule-hdr">VALID SCHOOLS</div><div class="jl-rule-body">${Object.keys(SCH).map(s=>`<code>${s}</code>`).join(' · ')}</div></div>`;},
    validator(p){
      if(typeof p!=='object'||!p)return'Must be a JSON object';
      if(!p.name||typeof p.name!=='string')return'Missing "name" field';
      if(p.name==='TEMPLATE')return'Change "name" to something new';
      if(typeof p.hp!=='number'||p.hp<50||p.hp>800)return`"hp" must be a number between 50 and 800 (you wrote ${p.hp})`;
      if(p.hp===200)return'Change "hp" to a different value';
      if(!Object.keys(SCH).includes(p.school))return`"school" must be one of: ${Object.keys(SCH).join(', ')}`;
      return null;
    }},
  // ── 11 ─────────────────────────────────────────────────────────
  {id:'ai_config',title:'AI CONFIG',icon:'11',exercise:true,
    initialCode:'{\n  "ai": {\n    "stance": "balanced",\n    "aggression": 0.5,\n    "spacing": 0.5,\n    "dodge": 0.4,\n    "priority": {\n      "magic": 0.5,\n      "melee": 0.25,\n      "ranged": 0.25\n    }\n  }\n}',
    render(){return`<div class="jl-h1">AI CONFIG</div><div class="jl-sub">LESSON 11 / 12 — BEHAVIOR SYSTEM</div><div class="jl-p">The <code>ai</code> section controls how the unit thinks and fights. Every behavior parameter is a number between 0 and 1.</div><div class="jl-rule"><div class="jl-rule-hdr">KEY AI FIELDS</div><div class="jl-rule-body"><code>aggression</code> — how aggressively it pushes toward the enemy<br><code>spacing</code> — preferred distance from target (higher = farther)<br><code>dodge</code> — tendency to evade incoming attacks<br><code>retreatThreshold</code> — HP% at which it retreats (0.2 = 20% HP)<br><code>aim</code> — targeting accuracy (0–1)</div></div><div class="jl-rule"><div class="jl-rule-hdr">STANCES</div><div class="jl-rule-body">${['balanced','aggressive','defensive','sniper','berserk','cunning','duelist','coward'].map(s=>`<code>${s}</code>`).join(' · ')}</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Change the <code>stance</code> to <code>"berserk"</code>, set <code>aggression</code> to <strong>0.9</strong> or higher, and set <code>ai.priority.magic</code> to <strong>0</strong> and <code>ai.priority.melee</code> to <strong>1</strong>.</div></div>`;},
    validator(p){
      if(!p||!p.ai)return'Must have an "ai" object';
      if(p.ai.stance!=='berserk')return`"ai.stance" must be "berserk" — you wrote "${p.ai.stance}"`;
      if(typeof p.ai.aggression!=='number'||p.ai.aggression<0.9)return`"ai.aggression" must be 0.9 or higher`;
      if(!p.ai.priority)return'Must have "ai.priority" object';
      if(p.ai.priority.magic!==0)return`"ai.priority.magic" must be 0 for a pure melee berserk`;
      if(p.ai.priority.melee!==1)return`"ai.priority.melee" must be 1`;
      return null;
    }},
  // ── 12 ─────────────────────────────────────────────────────────
  {id:'import',title:'BUILD & IMPORT',icon:'12',exercise:true,
    initialCode:'{\n  "id": "my_unit",\n  "name": "MY UNIT",\n  "school": "void",\n  "desc": "Built from scratch.",\n  "hp": 260,\n  "armor": 8,\n  "spd": 2.2,\n  "magic": {\n    "enabled": true,\n    "school": "void",\n    "mana": { "max": 90, "regen": 8, "cost": 20 },\n    "spell": { "type": "bolt", "pattern": "single",\n               "dmg": 28, "cd": 1100, "range": 220 },\n    "bolt":  { "speed": 5.5, "count": 1, "homing": 0.1 },\n    "effect": { "type": "weaken", "power": 5, "duration": 2000 },\n    "sig": { "type": "beam", "chargeRate": 1.0, "power": 90 }\n  },\n  "melee":  { "enabled": false },\n  "ranged": { "enabled": false },\n  "passive":  { "id": "vampiric",    "power": 1.0 },\n  "passive2": { "id": "spellweave", "power": 1.0 },\n  "ai": { "stance": "cunning", "aggression": 0.6, "spacing": 0.5,\n          "priority": { "magic": 1, "melee": 0, "ranged": 0 } }\n}',
    render(){return`<div class="jl-h1">BUILD & IMPORT</div><div class="jl-sub">LESSON 12 / 12 — MASTER TRIAL</div><div class="jl-p">The final lesson. Build a fully valid unit from the template, customize it, and press <strong style="color:#44ffaa">IMPORT TO ROSTER</strong> to add it to the game.</div><div class="jl-rule"><div class="jl-rule-hdr">REQUIRED FIELDS</div><div class="jl-rule-body"><code>id</code> — unique string identifier, no spaces<br><code>name</code> — display name (up to 12 chars)<br><code>school</code> — one of: ${Object.keys(SCH).map(s=>`<code>${s}</code>`).join(' ')}<br><code>hp</code> — number ≥ 50<br><code>spd</code> — number ≥ 0.5</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ MASTER TRIAL</div><div class="jl-ex-body">Customize the template — change the <code>name</code>, school, stats, spell type, or anything else. When validation passes, click <strong>IMPORT TO ROSTER</strong>. Your unit will appear in Battle and Roster immediately.</div></div>`;},
    validator(p){
      if(typeof p!=='object'||!p)return'Must be a JSON object';
      if(!p.id||typeof p.id!=='string')return'Missing "id" (must be a string)';
      if(p.id.includes(' '))return'"id" cannot contain spaces';
      if(!p.name||typeof p.name!=='string')return'Missing "name"';
      if(p.name==='MY UNIT')return'Change "name" to something unique';
      if(!Object.keys(SCH).includes(p.school))return`"school" must be one of: ${Object.keys(SCH).join(', ')}`;
      if(typeof p.hp!=='number'||p.hp<50)return'"hp" must be a number ≥ 50';
      if(typeof p.spd!=='number'||p.spd<0.5)return'"spd" must be a number ≥ 0.5';
      return null;
    }},
  // ── PRESTIGE 3 LESSONS (p3_01 - p3_12) ─────────────────────────────
  {id:'p3_01',title:'ADVANCED SPELL PATTERNS',icon:'A1',exercise:true,initialCode:'{\n  "magic": {\n    "spell": {\n      "pattern": "single",\n      "dmg": 30,\n      "cd": 900\n    }\n  }\n}',
    render(){return`<div class="jl-h1">ADVANCED SPELL PATTERNS</div><div class="jl-sub">PRESTIGE 3 — LESSON 1/12</div><div class="jl-p">Beyond basic bolts, spells can use complex patterns like <code>spread</code>, <code>wave</code>, <code>spiral</code>, and <code>burst</code>.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Change the spell pattern to <code>"wave"</code> and set damage to <strong>25</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.spell)return'Missing magic.spell';if(p.magic.spell.pattern!=='wave')return'Pattern must be "wave"';if(p.magic.spell.dmg!==25)return'Damage must be 25';return null;}},
  {id:'p3_02',title:'PASSIVE ABILITIES',icon:'A2',exercise:true,initialCode:'{\n  "passive": {\n    "id": "none",\n    "power": 1.0\n  }\n}',
    render(){return`<div class="jl-h1">PASSIVE ABILITIES</div><div class="jl-sub">PRESTIGE 3 — LESSON 2/12</div><div class="jl-p">Passives give units constant effects like regeneration, damage reflection, or stat boosts.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set passive id to <code>"regeneration"</code> and power to <strong>1.5</strong>.</div></div>`;},
    validator(p){if(!p.passive)return'Missing passive';if(p.passive.id!=='regeneration')return'ID must be "regeneration"';if(p.passive.power!==1.5)return'Power must be 1.5';return null;}},
  {id:'p3_03',title:'DUAL PASSIVES',icon:'A3',exercise:true,initialCode:'{\n  "passive": { "id": "berserker", "power": 1.0 },\n  "passive2": { "id": "none", "power": 1.0 }\n}',
    render(){return`<div class="jl-h1">DUAL PASSIVES</div><div class="jl-sub">PRESTIGE 3 — LESSON 3/12</div><div class="jl-p">Units can have two passive abilities simultaneously for powerful combinations.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set passive2 id to <code>"vampiric"</code> with power <strong>1.2</strong>.</div></div>`;},
    validator(p){if(!p.passive2)return'Missing passive2';if(p.passive2.id!=='vampiric')return'ID must be "vampiric"';if(p.passive2.power!==1.2)return'Power must be 1.2';return null;}},
  {id:'p3_04',title:'SPELL EFFECTS',icon:'A4',exercise:true,initialCode:'{\n  "magic": {\n    "effect": {\n      "type": "none",\n      "power": 0,\n      "duration": 0\n    }\n  }\n}',
    render(){return`<div class="jl-h1">SPELL EFFECTS</div><div class="jl-sub">PRESTIGE 3 — LESSON 4/12</div><div class="jl-p">Spells can apply effects like burn, weaken, slow, or freeze on hit.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set effect type to <code>"burn"</code>, power to <strong>8</strong>, duration to <strong>3000</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.effect)return'Missing magic.effect';if(p.magic.effect.type!=='burn')return'Type must be "burn"';if(p.magic.effect.power!==8)return'Power must be 8';if(p.magic.effect.duration!==3000)return'Duration must be 3000';return null;}},
  {id:'p3_05',title:'MANA MANAGEMENT',icon:'A5',exercise:true,initialCode:'{\n  "magic": {\n    "mana": {\n      "max": 100,\n      "regen": 8,\n      "cost": 20\n    }\n  }\n}',
    render(){return`<div class="jl-h1">MANA MANAGEMENT</div><div class="jl-sub">PRESTIGE 3 — LESSON 5/12</div><div class="jl-p">Mana controls spell frequency. Balance max mana, regen rate, and spell cost.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set max to <strong>150</strong>, regen to <strong>12</strong>, cost to <strong>25</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.mana)return'Missing magic.mana';if(p.magic.mana.max!==150)return'Max must be 150';if(p.magic.mana.regen!==12)return'Regen must be 12';if(p.magic.mana.cost!==25)return'Cost must be 25';return null;}},
  {id:'p3_06',title:'BOLT CONFIGURATION',icon:'A6',exercise:true,initialCode:'{\n  "magic": {\n    "bolt": {\n      "speed": 4.0,\n      "count": 1,\n      "spread": 0.1,\n      "homing": 0.0\n    }\n  }\n}',
    render(){return`<div class="jl-h1">BOLT CONFIGURATION</div><div class="jl-sub">PRESTIGE 3 — LESSON 6/12</div><div class="jl-p">Bolt settings control projectile speed, count, spread angle, and homing behavior.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set count to <strong>5</strong>, spread to <strong>0.5</strong>, homing to <strong>0.4</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.bolt)return'Missing magic.bolt';if(p.magic.bolt.count!==5)return'Count must be 5';if(p.magic.bolt.spread!==0.5)return'Spread must be 0.5';if(p.magic.bolt.homing!==0.4)return'Homing must be 0.4';return null;}},
  {id:'p3_07',title:'SIGNATURE ABILITIES',icon:'A7',exercise:true,initialCode:'{\n  "magic": {\n    "sig": {\n      "type": "nova",\n      "chargeRate": 1.0,\n      "power": 80\n    }\n  }\n}',
    render(){return`<div class="jl-h1">SIGNATURE ABILITIES</div><div class="jl-sub">PRESTIGE 3 — LESSON 7/12</div><div class="jl-p">Signature abilities are powerful charged attacks that build up over time.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set type to <code>"beam"</code>, chargeRate to <strong>1.5</strong>, power to <strong>100</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.sig)return'Missing magic.sig';if(p.magic.sig.type!=='beam')return'Type must be "beam"';if(p.magic.sig.chargeRate!==1.5)return'ChargeRate must be 1.5';if(p.magic.sig.power!==100)return'Power must be 100';return null;}},
  {id:'p3_08',title:'CRITICAL HITS',icon:'A8',exercise:true,initialCode:'{\n  "magic": {\n    "spell": {\n      "critChance": 0.10,\n      "critMult": 1.8\n    }\n  }\n}',
    render(){return`<div class="jl-h1">CRITICAL HITS</div><div class="jl-sub">PRESTIGE 3 — LESSON 8/12</div><div class="jl-p">Critical hits deal bonus damage based on chance and multiplier.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set critChance to <strong>0.25</strong> and critMult to <strong>2.5</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.spell)return'Missing magic.spell';if(p.magic.spell.critChance!==0.25)return'CritChance must be 0.25';if(p.magic.spell.critMult!==2.5)return'CritMult must be 2.5';return null;}},
  {id:'p3_09',title:'SPELL RANGE',icon:'A9',exercise:true,initialCode:'{\n  "magic": {\n    "spell": {\n      "range": 200\n    }\n  }\n}',
    render(){return`<div class="jl-h1">SPELL RANGE</div><div class="jl-sub">PRESTIGE 3 — LESSON 9/12</div><div class="jl-p">Range determines how far a spell can reach. Balance with damage and cooldown.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set range to <strong>350</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.spell)return'Missing magic.spell';if(p.magic.spell.range!==350)return'Range must be 350';return null;}},
  {id:'p3_10',title:'COOLDOWN MANAGEMENT',icon:'A10',exercise:true,initialCode:'{\n  "magic": {\n    "spell": {\n      "cd": 900\n    }\n  }\n}',
    render(){return`<div class="jl-h1">COOLDOWN MANAGEMENT</div><div class="jl-sub">PRESTIGE 3 — LESSON 10/12</div><div class="jl-p">Cooldown (cd) is in milliseconds. Lower values mean faster spell casting.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set cd to <strong>600</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.spell)return'Missing magic.spell';if(p.magic.spell.cd!==600)return'cd must be 600';return null;}},
  {id:'p3_11',title:'SCHOOL SYNERGY',icon:'A11',exercise:false,initialCode:'',
    render(){return`<div class="jl-h1">SCHOOL SYNERGY</div><div class="jl-sub">PRESTIGE 3 — LESSON 11/12</div><div class="jl-p">Each magic school has unique strengths. Fire burns, frost slows, void weakens, storm chains, nature heals.</div><div class="jl-rule"><div class="jl-rule-hdr">SCHOOL BONUSES</div><div class="jl-rule-body"><strong>Fire</strong> — burn damage bonus<br><strong>Frost</strong> — slow effect bonus<br><strong>Void</strong> — weaken effect bonus<br><strong>Storm</strong> — chain lightning bonus<br><strong>Nature</strong> — regeneration bonus</div></div>`;},validator:null},
  {id:'p3_12',title:'SPELL COMBOS',icon:'A12',exercise:true,initialCode:'{\n  "magic": {\n    "spell": {\n      "pattern": "burst",\n      "dmg": 20,\n      "cd": 1200\n    },\n    "bolt": {\n      "count": 8,\n      "spread": 0.8\n    },\n    "effect": {\n      "type": "burn",\n      "power": 6\n    }\n  }\n}',
    render(){return`<div class="jl-h1">SPELL COMBOS</div><div class="jl-sub">PRESTIGE 3 — LESSON 12/12</div><div class="jl-p">Combine patterns, bolts, and effects for devastating spell combinations.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set spell dmg to <strong>25</strong>, bolt count to <strong>12</strong>, effect power to <strong>10</strong>.</div></div>`;},
    validator(p){if(!p.magic)return'Missing magic';if(p.magic.spell.dmg!==25)return'Damage must be 25';if(p.magic.bolt.count!==12)return'Bolt count must be 12';if(p.magic.effect.power!==10)return'Effect power must be 10';return null;}},
  // ── PRESTIGE 4 LESSONS (p4_01 - p4_12) ─────────────────────────────
  {id:'p4_01',title:'MELEE BASICS',icon:'M1',exercise:true,initialCode:'{\n  "melee": {\n    "enabled": false,\n    "dmg": 20,\n    "range": 40,\n    "cd": 800\n  }\n}',
    render(){return`<div class="jl-h1">MELEE BASICS</div><div class="jl-sub">PRESTIGE 4 — LESSON 1/12</div><div class="jl-p">Melee attacks are close-range strikes that don't use mana.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Enable melee, set dmg to <strong>35</strong>, range to <strong>50</strong>.</div></div>`;},
    validator(p){if(!p.melee)return'Missing melee';if(!p.melee.enabled)return'Melee must be enabled';if(p.melee.dmg!==35)return'Damage must be 35';if(p.melee.range!==50)return'Range must be 50';return null;}},
  {id:'p4_02',title:'MELEE COMBOS',icon:'M2',exercise:true,initialCode:'{\n  "melee": {\n    "enabled": true,\n    "comboCount": 2,\n    "comboDmgMult": 1.2\n  }\n}',
    render(){return`<div class="jl-h1">MELEE COMBOS</div><div class="jl-sub">PRESTIGE 4 — LESSON 2/12</div><div class="jl-p">Combo attacks deal increasing damage with each hit in sequence.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set comboCount to <strong>4</strong> and comboDmgMult to <strong>1.5</strong>.</div></div>`;},
    validator(p){if(!p.melee)return'Missing melee';if(p.melee.comboCount!==4)return'ComboCount must be 4';if(p.melee.comboDmgMult!==1.5)return'ComboDmgMult must be 1.5';return null;}},
  {id:'p4_03',title:'LIFESTEAL',icon:'M3',exercise:true,initialCode:'{\n  "melee": {\n    "enabled": true,\n    "lifesteal": 0.0\n  }\n}',
    render(){return`<div class="jl-h1">LIFESTEAL</div><div class="jl-sub">PRESTIGE 4 — LESSON 3/12</div><div class="jl-p">Lifesteal heals the attacker based on damage dealt (0-1 range).</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set lifesteal to <strong>0.3</strong>.</div></div>`;},
    validator(p){if(!p.melee)return'Missing melee';if(p.melee.lifesteal!==0.3)return'Lifesteal must be 0.3';return null;}},
  {id:'p4_04',title:'ARMOR PENETRATION',icon:'M4',exercise:true,initialCode:'{\n  "melee": {\n    "enabled": true,\n    "armorPen": 0.0\n  }\n}',
    render(){return`<div class="jl-h1">ARMOR PENETRATION</div><div class="jl-sub">PRESTIGE 4 — LESSON 4/12</div><div class="jl-p">Armor penetration ignores a portion of enemy armor (0-1 range).</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set armorPen to <strong>0.5</strong>.</div></div>`;},
    validator(p){if(!p.melee)return'Missing melee';if(p.melee.armorPen!==0.5)return'ArmorPen must be 0.5';return null;}},
  {id:'p4_05',title:'RANGED BASICS',icon:'M5',exercise:true,initialCode:'{\n  "ranged": {\n    "enabled": false,\n    "dmg": 15,\n    "range": 300,\n    "speed": 6.0,\n    "cd": 1000\n  }\n}',
    render(){return`<div class="jl-h1">RANGED BASICS</div><div class="jl-sub">PRESTIGE 4 — LESSON 5/12</div><div class="jl-p">Ranged attacks fire projectiles from a distance.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Enable ranged, set dmg to <strong>25</strong>, speed to <strong>8.0</strong>.</div></div>`;},
    validator(p){if(!p.ranged)return'Missing ranged';if(!p.ranged.enabled)return'Ranged must be enabled';if(p.ranged.dmg!==25)return'Damage must be 25';if(p.ranged.speed!==8.0)return'Speed must be 8.0';return null;}},
  {id:'p4_06',title:'PROJECTILE TYPES',icon:'M6',exercise:true,initialCode:'{\n  "ranged": {\n    "enabled": true,\n    "type": "arrow"\n  }\n}',
    render(){return`<div class="jl-h1">PROJECTILE TYPES</div><div class="jl-sub">PRESTIGE 4 — LESSON 6/12</div><div class="jl-p">Ranged attacks can use arrows, bolts, or energy bolts with different properties.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set type to <code>"bolt"</code>.</div></div>`;},
    validator(p){if(!p.ranged)return'Missing ranged';if(p.ranged.type!=='bolt')return'Type must be "bolt"';return null;}},
  {id:'p4_07',title:'MULTI-SHOT',icon:'M7',exercise:true,initialCode:'{\n  "ranged": {\n    "enabled": true,\n    "count": 1,\n    "spread": 0.1\n  }\n}',
    render(){return`<div class="jl-h1">MULTI-SHOT</div><div class="jl-sub">PRESTIGE 4 — LESSON 7/12</div><div class="jl-p">Multi-shot fires multiple projectiles in a spread pattern.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set count to <strong>3</strong> and spread to <strong>0.4</strong>.</div></div>`;},
    validator(p){if(!p.ranged)return'Missing ranged';if(p.ranged.count!==3)return'Count must be 3';if(p.ranged.spread!==0.4)return'Spread must be 0.4';return null;}},
  {id:'p4_08',title:'HYBRID COMBAT',icon:'M8',exercise:true,initialCode:'{\n  "melee": { "enabled": true },\n  "ranged": { "enabled": true }\n}',
    render(){return`<div class="jl-h1">HYBRID COMBAT</div><div class="jl-sub">PRESTIGE 4 — LESSON 8/12</div><div class="jl-p">Units can use both melee and ranged attacks, switching based on distance.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Enable both melee and ranged.</div></div>`;},
    validator(p){if(!p.melee||!p.ranged)return'Missing melee or ranged';if(!p.melee.enabled||!p.ranged.enabled)return'Both must be enabled';return null;}},
  {id:'p4_09',title:'ATTACK PRIORITY',icon:'M9',exercise:true,initialCode:'{\n  "ai": {\n    "priority": {\n      "magic": 1,\n      "melee": 0,\n      "ranged": 0\n    }\n  }\n}',
    render(){return`<div class="jl-h1">ATTACK PRIORITY</div><div class="jl-sub">PRESTIGE 4 — LESSON 9/12</div><div class="jl-p">AI priority determines which attack type the unit prefers.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set melee priority to <strong>1</strong> and magic to <strong>0</strong>.</div></div>`;},
    validator(p){if(!p.ai||!p.ai.priority)return'Missing ai.priority';if(p.ai.priority.melee!==1)return'Melee priority must be 1';if(p.ai.priority.magic!==0)return'Magic priority must be 0';return null;}},
  {id:'p4_10',title:'KNOCKBACK',icon:'M10',exercise:true,initialCode:'{\n  "melee": {\n    "enabled": true,\n    "knockback": 0.0\n  }\n}',
    render(){return`<div class="jl-h1">KNOCKBACK</div><div class="jl-sub">PRESTIGE 4 — LESSON 10/12</div><div class="jl-p">Knockback pushes enemies away on hit, creating spacing.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set knockback to <strong>0.6</strong>.</div></div>`;},
    validator(p){if(!p.melee)return'Missing melee';if(p.melee.knockback!==0.6)return'Knockback must be 0.6';return null;}},
  {id:'p4_11',title:'STUN CHANCE',icon:'M11',exercise:true,initialCode:'{\n  "melee": {\n    "enabled": true,\n    "stunChance": 0.0\n  }\n}',
    render(){return`<div class="jl-h1">STUN CHANCE</div><div class="jl-sub">PRESTIGE 4 — LESSON 11/12</div><div class="jl-p">Stun chance temporarily disables the enemy on hit.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set stunChance to <strong>0.15</strong>.</div></div>`;},
    validator(p){if(!p.melee)return'Missing melee';if(p.melee.stunChance!==0.15)return'StunChance must be 0.15';return null;}},
  {id:'p4_12',title:'COMBAT BALANCING',icon:'M12',exercise:true,initialCode:'{\n  "hp": 250,\n  "armor": 10,\n  "spd": 2.0,\n  "melee": { "enabled": true, "dmg": 30 },\n  "ranged": { "enabled": true, "dmg": 20 }\n}',
    render(){return`<div class="jl-h1">COMBAT BALANCING</div><div class="jl-sub">PRESTIGE 4 — LESSON 12/12</div><div class="jl-p">Balance HP, armor, speed, and damage for effective units.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set hp to <strong>300</strong>, melee dmg to <strong>40</strong>, ranged dmg to <strong>25</strong>.</div></div>`;},
    validator(p){if(p.hp!==300)return'HP must be 300';if(!p.melee||p.melee.dmg!==40)return'Melee dmg must be 40';if(!p.ranged||p.ranged.dmg!==25)return'Ranged dmg must be 25';return null;}},
  // ── PRESTIGE 5-12 PLACEHOLDER LESSONS ───────────────────────────────
  {id:'p5_01',title:'AI STANCES',icon:'B1',exercise:true,initialCode:'{\n  "ai": { "stance": "balanced" }\n}',
    render(){return`<div class="jl-h1">AI STANCES</div><div class="jl-sub">PRESTIGE 5 — LESSON 1/12</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set stance to <code>"aggressive"</code>.</div></div>`;},
    validator(p){if(!p.ai||p.ai.stance!=='aggressive')return'Stance must be aggressive';return null;}},
  {id:'p5_02',title:'AGGRESSION TUNING',icon:'B2',exercise:true,initialCode:'{\n  "ai": { "aggression": 0.5 }\n}',
    render(){return`<div class="jl-h1">AGGRESSION TUNING</div><div class="jl-sub">PRESTIGE 5 — LESSON 2/12</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set aggression to <strong>0.9</strong>.</div></div>`;},
    validator(p){if(!p.ai||p.ai.aggression!==0.9)return'Aggression must be 0.9';return null;}},
  {id:'p5_03',title:'SPACING CONTROL',icon:'B3',exercise:true,initialCode:'{\n  "ai": { "spacing": 0.5 }\n}',
    render(){return`<div class="jl-h1">SPACING CONTROL</div><div class="jl-sub">PRESTIGE 5 — LESSON 3/12</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set spacing to <strong>0.8</strong>.</div></div>`;},
    validator(p){if(!p.ai||p.ai.spacing!==0.8)return'Spacing must be 0.8';return null;}},
  {id:'p5_04',title:'DODGE BEHAVIOR',icon:'B4',exercise:true,initialCode:'{\n  "ai": { "dodge": 0.4 }\n}',
    render(){return`<div class="jl-h1">DODGE BEHAVIOR</div><div class="jl-sub">PRESTIGE 5 — LESSON 4/12</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set dodge to <strong>0.7</strong>.</div></div>`;},
    validator(p){if(!p.ai||p.ai.dodge!==0.7)return'Dodge must be 0.7';return null;}},
  {id:'p5_05',title:'RETREAT THRESHOLD',icon:'B5',exercise:true,initialCode:'{\n  "ai": { "retreatThreshold": 0.2 }\n}',
    render(){return`<div class="jl-h1">RETREAT THRESHOLD</div><div class="jl-sub">PRESTIGE 5 — LESSON 5/12</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set retreatThreshold to <strong>0.4</strong>.</div></div>`;},
    validator(p){if(!p.ai||p.ai.retreatThreshold!==0.4)return'RetreatThreshold must be 0.4';return null;}},
  {id:'p5_06',title:'AIM ACCURACY',icon:'B6',exercise:true,initialCode:'{\n  "ai": { "aim": 0.8 }\n}',
    render(){return`<div class="jl-h1">AIM ACCURACY</div><div class="jl-sub">PRESTIGE 5 — LESSON 6/12</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set aim to <strong>0.95</strong>.</div></div>`;},
    validator(p){if(!p.ai||p.ai.aim!==0.95)return'Aim must be 0.95';return null;}},
  {id:'p5_07',title:'REACTIVITY',icon:'B7',exercise:true,initialCode:'{\n  "ai": { "reactivity": 0.5 }\n}',
    render(){return`<div class="jl-h1">REACTIVITY</div><div class="jl-sub">PRESTIGE 5 — LESSON 7/12</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set reactivity to <strong>0.8</strong>.</div></div>`;},
    validator(p){if(!p.ai||p.ai.reactivity!==0.8)return'Reactivity must be 0.8';return null;}},
  {id:'p5_08',title:'TARGET SELECTION',icon:'B8',exercise:true,initialCode:'{\n  "ai": { "targetBias": "nearest" }\n}',
    render(){return`<div class="jl-h1">TARGET SELECTION</div><div class="jl-sub">PRESTIGE 5 — LESSON 8/12</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set targetBias to <code>"weakest"</code>.</div></div>`;},
    validator(p){if(!p.ai||p.ai.targetBias!=='weakest')return'TargetBias must be weakest';return null;}},
  {id:'p5_09',title:'TEAM TACTICS',icon:'B9',exercise:false,initialCode:'',
    render(){return`<div class="jl-h1">TEAM TACTICS</div><div class="jl-sub">PRESTIGE 5 — LESSON 9/12</div><div class="jl-p">AI can coordinate with allies for focus fire, protection, and combos.</div>`;},validator:null},
  {id:'p5_10',title:'ADAPTIVE AI',icon:'B10',exercise:true,initialCode:'{\n  "ai": { "adaptive": true }\n}',
    render(){return`<div class="jl-h1">ADAPTIVE AI</div><div class="jl-sub">PRESTIGE 5 — LESSON 10/12</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Enable adaptive AI.</div></div>`;},
    validator(p){if(!p.ai||!p.ai.adaptive)return'Adaptive must be true';return null;}},
  {id:'p5_11',title:'COUNTER PLAY',icon:'B11',exercise:false,initialCode:'',
    render(){return`<div class="jl-h1">COUNTER PLAY</div><div class="jl-sub">PRESTIGE 5 — LESSON 11/12</div><div class="jl-p">AI can recognize enemy patterns and adjust tactics accordingly.</div>`;},validator:null},
  {id:'p5_12',title:'AI MASTERY',icon:'B12',exercise:true,initialCode:'{\n  "ai": {\n    "stance": "cunning",\n    "aggression": 0.7,\n    "dodge": 0.8,\n    "aim": 0.9\n  }\n}',
    render(){return`<div class="jl-h1">AI MASTERY</div><div class="jl-sub">PRESTIGE 5 — LESSON 12/12</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Configure cunning AI with high stats.</div></div>`;},
    validator(p){if(!p.ai)return'Missing ai';if(p.ai.stance!=='cunning')return'Stance must be cunning';if(p.ai.aggression!==0.7)return'Aggression must be 0.7';if(p.ai.dodge!==0.8)return'Dodge must be 0.8';if(p.ai.aim!==0.9)return'Aim must be 0.9';return null;}},
  // Prestige 6-12 simplified placeholders
  {id:'p6_01',title:'RESISTANCES',icon:'C1',exercise:true,initialCode:'{\n  "resistances": {\n    "fire": 0.0,\n    "frost": 0.0\n  }\n}',
    render(){return`<div class="jl-h1">RESISTANCES</div><div class="jl-sub">PRESTIGE 6 — LESSON 1/12</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set fire resistance to <strong>0.5</strong>.</div></div>`;},
    validator(p){if(!p.resistances||p.resistances.fire!==0.5)return'Fire resistance must be 0.5';return null;}},
  {id:'p6_02',title:'MOVE SPEED',icon:'C2',exercise:true,initialCode:'{\n  "move": {\n    "speed": 1.0\n  }\n}',
    render(){return`<div class="jl-h1">MOVE SPEED</div><div class="jl-sub">PRESTIGE 6 — LESSON 2/12</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set move speed to <strong>1.5</strong>.</div></div>`;},
    validator(p){if(!p.move||p.move.speed!==1.5)return'Move speed must be 1.5';return null;}},
  {id:'p6_03',title:'STATUS EFFECTS',icon:'C3',exercise:false,initialCode:'',
    render(){return`<div class="jl-h1">STATUS EFFECTS</div><div class="jl-sub">PRESTIGE 6 — LESSON 3/12</div><div class="jl-p">Units can apply and resist status effects like burn, freeze, slow, weaken.</div>`;},validator:null},
  {id:'p6_04',title:'EFFECT DURATION',icon:'C4',exercise:true,initialCode:'{\n  "magic": {\n    "effect": {\n      "duration": 2000\n    }\n  }\n}',
    render(){return`<div class="jl-h1">EFFECT DURATION</div><div class="jl-sub">PRESTIGE 6 — LESSON 4/12</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set effect duration to <strong>5000</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.effect||p.magic.effect.duration!==5000)return'Duration must be 5000';return null;}},
  {id:'p6_05',title:'EFFECT STACKING',icon:'C5',exercise:false,initialCode:'',
    render(){return`<div class="jl-h1">EFFECT STACKING</div><div class="jl-sub">PRESTIGE 6 — LESSON 5/12</div><div class="jl-p">Some effects can stack for increased power, while others refresh duration.</div>`;},validator:null},
  {id:'p6_06',title:'CLEANSE',icon:'C6',exercise:true,initialCode:'{\n  "passive": {\n    "id": "cleanse",\n    "power": 1.0\n  }\n}',
    render(){return`<div class="jl-h1">CLEANSE</div><div class="jl-sub">PRESTIGE 6 — LESSON 6/12</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set passive id to <code>"cleanse"</code>.</div></div>`;},
    validator(p){if(!p.passive||p.passive.id!=='cleanse')return'Passive must be cleanse';return null;}},
  {id:'p6_07',title:'REFLECTION',icon:'C7',exercise:true,initialCode:'{\n  "passive": {\n    "id": "reflection",\n    "power": 0.5\n  }\n}',
    render(){return`<div class="jl-h1">REFLECTION</div><div class="jl-sub">PRESTIGE 6 — LESSON 7/12</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set reflection power to <strong>0.8</strong>.</div></div>`;},
    validator(p){if(!p.passive||p.passive.power!==0.8)return'Reflection power must be 0.8';return null;}},
  {id:'p6_08',title:'SHIELDS',icon:'C8',exercise:true,initialCode:'{\n  "passive": {\n    "id": "shield",\n    "power": 50\n  }\n}',
    render(){return`<div class="jl-h1">SHIELDS</div><div class="jl-sub">PRESTIGE 6 — LESSON 8/12</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set shield power to <strong>100</strong>.</div></div>`;},
    validator(p){if(!p.passive||p.passive.power!==100)return'Shield power must be 100';return null;}},
  {id:'p6_09',title:'THORNS',icon:'C9',exercise:true,initialCode:'{\n  "passive": {\n    "id": "thorns",\n    "power": 0.3\n  }\n}',
    render(){return`<div class="jl-h1">THORNS</div><div class="jl-sub">PRESTIGE 6 — LESSON 9/12</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set thorns power to <strong>0.5</strong>.</div></div>`;},
    validator(p){if(!p.passive||p.passive.power!==0.5)return'Thorns power must be 0.5';return null;}},
  {id:'p6_10',title:'LEECH',icon:'C10',exercise:true,initialCode:'{\n  "passive": {\n    "id": "leech",\n    "power": 0.2\n  }\n}',
    render(){return`<div class="jl-h1">LEECH</div><div class="jl-sub">PRESTIGE 6 — LESSON 10/12</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set leech power to <strong>0.4</strong>.</div></div>`;},
    validator(p){if(!p.passive||p.passive.power!==0.4)return'Leech power must be 0.4';return null;}},
  {id:'p6_11',title:'PASSIVE SYNERGY',icon:'C11',exercise:false,initialCode:'',
    render(){return`<div class="jl-h1">PASSIVE SYNERGY</div><div class="jl-sub">PRESTIGE 6 — LESSON 11/12</div><div class="jl-p">Combine passives for powerful synergistic effects.</div>`;},validator:null},
  {id:'p6_12',title:'PASSIVE MASTERY',icon:'C12',exercise:true,initialCode:'{\n  "passive": { "id": "regeneration", "power": 2.0 },\n  "passive2": { "id": "vampiric", "power": 1.5 }\n}',
    render(){return`<div class="jl-h1">PASSIVE MASTERY</div><div class="jl-sub">PRESTIGE 6 — LESSON 12/12</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Configure dual passives with high power.</div></div>`;},
    validator(p){if(!p.passive||!p.passive2)return'Need both passives';if(p.passive.power!==2.0||p.passive2.power!==1.5)return'Check power values';return null;}},
  // Prestige 7-12 simplified placeholders
  {id:'p7_01',title:'EXPORT JSON',icon:'D1',exercise:true,initialCode:'{\n  "id": "my_unit",\n  "name": "MY UNIT",\n  "hp": 250\n}',
    render(){return`<div class="jl-h1">EXPORT JSON</div><div class="jl-sub">PRESTIGE 7 — LESSON 1/12</div><div class="jl-p">Exporting unit JSON allows you to share units, backup your work, and transfer units between sessions.</div><div class="jl-rule"><div class="jl-rule-hdr">EXPORT PROCESS</div><div class="jl-rule-body">1. Complete the unit JSON below<br>2. Click EXPORT JSON in the Editor<br>3. Copy the JSON string<br>4. Save it externally or share it</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Complete the unit JSON with valid id, name, and hp fields.</div></div>`;},
    validator(p){if(!p.id||typeof p.id!=='string')return'Missing valid "id"';if(!p.name||typeof p.name!=='string')return'Missing valid "name"';if(typeof p.hp!=='number')return'Missing valid "hp"';return null;}},
  {id:'p7_02',title:'IMPORT JSON',icon:'D2',exercise:true,initialCode:'{\n  "id": "imported_unit",\n  "name": "IMPORTED",\n  "school": "arcane",\n  "hp": 280,\n  "armor": 5,\n  "spd": 2.0,\n  "magic": {\n    "enabled": true,\n    "school": "arcane",\n    "mana": { "max": 100, "regen": 8, "cost": 18 },\n    "spell": { "type": "bolt", "pattern": "single", "dmg": 35, "cd": 900, "range": 200 }\n  },\n  "ai": { "stance": "balanced" }\n}',
    render(){return`<div class="jl-h1">IMPORT JSON</div><div class="jl-sub">PRESTIGE 7 — LESSON 2/12</div><div class="jl-p">Importing JSON lets you load units from external sources, community shares, or your own backups.</div><div class="jl-rule"><div class="jl-rule-hdr">IMPORT REQUIREMENTS</div><div class="jl-rule-body">• Valid JSON structure<br>• Required fields: id, name, school, hp<br>• Valid school from available list<br>• No duplicate IDs in roster</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">The template is valid. Change the name to something unique and increase hp to <strong>320</strong>.</div></div>`;},
    validator(p){if(p.name==='IMPORTED')return'Change the name to something unique';if(p.hp!==320)return'HP must be 320';return null;}},
  {id:'p7_03',title:'JSON VALIDATION',icon:'D3',exercise:true,initialCode:'{\n  "hp": 250,\n  "armor": 5,\n  "magic": {\n    "enabled": true,\n    "spell": {\n      "dmg": 30,\n      "cd": 900\n    }\n  }\n}',
    render(){return`<div class="jl-h1">JSON VALIDATION</div><div class="jl-sub">PRESTIGE 7 — LESSON 3/12</div><div class="jl-p">Deep validation ensures units are balanced and won't cause game errors.</div><div class="jl-rule"><div class="jl-rule-hdr">VALIDATION CHECKS</div><div class="jl-rule-body">• Type checking (numbers, strings, booleans)<br>• Range validation (hp 50-800, speed 0.5-5)<br>• Required field presence<br>• School validity<br>• Nested object structure</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Add a <code>"name"</code> field with a string value, and set <code>magic.spell.dmg</code> to <strong>45</strong>.</div></div>`;},
    validator(p){if(!p.name||typeof p.name!=='string')return'Missing "name" string';if(!p.magic||!p.magic.spell||p.magic.spell.dmg!==45)return'Spell damage must be 45';return null;}},
  {id:'p7_04',title:'UNIT TEMPLATES',icon:'D4',exercise:true,initialCode:'{\n  "template": "glass_cannon",\n  "hp": 150,\n  "armor": 0,\n  "spd": 3.5,\n  "magic": {\n    "enabled": true,\n    "spell": { "dmg": 60, "cd": 700 }\n  }\n}',
    render(){return`<div class="jl-h1">UNIT TEMPLATES</div><div class="jl-sub">PRESTIGE 7 — LESSON 4/12</div><div class="jl-p">Templates provide starting points for common unit archetypes like glass cannon, tank, support.</div><div class="jl-rule"><div class="jl-rule-hdr">COMMON TEMPLATES</div><div class="jl-rule-body"><code>glass_cannon</code> — high damage, low HP<br><code>tank</code> — high HP/armor, slow<br><code>support</code> — healing, buffs<br><code>assassin</code> — high speed, burst damage</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Modify this glass cannon template: increase armor to <strong>5</strong> and reduce spell damage to <strong>50</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.spell||p.magic.spell.dmg!==50)return'Spell damage must be 50';if(p.armor!==5)return'Armor must be 5';return null;}},
  {id:'p7_05',title:'ADVANCED EDITING',icon:'D5',exercise:true,initialCode:'{\n  "hp": 250,\n  "magic": {\n    "spell": {\n      "dmg": 35,\n      "cd": 900,\n      "range": 200,\n      "critChance": 0.12,\n      "critMult": 1.8\n    }\n  }\n}',
    render(){return`<div class="jl-h1">ADVANCED EDITING</div><div class="jl-sub">PRESTIGE 7 — LESSON 5/12</div><div class="jl-p">Advanced editing techniques include bulk modifications, formula-based values, and conditional logic.</div><div class="jl-rule"><div class="jl-rule-hdr">EDITING TIPS</div><div class="jl-rule-body">• Use relative values (e.g., +10% damage)<br>• Balance tradeoffs (more damage = higher CD)<br>• Consider scaling with level<br>• Test incremental changes</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set critChance to <strong>0.25</strong>, critMult to <strong>2.2</strong>, and increase cd to <strong>1100</strong> to balance.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.spell)return'Missing magic.spell';if(p.magic.spell.critChance!==0.25)return'CritChance must be 0.25';if(p.magic.spell.critMult!==2.2)return'CritMult must be 2.2';if(p.magic.spell.cd!==1100)return'CD must be 1100';return null;}},
  {id:'p7_06',title:'BATCH OPERATIONS',icon:'D6',exercise:false,initialCode:'',
    render(){return`<div class="jl-h1">BATCH OPERATIONS</div><div class="jl-sub">PRESTIGE 7 — LESSON 6/12</div><div class="jl-p">Batch operations allow modifying multiple units simultaneously — useful for balance patches or theme updates.</div><div class="jl-rule"><div class="jl-rule-hdr">BATCH USE CASES</div><div class="jl-rule-body">• Apply global nerfs/buffs<br>• Update deprecated fields<br>• Standardize formatting<br>• Mass-rename properties</div></div><div class="jl-rule"><div class="jl-rule-hdr">EXAMPLE</div><div class="jl-rule-body">Increase all fire school units' burn damage by 10% across the roster.</div></div>`;},validator:null},
  {id:'p7_07',title:'VERSION CONTROL',icon:'D7',exercise:true,initialCode:'{\n  "version": "1.0",\n  "changelog": "Initial release",\n  "unit": {\n    "id": "versioned_unit",\n    "name": "VERSIONED",\n    "hp": 250\n  }\n}',
    render(){return`<div class="jl-h1">VERSION CONTROL</div><div class="jl-sub">PRESTIGE 7 — LESSON 7/12</div><div class="jl-p">Track unit versions to revert changes, compare iterations, and maintain balance history.</div><div class="jl-rule"><div class="jl-rule-hdr">VERSIONING PRACTICES</div><div class="jl-rule-body">• Increment version on significant changes<br>• Document balance adjustments<br>• Keep previous versions accessible<br>• Use semantic versioning (major.minor.patch)</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Update version to <code>"1.1"</code> and add a changelog entry describing a balance change.</div></div>`;},
    validator(p){if(p.version!=='1.1')return'Version must be "1.1"';if(!p.changelog||typeof p.changelog!=='string')return'Missing changelog string';return null;}},
  {id:'p7_08',title:'COLLABORATION',icon:'D8',exercise:false,initialCode:'',
    render(){return`<div class="jl-h1">COLLABORATION</div><div class="jl-sub">PRESTIGE 7 — LESSON 8/12</div><div class="jl-p">Share units with the community, get feedback, and collaborate on balance testing.</div><div class="jl-rule"><div class="jl-rule-hdr">SHARING BEST PRACTICES</div><div class="jl-rule-body">• Include unit description and intended role<br>• Note any synergies or counters<br>• Specify required prestige level<br>• Credit original creators</div></div><div class="jl-rule"><div class="jl-rule-hdr">COMMUNITY GUIDELINES</div><div class="jl-rule-body">• Test units before sharing<br>• Avoid game-breaking configurations<br>• Document special mechanics<br>• Accept constructive feedback</div></div>`;},validator:null},
  {id:'p7_09',title:'OPTIMIZATION',icon:'D9',exercise:true,initialCode:'{\n  "hp": 250,\n  "armor": 10,\n  "spd": 2.0,\n  "magic": {\n    "spell": {\n      "dmg": 35,\n      "cd": 900,\n      "range": 200\n    }\n  }\n}',
    render(){return`<div class="jl-h1">OPTIMIZATION</div><div class="jl-sub">PRESTIGE 7 — LESSON 9/12</div><div class="jl-p">Optimize unit JSON for performance, readability, and maintainability.</div><div class="jl-rule"><div class="jl-rule-hdr">OPTIMIZATION GOALS</div><div class="jl-rule-body">• Remove unused fields<br>• Use consistent formatting<br>• Minimize nested depth<br>• Choose appropriate data types</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Remove the <code>"armor"</code> field and increase <code>"spd"</code> to <strong>2.5</strong> to create a lighter, faster unit.</div></div>`;},
    validator(p){if(p.armor!==undefined)return'Remove the armor field';if(p.spd!==2.5)return'Speed must be 2.5';return null;}},
  {id:'p7_10',title:'DEBUGGING',icon:'D10',exercise:true,initialCode:'{\n  "magic": {\n    "spell": {\n      "dmg": 35,\n      "cd": 900,\n      "range": 200\n    }\n  }\n}',
    render(){return`<div class="jl-h1">DEBUGGING</div><div class="jl-sub">PRESTIGE 7 — LESSON 10/12</div><div class="jl-p">Debug unit behavior by inspecting JSON, testing values, and isolating issues.</div><div class="jl-rule"><div class="jl-rule-hdr">DEBUGGING PROCESS</div><div class="jl-rule-body">1. Identify the problem behavior<br>2. Isolate the relevant JSON section<br>3. Test individual field changes<br>4. Verify fix doesn't break other systems</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">The spell isn't firing fast enough. Reduce cd to <strong>600</strong> and verify range is at least <strong>180</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.spell)return'Missing magic.spell';if(p.magic.spell.cd!==600)return'CD must be 600';if(p.magic.spell.range<180)return'Range must be at least 180';return null;}},
  {id:'p7_11',title:'BEST PRACTICES',icon:'D11',exercise:false,initialCode:'',
    render(){return`<div class="jl-h1">BEST PRACTICES</div><div class="jl-sub">PRESTIGE 7 — LESSON 11/12</div><div class="jl-p">Industry best practices for creating balanced, maintainable, and fun units.</div><div class="jl-rule"><div class="jl-rule-hdr">DESIGN PRINCIPLES</div><div class="jl-rule-body">• Clear strengths and weaknesses<br>• Meaningful tradeoffs<br>• Unique identity<br>• Fun gameplay interactions</div></div><div class="jl-rule"><div class="jl-rule-hdr">BALANCE GUIDELINES</div><div class="jl-rule-body">• Test against varied opponents<br>• Consider scaling with progression<br>• Avoid one-shot mechanics<br>• Maintain counterplay options</div></div>`;},validator:null},
  {id:'p7_12',title:'GRANDMASTER EXAM',icon:'D12',exercise:true,initialCode:'{\n  "id": "grandmaster_unit",\n  "name": "GRANDMASTER",\n  "school": "void",\n  "hp": 300,\n  "armor": 8,\n  "spd": 2.3,\n  "passive": { "id": "vampiric", "power": 1.5 },\n  "magic": {\n    "enabled": true,\n    "school": "void",\n    "mana": { "max": 120, "regen": 10, "cost": 22 },\n    "spell": { "type": "bolt", "pattern": "spread",\n               "dmg": 40, "cd": 1000, "range": 240,\n               "critChance": 0.18, "critMult": 2.0 },\n    "bolt": { "speed": 5.0, "count": 3, "spread": 0.4, "homing": 0.2 },\n    "effect": { "type": "weaken", "power": 8, "duration": 2500 },\n    "sig": { "type": "beam", "chargeRate": 1.2, "power": 95 }\n  },\n  "ai": { "stance": "cunning", "aggression": 0.7, "dodge": 0.8,\n          "priority": { "magic": 1, "melee": 0, "ranged": 0 } }\n}',
    render(){return`<div class="jl-h1">GRANDMASTER EXAM</div><div class="jl-sub">PRESTIGE 7 — LESSON 12/12</div><div class="jl-p">Comprehensive test of all JSON knowledge. Create a balanced, competitive unit.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ GRANDMASTER TRIAL</div><div class="jl-ex-body">Customize this unit: change name, adjust any stats, but keep it balanced. When ready, the unit will be evaluated for viability.</div></div><div class="jl-rule"><div class="jl-rule-hdr">EVALUATION CRITERIA</div><div class="jl-rule-body">• Valid JSON structure<br>• Balanced stats (no extreme values)<br>• Coherent design theme<br>• Proper field types</div></div>`;},
    validator(p){if(!p.id||!p.name||!p.school)return'Missing required fields';if(p.hp<100||p.hp>600)return'HP out of reasonable range';if(p.spd<1.0||p.spd>4.0)return'Speed out of reasonable range';return null;}},
  // Prestige 8 lessons - Advanced Combat Systems
  {id:'p8_01',title:'MULTI-TARGET SPELLS',icon:'E1',exercise:true,initialCode:'{\n  "magic": {\n    "spell": {\n      "pattern": "burst",\n      "dmg": 25,\n      "cd": 1200\n    },\n    "bolt": {\n      "count": 6,\n      "spread": 0.6\n    }\n  }\n}',
    render(){return`<div class="jl-h1">MULTI-TARGET SPELLS</div><div class="jl-sub">PRESTIGE 8 — LESSON 1/12</div><div class="jl-p">Multi-target spells hit multiple enemies or areas simultaneously using burst, ring, or wave patterns.</div><div class="jl-rule"><div class="jl-rule-hdr">MULTI-TARGET PATTERNS</div><div class="jl-rule-body"><code>burst</code> — radial explosion<br><code>ring</code> — expanding circle<br><code>wave</code> — directional cone<br><code>barrage</code> — rapid sequence</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set bolt count to <strong>10</strong> and spread to <strong>0.8</strong> for maximum area coverage.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.bolt)return'Missing magic.bolt';if(p.magic.bolt.count!==10)return'Bolt count must be 10';if(p.magic.bolt.spread!==0.8)return'Spread must be 0.8';return null;}},
  {id:'p8_02',title:'CHAIN LIGHTNING',icon:'E2',exercise:true,initialCode:'{\n  "magic": {\n    "spell": {\n      "pattern": "chain",\n      "dmg": 30,\n      "cd": 1500,\n      "chainCount": 3\n    }\n  }\n}',
    render(){return`<div class="jl-h1">CHAIN LIGHTNING</div><div class="jl-sub">PRESTIGE 8 — LESSON 2/12</div><div class="jl-p">Chain lightning jumps between targets, dealing reduced damage with each bounce.</div><div class="jl-rule"><div class="jl-rule-hdr">CHAIN MECHANICS</div><div class="jl-rule-body">• chainCount determines bounces<br>• Damage reduces by 20% per bounce<br>• Requires multiple targets nearby<br>• Storm school bonus</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set chainCount to <strong>5</strong> and increase base damage to <strong>40</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.spell)return'Missing magic.spell';if(p.magic.spell.chainCount!==5)return'ChainCount must be 5';if(p.magic.spell.dmg!==40)return'Damage must be 40';return null;}},
  {id:'p8_03',title:'METEOR STRIKES',icon:'E3',exercise:true,initialCode:'{\n  "magic": {\n    "sig": {\n      "type": "meteor",\n      "power": 100,\n      "chargeRate": 0.8,\n      "radius": 80\n    }\n  }\n}',
    render(){return`<div class="jl-h1">METEOR STRIKES</div><div class="jl-sub">PRESTIGE 8 — LESSON 3/12</div><div class="jl-p">Meteor signatures call down devastating area attacks with delay and impact.</div><div class="jl-rule"><div class="jl-rule-hdr">METEOR PROPERTIES</div><div class="jl-rule-body">• High damage, slow charge<br>• Large impact radius<br>• Warning indicator<br>• Fire school synergy</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set power to <strong>150</strong>, radius to <strong>100</strong>, and chargeRate to <strong>1.0</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.sig)return'Missing magic.sig';if(p.magic.sig.power!==150)return'Power must be 150';if(p.magic.sig.radius!==100)return'Radius must be 100';if(p.magic.sig.chargeRate!==1.0)return'ChargeRate must be 1.0';return null;}},
  {id:'p8_04',title:'ZONE CONTROL',icon:'E4',exercise:true,initialCode:'{\n  "magic": {\n    "sig": {\n      "type": "zone",\n      "power": 40,\n      "duration": 5000,\n      "radius": 60\n    }\n  }\n}',
    render(){return`<div class="jl-h1">ZONE CONTROL</div><div class="jl-sub">PRESTIGE 8 — LESSON 4/12</div><div class="jl-p">Zone signatures create persistent area effects that damage or control space.</div><div class="jl-rule"><div class="jl-rule-hdr">ZONE TYPES</div><div class="jl-rule-body"><code>zone</code> — persistent damage area<br>• Continuous effect over duration<br>• Denies ground area<br>• Synergizes with slow effects</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set duration to <strong>8000</strong> and radius to <strong>80</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.sig)return'Missing magic.sig';if(p.magic.sig.duration!==8000)return'Duration must be 8000';if(p.magic.sig.radius!==80)return'Radius must be 80';return null;}},
  {id:'p8_05',title:'SUMMONING',icon:'E5',exercise:false,initialCode:'',
    render(){return`<div class="jl-h1">SUMMONING</div><div class="jl-sub">PRESTIGE 8 — LESSON 5/12</div><div class="jl-p">Advanced units can summon temporary allies or constructs to fight alongside them.</div><div class="jl-rule"><div class="jl-rule-hdr">SUMMON MECHANICS</div><div class="jl-rule-body">• Summon duration and health<br>• Summon inherits caster stats<br>• Summon abilities and AI<br>• Mana cost per summon</div></div>`;},validator:null},
  {id:'p8_06',title:'TIME MANIPULATION',icon:'E6',exercise:true,initialCode:'{\n  "magic": {\n    "effect": {\n      "type": "slow",\n      "power": 0.3,\n      "duration": 2000\n    }\n  }\n}',
    render(){return`<div class="jl-h1">TIME MANIPULATION</div><div class="jl-sub">PRESTIGE 8 — LESSON 6/12</div><div class="jl-p">Time effects slow, hasten, or freeze targets, controlling the flow of battle.</div><div class="jl-rule"><div class="jl-rule-hdr">TIME EFFECTS</div><div class="jl-rule-body"><code>slow</code> — reduces movement speed<br><code>haste</code> — increases action speed<br><code>freeze</code> — complete immobilization<br><code>stasis</code> — invulnerability + freeze</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set slow power to <strong>0.6</strong> and duration to <strong>4000</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.effect)return'Missing magic.effect';if(p.magic.effect.power!==0.6)return'Slow power must be 0.6';if(p.magic.effect.duration!==4000)return'Duration must be 4000';return null;}},
  {id:'p8_07',title:'DAMAGE OVER TIME',icon:'E7',exercise:true,initialCode:'{\n  "magic": {\n    "effect": {\n      "type": "burn",\n      "power": 5,\n      "duration": 3000,\n      "tickRate": 500\n    }\n  }\n}',
    render(){return`<div class="jl-h1">DAMAGE OVER TIME</div><div class="jl-sub">PRESTIGE 8 — LESSON 7/12</div><div class="jl-p">DoT effects deal damage repeatedly over their duration, bypassing armor.</div><div class="jl-rule"><div class="jl-rule-hdr">DOT MECHANICS</div><div class="jl-rule-body">• power = damage per tick<br>• tickRate = time between ticks<br>• total damage = power × (duration/tickRate)<br>• Stacks with multiple applications</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set power to <strong>10</strong>, duration to <strong>5000</strong>, tickRate to <strong>250</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.effect)return'Missing magic.effect';if(p.magic.effect.power!==10)return'Power must be 10';if(p.magic.effect.duration!==5000)return'Duration must be 5000';if(p.magic.effect.tickRate!==250)return'TickRate must be 250';return null;}},
  {id:'p8_08',title:'SHIELD BREAKING',icon:'E8',exercise:true,initialCode:'{\n  "magic": {\n    "spell": {\n      "dmg": 35,\n      "armorPen": 0.0\n    }\n  }\n}',
    render(){return`<div class="jl-h1">SHIELD BREAKING</div><div class="jl-sub">PRESTIGE 8 — LESSON 8/12</div><div class="jl-p">Armor penetration and shield breaking allow bypassing defensive layers.</div><div class="jl-rule"><div class="jl-rule-hdr">PENETRATION TYPES</div><div class="jl-rule-body"><code>armorPen</code> — ignores armor percentage<br><code>shieldBreak</code> — destroys shields<br><code>trueDamage</code> — ignores all mitigation<br>• Void school synergy</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set armorPen to <strong>0.7</strong> and increase damage to <strong>50</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.spell)return'Missing magic.spell';if(p.magic.spell.armorPen!==0.7)return'ArmorPen must be 0.7';if(p.magic.spell.dmg!==50)return'Damage must be 50';return null;}},
  {id:'p8_09',title:'LIFESTEAL SPELLS',icon:'E9',exercise:true,initialCode:'{\n  "magic": {\n    "spell": {\n      "type": "drain",\n      "dmg": 30,\n      "lifesteal": 0.3\n    }\n  }\n}',
    render(){return`<div class="jl-h1">LIFESTEAL SPELLS</div><div class="jl-sub">PRESTIGE 8 — LESSON 9/12</div><div class="jl-p">Drain spells damage the enemy and heal the caster simultaneously.</div><div class="jl-rule"><div class="jl-rule-hdr">DRAIN MECHANICS</div><div class="jl-rule-body">• lifesteal = heal percentage of damage<br>• Effective against high-HP targets<br>• Sustain in prolonged fights<br>• Nature/Void school synergy</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set lifesteal to <strong>0.6</strong> and damage to <strong>40</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.spell)return'Missing magic.spell';if(p.magic.spell.lifesteal!==0.6)return'Lifesteal must be 0.6';if(p.magic.spell.dmg!==40)return'Damage must be 40';return null;}},
  {id:'p8_10',title:'REFLECTION SPELLS',icon:'E10',exercise:true,initialCode:'{\n  "magic": {\n    "effect": {\n      "type": "reflection",\n      "power": 0.5,\n      "duration": 3000\n    }\n  }\n}',
    render(){return`<div class="jl-h1">REFLECTION SPELLS</div><div class="jl-sub">PRESTIGE 8 — LESSON 10/12</div><div class="jl-p">Reflection effects return a portion of incoming damage back to the attacker.</div><div class="jl-rule"><div class="jl-rule-hdr">REFLECTION MECHANICS</div><div class="jl-rule-body">• power = damage reflected (0-1)<br>• Triggers on any damage source<br>• Can trigger on self-damage<br>• Effective against burst</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set reflection power to <strong>0.8</strong> and duration to <strong>5000</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.effect)return'Missing magic.effect';if(p.magic.effect.power!==0.8)return'Reflection power must be 0.8';if(p.magic.effect.duration!==5000)return'Duration must be 5000';return null;}},
  {id:'p8_11',title:'SPELL INTERACTIONS',icon:'E11',exercise:false,initialCode:'',
    render(){return`<div class="jl-h1">SPELL INTERACTIONS</div><div class="jl-sub">PRESTIGE 8 — LESSON 11/12</div><div class="jl-p">Spells can interact with each other — amplifying, canceling, or transforming effects.</div><div class="jl-rule"><div class="jl-rule-hdr">INTERACTION TYPES</div><div class="jl-rule-body">• Elemental amplification (fire + burn)<br>• Contrasting effects (slow + haste)<br>• Stacking rules<br>• Priority and override</div></div>`;},validator:null},
  {id:'p8_12',title:'SPELL MASTERY',icon:'E12',exercise:true,initialCode:'{\n  "magic": {\n    "spell": {\n      "type": "bolt",\n      "pattern": "spiral",\n      "dmg": 45,\n      "cd": 1100,\n      "range": 260,\n      "critChance": 0.22,\n      "critMult": 2.3,\n      "armorPen": 0.4\n    },\n    "bolt": {\n      "speed": 6.0,\n      "count": 4,\n      "spread": 0.5,\n      "homing": 0.3\n    },\n    "effect": {\n      "type": "burn",\n      "power": 12,\n      "duration": 4000\n    }\n  }\n}',
    render(){return`<div class="jl-h1">SPELL MASTERY</div><div class="jl-sub">PRESTIGE 8 — LESSON 12/12</div><div class="jl-p">Combine all spell mechanics into a devastating, balanced ability.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ MASTERY EXERCISE</div><div class="jl-ex-body">Configure a spiral pattern spell with homing bolts, burn effect, and armor penetration. Set critChance to <strong>0.25</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.spell)return'Missing magic.spell';if(p.magic.spell.critChance!==0.25)return'CritChance must be 0.25';if(p.magic.spell.pattern!=='spiral')return'Pattern must be spiral';if(!p.magic.effect||p.magic.effect.type!=='burn')return'Need burn effect';return null;}},
  // Prestige 9 lessons - Advanced AI & Behavior
  {id:'p9_01',title:'PREDICTIVE AI',icon:'F1',exercise:true,initialCode:'{\n  "ai": {\n    "predictive": true,\n    "lookahead": 500,\n    "reactionTime": 200\n  }\n}',
    render(){return`<div class="jl-h1">PREDICTIVE AI</div><div class="jl-sub">PRESTIGE 9 — LESSON 1/12</div><div class="jl-p">Predictive AI anticipates enemy movements and actions, positioning advantageously before attacks occur.</div><div class="jl-rule"><div class="jl-rule-hdr">PREDICTION MECHANICS</div><div class="jl-rule-body">• lookahead = prediction window (ms)<br>• reactionTime = response delay<br>• Higher CPU cost<br>• More effective against predictable patterns</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set lookahead to <strong>800</strong> and reactionTime to <strong>100</strong>.</div></div>`;},
    validator(p){if(!p.ai||!p.ai.predictive)return'Predictive must be enabled';if(p.ai.lookahead!==800)return'Lookahead must be 800';if(p.ai.reactionTime!==100)return'ReactionTime must be 100';return null;}},
  {id:'p9_02',title:'LEARNING AI',icon:'F2',exercise:true,initialCode:'{\n  "ai": {\n    "learning": true,\n    "adaptationRate": 0.5,\n    "memoryDepth": 10\n  }\n}',
    render(){return`<div class="jl-h1">LEARNING AI</div><div class="jl-sub">PRESTIGE 9 — LESSON 2/12</div><div class="jl-p">Learning AI adapts to player patterns over time, becoming more effective the longer the battle lasts.</div><div class="jl-rule"><div class="jl-rule-hdr">LEARNING PARAMETERS</div><div class="jl-rule-body">• adaptationRate = how quickly it adjusts<br>• memoryDepth = how many past actions remembered<br>• Can learn counters<br>• Resets each battle</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set adaptationRate to <strong>0.8</strong> and memoryDepth to <strong>15</strong>.</div></div>`;},
    validator(p){if(!p.ai||!p.ai.learning)return'Learning must be enabled';if(p.ai.adaptationRate!==0.8)return'AdaptationRate must be 0.8';if(p.ai.memoryDepth!==15)return'MemoryDepth must be 15';return null;}},
  {id:'p9_03',title:'TEAM COORDINATION',icon:'F3',exercise:true,initialCode:'{\n  "ai": {\n    "teamCoordination": true,\n    "focusFire": true,\n    "protectPriority": 0.7\n  }\n}',
    render(){return`<div class="jl-h1">TEAM COORDINATION</div><div class="jl-sub">PRESTIGE 9 — LESSON 3/12</div><div class="jl-p">Team coordination allows AI units to work together, focusing fire and protecting allies.</div><div class="jl-rule"><div class="jl-rule-hdr">COORDINATION FEATURES</div><div class="jl-rule-body">• focusFire = attack same target<br>• protectPriority = willingness to defend allies<br>• Synced abilities<br>• Requires multiple AI units</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Enable both focusFire and teamCoordination, set protectPriority to <strong>0.9</strong>.</div></div>`;},
    validator(p){if(!p.ai||!p.ai.teamCoordination||!p.ai.focusFire)return'Both features must be enabled';if(p.ai.protectPriority!==0.9)return'ProtectPriority must be 0.9';return null;}},
  {id:'p9_04',title:'FEINTING',icon:'F4',exercise:true,initialCode:'{\n  "ai": {\n    "feintChance": 0.2,\n    "feintPattern": "retreat"\n  }\n}',
    render(){return`<div class="jl-h1">FEINTING</div><div class="jl-sub">PRESTIGE 9 — LESSON 4/12</div><div class="jl-p">Feinting AI creates fake movements to bait enemy reactions, then exploits the opening.</div><div class="jl-rule"><div class="jl-rule-hdr">FEINT PATTERNS</div><div class="jl-rule-body"><code>retreat</code> — fake retreat then advance<br><code>flank</code> — fake one direction, go other<br><code>charge</code> — fake hesitation, then burst<br>• Cunning stance bonus</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set feintChance to <strong>0.4</strong> and pattern to <code>"flank"</code>.</div></div>`;},
    validator(p){if(!p.ai||p.ai.feintChance!==0.4)return'FeintChance must be 0.4';if(p.ai.feintPattern!=='flank')return'Pattern must be flank';return null;}},
  {id:'p9_05',title:'POSITIONING',icon:'F5',exercise:true,initialCode:'{\n  "ai": {\n    "preferredDistance": 150,\n    "distanceTolerance": 30,\n    "flankingEnabled": true\n  }\n}',
    render(){return`<div class="jl-h1">POSITIONING</div><div class="jl-sub">PRESTIGE 9 — LESSON 5/12</div><div class="jl-p">Advanced positioning maintains optimal distance and uses flanking routes.</div><div class="jl-rule"><div class="jl-rule-hdr">POSITIONING MECHANICS</div><div class="jl-rule-body">• preferredDistance = ideal range<br>• distanceTolerance = acceptable variance<br>• flankingEnabled = use side routes<br>• Sniper stance bonus</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set preferredDistance to <strong>200</strong>, tolerance to <strong>20</strong>, enable flanking.</div></div>`;},
    validator(p){if(!p.ai)return'Missing ai';if(p.ai.preferredDistance!==200)return'PreferredDistance must be 200';if(p.ai.distanceTolerance!==20)return'Tolerance must be 20';if(!p.ai.flankingEnabled)return'Flanking must be enabled';return null;}},
  {id:'p9_06',title:'RESOURCE MANAGEMENT',icon:'F6',exercise:true,initialCode:'{\n  "ai": {\n    "manaConservation": 0.3,\n    "signatureThreshold": 0.8,\n    "emergencyReserve": 20\n  }\n}',
    render(){return`<div class="jl-h1">RESOURCE MANAGEMENT</div><div class="jl-sub">PRESTIGE 9 — LESSON 6/12</div><div class="jl-p">AI can manage mana and signature charges strategically rather than spamming abilities.</div><div class="jl-rule"><div class="jl-rule-hdr">RESOURCE RULES</div><div class="jl-rule-body">• manaConservation = reserve percentage<br>• signatureThreshold = when to use sig<br>• emergencyReserve = minimum mana<br>• Prevents resource exhaustion</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set manaConservation to <strong>0.5</strong>, signatureThreshold to <strong>0.9</strong>.</div></div>`;},
    validator(p){if(!p.ai)return'Missing ai';if(p.ai.manaConservation!==0.5)return'ManaConservation must be 0.5';if(p.ai.signatureThreshold!==0.9)return'SignatureThreshold must be 0.9';return null;}},
  {id:'p9_07',title:'THREAT ASSESSMENT',icon:'F7',exercise:true,initialCode:'{\n  "ai": {\n    "threatAssessment": true,\n    "threatFactors": {\n      "damage": 1.0,\n      "range": 0.5,\n      "mobility": 0.3\n    }\n  }\n}',
    render(){return`<div class="jl-h1">THREAT ASSESSMENT</div><div class="jl-sub">PRESTIGE 9 — LESSON 7/12</div><div class="jl-p">Threat assessment evaluates enemy danger levels to prioritize targets and defensive actions.</div><div class="jl-rule"><div class="jl-rule-hdr">THREAT FACTORS</div><div class="jl-rule-body">• damage = offensive threat<br>• range = engagement threat<br>• mobility = positioning threat<br>• Weighted sum determines priority</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set damage factor to <strong>1.5</strong> and mobility to <strong>0.8</strong>.</div></div>`;},
    validator(p){if(!p.ai||!p.ai.threatFactors)return'Missing threatFactors';if(p.ai.threatFactors.damage!==1.5)return'Damage factor must be 1.5';if(p.ai.threatFactors.mobility!==0.8)return'Mobility must be 0.8';return null;}},
  {id:'p9_08',title:'COUNTER PLAY',icon:'F8',exercise:true,initialCode:'{\n  "ai": {\n    "counterPlay": true,\n    "counterWindow": 300,\n    "counterReaction": 0.7\n  }\n}',
    render(){return`<div class="jl-h1">COUNTER PLAY</div><div class="jl-sub">PRESTIGE 9 — LESSON 8/12</div><div class="jl-p">Counter play AI recognizes enemy attack patterns and responds with appropriate counters.</div><div class="jl-rule"><div class="jl-rule-hdr">COUNTER MECHANICS</div><div class="jl-rule-body">• counterWindow = time to react<br>• counterReaction = response likelihood<br>• Requires threat assessment<br>• Cunning stance bonus</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set counterWindow to <strong>200</strong> and counterReaction to <strong>0.9</strong>.</div></div>`;},
    validator(p){if(!p.ai||!p.ai.counterPlay)return'CounterPlay must be enabled';if(p.ai.counterWindow!==200)return'CounterWindow must be 200';if(p.ai.counterReaction!==0.9)return'CounterReaction must be 0.9';return null;}},
  {id:'p9_09',title:'ADAPTIVE STANCE',icon:'F9',exercise:true,initialCode:'{\n  "ai": {\n    "adaptiveStance": true,\n    "stanceConditions": {\n      "lowHP": "defensive",\n      "highMana": "aggressive",\n      "enemyClose": "berserk"\n    }\n  }\n}',
    render(){return`<div class="jl-h1">ADAPTIVE STANCE</div><div class="jl-sub">PRESTIGE 9 — LESSON 9/12</div><div class="jl-p">Adaptive stance changes AI behavior based on battle conditions.</div><div class="jl-rule"><div class="jl-rule-hdr">STANCE CONDITIONS</div><div class="jl-rule-body">• lowHP → defensive when hurt<br>• highMana → aggressive when resources available<br>• enemyClose → berserk when engaged<br>• Dynamic behavior adjustment</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Add condition: <code>"enemyFar": "sniper"</code> and enable adaptiveStance.</div></div>`;},
    validator(p){if(!p.ai||!p.ai.adaptiveStance)return'AdaptiveStance must be enabled';if(!p.ai.stanceConditions||p.ai.stanceConditions.enemyFar!=='sniper')return'Missing enemyFar sniper condition';return null;}},
  {id:'p9_10',title:'ABILITY TIMING',icon:'F10',exercise:true,initialCode:'{\n  "ai": {\n    "abilityTiming": {\n      "signature": "finisher",\n      "burst": "opening",\n      "heal": "reactive"\n    }\n  }\n}',
    render(){return`<div class="jl-h1">ABILITY TIMING</div><div class="jl-sub">PRESTIGE 9 — LESSON 10/12</div><div class="jl-p">Ability timing determines when AI uses specific abilities for maximum impact.</div><div class="jl-rule"><div class="jl-rule-hdr">TIMING STRATEGIES</div><div class="jl-rule-body"><code>opening</code> — use immediately<br><code>finisher</code> — use for kill<br><code>reactive</code> — use when needed<br><code>opportunistic</code> — use when advantageous</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set signature timing to <code>"opportunistic"</code> and burst to <code>"finisher"</code>.</div></div>`;},
    validator(p){if(!p.ai||!p.ai.abilityTiming)return'Missing abilityTiming';if(p.ai.abilityTiming.signature!=='opportunistic')return'Signature must be opportunistic';if(p.ai.abilityTiming.burst!=='finisher')return'Burst must be finisher';return null;}},
  {id:'p9_11',title:'AI PERSONALITY',icon:'F11',exercise:false,initialCode:'',
    render(){return`<div class="jl-h1">AI PERSONALITY</div><div class="jl-sub">PRESTIGE 9 — LESSON 11/12</div><div class="jl-p">AI personality combines all behavioral traits into a cohesive character.</div><div class="jl-rule"><div class="jl-rule-hdr">PERSONALITY COMPONENTS</div><div class="jl-rule-body">• Aggression vs caution<br>• Predictability vs randomness<br>• Team focus vs self-preservation<br>• Risk tolerance</div></div>`;},validator:null},
  {id:'p9_12',title:'AI MASTERY',icon:'F12',exercise:true,initialCode:'{\n  "ai": {\n    "stance": "cunning",\n    "aggression": 0.6,\n    "dodge": 0.9,\n    "aim": 0.95,\n    "predictive": true,\n    "learning": true,\n    "teamCoordination": true,\n    "counterPlay": true\n  }\n}',
    render(){return`<div class="jl-h1">AI MASTERY</div><div class="jl-sub">PRESTIGE 9 — LESSON 12/12</div><div class="jl-p">Combine all AI systems into a masterfully intelligent opponent.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ MASTERY EXERCISE</div><div class="jl-ex-body">Enable all advanced AI features and set dodge to <strong>0.95</strong>.</div></div>`;},
    validator(p){if(!p.ai)return'Missing ai';if(p.ai.dodge!==0.95)return'Dodge must be 0.95';if(!p.ai.predictive||!p.ai.learning||!p.ai.teamCoordination||!p.ai.counterPlay)return'Enable all advanced features';return null;}},
  // Prestige 10 lessons - Advanced Unit Systems
  {id:'p10_01',title:'EVOLUTION MECHANICS',icon:'G1',exercise:true,initialCode:'{\n  "evolution": {\n    "enabled": true,\n    "stages": 3,\n    "trigger": "level"\n  }\n}',
    render(){return`<div class="jl-h1">EVOLUTION MECHANICS</div><div class="jl-sub">PRESTIGE 10 — LESSON 1/12</div><div class="jl-p">Evolution allows units to transform into stronger forms during battle based on conditions.</div><div class="jl-rule"><div class="jl-rule-hdr">EVOLUTION TRIGGERS</div><div class="jl-rule-body"><code>level</code> — XP threshold<br><code>time</code> — battle duration<br><code>kills</code> — enemy defeats<br><code>lowHP</code> — desperation form</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set stages to <strong>5</strong> and trigger to <code>"time"</code>.</div></div>`;},
    validator(p){if(!p.evolution||!p.evolution.enabled)return'Evolution must be enabled';if(p.evolution.stages!==5)return'Stages must be 5';if(p.evolution.trigger!=='time')return'Trigger must be time';return null;}},
  {id:'p10_02',title:'MUTATION SYSTEM',icon:'G2',exercise:true,initialCode:'{\n  "mutation": {\n    "enabled": true,\n    "rate": 0.1,\n    "beneficialOnly": false\n  }\n}',
    render(){return`<div class="jl-h1">MUTATION SYSTEM</div><div class="jl-sub">PRESTIGE 10 — LESSON 2/12</div><div class="jl-p">Mutation introduces random stat changes each battle, creating unique unit variants.</div><div class="jl-rule"><div class="jl-rule-hdr">MUTATION RULES</div><div class="jl-rule-body">• rate = mutation chance per battle<br>• beneficialOnly = restrict to buffs<br>• Can affect any stat<br>• Void school synergy</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set rate to <strong>0.3</strong> and enable beneficialOnly.</div></div>`;},
    validator(p){if(!p.mutation||!p.mutation.enabled)return'Mutation must be enabled';if(p.mutation.rate!==0.3)return'Rate must be 0.3';if(!p.mutation.beneficialOnly)return'BeneficialOnly must be true';return null;}},
  {id:'p10_03',title:'SYNERGY BONUSES',icon:'G3',exercise:true,initialCode:'{\n  "synergy": {\n    "fire": 1.2,\n    "void": 1.1,\n    "sameSchool": 1.15\n  }\n}',
    render(){return`<div class="jl-h1">SYNERGY BONUSES</div><div class="jl-sub">PRESTIGE 10 — LESSON 3/12</div><div class="jl-p">Synergy bonuses provide multipliers when units with matching traits fight together.</div><div class="jl-rule"><div class="jl-rule-hdr">SYNERGY TYPES</div><div class="jl-rule-body">• School-based bonuses<br>• Same-team multiplier<br>• Passive combinations<br>• Ability chaining</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set fire synergy to <strong>1.5</strong> and sameSchool to <strong>1.3</strong>.</div></div>`;},
    validator(p){if(!p.synergy)return'Missing synergy';if(p.synergy.fire!==1.5)return'Fire synergy must be 1.5';if(p.synergy.sameSchool!==1.3)return'SameSchool must be 1.3';return null;}},
  {id:'p10_04',title:'COMBO CHAINS',icon:'G4',exercise:true,initialCode:'{\n  "comboChain": {\n    "enabled": true,\n    "maxLength": 5,\n    "decayRate": 0.1\n  }\n}',
    render(){return`<div class="jl-h1">COMBO CHAINS</div><div class="jl-sub">PRESTIGE 10 — LESSON 4/12</div><div class="jl-p">Combo chains reward consecutive successful actions with increasing bonuses.</div><div class="jl-rule"><div class="jl-rule-hdr">COMBO MECHANICS</div><div class="jl-rule-body">• maxLength = maximum chain length<br>• decayRate = bonus loss per miss<br>• Resets on death or long idle<br>• Berserk stance bonus</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set maxLength to <strong>8</strong> and decayRate to <strong>0.05</strong>.</div></div>`;},
    validator(p){if(!p.comboChain||!p.comboChain.enabled)return'ComboChain must be enabled';if(p.comboChain.maxLength!==8)return'MaxLength must be 8';if(p.comboChain.decayRate!==0.05)return'DecayRate must be 0.05';return null;}},
  {id:'p10_05',title:'ADAPTIVE STATS',icon:'G5',exercise:true,initialCode:'{\n  "adaptiveStats": {\n    "enabled": true,\n    "responseTime": 2000,\n    "maxBonus": 0.5\n  }\n}',
    render(){return`<div class="jl-h1">ADAPTIVE STATS</div><div class="jl-sub">PRESTIGE 10 — LESSON 5/12</div><div class="jl-p">Adaptive stats dynamically adjust based on battle conditions and enemy composition.</div><div class="jl-rule"><div class="jl-rule-hdr">ADAPTATION RULES</div><div class="jl-rule-body">• responseTime = adjustment speed<br>• maxBonus = maximum stat change<br>• Can boost or reduce<br>• Nature school synergy</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set responseTime to <strong>1000</strong> and maxBonus to <strong>0.8</strong>.</div></div>`;},
    validator(p){if(!p.adaptiveStats||!p.adaptiveStats.enabled)return'AdaptiveStats must be enabled';if(p.adaptiveStats.responseTime!==1000)return'ResponseTime must be 1000';if(p.adaptiveStats.maxBonus!==0.8)return'MaxBonus must be 0.8';return null;}},
  {id:'p10_06',title:'SOUL LINK',icon:'G6',exercise:true,initialCode:'{\n  "soulLink": {\n    "enabled": true,\n    "partner": "ally_id",\n    "shareDamage": 0.5,\n    "shareHealing": 0.5\n  }\n}',
    render(){return`<div class="jl-h1">SOUL LINK</div><div class="jl-sub">PRESTIGE 10 — LESSON 6/12</div><div class="jl-p">Soul link connects two units, sharing damage and healing between them.</div><div class="jl-rule"><div class="jl-rule-hdr">LINK MECHANICS</div><div class="jl-rule-body">• shareDamage = damage split percentage<br>• shareHealing = healing split percentage<br>• Both units affected<br>• Breaks on death</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set shareDamage to <strong>0.7</strong> and shareHealing to <strong>0.8</strong>.</div></div>`;},
    validator(p){if(!p.soulLink||!p.soulLink.enabled)return'SoulLink must be enabled';if(p.soulLink.shareDamage!==0.7)return'ShareDamage must be 0.7';if(p.soulLink.shareHealing!==0.8)return'ShareHealing must be 0.8';return null;}},
  {id:'p10_07',title:'REINCARNATION',icon:'G7',exercise:true,initialCode:'{\n  "reincarnation": {\n    "enabled": true,\n    "charges": 1,\n    "hpPercent": 0.5,\n    "cooldown": 30000\n  }\n}',
    render(){return`<div class="jl-h1">REINCARNATION</div><div class="jl-sub">PRESTIGE 10 — LESSON 7/12</div><div class="jl-p">Reincarnation allows units to revive after death with reduced stats.</div><div class="jl-rule"><div class="jl-rule-hdr">REINCARNATION RULES</div><div class="jl-rule-body">• charges = number of revives<br>• hpPercent = HP on return<br>• cooldown = time between revives<br>• Void school synergy</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set charges to <strong>2</strong>, hpPercent to <strong>0.75</strong>.</div></div>`;},
    validator(p){if(!p.reincarnation||!p.reincarnation.enabled)return'Reincarnation must be enabled';if(p.reincarnation.charges!==2)return'Charges must be 2';if(p.reincarnation.hpPercent!==0.75)return'HpPercent must be 0.75';return null;}},
  {id:'p10_08',title:'ABSORPTION',icon:'G8',exercise:true,initialCode:'{\n  "absorption": {\n    "enabled": true,\n    "type": "magic",\n    "efficiency": 0.5,\n    "cap": 100\n  }\n}',
    render(){return`<div class="jl-h1">ABSORPTION</div><div class="jl-sub">PRESTIGE 10 — LESSON 8/12</div><div class="jl-p">Absorption converts incoming damage of a specific type into healing or shields.</div><div class="jl-rule"><div class="jl-rule-hdr">ABSORPTION TYPES</div><div class="jl-rule-body"><code>magic</code> — spell damage<br><code>physical</code> — melee/ranged<br><code>all</code> — any damage<br>• efficiency = conversion rate</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set type to <code>"all"</code>, efficiency to <strong>0.7</strong>, cap to <strong>150</strong>.</div></div>`;},
    validator(p){if(!p.absorption||!p.absorption.enabled)return'Absorption must be enabled';if(p.absorption.type!=='all')return'Type must be all';if(p.absorption.efficiency!==0.7)return'Efficiency must be 0.7';if(p.absorption.cap!==150)return'Cap must be 150';return null;}},
  {id:'p10_09',title:'PHASE SHIFT',icon:'G9',exercise:true,initialCode:'{\n  "phaseShift": {\n    "enabled": true,\n    "duration": 2000,\n    "cooldown": 15000,\n    "invulnerable": true\n  }\n}',
    render(){return`<div class="jl-h1">PHASE SHIFT</div><div class="jl-sub">PRESTIGE 10 — LESSON 9/12</div><div class="jl-p">Phase shift temporarily removes the unit from existence, avoiding all damage and effects.</div><div class="jl-rule"><div class="jl-rule-hdr">PHASE MECHANICS</div><div class="jl-rule-body">• duration = shift length<br>• cooldown = time between shifts<br>• invulnerable = complete immunity<br>• Cannot act during shift</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set duration to <strong>3000</strong> and cooldown to <strong>20000</strong>.</div></div>`;},
    validator(p){if(!p.phaseShift||!p.phaseShift.enabled)return'PhaseShift must be enabled';if(p.phaseShift.duration!==3000)return'Duration must be 3000';if(p.phaseShift.cooldown!==20000)return'Cooldown must be 20000';return null;}},
  {id:'p10_10',title:'TEMPORAL CLONE',icon:'G10',exercise:true,initialCode:'{\n  "temporalClone": {\n    "enabled": true,\n    "count": 1,\n    "duration": 5000,\n    "power": 0.5\n  }\n}',
    render(){return`<div class="jl-h1">TEMPORAL CLONE</div><div class="jl-sub">PRESTIGE 10 — LESSON 10/12</div><div class="jl-p">Temporal clones create temporary copies that fight alongside the original.</div><div class="jl-rule"><div class="jl-rule-hdr">CLONE PROPERTIES</div><div class="jl-rule-body">• count = number of clones<br>• duration = clone lifetime<br>• power = damage output percentage<br>• Inherits original abilities</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set count to <strong>3</strong>, duration to <strong>8000</strong>, power to <strong>0.7</strong>.</div></div>`;},
    validator(p){if(!p.temporalClone||!p.temporalClone.enabled)return'TemporalClone must be enabled';if(p.temporalClone.count!==3)return'Count must be 3';if(p.temporalClone.duration!==8000)return'Duration must be 8000';if(p.temporalClone.power!==0.7)return'Power must be 0.7';return null;}},
  {id:'p10_11',title:'UNIT ARCHETYPES',icon:'G11',exercise:false,initialCode:'',
    render(){return`<div class="jl-h1">UNIT ARCHETYPES</div><div class="jl-sub">PRESTIGE 10 — LESSON 11/12</div><div class="jl-p">Archetypes define unit roles and playstyles through stat distributions and ability sets.</div><div class="jl-rule"><div class="jl-rule-hdr">COMMON ARCHETYPES</div><div class="jl-rule-body"><code>assassin</code> — high burst, low survivability<br><code>tank</code> — high HP/armor, low damage<br><code>support</code> — healing/buffs, low offense<br><code>controller</code> — CC/debuffs, moderate damage</div></div>`;},validator:null},
  {id:'p10_12',title:'UNIT MASTERY',icon:'G12',exercise:true,initialCode:'{\n  "id": "master_unit",\n  "name": "MASTER",\n  "school": "arcane",\n  "hp": 350,\n  "armor": 12,\n  "spd": 2.5,\n  "evolution": { "enabled": true, "stages": 5 },\n  "adaptiveStats": { "enabled": true, "maxBonus": 0.6 },\n  "magic": {\n    "enabled": true,\n    "school": "arcane",\n    "spell": { "type": "bolt", "pattern": "spiral", "dmg": 50, "cd": 1000 },\n    "sig": { "type": "zone", "power": 60, "duration": 6000 }\n  },\n  "ai": { "stance": "cunning", "predictive": true, "learning": true }\n}',
    render(){return`<div class="jl-h1">UNIT MASTERY</div><div class="jl-sub">PRESTIGE 10 — LESSON 12/12</div><div class="jl-p">Combine all advanced unit systems into a masterfully designed combatant.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ MASTERY EXERCISE</div><div class="jl-ex-body">This unit has evolution and adaptive stats. Set hp to <strong>400</strong> and enable both systems.</div></div>`;},
    validator(p){if(p.hp!==400)return'HP must be 400';if(!p.evolution||!p.evolution.enabled)return'Evolution must be enabled';if(!p.adaptiveStats||!p.adaptiveStats.enabled)return'AdaptiveStats must be enabled';return null;}},
  // Prestige 11 lessons - Master Level Concepts
  {id:'p11_01',title:'BALANCE THEORY',icon:'H1',exercise:true,initialCode:'{"balanceScore":{"offense":50,"defense":50,"utility":50}}',
    render(){return`<div class="jl-h1">BALANCE THEORY</div><div class="jl-sub">PRESTIGE 11 — LESSON 1/12</div><div class="jl-p">Balance theory quantifies unit power across offense, defense, and utility dimensions.</div><div class="jl-rule"><div class="jl-rule-hdr">BALANCE METRICS</div><div class="jl-rule-body">• offense = damage output capability<br>• defense = survivability<br>• utility = support/control value<br>• Ideal balance varies by role</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set offense to <strong>70</strong>, defense to <strong>40</strong>, utility to <strong>30</strong> for an offensive unit.</div></div>`;},
    validator(p){if(!p.balanceScore)return'Missing balanceScore';if(p.balanceScore.offense!==70)return'Offense must be 70';if(p.balanceScore.defense!==40)return'Defense must be 40';if(p.balanceScore.utility!==30)return'Utility must be 30';return null;}},
  {id:'p11_02',title:'META ANALYSIS',icon:'H2',exercise:true,initialCode:'{"metaAnalysis":{"strongAgainst":["tank","support"],"weakAgainst":["assassin","controller"]}}',
    render(){return`<div class="jl-h1">META ANALYSIS</div><div class="jl-sub">PRESTIGE 11 — LESSON 2/12</div><div class="jl-p">Meta analysis identifies unit strengths and weaknesses against different archetypes.</div><div class="jl-rule"><div class="jl-rule-hdr">META RELATIONSHIPS</div><div class="jl-rule-body">• strongAgainst = favorable matchups<br>• weakAgainst = unfavorable matchups<br>• Rock-paper-scissors dynamics<br>• Team composition considerations</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Add <code>"sniper"</code> to strongAgainst and <code>"berserker"</code> to weakAgainst.</div></div>`;},
    validator(p){if(!p.metaAnalysis)return'Missing metaAnalysis';if(!p.metaAnalysis.strongAgainst.includes('sniper'))return'Must include sniper in strongAgainst';if(!p.metaAnalysis.weakAgainst.includes('berserker'))return'Must include berserker in weakAgainst';return null;}},
  {id:'p11_03',title:'SCALING MECHANICS',icon:'H3',exercise:true,initialCode:'{"scaling":{"primary":"intellect","secondary":"agility","coefficients":{"dmg":0.8,"hp":0.5}}}',
    render(){return`<div class="jl-h1">SCALING MECHANICS</div><div class="jl-sub">PRESTIGE 11 — LESSON 3/12</div><div class="jl-p">Scaling determines how unit stats grow with level or other progression metrics.</div><div class="jl-rule"><div class="jl-rule-hdr">SCALING TYPES</div><div class="jl-rule-body"><code>intellect</code> — magic damage<br><code>strength</code> — physical damage<br><code>agility</code> — speed/crit<br><code>vitality</code> — HP/defense</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set primary to <code>"strength"</code> and dmg coefficient to <strong>1.0</strong>.</div></div>`;},
    validator(p){if(!p.scaling)return'Missing scaling';if(p.scaling.primary!=='strength')return'Primary must be strength';if(p.scaling.coefficients.dmg!==1.0)return'Dmg coefficient must be 1.0';return null;}},
  {id:'p11_04',title:'COUNTER SYSTEMS',icon:'H4',exercise:true,initialCode:'{"counters":{"fire":"frost","physical":"evasion","magic":"reflection"}}',
    render(){return`<div class="jl-h1">COUNTER SYSTEMS</div><div class="jl-sub">PRESTIGE 11 — LESSON 4/12</div><div class="jl-p">Counter systems define specific responses to different threat types.</div><div class="jl-rule"><div class="jl-rule-hdr">COUNTER TYPES</div><div class="jl-rule-body">• Elemental counters (fire → frost)<br>• Damage type counters (physical → evasion)<br>• Mechanic counters (DoT → cleanse)<br>• Active vs passive counters</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Change fire counter to <code>"water"</code> and magic counter to <code>"absorption"</code>.</div></div>`;},
    validator(p){if(!p.counters)return'Missing counters';if(p.counters.fire!=='water')return'Fire counter must be water';if(p.counters.magic!=='absorption')return'Magic counter must be absorption';return null;}},
  {id:'p11_05',title:'SYNERGY CALCULATION',icon:'H5',exercise:true,initialCode:'{\n  "synergyCalc": {\n    "baseMultiplier": 1.0,\n    "perAllyBonus": 0.1,\n    "maxAllies": 5
  }
}',
    render(){return`<div class="jl-h1">SYNERGY CALCULATION</div><div class="jl-sub">PRESTIGE 11 — LESSON 5/12</div><div class="jl-p">Synergy calculation determines how team composition affects unit performance.</div><div class="jl-rule"><div class="jl-rule-hdr">SYNERGY FORMULAS</div><div class="jl-rule-body">• baseMultiplier = starting value<br>• perAllyBonus = additional per matching ally<br>• maxAllies = bonus cap<br>• Diminishing returns options</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set baseMultiplier to <strong>1.2</strong>, perAllyBonus to <strong>0.15</strong>.</div></div>`;},
    validator(p){if(!p.synergyCalc)return'Missing synergyCalc';if(p.synergyCalc.baseMultiplier!==1.2)return'BaseMultiplier must be 1.2';if(p.synergyCalc.perAllyBonus!==0.15)return'PerAllyBonus must be 0.15';return null;}},
  {id:'p11_06',title:'WIN CONDITIONS',icon:'H6',exercise:true,initialCode:'{\n  "winCondition": {
    "type": "domination",
    "threshold": 0.8,
    "timeLimit": 60000
  }
}',
    render(){return`<div class="jl-h1">WIN CONDITIONS</div><div class="jl-sub">PRESTIGE 11 — LESSON 6/12</div><div class="jl-p">Win conditions define alternative victory methods beyond HP depletion.</div><div class="jl-rule"><div class="jl-rule-hdr">WIN TYPES</div><div class="jl-rule-body"><code>domination</code> — control % of map<br><code>attrition</code> — resource drain<br><code>assassination</code> — target kill<br><code>objective</code> — capture point</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set type to <code>"attrition"</code> and threshold to <strong>0.6</strong>.</div></div>`;},
    validator(p){if(!p.winCondition)return'Missing winCondition';if(p.winCondition.type!=='attrition')return'Type must be attrition';if(p.winCondition.threshold!==0.6)return'Threshold must be 0.6';return null;}},
  {id:'p11_07',title:'RESOURCE ECONOMY',icon:'H7',exercise:true,initialCode:'{\n  "economy": {
    "mana": {
      "base": 100,
      "regen": 8,
      "efficiency": 1.0
    },
    "energy": {
      "base": 50,
      "regen": 5
    }
  }
}',
    render(){return`<div class="jl-h1">RESOURCE ECONOMY</div><div class="jl-sub">PRESTIGE 11 — LESSON 7/12</div><div class="jl-p">Resource economy manages multiple resource types and their regeneration.</div><div class="jl-rule"><div class="jl-rule-hdr">RESOURCE TYPES</div><div class="jl-rule-body">• mana — spell casting<br>• energy — physical abilities<br>• rage — builds on damage taken<br>• focus — precision resource</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set mana efficiency to <strong>1.3</strong> and energy regen to <strong>8</strong>.</div></div>`;},
    validator(p){if(!p.economy)return'Missing economy';if(p.economy.mana.efficiency!==1.3)return'Mana efficiency must be 1.3';if(p.economy.energy.regen!==8)return'Energy regen must be 8';return null;}},
  {id:'p11_08',title:'TEAM COMPOSITION',icon:'H8',exercise:true,initialCode:'{\n  "teamComp": {
    "roles": ["damage", "support", "tank"],
    "idealSize": 3,
    "flexSlots": 1
  }
}',
    render(){return`<div class="jl-h1">TEAM COMPOSITION</div><div class="jl-sub">PRESTIGE 11 — LESSON 8/12</div><div class="jl-p">Team composition defines optimal role distribution for balanced teams.</div><div class="jl-rule"><div class="jl-rule-hdr">ROLE REQUIREMENTS</div><div class="jl-rule-body">• damage — primary offense<br>• support — healing/buffs<br>• tank — frontline/defense<br>• flex — adaptable slot</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Add <code>"controller"</code> to roles and set flexSlots to <strong>2</strong>.</div></div>`;},
    validator(p){if(!p.teamComp)return'Missing teamComp';if(!p.teamComp.roles.includes('controller'))return'Must include controller in roles';if(p.teamComp.flexSlots!==2)return'FlexSlots must be 2';return null;}},
  {id:'p11_09',title:'MATCH PREDICTION',icon:'H9',exercise:true,initialCode:'{\n  "prediction": {
    "winRate": 0.5,
    "confidence": 0.7,
    "factors": ["stats", "synergy", "counter"]
  }
}',
    render(){return`<div class="jl-h1">MATCH PREDICTION</div><div class="jl-sub">PRESTIGE 11 — LESSON 9/12</div><div class="jl-p">Match prediction estimates victory probability based on multiple factors.</div><div class="jl-rule"><div class="jl-rule-hdr">PREDICTION FACTORS</div><div class="jl-rule-body">• stats — raw power comparison<br>• synergy — team coordination<br>• counter — matchup advantage<br>• confidence — prediction certainty</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set winRate to <strong>0.65</strong> and confidence to <strong>0.85</strong>.</div></div>`;},
    validator(p){if(!p.prediction)return'Missing prediction';if(p.prediction.winRate!==0.65)return'WinRate must be 0.65';if(p.prediction.confidence!==0.85)return'Confidence must be 0.85';return null;}},
  {id:'p11_10',title:'ADAPTIVE DIFFICULTY',icon:'H10',exercise:true,initialCode:'{\n  "adaptiveDifficulty": {
    "enabled": true,
    "sensitivity": 0.5,
    "adjustmentSpeed": 0.1
  }
}',
    render(){return`<div class="jl-h1">ADAPTIVE DIFFICULTY</div><div class="jl-sub">PRESTIGE 11 — LESSON 10/12</div><div class="jl-p">Adaptive difficulty adjusts challenge level based on player performance.</div><div class="jl-rule"><div class="jl-rule-hdr">DIFFICULTY MECHANICS</div><div class="jl-rule-body">• sensitivity = how reactive to performance<br>• adjustmentSpeed = change rate<br>• Can scale enemy stats<br>• Can modify AI behavior</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set sensitivity to <strong>0.8</strong> and adjustmentSpeed to <strong>0.15</strong>.</div></div>`;},
    validator(p){if(!p.adaptiveDifficulty||!p.adaptiveDifficulty.enabled)return'AdaptiveDifficulty must be enabled';if(p.adaptiveDifficulty.sensitivity!==0.8)return'Sensitivity must be 0.8';if(p.adaptiveDifficulty.adjustmentSpeed!==0.15)return'AdjustmentSpeed must be 0.15';return null;}},
  {id:'p11_11',title:'TOURNAMENT RULES',icon:'H11',exercise:false,initialCode:'',
    render(){return`<div class="jl-h1">TOURNAMENT RULES</div><div class="jl-sub">PRESTIGE 11 — LESSON 11/12</div><div class="jl-p">Tournament rules define competitive formats, bans, and restrictions.</div><div class="jl-rule"><div class="jl-rule-hdr">FORMAT TYPES</div><div class="jl-rule-body">• Single elimination<br>• Double elimination<br>• Round robin<br>• Swiss system</div></div><div class="jl-rule"><div class="jl-rule-hdr">COMMON RESTRICTIONS</div><div class="jl-rule-body">• Unit bans<br>• Archetype limits<br>• Time controls<br>• Point systems</div></div>`;},validator:null},
  {id:'p11_12',title:'GRANDMASTER THEORY',icon:'H12',exercise:true,initialCode:'{\n  "grandmaster": {
    "balanceScore": { "offense": 65, "defense": 55, "utility": 40 },
    "metaAnalysis": { "strongAgainst": ["tank"], "weakAgainst": ["assassin"] },
    "scaling": { "primary": "intellect", "coefficients": { "dmg": 0.9 } }
  }
}',
    render(){return`<div class="jl-h1">GRANDMASTER THEORY</div><div class="jl-sub">PRESTIGE 11 — LESSON 12/12</div><div class="jl-p">Combine all theoretical concepts into a comprehensive unit analysis.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ THEORY EXERCISE</div><div class="jl-ex-body">Set utility to <strong>50</strong> and dmg coefficient to <strong>1.0</strong>.</div></div>`;},
    validator(p){if(!p.grandmaster)return'Missing grandmaster';if(p.grandmaster.balanceScore.utility!==50)return'Utility must be 50';if(p.grandmaster.scaling.coefficients.dmg!==1.0)return'Dmg coefficient must be 1.0';return null;}},
];

// ================================================================
// VALIDATION
// ================================================================
function jsonRunValidate(code, lessonId){
  if(!code||!code.trim())return{ok:false,parsed:null,error:null,lessonErr:null,errLine:null};
  let parsed;
  try{parsed=JSON.parse(code);}
  catch(err){
    const det=parseJsonError(err,code);
    return{ok:false,parsed:null,error:det,lessonErr:null,errLine:det.line};
  }
  const lesson=JSON_LESSONS.find(l=>l.id===lessonId);
  if(lesson&&lesson.validator){
    const le=lesson.validator(parsed);
    if(le)return{ok:false,parsed,error:{message:le,line:null,col:null},lessonErr:le,errLine:null};
  }
  // Check prestige requirement
  if(typeof Progression !== 'undefined' && lessonId) {
    const unlockedLessons = Progression.getUnlockedLessons();
    if(!unlockedLessons.includes(lessonId)) {
      return{ok:false,parsed,error:{message:'This lesson requires a higher prestige level to unlock.',line:null,col:null},lessonErr:'Requires higher prestige',errLine:null};
    }
  }
  return{ok:true,parsed,error:null,lessonErr:null,errLine:null};
}

// ================================================================
// IDE RENDER
// ================================================================
function renderJsonIde(){
  const appEl=document.getElementById('app');
  if(!appEl)return;
  const completed=JsonFreedom.getCompleted();
  const rank=JsonFreedom.getRank();
  const rankObj=JSON_RANKS[rank];
  const unlockedLessons = typeof Progression !== 'undefined' ? Progression.getUnlockedLessons() : JSON_LESSONS.map(l => l.id);
  const availableLessons = JSON_LESSONS.filter(l => unlockedLessons.includes(l.id));
  const n=completed.size,total=availableLessons.length;
  const pct=total>0?Math.round((n/total)*100):0;
  const lesson=availableLessons.find(l=>l.id===JIS.lesson)||availableLessons[0]||JSON_LESSONS[0];
  const llistHtml=availableLessons.map(l=>{
    const done=completed.has(l.id),active=l.id===JIS.lesson;
    const icon=done?'\u2713':(active?'\u25B8':l.icon);
    const col=done?'#44ff88':(active?'var(--acc)':'var(--dim)');
    return`<div class="json-litem${active?' active':''}${done?' done':''}" onclick="jsonGoLesson('${l.id}')"><span class="json-lnum" style="color:${col}">${icon}</span><span class="json-ltitle">${l.title}</span></div>`;
  }).join('');
  const featHtml=JSON_FEATURES.map(f=>{const on=rank>=f.minRank;return`<div class="rk-feat ${on?'on':''}"><span class="rk-feat-icon">${on?'\u2713':'\u25CB'}</span>${f.label}</div>`;}).join('');
  const toNext=rank<4?Math.max(0,JSON_RANKS[rank+1].minLessons-n):0;
  const sandboxHtml=rank>=4
    ?`<div class="rk-sandbox active">\u26A1 MASTER RANK<br><span style="color:#3a6a50;font-size:7px">All features + GLITCH tab active.</span></div>`
    :`<div class="rk-sandbox">${toNext} more lesson${toNext===1?'':'s'} to <strong>${JSON_RANKS[rank+1].name}</strong>.</div>`;
  const nextChapter=StoryProgress.nextChapter();
  const storyHtml=nextChapter
    ?`<div class="rk-sandbox story">\uD83D\uDCD6 Story at <strong>${JSON_RANKS[nextChapter.rank].name}</strong>.</div>`
    :`<div class="rk-sandbox story active">\uD83D\uDCD6 Story complete.</div>`;
  const lc=lesson.render();
  let edSection='';
  if(lesson.exercise){
    const code=JIS.code!==''?JIS.code:lesson.initialCode;
    const vr=jsonRunValidate(code,lesson.id);
    if(JIS.validation===null)JIS.validation=vr;
    const isDone=completed.has(lesson.id),isImport=lesson.id==='import';
    const canFmt=JsonFreedom.canFormat(),canLoad=JsonFreedom.canLoadUnit();
    const subBtn=!isDone&&!isImport?`<button class="jbt go" onclick="jsonSubmit()" ${(!vr||!vr.ok)?'disabled':''}>\u2713 SUBMIT</button>`:'';
    const impBtn=isImport?`<button class="jbt go" onclick="jsonImport()" ${(!vr||!vr.ok)?'disabled':''}>\u25B2 IMPORT TO ROSTER</button>`:'';
    const doneTag=isDone&&!isImport?`<span class="done-tag">\u2713 DONE</span>`:'';
    const loadSel=canLoad?`<select class="jbt-sel" onchange="jsonLoadUnit(this)"><option value="">\u2B07 LOAD UNIT</option>${S.units.map(u=>`<option value="${u.id}">${u.name}</option>`).join('')}</select>`:'';
    const exportBtn=JsonFreedom.canEdit()?`<button class="jbt" onclick="jsonDownload()">\u2B07 EXPORT</button>`:'';
    const safeCode=(code||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const activeLine=String(code||'').substring(0,0).split('\n').length;
    const gutterHtml=jsonGutterHtml(code||'',vr.errLine,null);
    const valCls=vr&&vr.ok?'ok':(vr&&(vr.error||vr.lessonErr))?'err':'idle';
    const valTxt=!String(code||'').trim()?'\u2E61 type JSON below to validate...'
      :vr&&vr.lessonErr?'\u25CB '+vr.lessonErr
      :vr&&vr.error?(vr.error.line?`\u2717 Line ${vr.error.line}, Col ${vr.error.col}: ${vr.error.message}`:`\u2717 ${vr.error.message}`)
      :'\u2713 Valid JSON \u2014 exercise complete!';
    edSection=`<div class="json-tb"><button class="jbt" onclick="jsonFmt()" ${!canFmt?'disabled title="Requires STUDENT rank"':''}>\u229E FORMAT</button><button class="jbt" onclick="jsonRst()">\u21BA RESET</button><button class="jbt" onclick="jsonClr()">\u2715 CLEAR</button>${exportBtn}${loadSel}${subBtn}${impBtn}${doneTag}</div>
<div class="json-editor" id="jeditor">
  <div id="jln" style="margin:0;flex:0 0 38px;overflow:hidden;background:#02050b;color:#2a3870;font-family:'Courier New',monospace;font-size:10px;line-height:1.7;padding:10px 5px;text-align:right;user-select:none;white-space:nowrap;border-right:1px solid #0d1530">${gutterHtml}</div>
  <div class="json-code">
    <pre class="json-hl-layer" id="jhl">${code?jsonHL(code):'<span style="color:#1a2540">// write JSON here</span>'}</pre>
    <textarea class="json-ta" id="jta" spellcheck="false" oninput="jsonTaInput(this)" onscroll="jsonSyncScroll(this)" onkeydown="jsonHandleEditorKeys(event,this)" onclick="jsonUpdateGutter(this)" onkeyup="jsonUpdateGutter(this)" placeholder="// write your JSON here.">${safeCode}</textarea>
  </div>
</div>
<div id="jval" class="json-val ${valCls}">${valTxt}</div>
<div style="display:grid;grid-template-columns:minmax(0,1fr) 220px;gap:8px;align-items:start;margin-top:6px">
  <div style="background:#010306;border:1px solid #0a1020;border-radius:3px;padding:9px 10px;font-family:'Courier New',monospace;font-size:9px;line-height:1.7;color:#3a4a70;min-height:90px;overflow:auto" id="jprv">${jsonPreviewHtml(vr)}</div>
</div>`;
  }else{
    const isDone=completed.has(lesson.id);
    edSection=`<div class="json-cbar">${isDone?`<span class="done-tag">\u2713 LESSON COMPLETE</span>`:`<button class="jbt go" onclick="jsonMarkRead('${lesson.id}')">\u2713 MARK COMPLETE &amp; CONTINUE</button>`}</div>`;
  }
  document.getElementById('app').innerHTML=`${nav('json')}<div class="json-ide"><div class="json-lpanel"><div class="json-lhdr"><div style="font-size:8px;color:var(--dim);letter-spacing:2px;margin-bottom:7px">JSON LESSONS</div><div class="rk-bar-bg"><div class="rk-bar-fg" style="width:${pct}%"></div></div><div style="font-size:8px;color:#2a3870;margin-top:4px;letter-spacing:.5px">${n} / ${total} COMPLETE</div></div><div class="json-llist">${llistHtml}</div></div><div class="json-cmid"><div class="json-content">${lc}${edSection}</div></div><div class="json-rpanel"><div style="font-size:8px;color:var(--dim);letter-spacing:2px;margin-bottom:6px">FREEDOM RANK</div><div class="rk-bar-bg" style="margin-bottom:3px"><div class="rk-bar-fg" style="width:${pct}%"></div></div><div style="font-size:8px;color:#2a3870;margin-bottom:12px;letter-spacing:.5px">${n}/${total} — ${pct}%</div><div class="rk-badge"><span class="rk-badge-icon">${rankObj.icon}</span><div class="rk-badge-name">${rankObj.name}</div><div class="rk-badge-tier">${rankObj.tier} · ${rankObj.desc}</div></div><div style="font-size:8px;color:var(--dim);letter-spacing:1.5px;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid var(--border)">SANDBOX FEATURES</div>${featHtml}${sandboxHtml}${storyHtml}<div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border)"><button onclick="JsonFreedom.reset();JIS.lesson='intro';JIS.code='';JIS.validation=null;renderJsonIde()" style="width:100%;background:transparent;border:1px solid #200f0f;color:#3a1818;font-size:8px;padding:4px;border-radius:2px;cursor:pointer;font-family:monospace">\u21BA RESET PROGRESS</button></div></div></div>`;
}

// ================================================================
// IDE FUNCTIONS
// ================================================================
function jsonGoLesson(id){
  const unlockedLessons = typeof Progression !== 'undefined' ? Progression.getUnlockedLessons() : JSON_LESSONS.map(l => l.id);
  if(!unlockedLessons.includes(id)) {
    showLockedMsg('lesson', Math.floor((unlockedLessons.length / 12) + 1));
    return;
  }
  const l=JSON_LESSONS.find(x=>x.id===id);if(!l)return;JIS.lesson=id;JIS.code=l.initialCode||'';JIS.validation=null;jIdeUndo.reset(JIS.code);jsonSaveDraft(JIS.code);renderJsonIde();
}
function jsonMarkRead(id){
  JsonFreedom.complete(id);showJIdToast(id);checkStoryProgress();
  const unlockedLessons = typeof Progression !== 'undefined' ? Progression.getUnlockedLessons() : JSON_LESSONS.map(l => l.id);
  const idx=JSON_LESSONS.findIndex(l=>l.id===id);
  const next=JSON_LESSONS.find((l, i) => i > idx && unlockedLessons.includes(l.id));
  setTimeout(()=>{if(next){JIS.lesson=next.id;JIS.code=next.initialCode||'';}JIS.validation=null;jsonSaveDraft(JIS.code);renderJsonIde();},1200);
}

function jsonUpdateGutter(ta){
  const ln=document.getElementById('jln');if(!ln)return;
  const vr=JIS.validation||{errLine:null};
  const lines=String(ta.value||'').substring(0,ta.selectionStart).split('\n');
  const activeLine=lines.length;
  ln.innerHTML=jsonGutterHtml(ta.value,vr.errLine,activeLine);
  ln.scrollTop=ta.scrollTop;
}
function jsonSyncScroll(ta){
  const ln=document.getElementById('jln');if(ln)ln.scrollTop=ta.scrollTop;
  const hl=document.getElementById('jhl');if(hl)hl.scrollTop=ta.scrollTop;
}
function jsonTaInput(ta){
  jIdeUndo.push(ta.value);JIS.code=ta.value;jsonSaveDraft(ta.value);
  const vr=jsonRunValidate(ta.value,JIS.lesson);JIS.validation=vr;
  const hl=document.getElementById('jhl');
  if(hl)hl.innerHTML=ta.value?jsonHL(ta.value):'<span style="color:#1a2540">// write JSON here</span>';
  jsonUpdateGutter(ta);
  const v=document.getElementById('jval');
  if(v){
    v.className='json-val '+(vr.ok?'ok':(vr.error||vr.lessonErr)?'err':'idle');
    v.textContent=!String(ta.value||'').trim()?'\u2E61 type JSON below to validate...'
      :vr.lessonErr?'\u25CB '+vr.lessonErr
      :vr.error?(vr.error.line?`\u2717 Line ${vr.error.line}, Col ${vr.error.col}: ${vr.error.message}`:`\u2717 ${vr.error.message}`)
      :'\u2713 Valid JSON \u2014 exercise complete!';
  }
  const prv=document.getElementById('jprv');if(prv)prv.innerHTML=jsonPreviewHtml(vr);
  const subBtn=document.querySelector('.jbt.go');
  if(subBtn&&vr.ok)subBtn.removeAttribute('disabled');
  else if(subBtn)subBtn.setAttribute('disabled','');
}
function jsonHandleEditorKeys(e,ta){
  const start=ta.selectionStart,end=ta.selectionEnd,value=ta.value;
  if(e.key==='Tab'){e.preventDefault();if(!e.shiftKey){ta.value=value.substring(0,start)+'  '+value.substring(end);ta.selectionStart=ta.selectionEnd=start+2;}else{const ls=value.lastIndexOf('\n',start-1)+1;if(value.substring(ls,ls+2)==='  '){ta.value=value.substring(0,ls)+value.substring(ls+2);ta.selectionStart=ta.selectionEnd=Math.max(ls,start-2);}}jsonTaInput(ta);return;}
  if((e.ctrlKey||e.metaKey)&&e.key==='z'){e.preventDefault();const prev=jIdeUndo.undo();if(prev!==null){ta.value=prev;jsonTaInput(ta);}return;}
  if((e.ctrlKey||e.metaKey)&&(e.key==='y'||(e.shiftKey&&e.key==='z'))){e.preventDefault();const next=jIdeUndo.redo();if(next!==null){ta.value=next;jsonTaInput(ta);}return;}
  const pairs={'{':'}','[':']','"':'"'};
  if(pairs[e.key]!==undefined){e.preventDefault();ta.value=value.substring(0,start)+e.key+pairs[e.key]+value.substring(end);ta.selectionStart=ta.selectionEnd=start+1;jsonTaInput(ta);}
}
function jsonFmt(){if(!JsonFreedom.canFormat()){const v=document.getElementById('jval');if(v){v.className='json-val err';v.textContent='Format requires STUDENT rank';}return;}const ta=document.getElementById('jta');if(!ta)return;try{ta.value=JSON.stringify(JSON.parse(ta.value),null,2);jsonTaInput(ta);}catch(e){const v=document.getElementById('jval');if(v){v.className='json-val err';v.textContent='Fix syntax errors before formatting';}}}
function jsonClr(){const ta=document.getElementById('jta');if(!ta)return;ta.value='';jsonTaInput(ta);}
function jsonRst(){const l=JSON_LESSONS.find(x=>x.id===JIS.lesson);if(!l)return;const ta=document.getElementById('jta');if(!ta)return;ta.value=l.initialCode||'';jIdeUndo.reset(ta.value);jsonTaInput(ta);}
function jsonLoadUnit(sel){const id=sel.value;sel.value='';if(!id)return;const def=getDef(id);if(!def)return;const ta=document.getElementById('jta');if(!ta)return;ta.value=JSON.stringify(def,null,2);jIdeUndo.reset(ta.value);jsonTaInput(ta);}
function jsonDownload(){const text=JIS.code||'';const blob=new Blob([text],{type:'application/json;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${(JIS.lesson||'unit').replace(/[^a-z0-9_-]+/gi,'_')||'unit'}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);}
function jsonSubmit(){
  const vr=JIS.validation||jsonRunValidate(JIS.code,JIS.lesson);if(!vr||!vr.ok){console.log('Submit failed:',vr);return;}
  const id=JIS.lesson;JsonFreedom.complete(id);showJIdToast(id);checkStoryProgress();
  const unlockedLessons = typeof Progression !== 'undefined' ? Progression.getUnlockedLessons() : JSON_LESSONS.map(l => l.id);
  const idx=JSON_LESSONS.findIndex(l=>l.id===id);
  const next=JSON_LESSONS.find((l, i) => i > idx && unlockedLessons.includes(l.id));
  setTimeout(()=>{if(next){JIS.lesson=next.id;JIS.code=next.initialCode||'';}JIS.validation=null;jsonSaveDraft(JIS.code);renderJsonIde();},1200);
}
function jsonImport(){const vr=JIS.validation||jsonRunValidate(JIS.code,JIS.lesson);if(!vr||!vr.ok||!vr.parsed)return;const def=mkDef(vr.parsed);const idx=S.units.findIndex(u=>u.id===def.id);if(idx>=0)S.units[idx]=def;else S.units.push(def);const alreadyDone=JsonFreedom.getCompleted().has('import');JsonFreedom.complete('import');if(!alreadyDone){showJIdToast('import');setTimeout(()=>showImportToast(def.name),1300);}else{showImportToast(def.name);}checkStoryProgress();setTimeout(()=>{JIS.validation=null;renderJsonIde();},2000);}
function showJIdToast(completedId){
  const completed=JsonFreedom.getCompleted();const newRank=JsonFreedom.getRank();
  const didRankUp=newRank>0&&completed.size===JSON_RANKS[newRank].minLessons;
  const t=document.createElement('div');t.className='unlock-toast';
  if(didRankUp){const ro=JSON_RANKS[newRank];t.innerHTML=`<div style="font-size:9px;color:#44ffaa;letter-spacing:3px;margin-bottom:6px">RANK UP</div><div style="font-size:26px;margin:4px 0">${ro.icon}</div><div style="font-size:15px;color:var(--acc);letter-spacing:3px;font-weight:bold">${ro.name}</div><div style="font-size:8px;color:#4455aa;margin-top:4px;letter-spacing:1px">${ro.desc} unlocked</div>`;}
  else{const lesson=JSON_LESSONS.find(l=>l.id===completedId);t.innerHTML=`<div style="font-size:9px;color:#44ffaa;letter-spacing:3px;margin-bottom:4px">LESSON COMPLETE</div><div style="font-size:10px;color:#8899cc;letter-spacing:1.5px">${lesson?lesson.title:''}</div>`;}
  document.body.appendChild(t);setTimeout(()=>{t.style.transition='opacity .3s';t.style.opacity='0';setTimeout(()=>t.remove(),300);},1100);
}
function showImportToast(name){const t=document.createElement('div');t.className='unlock-toast import-toast';t.innerHTML=`<div style="font-size:9px;color:#aabbff;letter-spacing:3px;margin-bottom:6px">UNIT IMPORTED</div><div style="font-size:17px;color:var(--acc);letter-spacing:3px;font-weight:bold;margin-bottom:6px">${name}</div><div style="font-size:8px;color:#4455aa;letter-spacing:1px">Now in ROSTER &amp; BATTLE</div>`;document.body.appendChild(t);setTimeout(()=>{t.style.transition='opacity .3s';t.style.opacity='0';setTimeout(()=>t.remove(),300);},1800);}
