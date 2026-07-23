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
  {id:'p4_10',title:'KNOCKBACK',icon:'M10',exercise:true,initialCode:'{\n  "melee": {\n    "enabled": true,\n    "knockback": 0.5\n  }\n}',
    render(){return`<div class="jl-h1">KNOCKBACK</div><div class="jl-sub">PRESTIGE 4 — LESSON 10/12</div><div class="jl-p">Knockback pushes enemies away on hit, creating spacing.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set knockback to <strong>0.8</strong>.</div></div>`;},
    validator(p){if(!p.melee||!p.melee.knockback)return'Missing melee.knockback';if(p.melee.knockback!==0.8)return'Knockback must be 0.8';return null;}},
  {id:'p4_11',title:'CLEAVE',icon:'M11',exercise:true,initialCode:'{\n  "melee": {\n    "enabled": true,\n    "cleave": 0.3\n  }\n}',
    render(){return`<div class="jl-h1">CLEAVE</div><div class="jl-sub">PRESTIGE 4 — LESSON 11/12</div><div class="jl-p">Cleave deals damage to nearby enemies when hitting a target.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set cleave to <strong>0.5</strong>.</div></div>`;},
    validator(p){if(!p.melee||!p.melee.cleave)return'Missing melee.cleave';if(p.melee.cleave!==0.5)return'Cleave must be 0.5';return null;}},
  {id:'p4_12',title:'COMBAT BALANCING',icon:'M12',exercise:true,initialCode:'{\n  "hp": 200,\n  "armor": 8,\n  "spd": 2.0,\n  "melee": {\n    "enabled": true,\n    "dmg": 25,\n    "cd": 1200\n  }\n}',
    render(){return`<div class="jl-h1">COMBAT BALANCING</div><div class="jl-sub">PRESTIGE 4 — LESSON 12/12</div><div class="jl-p">Balance unit stats to create a viable combatant.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set hp to <strong>250</strong> and armor to <strong>10</strong>.</div></div>`;},
    validator(p){if(p.hp!==250)return'HP must be 250';if(p.armor!==10)return'Armor must be 10';return null;}},

// ================================================================
// PRESTIGE 5 - AI CONFIGURATION
// ================================================================
  {id:'p5_01',title:'AI STANCE',icon:'N1',exercise:true,initialCode:'{\n  "ai": {\n    "stance": "aggressive"\n  }\n}',
    render(){return`<div class="jl-h1">AI STANCE</div><div class="jl-sub">PRESTIGE 5 — LESSON 1/12</div><div class="jl-p">AI stance determines the unit's overall combat behavior.</div><div class="jl-rule"><div class="jl-rule-hdr">STANCE OPTIONS</div><div class="jl-rule-body"><code>aggressive</code> — high offense, low defense<br><code>defensive</code> — high defense, low offense<br><code>cunning</code> — balanced, tactical<br><code>berserk</code> — all-out attack</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set stance to <code>"cunning"</code>.</div></div>`;},
    validator(p){if(!p.ai||p.ai.stance!=='cunning')return'Stance must be cunning';return null;}},
  {id:'p5_02',title:'AGGRESSION',icon:'N2',exercise:true,initialCode:'{\n  "ai": {\n    "aggression": 0.5\n  }\n}',
    render(){return`<div class="jl-h1">AGGRESSION</div><div class="jl-sub">PRESTIGE 5 — LESSON 2/12</div><div class="jl-p">Aggression controls how eagerly the unit pursues combat.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set aggression to <strong>0.8</strong>.</div></div>`;},
    validator(p){if(!p.ai||p.ai.aggression!==0.8)return'Aggression must be 0.8';return null;}},
  {id:'p5_03',title:'SPACING',icon:'N3',exercise:true,initialCode:'{\n  "ai": {\n    "spacing": 0.5\n  }\n}',
    render(){return`<div class="jl-h1">SPACING</div><div class="jl-sub">PRESTIGE 5 — LESSON 3/12</div><div class="jl-p">Spacing determines preferred distance from enemies.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set spacing to <strong>0.3</strong> for close combat.</div></div>`;},
    validator(p){if(!p.ai||p.ai.spacing!==0.3)return'Spacing must be 0.3';return null;}},
  {id:'p5_04',title:'DODGE',icon:'N4',exercise:true,initialCode:'{\n  "ai": {\n    "dodge": 0.4\n  }\n}',
    render(){return`<div class="jl-h1">DODGE</div><div class="jl-sub">PRESTIGE 5 — LESSON 4/12</div><div class="jl-p">Dodge chance determines how often the unit avoids attacks.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set dodge to <strong>0.7</strong>.</div></div>`;},
    validator(p){if(!p.ai||p.ai.dodge!==0.7)return'Dodge must be 0.7';return null;}},
  {id:'p5_05',title:'AIM',icon:'N5',exercise:true,initialCode:'{\n  "ai": {\n    "aim": 0.8\n  }\n}',
    render(){return`<div class="jl-h1">AIM</div><div class="jl-sub">PRESTIGE 5 — LESSON 5/12</div><div class="jl-p">Aim accuracy affects ranged and spell attacks.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set aim to <strong>0.95</strong>.</div></div>`;},
    validator(p){if(!p.ai||p.ai.aim!==0.95)return'Aim must be 0.95';return null;}},
  {id:'p5_06',title:'RETREAT THRESHOLD',icon:'N6',exercise:true,initialCode:'{\n  "ai": {\n    "retreatThreshold": 0.2\n  }\n}',
    render(){return`<div class="jl-h1">RETREAT THRESHOLD</div><div class="jl-sub">PRESTIGE 5 — LESSON 6/12</div><div class="jl-p">Retreat threshold determines when the unit falls back to heal.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set retreatThreshold to <strong>0.4</strong>.</div></div>`;},
    validator(p){if(!p.ai||p.ai.retreatThreshold!==0.4)return'RetreatThreshold must be 0.4';return null;}},
  {id:'p5_07',title:'PREDICTION',icon:'N7',exercise:true,initialCode:'{\n  "ai": {\n    "prediction": 0.5\n  }\n}',
    render(){return`<div class="jl-h1">PREDICTION</div><div class="jl-sub">PRESTIGE 5 — LESSON 7/12</div><div class="jl-p">Prediction helps the unit lead moving targets.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set prediction to <strong>0.8</strong>.</div></div>`;},
    validator(p){if(!p.ai||p.ai.prediction!==0.8)return'Prediction must be 0.8';return null;}},
  {id:'p5_08',title:'COUNTER PLAY',icon:'N8',exercise:true,initialCode:'{\n  "ai": {\n    "counterPlay": 0.4\n  }\n}',
    render(){return`<div class="jl-h1">COUNTER PLAY</div><div class="jl-sub">PRESTIGE 5 — LESSON 8/12</div><div class="jl-p">Counter play enables reactive defensive tactics.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set counterPlay to <strong>0.7</strong>.</div></div>`;},
    validator(p){if(!p.ai||p.ai.counterPlay!==0.7)return'CounterPlay must be 0.7';return null;}},
  {id:'p5_09',title:'COMBO BIAS',icon:'N9',exercise:true,initialCode:'{\n  "ai": {\n    "comboBias": 0.5\n  }\n}',
    render(){return`<div class="jl-h1">COMBO BIAS</div><div class="jl-sub">PRESTIGE 5 — LESSON 9/12</div><div class="jl-p">Combo bias affects how often the unit chains attacks.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set comboBias to <strong>0.8</strong>.</div></div>`;},
    validator(p){if(!p.ai||p.ai.comboBias!==0.8)return'ComboBias must be 0.8';return null;}},
  {id:'p5_10',title:'MANA CONSERVE',icon:'N10',exercise:true,initialCode:'{\n  "ai": {\n    "manaConserve": 0.3\n  }\n}',
    render(){return`<div class="jl-h1">MANA CONSERVE</div><div class="jl-sub">PRESTIGE 5 — LESSON 10/12</div><div class="jl-p">Mana conserve reserves mana for critical moments.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set manaConserve to <strong>0.6</strong>.</div></div>`;},
    validator(p){if(!p.ai||p.ai.manaConserve!==0.6)return'ManaConserve must be 0.6';return null;}},
  {id:'p5_11',title:'FLANK TENDENCY',icon:'N11',exercise:true,initialCode:'{\n  "ai": {\n    "flankTendency": 0.2\n  }\n}',
    render(){return`<div class="jl-h1">FLANK TENDENCY</div><div class="jl-sub">PRESTIGE 5 — LESSON 11/12</div><div class="jl-p">Flank tendency determines how often the unit tries to attack from the side.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set flankTendency to <strong>0.5</strong>.</div></div>`;},
    validator(p){if(!p.ai||p.ai.flankTendency!==0.5)return'FlankTendency must be 0.5';return null;}},
  {id:'p5_12',title:'AI MASTERY',icon:'N12',exercise:true,initialCode:'{\n  "ai": {\n    "stance": "cunning",\n    "aggression": 0.6,\n    "dodge": 0.7,\n    "aim": 0.9,\n    "prediction": 0.7,\n    "counterPlay": 0.6\n  }\n}',
    render(){return`<div class="jl-h1">AI MASTERY</div><div class="jl-sub">PRESTIGE 5 — LESSON 12/12</div><div class="jl-p">Combine AI settings for intelligent behavior.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ MASTERY EXERCISE</div><div class="jl-ex-body">Set dodge to <strong>0.85</strong> and aim to <strong>0.95</strong>.</div></div>`;},
    validator(p){if(!p.ai)return'Missing ai';if(p.ai.dodge!==0.85)return'Dodge must be 0.85';if(p.ai.aim!==0.95)return'Aim must be 0.95';return null;}},

// ================================================================
// PRESTIGE 6 - RESISTANCES & STATUS EFFECTS
// ================================================================
  {id:'p6_01',title:'RESISTANCES',icon:'O1',exercise:true,initialCode:'{\n  "resistances": {\n    "fire": 0.2,\n    "frost": 0.2\n  }\n}',
    render(){return`<div class="jl-h1">RESISTANCES</div><div class="jl-sub">PRESTIGE 6 — LESSON 1/12</div><div class="jl-p">Resistances reduce damage from specific magic schools.</div><div class="jl-rule"><div class="jl-rule-hdr">RESISTANCE VALUES</div><div class="jl-rule-body">• 0.0 = no resistance<br>• 0.5 = 50% damage reduction<br>• 1.0 = immune<br>• Can be negative (vulnerability)</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set fire resistance to <strong>0.5</strong>.</div></div>`;},
    validator(p){if(!p.resistances)return'Missing resistances';if(p.resistances.fire!==0.5)return'Fire resistance must be 0.5';return null;}},
  {id:'p6_02',title:'MULTI RESISTANCE',icon:'O2',exercise:true,initialCode:'{\n  "resistances": {\n    "fire": 0.3,\n    "frost": 0.3,\n    "nature": 0.3\n  }\n}',
    render(){return`<div class="jl-h1">MULTI RESISTANCE</div><div class="jl-sub">PRESTIGE 6 — LESSON 2/12</div><div class="jl-p">Units can have resistances to multiple schools.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set all resistances to <strong>0.4</strong>.</div></div>`;},
    validator(p){if(!p.resistances)return'Missing resistances';if(p.resistances.fire!==0.4||p.resistances.frost!==0.4||p.resistances.nature!==0.4)return'All resistances must be 0.4';return null;}},
  {id:'p6_03',title:'STATUS EFFECTS',icon:'O3',exercise:true,initialCode:'{\n  "magic": {\n    "effect": {\n      "type": "slow",\n      "power": 0.3,\n      "duration": 3000\n    }\n  }\n}',
    render(){return`<div class="jl-h1">STATUS EFFECTS</div><div class="jl-sub">PRESTIGE 6 — LESSON 3/12</div><div class="jl-p">Status effects apply debuffs to enemies on hit.</div><div class="jl-rule"><div class="jl-rule-hdr">EFFECT TYPES</div><div class="jl-rule-body"><code>slow</code> — reduces speed<br><code>burn</code> — damage over time<br><code>freeze</code> — prevents movement<br><code>poison</code> — damage over time</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set effect type to <code>"burn"</code> and power to <strong>15</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.effect)return'Missing magic.effect';if(p.magic.effect.type!=='burn')return'Type must be burn';if(p.magic.effect.power!==15)return'Power must be 15';return null;}},
  {id:'p6_04',title:'EFFECT DURATION',icon:'O4',exercise:true,initialCode:'{\n  "magic": {\n    "effect": {\n      "type": "slow",\n      "power": 0.3,\n      "duration": 3000\n    }\n  }\n}',
    render(){return`<div class="jl-h1">EFFECT DURATION</div><div class="jl-sub">PRESTIGE 6 — LESSON 4/12</div><div class="jl-p">Duration determines how long a status effect lasts.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set duration to <strong>5000</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.effect)return'Missing magic.effect';if(p.magic.effect.duration!==5000)return'Duration must be 5000';return null;}},
  {id:'p6_05',title:'MELEE EFFECTS',icon:'O5',exercise:true,initialCode:'{\n  "melee": {\n    "enabled": true,\n    "effect": {\n      "type": "slow",\n      "power": 0.2,\n      "duration": 2000\n    }\n  }\n}',
    render(){return`<div class="jl-h1">MELEE EFFECTS</div><div class="jl-sub">PRESTIGE 6 — LESSON 5/12</div><div class="jl-p">Melee attacks can also apply status effects.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set effect type to <code>"poison"</code> and power to <strong>10</strong>.</div></div>`;},
    validator(p){if(!p.melee||!p.melee.effect)return'Missing melee.effect';if(p.melee.effect.type!=='poison')return'Type must be poison';if(p.melee.effect.power!==10)return'Power must be 10';return null;}},
  {id:'p6_06',title:'RANGED EFFECTS',icon:'O6',exercise:true,initialCode:'{\n  "ranged": {\n    "enabled": true,\n    "effect": {\n      "type": "slow",\n      "power": 0.2,\n      "duration": 2000\n    }\n  }\n}',
    render(){return`<div class="jl-h1">RANGED EFFECTS</div><div class="jl-sub">PRESTIGE 6 — LESSON 6/12</div><div class="jl-p">Ranged attacks can apply status effects at range.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set effect type to <code>"freeze"</code> and duration to <strong>1500</strong>.</div></div>`;},
    validator(p){if(!p.ranged||!p.ranged.effect)return'Missing ranged.effect';if(p.ranged.effect.type!=='freeze')return'Type must be freeze';if(p.ranged.effect.duration!==1500)return'Duration must be 1500';return null;}},
  {id:'p6_07',title:'PASSIVE ABILITIES',icon:'O7',exercise:true,initialCode:'{\n  "passive": "vampiric"\n}',
    render(){return`<div class="jl-h1">PASSIVE ABILITIES</div><div class="jl-sub">PRESTIGE 6 — LESSON 7/12</div><div class="jl-p">Passive abilities provide constant bonuses.</div><div class="jl-rule"><div class="jl-rule-hdr">COMMON PASSIVES</div><div class="jl-rule-body"><code>vampiric</code> — lifesteal<br><code>regeneration</code> — HP regen<br><code>thorns</code> — reflect damage<br><code>shield</code> — damage absorption</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set passive to <code>"regeneration"</code>.</div></div>`;},
    validator(p){if(!p.passive||p.passive!=='regeneration')return'Passive must be regeneration';return null;}},
  {id:'p6_08',title:'DUAL PASSIVES',icon:'O8',exercise:true,initialCode:'{\n  "passive": "vampiric",\n  "passive2": "regeneration"\n}',
    render(){return`<div class="jl-h1">DUAL PASSIVES</div><div class="jl-sub">PRESTIGE 6 — LESSON 8/12</div><div class="jl-p">Units can have two passive abilities.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set passive to <code>"thorns"</code> and passive2 to <code>"shield"</code>.</div></div>`;},
    validator(p){if(p.passive!=='thorns'||p.passive2!=='shield')return'Passive must be thorns, passive2 must be shield';return null;}},
  {id:'p6_09',title:'SCHOOL SYNERGY',icon:'O9',exercise:true,initialCode:'{\n  "school": "fire",\n  "resistances": {\n    "fire": 0.5\n  },\n  "passive": "burning"\n}',
    render(){return`<div class="jl-h1">SCHOOL SYNERGY</div><div class="jl-sub">PRESTIGE 6 — LESSON 9/12</div><div class="jl-p">Matching school with resistances and passives creates synergy.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set school to <code>"frost"</code> and frost resistance to <strong>0.6</strong>.</div></div>`;},
    validator(p){if(p.school!=='frost')return'School must be frost';if(!p.resistances||p.resistances.frost!==0.6)return'Frost resistance must be 0.6';return null;}},
  {id:'p6_10',title:'STATUS IMMUNITY',icon:'O10',exercise:true,initialCode:'{\n  "resistances": {\n    "fire": 0.5,\n    "frost": 0.5,\n    "nature": 0.5,\n    "void": 0.5\n  }\n}',
    render(){return`<div class="jl-h1">STATUS IMMUNITY</div><div class="jl-sub">PRESTIGE 6 — LESSON 10/12</div><div class="jl-p">High resistance to all schools provides broad protection.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set all resistances to <strong>0.7</strong>.</div></div>`;},
    validator(p){if(!p.resistances)return'Missing resistances';if(p.resistances.fire!==0.7||p.resistances.frost!==0.7||p.resistances.nature!==0.7||p.resistances.void!==0.7)return'All resistances must be 0.7';return null;}},
  {id:'p6_11',title:'EFFECT STACKING',icon:'O11',exercise:true,initialCode:'{\n  "magic": {\n    "effect": {\n      "type": "burn",\n      "power": 10,\n      "duration": 4000,\n      "stack": true\n    }\n  }\n}',
    render(){return`<div class="jl-h1">EFFECT STACKING</div><div class="jl-sub">PRESTIGE 6 — LESSON 11/12</div><div class="jl-p">Stacking effects can accumulate for stronger debuffs.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set power to <strong>15</strong> and duration to <strong>5000</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.effect)return'Missing magic.effect';if(p.magic.effect.power!==15)return'Power must be 15';if(p.magic.effect.duration!==5000)return'Duration must be 5000';return null;}},
  {id:'p6_12',title:'DEFENSIVE MASTERY',icon:'O12',exercise:true,initialCode:'{\n  "hp": 300,\n  "armor": 15,\n  "resistances": {\n    "fire": 0.4,\n    "frost": 0.4\n  },\n  "passive": "regeneration"\n}',
    render(){return`<div class="jl-h1">DEFENSIVE MASTERY</div><div class="jl-sub">PRESTIGE 6 — LESSON 12/12</div><div class="jl-p">Combine defensive features for a resilient unit.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ MASTERY EXERCISE</div><div class="jl-ex-body">Set hp to <strong>350</strong> and armor to <strong>18</strong>.</div></div>`;},
    validator(p){if(p.hp!==350)return'HP must be 350';if(p.armor!==18)return'Armor must be 18';return null;}},

// ================================================================
// PRESTIGE 7 - UNIT MANAGEMENT
// ================================================================
  {id:'p7_01',title:'UNIT ID',icon:'P1',exercise:true,initialCode:'{\n  "id": "my_unit",\n  "name": "My Unit"\n}',
    render(){return`<div class="jl-h1">UNIT ID</div><div class="jl-sub">PRESTIGE 7 — LESSON 1/12</div><div class="jl-p">Every unit needs a unique ID and display name.</div><div class="jl-rule"><div class="jl-rule-hdr">ID RULES</div><div class="jl-rule-body">• Must be unique<br>• Use lowercase, numbers, underscores<br>• No spaces or special chars<br>• Used for saving/loading</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set id to <code>"custom_unit"</code> and name to <code>"Custom Unit"</code>.</div></div>`;},
    validator(p){if(p.id!=='custom_unit')return'ID must be custom_unit';if(p.name!=='Custom Unit')return'Name must be Custom Unit';return null;}},
  {id:'p7_02',title:'MAGIC SCHOOL',icon:'P2',exercise:true,initialCode:'{\n  "school": "fire"\n}',
    render(){return`<div class="jl-h1">MAGIC SCHOOL</div><div class="jl-sub">PRESTIGE 7 — LESSON 2/12</div><div class="jl-p">Magic school determines the type of magic and visual theme.</div><div class="jl-rule"><div class="jl-rule-hdr">SCHOOLS</div><div class="jl-rule-body"><code>fire</code> — fire magic<br><code>frost</code> — ice magic<br><code>nature</code> — nature magic<br><code>void</code> — dark magic<br><code>arcane</code> — arcane magic</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set school to <code>"arcane"</code>.</div></div>`;},
    validator(p){if(p.school!=='arcane')return'School must be arcane';return null;}},
  {id:'p7_03',title:'MOVE SPEED',icon:'P3',exercise:true,initialCode:'{\n  "spd": 2.0\n}',
    render(){return`<div class="jl-h1">MOVE SPEED</div><div class="jl-sub">PRESTIGE 7 — LESSON 3/12</div><div class="jl-p">Speed determines how fast the unit moves.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set spd to <strong>3.0</strong>.</div></div>`;},
    validator(p){if(p.spd!==3.0)return'Spd must be 3.0';return null;}},
  {id:'p7_04',title:'VISUAL CUSTOMIZATION',icon:'P4',exercise:true,initialCode:'{\n  "visual": {\n    "color": "#ff0000",\n    "size": 1.0\n  }\n}',
    render(){return`<div class="jl-h1">VISUAL CUSTOMIZATION</div><div class="jl-sub">PRESTIGE 7 — LESSON 4/12</div><div class="jl-p">Visual settings control the unit's appearance.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set color to <code>"#00ff00"</code> and size to <strong>1.2</strong>.</div></div>`;},
    validator(p){if(!p.visual||p.visual.color!=='#00ff00')return'Color must be #00ff00';if(p.visual.size!==1.2)return'Size must be 1.2';return null;}},
  {id:'p7_05',title:'GLITCH ABILITIES',icon:'P5',exercise:true,initialCode:'{\n  "glitch": {\n    "enabled": true,\n    "ability": "blink"\n  }\n}',
    render(){return`<div class="jl-h1">GLITCH ABILITIES</div><div class="jl-sub">PRESTIGE 7 — LESSON 5/12</div><div class="jl-p">Glitch abilities are special powers with cooldowns.</div><div class="jl-rule"><div class="jl-rule-hdr">GLITCH TYPES</div><div class="jl-rule-body"><code>blink</code> — teleport<br><code>shield</code> — temporary invulnerability<br><code>heal</code> — restore HP<br><code>burst</code> — damage area</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set ability to <code>"shield"</code>.</div></div>`;},
    validator(p){if(!p.glitch||!p.glitch.enabled)return'Glitch must be enabled';if(p.glitch.ability!=='shield')return'Ability must be shield';return null;}},
  {id:'p7_06',title:'SIGNATURE ABILITIES',icon:'P6',exercise:true,initialCode:'{\n  "magic": {\n    "sig": {\n      "type": "zone",\n      "power": 50,\n      "duration": 5000\n    }\n  }\n}',
    render(){return`<div class="jl-h1">SIGNATURE ABILITIES</div><div class="jl-sub">PRESTIGE 7 — LESSON 6/12</div><div class="jl-p">Signature abilities are powerful ultimate skills.</div><div class="jl-rule"><div class="jl-rule-hdr">SIG TYPES</div><div class="jl-rule-body"><code>zone</code> — area effect<br><code>burst</code> — single target damage<br><code>summon</code> — create ally<br><code>buff</code> — enhance self</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set sig type to <code>"burst"</code> and power to <strong>80</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.sig)return'Missing magic.sig';if(p.magic.sig.type!=='burst')return'Type must be burst';if(p.magic.sig.power!==80)return'Power must be 80';return null;}},
  {id:'p7_07',title:'BOLT CONFIGURATION',icon:'P7',exercise:true,initialCode:'{\n  "magic": {\n    "bolt": {\n      "speed": 5.0,\n      "count": 1\n    }\n  }\n}',
    render(){return`<div class="jl-h1">BOLT CONFIGURATION</div><div class="jl-sub">PRESTIGE 7 — LESSON 7/12</div><div class="jl-p">Bolt settings control projectile behavior.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set bolt speed to <strong>7.0</strong> and count to <strong>3</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.bolt)return'Missing magic.bolt';if(p.magic.bolt.speed!==7.0)return'Speed must be 7.0';if(p.magic.bolt.count!==3)return'Count must be 3';return null;}},
  {id:'p7_08',title:'VOLLEY SHOTS',icon:'P8',exercise:true,initialCode:'{\n  "ranged": {\n    "enabled": true,\n    "volley": {\n      "count": 3,\n      "delay": 200\n    }\n  }\n}',
    render(){return`<div class="jl-h1">VOLLEY SHOTS</div><div class="jl-sub">PRESTIGE 7 — LESSON 8/12</div><div class="jl-p">Volley fires multiple shots in sequence.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set volley count to <strong>5</strong> and delay to <strong>150</strong>.</div></div>`;},
    validator(p){if(!p.ranged||!p.ranged.volley)return'Missing ranged.volley';if(p.ranged.volley.count!==5)return'Count must be 5';if(p.ranged.volley.delay!==150)return'Delay must be 150';return null;}},
  {id:'p7_09',title:'LUNGE ATTACK',icon:'P9',exercise:true,initialCode:'{\n  "melee": {\n    "enabled": true,\n    "lunge": 0.5\n  }\n}',
    render(){return`<div class="jl-h1">LUNGE ATTACK</div><div class="jl-sub">PRESTIGE 7 — LESSON 9/12</div><div class="jl-p">Lunge makes the unit dash forward when attacking.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set lunge to <strong>0.8</strong>.</div></div>`;},
    validator(p){if(!p.melee||!p.melee.lunge)return'Missing melee.lunge';if(p.melee.lunge!==0.8)return'Lunge must be 0.8';return null;}},
  {id:'p7_10',title:'PARRY CHANCE',icon:'P10',exercise:true,initialCode:'{\n  "melee": {\n    "enabled": true,\n    "parry": 0.3\n  }\n}',
    render(){return`<div class="jl-h1">PARRY CHANCE</div><div class="jl-sub">PRESTIGE 7 — LESSON 10/12</div><div class="jl-p">Parry allows blocking and counter-attacking.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set parry to <strong>0.5</strong>.</div></div>`;},
    validator(p){if(!p.melee||!p.melee.parry)return'Missing melee.parry';if(p.melee.parry!==0.5)return'Parry must be 0.5';return null;}},
  {id:'p7_11',title:'CHARGE ATTACK',icon:'P11',exercise:true,initialCode:'{\n  "melee": {\n    "enabled": true,\n    "charge": 0.4\n  }\n}',
    render(){return`<div class="jl-h1">CHARGE ATTACK</div><div class="jl-sub">PRESTIGE 7 — LESSON 11/12</div><div class="jl-p">Charge builds power over time for a strong attack.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set charge to <strong>0.7</strong>.</div></div>`;},
    validator(p){if(!p.melee||!p.melee.charge)return'Missing melee.charge';if(p.melee.charge!==0.7)return'Charge must be 0.7';return null;}},
  {id:'p7_12',title:'UNIT MASTERY',icon:'P12',exercise:true,initialCode:'{\n  "id": "master_unit",\n  "name": "Master Unit",\n  "school": "arcane",\n  "hp": 250,\n  "armor": 12,\n  "spd": 2.5,\n  "magic": {\n    "enabled": true,\n    "spell": { "type": "bolt", "dmg": 40, "cd": 1000 }\n  },\n  "ai": { "stance": "cunning" }\n}',
    render(){return`<div class="jl-h1">UNIT MASTERY</div><div class="jl-sub">PRESTIGE 7 — LESSON 12/12</div><div class="jl-p">Combine all unit features into a complete design.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ MASTERY EXERCISE</div><div class="jl-ex-body">Set hp to <strong>300</strong> and add a passive <code>"vampiric"</code>.</div></div>`;},
    validator(p){if(p.hp!==300)return'HP must be 300';if(!p.passive||p.passive!=='vampiric')return'Passive must be vampiric';return null;}},

// ================================================================
// PRESTIGE 8 - ADVANCED SPELL FEATURES
// ================================================================
  {id:'p8_01',title:'SPELL PATTERNS',icon:'Q1',exercise:true,initialCode:'{\n  "magic": {\n    "spell": {\n      "type": "bolt",\n      "pattern": "straight"\n    }\n  }\n}',
    render(){return`<div class="jl-h1">SPELL PATTERNS</div><div class="jl-sub">PRESTIGE 8 — LESSON 1/12</div><div class="jl-p">Spell patterns determine how projectiles travel.</div><div class="jl-rule"><div class="jl-rule-hdr">PATTERN TYPES</div><div class="jl-rule-body"><code>straight</code> — direct line<br><code>spiral</code> — spinning path<br><code>wave</code> — sine wave<br><code>spread</code> — fan pattern</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set pattern to <code>"spiral"</code>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.spell)return'Missing magic.spell';if(p.magic.spell.pattern!=='spiral')return'Pattern must be spiral';return null;}},
  {id:'p8_02',title:'SPELL RANGE',icon:'Q2',exercise:true,initialCode:'{\n  "magic": {\n    "spell": {\n      "type": "bolt",\n      "range": 200\n    }\n  }\n}',
    render(){return`<div class="jl-h1">SPELL RANGE</div><div class="jl-sub">PRESTIGE 8 — LESSON 2/12</div><div class="jl-p">Range determines maximum spell distance.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set range to <strong>300</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.spell)return'Missing magic.spell';if(p.magic.spell.range!==300)return'Range must be 300';return null;}},
  {id:'p8_03',title:'COOLDOWN MANAGEMENT',icon:'Q3',exercise:true,initialCode:'{\n  "magic": {\n    "spell": {\n      "type": "bolt",\n      "cd": 1000\n    }\n  }\n}',
    render(){return`<div class="jl-h1">COOLDOWN MANAGEMENT</div><div class="jl-sub">PRESTIGE 8 — LESSON 3/12</div><div class="jl-p">Cooldown (cd) controls spell frequency.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set cd to <strong>800</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.spell)return'Missing magic.spell';if(p.magic.spell.cd!==800)return'CD must be 800';return null;}},
  {id:'p8_04',title:'MANA COSTS',icon:'Q4',exercise:true,initialCode:'{\n  "magic": {\n    "mana": 100,\n    "spell": {\n      "type": "bolt",\n      "dmg": 30\n    }\n  }\n}',
    render(){return`<div class="jl-h1">MANA COSTS</div><div class="jl-sub">PRESTIGE 8 — LESSON 4/12</div><div class="jl-p">Mana determines spell capacity and regeneration.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set mana to <strong>150</strong>.</div></div>`;},
    validator(p){if(!p.magic||p.magic.mana!==150)return'Mana must be 150';return null;}},
  {id:'p8_05',title:'CRITICAL HITS',icon:'Q5',exercise:true,initialCode:'{\n  "magic": {\n    "spell": {\n      "type": "bolt",\n      "critChance": 0.1,\n      "critMult": 1.5\n    }\n  }\n}',
    render(){return`<div class="jl-h1">CRITICAL HITS</div><div class="jl-sub">PRESTIGE 8 — LESSON 5/12</div><div class="jl-p">Critical hits deal bonus damage randomly.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set critChance to <strong>0.2</strong> and critMult to <strong>2.0</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.spell)return'Missing magic.spell';if(p.magic.spell.critChance!==0.2)return'CritChance must be 0.2';if(p.magic.spell.critMult!==2.0)return'CritMult must be 2.0';return null;}},
  {id:'p8_06',title:'ARMOR PENETRATION',icon:'Q6',exercise:true,initialCode:'{\n  "magic": {\n    "spell": {\n      "type": "bolt",\n      "armorPen": 0.2\n    }\n  }\n}',
    render(){return`<div class="jl-h1">ARMOR PENETRATION</div><div class="jl-sub">PRESTIGE 8 — LESSON 6/12</div><div class="jl-p">Armor penetration ignores enemy defense.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set armorPen to <strong>0.5</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.spell)return'Missing magic.spell';if(p.magic.spell.armorPen!==0.5)return'ArmorPen must be 0.5';return null;}},
  {id:'p8_07',title:'HOMING PROJECTILES',icon:'Q7',exercise:true,initialCode:'{\n  "magic": {\n    "bolt": {\n      "homing": 0.3\n    }\n  }\n}',
    render(){return`<div class="jl-h1">HOMING PROJECTILES</div><div class="jl-sub">PRESTIGE 8 — LESSON 7/12</div><div class="jl-p">Homing makes projectiles track targets.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set homing to <strong>0.7</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.bolt)return'Missing magic.bolt';if(p.magic.bolt.homing!==0.7)return'Homing must be 0.7';return null;}},
  {id:'p8_08',title:'PROJECTILE SPREAD',icon:'Q8',exercise:true,initialCode:'{\n  "magic": {\n    "bolt": {\n      "spread": 0.2\n    }\n  }\n}',
    render(){return`<div class="jl-h1">PROJECTILE SPREAD</div><div class="jl-sub">PRESTIGE 8 — LESSON 8/12</div><div class="jl-p">Spread determines projectile dispersion.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set spread to <strong>0.5</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.bolt)return'Missing magic.bolt';if(p.magic.bolt.spread!==0.5)return'Spread must be 0.5';return null;}},
  {id:'p8_09',title:'ZONE EFFECTS',icon:'Q9',exercise:true,initialCode:'{\n  "magic": {\n    "sig": {\n      "type": "zone",\n      "radius": 100\n    }\n  }\n}',
    render(){return`<div class="jl-h1">ZONE EFFECTS</div><div class="jl-sub">PRESTIGE 8 — LESSON 9/12</div><div class="jl-p">Zone effects cover an area rather than single targets.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set radius to <strong>150</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.sig)return'Missing magic.sig';if(p.magic.sig.radius!==150)return'Radius must be 150';return null;}},
  {id:'p8_10',title:'SPELL COMBOS',icon:'Q10',exercise:true,initialCode:'{\n  "magic": {\n    "spell": {\n      "type": "bolt",\n      "pattern": "spiral",\n      "dmg": 35,\n      "cd": 900\n    },\n    "effect": {\n      "type": "slow",\n      "power": 0.3\n    }\n  }\n}',
    render(){return`<div class="jl-h1">SPELL COMBOS</div><div class="jl-sub">PRESTIGE 8 — LESSON 10/12</div><div class="jl-p">Combine spell patterns with status effects for combos.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set dmg to <strong>45</strong> and effect power to <strong>0.4</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.spell)return'Missing magic.spell';if(p.magic.spell.dmg!==45)return'Dmg must be 45';if(!p.magic.effect||p.magic.effect.power!==0.4)return'Effect power must be 0.4';return null;}},
  {id:'p8_11',title:'SPELL MASTERY',icon:'Q11',exercise:true,initialCode:'{\n  "magic": {\n    "enabled": true,\n    "school": "arcane",\n    "mana": 120,\n    "spell": {\n      "type": "bolt",\n      "pattern": "spiral",\n      "dmg": 40,\n      "cd": 1000,\n      "range": 250,\n      "critChance": 0.15,\n      "critMult": 1.8\n    },\n    "bolt": {\n      "speed": 6.0,\n      "homing": 0.5\n    },\n    "sig": {\n      "type": "zone",\n      "power": 60,\n      "radius": 120\n    }\n  }\n}',
    render(){return`<div class="jl-h1">SPELL MASTERY</div><div class="jl-sub">PRESTIGE 8 — LESSON 11/12</div><div class="jl-p">Combine all spell features into a master ability.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ MASTERY EXERCISE</div><div class="jl-ex-body">Set spell dmg to <strong>50</strong> and sig power to <strong>75</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.spell)return'Missing magic.spell';if(p.magic.spell.dmg!==50)return'Dmg must be 50';if(!p.magic.sig||p.magic.sig.power!==75)return'Sig power must be 75';return null;}},
  {id:'p8_12',title:'ULTIMATE MASTERY',icon:'Q12',exercise:true,initialCode:'{\n  "id": "ultimate_unit",\n  "name": "Ultimate",\n  "school": "void",\n  "hp": 280,\n  "armor": 14,\n  "spd": 2.2,\n  "resistances": { "fire": 0.3, "frost": 0.3 },\n  "passive": "vampiric",\n  "magic": {\n    "enabled": true,\n    "mana": 150,\n    "spell": { "type": "bolt", "pattern": "spiral", "dmg": 45, "cd": 900 },\n    "sig": { "type": "zone", "power": 70 }\n  },\n  "ai": { "stance": "cunning", "dodge": 0.7, "aim": 0.9 }\n}',
    render(){return`<div class="jl-h1">ULTIMATE MASTERY</div><div class="jl-sub">PRESTIGE 8 — LESSON 12/12</div><div class="jl-p">Combine all learned features into the ultimate unit.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ FINAL EXERCISE</div><div class="jl-ex-body">Set hp to <strong>320</strong> and dodge to <strong>0.8</strong>.</div></div>`;},
    validator(p){if(p.hp!==320)return'HP must be 320';if(!p.ai||p.ai.dodge!==0.8)return'Dodge must be 0.8';return null;}},

// ================================================================
// PRESTIGE 9 - ADVANCED COMBINATIONS
// ================================================================
  {id:'p9_01',title:'TANK BUILD',icon:'R1',exercise:true,initialCode:'{\n  "hp": 400,\n  "armor": 20,\n  "resistances": { "fire": 0.4, "frost": 0.4 },\n  "passive": "regeneration",\n  "melee": { "enabled": true, "dmg": 20, "cd": 1500 }\n}',
    render(){return`<div class="jl-h1">TANK BUILD</div><div class="jl-sub">PRESTIGE 9 — LESSON 1/12</div><div class="jl-p">Tank builds prioritize survival over damage output.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set hp to <strong>450</strong> and armor to <strong>25</strong>.</div></div>`;},
    validator(p){if(p.hp!==450)return'HP must be 450';if(p.armor!==25)return'Armor must be 25';return null;}},
  {id:'p9_02',title:'GLASS CANNON',icon:'R2',exercise:true,initialCode:'{\n  "hp": 150,\n  "armor": 5,\n  "spd": 3.5,\n  "magic": {\n    "enabled": true,\n    "mana": 100,\n    "spell": { "type": "bolt", "dmg": 60, "cd": 800 }\n  }\n}',
    render(){return`<div class="jl-h1">GLASS CANNON</div><div class="jl-sub">PRESTIGE 9 — LESSON 2/12</div><div class="jl-p">Glass cannons deal massive damage but have low survivability.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set spell dmg to <strong>75</strong> and spd to <strong>4.0</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.spell)return'Missing magic.spell';if(p.magic.spell.dmg!==75)return'Dmg must be 75';if(p.spd!==4.0)return'Spd must be 4.0';return null;}},
  {id:'p9_03',title:'SUPPORT BUILD',icon:'R3',exercise:true,initialCode:'{\n  "hp": 200,\n  "armor": 8,\n  "passive": "regeneration",\n  "passive2": "shield",\n  "magic": {\n    "enabled": true,\n    "spell": { "type": "bolt", "dmg": 25, "cd": 1200 },\n    "effect": { "type": "slow", "power": 0.3, "duration": 3000 }\n  }\n}',
    render(){return`<div class="jl-h1">SUPPORT BUILD</div><div class="jl-sub">PRESTIGE 9 — LESSON 3/12</div><div class="jl-p">Support builds focus on utility and team benefits.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set effect power to <strong>0.4</strong> and duration to <strong>4000</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.effect)return'Missing magic.effect';if(p.magic.effect.power!==0.4)return'Effect power must be 0.4';if(p.magic.effect.duration!==4000)return'Duration must be 4000';return null;}},
  {id:'p9_04',title:'KITE BUILD',icon:'R4',exercise:true,initialCode:'{\n  "spd": 3.0,\n  "ranged": {\n    "enabled": true,\n    "dmg": 30,\n    "cd": 1000,\n    "range": 250\n  },\n  "ai": {\n    "spacing": 0.8,\n    "retreatThreshold": 0.4\n  }\n}',
    render(){return`<div class="jl-h1">KITE BUILD</div><div class="jl-sub">PRESTIGE 9 — LESSON 4/12</div><div class="jl-p">Kite builds maintain distance while dealing damage.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set spd to <strong>3.5</strong> and spacing to <strong>0.9</strong>.</div></div>`;},
    validator(p){if(p.spd!==3.5)return'Spd must be 3.5';if(!p.ai||p.ai.spacing!==0.9)return'Spacing must be 0.9';return null;}},
  {id:'p9_05',title:'BURST BUILD',icon:'R5',exercise:true,initialCode:'{\n  "magic": {\n    "enabled": true,\n    "mana": 80,\n    "spell": {\n      "type": "bolt",\n      "dmg": 50,\n      "cd": 2000,\n      "critChance": 0.25,\n      "critMult": 2.0\n    }\n  }\n}',
    render(){return`<div class="jl-h1">BURST BUILD</div><div class="jl-sub">PRESTIGE 9 — LESSON 5/12</div><div class="jl-p">Burst builds deal high damage in short windows.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set critChance to <strong>0.35</strong> and critMult to <strong>2.5</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.spell)return'Missing magic.spell';if(p.magic.spell.critChance!==0.35)return'CritChance must be 0.35';if(p.magic.spell.critMult!==2.5)return'CritMult must be 2.5';return null;}},
  {id:'p9_06',title:'SUSTAIN BUILD',icon:'R6',exercise:true,initialCode:'{\n  "hp": 250,\n  "passive": "vampiric",\n  "passive2": "regeneration",\n  "melee": {\n    "enabled": true,\n    "dmg": 30,\n    "cd": 1000,\n    "lifesteal": 0.3\n  }\n}',
    render(){return`<div class="jl-h1">SUSTAIN BUILD</div><div class="jl-sub">PRESTIGE 9 — LESSON 6/12</div><div class="jl-p">Sustain builds focus on healing and survival.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set hp to <strong>300</strong> and add lifesteal to melee.</div></div>`;},
    validator(p){if(p.hp!==300)return'HP must be 300';return null;}},
  {id:'p9_07',title:'CROWD CONTROL',icon:'R7',exercise:true,initialCode:'{\n  "magic": {\n    "enabled": true,\n    "spell": {\n      "type": "bolt",\n      "dmg": 25,\n      "cd": 1500\n    },\n    "effect": {\n      "type": "freeze",\n      "power": 0.5,\n      "duration": 2000\n    }\n  }\n}',
    render(){return`<div class="jl-h1">CROWD CONTROL</div><div class="jl-sub">PRESTIGE 9 — LESSON 7/12</div><div class="jl-p">Crowd control builds disable enemies.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set effect type to <code>"slow"</code> and power to <strong>0.6</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.effect)return'Missing magic.effect';if(p.magic.effect.type!=='slow')return'Type must be slow';if(p.magic.effect.power!==0.6)return'Power must be 0.6';return null;}},
  {id:'p9_08',title:'AOE BUILD',icon:'R8',exercise:true,initialCode:'{\n  "magic": {\n    "enabled": true,\n    "sig": {\n      "type": "zone",\n      "power": 40,\n      "radius": 100,\n      "duration": 3000\n    }\n  },\n  "ranged": {\n    "enabled": true,\n    "count": 3,\n    "spread": 0.4\n  }\n}',
    render(){return`<div class="jl-h1">AOE BUILD</div><div class="jl-sub">PRESTIGE 9 — LESSON 8/12</div><div class="jl-p">AOE builds damage multiple targets.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set sig radius to <strong>150</strong> and ranged count to <strong>5</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.sig)return'Missing magic.sig';if(p.magic.sig.radius!==150)return'Radius must be 150';if(!p.ranged||p.ranged.count!==5)return'Count must be 5';return null;}},
  {id:'p9_09',title:'MOBILITY BUILD',icon:'R9',exercise:true,initialCode:'{\n  "spd": 3.5,\n  "ai": {\n    "dodge": 0.7,\n    "strafe": 0.8,\n    "movementStyle": "orbit"\n  },\n  "glitch": {\n    "enabled": true,\n    "ability": "blink"\n  }\n}',
    render(){return`<div class="jl-h1">MOBILITY BUILD</div><div class="jl-sub">PRESTIGE 9 — LESSON 9/12</div><div class="jl-p">Mobility builds focus on movement and positioning.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set spd to <strong>4.0</strong> and dodge to <strong>0.85</strong>.</div></div>`;},
    validator(p){if(p.spd!==4.0)return'Spd must be 4.0';if(!p.ai||p.ai.dodge!==0.85)return'Dodge must be 0.85';return null;}},
  {id:'p9_10',title:'HYBRID DAMAGE',icon:'R10',exercise:true,initialCode:'{\n  "magic": {\n    "enabled": true,\n    "spell": { "type": "bolt", "dmg": 35, "cd": 1200 }\n  },\n  "melee": {\n    "enabled": true,\n    "dmg": 35,\n    "cd": 1200\n  },\n  "ai": {\n    "priority": { "magic": 0.5, "melee": 0.5 }\n  }\n}',
    render(){return`<div class="jl-h1">HYBRID DAMAGE</div><div class="jl-sub">PRESTIGE 9 — LESSON 10/12</div><div class="jl-p">Hybrid damage uses both magic and melee effectively.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set both dmg values to <strong>40</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.spell)return'Missing magic.spell';if(p.magic.spell.dmg!==40)return'Magic dmg must be 40';if(!p.melee||p.melee.dmg!==40)return'Melee dmg must be 40';return null;}},
  {id:'p9_11',title:'DEFENSIVE OFFENSE',icon:'R11',exercise:true,initialCode:'{\n  "hp": 300,\n  "armor": 15,\n  "passive": "thorns",\n  "melee": {\n    "enabled": true,\n    "dmg": 40,\n    "cd": 1000,\n    "knockback": 0.5\n  }\n}',
    render(){return`<div class="jl-h1">DEFENSIVE OFFENSE</div><div class="jl-sub">PRESTIGE 9 — LESSON 11/12</div><div class="jl-p">Defensive offense deals damage while staying safe.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set knockback to <strong>0.8</strong> and armor to <strong>18</strong>.</div></div>`;},
    validator(p){if(!p.melee||!p.melee.knockback)return'Missing melee.knockback';if(p.melee.knockback!==0.8)return'Knockback must be 0.8';if(p.armor!==18)return'Armor must be 18';return null;}},
  {id:'p9_12',title:'BUILD MASTERY',icon:'R12',exercise:true,initialCode:'{\n  "id": "custom_build",\n  "name": "Custom Build",\n  "school": "arcane",\n  "hp": 280,\n  "armor": 12,\n  "spd": 2.8,\n  "resistances": { "fire": 0.3, "frost": 0.3 },\n  "passive": "vampiric",\n  "magic": {\n    "enabled": true,\n    "mana": 120,\n    "spell": { "type": "bolt", "dmg": 45, "cd": 900 },\n    "sig": { "type": "zone", "power": 55 }\n  },\n  "ai": { "stance": "cunning", "dodge": 0.7 }\n}',
    render(){return`<div class="jl-h1">BUILD MASTERY</div><div class="jl-sub">PRESTIGE 9 — LESSON 12/12</div><div class="jl-p">Create a balanced custom build.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ MASTERY EXERCISE</div><div class="jl-ex-body">Set hp to <strong>320</strong> and spell dmg to <strong>50</strong>.</div></div>`;},
    validator(p){if(p.hp!==320)return'HP must be 320';if(!p.magic||!p.magic.spell||p.magic.spell.dmg!==50)return'Spell dmg must be 50';return null;}},

// ================================================================
// PRESTIGE 10 - SPECIALIZED BUILDS
// ================================================================
  {id:'p10_01',title:'FIRE MAGE',icon:'S1',exercise:true,initialCode:'{\n  "school": "fire",\n  "resistances": { "fire": 0.5 },\n  "passive": "burning",\n  "magic": {\n    "enabled": true,\n    "mana": 100,\n    "spell": {\n      "type": "bolt",\n      "dmg": 40,\n      "cd": 1000\n    },\n    "effect": {\n      "type": "burn",\n      "power": 15,\n      "duration": 4000\n    }\n  }\n}',
    render(){return`<div class="jl-h1">FIRE MAGE</div><div class="jl-sub">PRESTIGE 10 — LESSON 1/12</div><div class="jl-p">Fire mages specialize in fire magic and burn effects.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set spell dmg to <strong>50</strong> and effect power to <strong>20</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.spell)return'Missing magic.spell';if(p.magic.spell.dmg!==50)return'Dmg must be 50';if(!p.magic.effect||p.magic.effect.power!==20)return'Effect power must be 20';return null;}},
  {id:'p10_02',title:'FROST MAGE',icon:'S2',exercise:true,initialCode:'{\n  "school": "frost",\n  "resistances": { "frost": 0.5 },\n  "magic": {\n    "enabled": true,\n    "mana": 100,\n    "spell": {\n      "type": "bolt",\n      "dmg": 35,\n      "cd": 1100\n    },\n    "effect": {\n      "type": "freeze",\n      "power": 0.4,\n      "duration": 2000\n    }\n  }\n}',
    render(){return`<div class="jl-h1">FROST MAGE</div><div class="jl-sub">PRESTIGE 10 — LESSON 2/12</div><div class="jl-p">Frost mages specialize in slowing and freezing enemies.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set effect duration to <strong>3000</strong> and power to <strong>0.5</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.effect)return'Missing magic.effect';if(p.magic.effect.duration!==3000)return'Duration must be 3000';if(p.magic.effect.power!==0.5)return'Power must be 0.5';return null;}},
  {id:'p10_03',title:'NATURE HEALER',icon:'S3',exercise:true,initialCode:'{\n  "school": "nature",\n  "passive": "regeneration",\n  "passive2": "shield",\n  "magic": {\n    "enabled": true,\n    "mana": 120,\n    "spell": {\n      "type": "bolt",\n      "dmg": 25,\n      "cd": 1500\n    },\n    "sig": {\n      "type": "zone",\n      "power": 30,\n      "radius": 100\n    }\n  }\n}',
    render(){return`<div class="jl-h1">NATURE HEALER</div><div class="jl-sub">PRESTIGE 10 — LESSON 3/12</div><div class="jl-p">Nature healers focus on support and survival.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set sig power to <strong>40</strong> and radius to <strong>120</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.sig)return'Missing magic.sig';if(p.magic.sig.power!==40)return'Sig power must be 40';if(p.magic.sig.radius!==120)return'Radius must be 120';return null;}},
  {id:'p10_04',title:'VOID ASSASSIN',icon:'S4',exercise:true,initialCode:'{\n  "school": "void",\n  "hp": 180,\n  "spd": 3.5,\n  "melee": {\n    "enabled": true,\n    "dmg": 50,\n    "cd": 900,\n    "lunge": 0.7\n  },\n  "ai": {\n    "aggression": 0.8,\n    "flankTendency": 0.6\n  }\n}',
    render(){return`<div class="jl-h1">VOID ASSASSIN</div><div class="jl-sub">PRESTIGE 10 — LESSON 4/12</div><div class="jl-p">Void assassins focus on high damage and mobility.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set melee dmg to <strong>60</strong> and lunge to <strong>0.9</strong>.</div></div>`;},
    validator(p){if(!p.melee||p.melee.dmg!==60)return'Melee dmg must be 60';if(p.melee.lunge!==0.9)return'Lunge must be 0.9';return null;}},
  {id:'p10_05',title:'ARCANE BATTLE MAGE',icon:'S5',exercise:true,initialCode:'{\n  "school": "arcane",\n  "hp": 250,\n  "armor": 10,\n  "magic": {\n    "enabled": true,\n    "mana": 110,\n    "spell": {\n      "type": "bolt",\n      "dmg": 45,\n      "cd": 1000,\n      "critChance": 0.2\n    },\n    "sig": {\n      "type": "burst",\n      "power": 70\n    }\n  },\n  "melee": {\n    "enabled": true,\n    "dmg": 30,\n    "cd": 1200\n  }\n}',
    render(){return`<div class="jl-h1">ARCANE BATTLE MAGE</div><div class="jl-sub">PRESTIGE 10 — LESSON 5/12</div><div class="jl-p">Arcane battle mages combine magic and melee.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set spell critChance to <strong>0.3</strong> and sig power to <strong>85</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.spell)return'Missing magic.spell';if(p.magic.spell.critChance!==0.3)return'CritChance must be 0.3';if(!p.magic.sig||p.magic.sig.power!==85)return'Sig power must be 85';return null;}},
  {id:'p10_06',title:'RANGER',icon:'S6',exercise:true,initialCode:'{\n  "hp": 200,\n  "spd": 2.8,\n  "ranged": {\n    "enabled": true,\n    "dmg": 40,\n    "cd": 900,\n    "range": 300,\n    "count": 1,\n    "spread": 0.1\n  },\n  "ai": {\n    "spacing": 0.7,\n    "aim": 0.9\n  }\n}',
    render(){return`<div class="jl-h1">RANGER</div><div class="jl-sub">PRESTIGE 10 — LESSON 6/12</div><div class="jl-p">Rangers specialize in ranged combat.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set ranged dmg to <strong>50</strong> and range to <strong>350</strong>.</div></div>`;},
    validator(p){if(!p.ranged||p.ranged.dmg!==50)return'Ranged dmg must be 50';if(p.ranged.range!==350)return'Range must be 350';return null;}},
  {id:'p10_07',title:'BERSERKER',icon:'S7',exercise:true,initialCode:'{\n  "hp": 350,\n  "armor": 8,\n  "melee": {\n    "enabled": true,\n    "dmg": 55,\n    "cd": 800,\n    "cleave": 0.4,\n    "knockback": 0.3\n  },\n  "ai": {\n    "stance": "berserk",\n    "aggression": 0.9\n  }\n}',
    render(){return`<div class="jl-h1">BERSERKER</div><div class="jl-sub">PRESTIGE 10 — LESSON 7/12</div><div class="jl-p">Berserkers sacrifice defense for offense.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set melee dmg to <strong>65</strong> and cleave to <strong>0.6</strong>.</div></div>`;},
    validator(p){if(!p.melee||p.melee.dmg!==65)return'Melee dmg must be 65';if(p.melee.cleave!==0.6)return'Cleave must be 0.6';return null;}},
  {id:'p10_08',title:'GUARDIAN',icon:'S8',exercise:true,initialCode:'{\n  "hp": 450,\n  "armor": 25,\n  "passive": "shield",\n  "passive2": "thorns",\n  "melee": {\n    "enabled": true,\n    "dmg": 25,\n    "cd": 1500,\n    "parry": 0.4\n  },\n  "ai": {\n    "stance": "defensive",\n    "retreatThreshold": 0.1\n  }\n}',
    render(){return`<div class="jl-h1">GUARDIAN</div><div class="jl-sub">PRESTIGE 10 — LESSON 8/12</div><div class="jl-p">Guardians protect allies with high defense.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set hp to <strong>500</strong> and armor to <strong>30</strong>.</div></div>`;},
    validator(p){if(p.hp!==500)return'HP must be 500';if(p.armor!==30)return'Armor must be 30';return null;}},
  {id:'p10_09',title:'SNIPER',icon:'S9',exercise:true,initialCode:'{\n  "ranged": {\n    "enabled": true,\n    "dmg": 70,\n    "cd": 2000,\n    "range": 400,\n    "bolt": {\n      "speed": 10.0,\n      "homing": 0.2\n    }\n  },\n  "ai": {\n    "aim": 0.95,\n    "prediction": 0.8\n  }\n}',
    render(){return`<div class="jl-h1">SNIPER</div><div class="jl-sub">PRESTIGE 10 — LESSON 9/12</div><div class="jl-p">Snipers deal high damage at long range.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set ranged dmg to <strong>85</strong> and bolt speed to <strong>12.0</strong>.</div></div>`;},
    validator(p){if(!p.ranged||p.ranged.dmg!==85)return'Ranged dmg must be 85';if(!p.ranged.bolt||p.ranged.bolt.speed!==12.0)return'Bolt speed must be 12.0';return null;}},
  {id:'p10_10',title:'MACHINE GUNNER',icon:'S10',exercise:true,initialCode:'{\n  "ranged": {\n    "enabled": true,\n    "dmg": 20,\n    "cd": 400,\n    "count": 3,\n    "spread": 0.3,\n    "volley": {\n      "count": 5,\n      "delay": 100\n    }\n  }\n}',
    render(){return`<div class="jl-h1">MACHINE GUNNER</div><div class="jl-sub">PRESTIGE 10 — LESSON 10/12</div><div class="jl-p">Machine gunners fire many projectiles rapidly.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set volley count to <strong>8</strong> and delay to <strong>80</strong>.</div></div>`;},
    validator(p){if(!p.ranged||!p.ranged.volley)return'Missing ranged.volley';if(p.ranged.volley.count!==8)return'Volley count must be 8';if(p.ranged.volley.delay!==80)return'Delay must be 80';return null;}},
  {id:'p10_11',title:'MONK',icon:'S11',exercise:true,initialCode:'{\n  "hp": 220,\n  "spd": 3.0,\n  "passive": "regeneration",\n  "melee": {\n    "enabled": true,\n    "dmg": 35,\n    "cd": 900,\n    "parry": 0.5,\n    "charge": 0.4\n  },\n  "ai": {\n    "counterPlay": 0.7,\n    "comboBias": 0.6\n  }\n}',
    render(){return`<div class="jl-h1">MONK</div><div class="jl-sub">PRESTIGE 10 — LESSON 11/12</div><div class="jl-p">Monks use counter attacks and combos.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set parry to <strong>0.7</strong> and comboBias to <strong>0.8</strong>.</div></div>`;},
    validator(p){if(!p.melee||p.melee.parry!==0.7)return'Parry must be 0.7';if(!p.ai||p.ai.comboBias!==0.8)return'ComboBias must be 0.8';return null;}},
  {id:'p10_12',title:'SPECIALIST MASTERY',icon:'S12',exercise:true,initialCode:'{\n  "id": "specialist",\n  "name": "Specialist",\n  "school": "arcane",\n  "hp": 300,\n  "armor": 15,\n  "spd": 2.5,\n  "resistances": { "fire": 0.4, "frost": 0.4 },\n  "passive": "vampiric",\n  "magic": {\n    "enabled": true,\n    "mana": 130,\n    "spell": { "type": "bolt", "dmg": 50, "cd": 850 },\n    "sig": { "type": "zone", "power": 60, "radius": 130 }\n  },\n  "ai": { "stance": "cunning", "dodge": 0.75, "aim": 0.9 }\n}',
    render(){return`<div class="jl-h1">SPECIALIST MASTERY</div><div class="jl-sub">PRESTIGE 10 — LESSON 12/12</div><div class="jl-p">Create a fully specialized unit.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ MASTERY EXERCISE</div><div class="jl-ex-body">Set hp to <strong>350</strong> and sig radius to <strong>150</strong>.</div></div>`;},
    validator(p){if(p.hp!==350)return'HP must be 350';if(!p.magic||!p.magic.sig||p.magic.sig.radius!==150)return'Sig radius must be 150';return null;}},

// ================================================================
// PRESTIGE 11 - COUNTER STRATEGIES
// ================================================================
  {id:'p11_01',title:'COUNTER FIRE',icon:'T1',exercise:true,initialCode:'{\n  "resistances": {\n    "fire": 0.7,\n    "frost": 0.2,\n    "nature": 0.2,\n    "void": 0.2\n  },\n  "passive": "regeneration"\n}',
    render(){return`<div class="jl-h1">COUNTER FIRE</div><div class="jl-sub">PRESTIGE 11 — LESSON 1/12</div><div class="jl-p">Counter fire damage with high resistance.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set fire resistance to <strong>0.8</strong>.</div></div>`;},
    validator(p){if(!p.resistances)return'Missing resistances';if(p.resistances.fire!==0.8)return'Fire resistance must be 0.8';return null;}},
  {id:'p11_02',title:'COUNTER PHYSICAL',icon:'T2',exercise:true,initialCode:'{\n  "armor": 20,\n  "passive": "thorns",\n  "melee": {\n    "enabled": true,\n    "parry": 0.5\n  }\n}',
    render(){return`<div class="jl-h1">COUNTER PHYSICAL</div><div class="jl-sub">PRESTIGE 11 — LESSON 2/12</div><div class="jl-p">Counter physical damage with armor and parry.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set armor to <strong>25</strong> and parry to <strong>0.6</strong>.</div></div>`;},
    validator(p){if(p.armor!==25)return'Armor must be 25';if(!p.melee||p.melee.parry!==0.6)return'Parry must be 0.6';return null;}},
  {id:'p11_03',title:'COUNTER MAGIC',icon:'T3',exercise:true,initialCode:'{\n  "resistances": {\n    "fire": 0.4,\n    "frost": 0.4,\n    "nature": 0.4,\n    "void": 0.4\n  },\n  "passive": "shield"\n}',
    render(){return`<div class="jl-h1">COUNTER MAGIC</div><div class="jl-sub">PRESTIGE 11 — LESSON 3/12</div><div class="jl-p">Counter magic with balanced resistances.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set all resistances to <strong>0.5</strong>.</div></div>`;},
    validator(p){if(!p.resistances)return'Missing resistances';if(p.resistances.fire!==0.5||p.resistances.frost!==0.5||p.resistances.nature!==0.5||p.resistances.void!==0.5)return'All resistances must be 0.5';return null;}},
  {id:'p11_04',title:'COUNTER SPEED',icon:'T4',exercise:true,initialCode:'{\n  "magic": {\n    "enabled": true,\n    "spell": {\n      "type": "bolt",\n      "dmg": 30,\n      "cd": 1000\n    },\n    "effect": {\n      "type": "slow",\n      "power": 0.5,\n      "duration": 3000\n    }\n  },\n  "ranged": {\n    "enabled": true,\n    "dmg": 35,\n    "cd": 900\n  }\n}',
    render(){return`<div class="jl-h1">COUNTER SPEED</div><div class="jl-sub">PRESTIGE 11 — LESSON 4/12</div><div class="jl-p">Counter fast units with slow effects.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set effect power to <strong>0.6</strong> and duration to <strong>4000</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.effect)return'Missing magic.effect';if(p.magic.effect.power!==0.6)return'Effect power must be 0.6';if(p.magic.effect.duration!==4000)return'Duration must be 4000';return null;}},
  {id:'p11_05',title:'COUNTER TANKS',icon:'T5',exercise:true,initialCode:'{\n  "magic": {\n    "enabled": true,\n    "spell": {\n      "type": "bolt",\n      "dmg": 40,\n      "cd": 1000,\n      "armorPen": 0.4\n    }\n  },\n  "melee": {\n    "enabled": true,\n    "dmg": 35,\n    "cd": 1100,\n    "cleave": 0.3\n  }\n}',
    render(){return`<div class="jl-h1">COUNTER TANKS</div><div class="jl-sub">PRESTIGE 11 — LESSON 5/12</div><div class="jl-p">Counter tanks with armor penetration.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set armorPen to <strong>0.6</strong> and cleave to <strong>0.5</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.spell)return'Missing magic.spell';if(p.magic.spell.armorPen!==0.6)return'ArmorPen must be 0.6';if(!p.melee||p.melee.cleave!==0.5)return'Cleave must be 0.5';return null;}},
  {id:'p11_06',title:'COUNTER RANGED',icon:'T6',exercise:true,initialCode:'{\n  "spd": 3.0,\n  "ai": {\n    "dodge": 0.7,\n    "spacing": 0.3\n  },\n  "glitch": {\n    "enabled": true,\n    "ability": "blink"\n  }\n}',
    render(){return`<div class="jl-h1">COUNTER RANGED</div><div class="jl-sub">PRESTIGE 11 — LESSON 6/12</div><div class="jl-p">Counter ranged with mobility and dodge.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set dodge to <strong>0.8</strong> and spd to <strong>3.5</strong>.</div></div>`;},
    validator(p){if(!p.ai||p.ai.dodge!==0.8)return'Dodge must be 0.8';if(p.spd!==3.5)return'Spd must be 3.5';return null;}},
  {id:'p11_07',title:'COUNTER BURST',icon:'T7',exercise:true,initialCode:'{\n  "hp": 350,\n  "armor": 18,\n  "passive": "shield",\n  "ai": {\n    "retreatThreshold": 0.3,\n    "dodge": 0.6\n  }\n}',
    render(){return`<div class="jl-h1">COUNTER BURST</div><div class="jl-sub">PRESTIGE 11 — LESSON 7/12</div><div class="jl-p">Counter burst damage with survival.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set hp to <strong>400</strong> and armor to <strong>22</strong>.</div></div>`;},
    validator(p){if(p.hp!==400)return'HP must be 400';if(p.armor!==22)return'Armor must be 22';return null;}},
  {id:'p11_08',title:'COUNTER SUSTAIN',icon:'T8',exercise:true,initialCode:'{\n  "magic": {\n    "enabled": true,\n    "spell": {\n      "type": "bolt",\n      "dmg": 45,\n      "cd": 900\n    },\n    "effect": {\n      "type": "poison",\n      "power": 12,\n      "duration": 5000\n    }\n  },\n  "passive": "thorns"\n}',
    render(){return`<div class="jl-h1">COUNTER SUSTAIN</div><div class="jl-sub">PRESTIGE 11 — LESSON 8/12</div><div class="jl-p">Counter sustain with poison and thorns.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set effect power to <strong>18</strong> and duration to <strong>6000</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.effect)return'Missing magic.effect';if(p.magic.effect.power!==18)return'Effect power must be 18';if(p.magic.effect.duration!==6000)return'Duration must be 6000';return null;}},
  {id:'p11_09',title:'COUNTER AOE',icon:'T9',exercise:true,initialCode:'{\n  "spd": 3.5,\n  "ai": {\n    "spacing": 0.8,\n    "dodge": 0.7\n  },\n  "glitch": {\n    "enabled": true,\n    "ability": "blink"\n  }\n}',
    render(){return`<div class="jl-h1">COUNTER AOE</div><div class="jl-sub">PRESTIGE 11 — LESSON 9/12</div><div class="jl-p">Counter AOE with spacing and mobility.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set spacing to <strong>0.9</strong> and dodge to <strong>0.8</strong>.</div></div>`;},
    validator(p){if(!p.ai||p.ai.spacing!==0.9)return'Spacing must be 0.9';if(p.ai.dodge!==0.8)return'Dodge must be 0.8';return null;}},
  {id:'p11_10',title:'COUNTER STEALTH',icon:'T10',exercise:true,initialCode:'{\n  "magic": {\n    "enabled": true,\n    "sig": {\n      "type": "zone",\n      "power": 30,\n      "radius": 150\n    }\n  },\n  "ranged": {\n    "enabled": true,\n    "count": 3,\n    "spread": 0.5\n  }\n}',
    render(){return`<div class="jl-h1">COUNTER STEALTH</div><div class="jl-sub">PRESTIGE 11 — LESSON 10/12</div><div class="jl-p">Counter stealth with AOE and spread attacks.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set sig radius to <strong>200</strong> and spread to <strong>0.7</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.sig)return'Missing magic.sig';if(p.magic.sig.radius!==200)return'Radius must be 200';if(!p.ranged||p.ranged.spread!==0.7)return'Spread must be 0.7';return null;}},
  {id:'p11_11',title:'COUNTER CRIT',icon:'T11',exercise:true,initialCode:'{\n  "hp": 300,\n  "armor": 15,\n  "passive": "shield",\n  "ai": {\n    "dodge": 0.6,\n    "parryTendency": 0.5\n  }\n}',
    render(){return`<div class="jl-h1">COUNTER CRIT</div><div class="jl-sub">PRESTIGE 11 — LESSON 11/12</div><div class="jl-p">Counter critical hits with defense.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set dodge to <strong>0.7</strong> and parryTendency to <strong>0.6</strong>.</div></div>`;},
    validator(p){if(!p.ai||p.ai.dodge!==0.7)return'Dodge must be 0.7';if(p.ai.parryTendency!==0.6)return'ParryTendency must be 0.6';return null;}},
  {id:'p11_12',title:'COUNTER MASTERY',icon:'T12',exercise:true,initialCode:'{\n  "id": "counter_unit",\n  "name": "Counter Unit",\n  "school": "arcane",\n  "hp": 320,\n  "armor": 18,\n  "spd": 2.8,\n  "resistances": { "fire": 0.5, "frost": 0.5 },\n  "passive": "shield",\n  "magic": {\n    "enabled": true,\n    "spell": { "type": "bolt", "dmg": 45, "cd": 900, "armorPen": 0.5 }\n  },\n  "ai": { "stance": "cunning", "dodge": 0.75 }\n}',
    render(){return`<div class="jl-h1">COUNTER MASTERY</div><div class="jl-sub">PRESTIGE 11 — LESSON 12/12</div><div class="jl-p">Create a unit that counters multiple threats.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ MASTERY EXERCISE</div><div class="jl-ex-body">Set hp to <strong>380</strong> and armorPen to <strong>0.6</strong>.</div></div>`;},
    validator(p){if(p.hp!==380)return'HP must be 380';if(!p.magic||!p.magic.spell||p.magic.spell.armorPen!==0.6)return'ArmorPen must be 0.6';return null;}},

// ================================================================
// PRESTIGE 12 - MASTERY CONCEPTS
// ================================================================
  {id:'p12_01',title:'BALANCE',icon:'U1',exercise:true,initialCode:'{\n  "hp": 250,\n  "armor": 12,\n  "spd": 2.5,\n  "magic": {\n    "enabled": true,\n    "spell": { "type": "bolt", "dmg": 35, "cd": 1000 }\n  },\n  "melee": {\n    "enabled": true,\n    "dmg": 30,\n    "cd": 1100\n  }\n}',
    render(){return`<div class="jl-h1">BALANCE</div><div class="jl-sub">PRESTIGE 12 — LESSON 1/12</div><div class="jl-p">Balance creates versatile units.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set hp to <strong>280</strong> and both dmg values to <strong>38</strong>.</div></div>`;},
    validator(p){if(p.hp!==280)return'HP must be 280';if(!p.magic||!p.magic.spell||p.magic.spell.dmg!==38)return'Magic dmg must be 38';if(!p.melee||p.melee.dmg!==38)return'Melee dmg must be 38';return null;}},
  {id:'p12_02',title:'SYNERGY',icon:'U2',exercise:true,initialCode:'{\n  "school": "fire",\n  "resistances": { "fire": 0.5 },\n  "passive": "burning",\n  "magic": {\n    "enabled": true,\n    "spell": { "type": "bolt", "dmg": 40 },\n    "effect": { "type": "burn", "power": 15 }\n  }\n}',
    render(){return`<div class="jl-h1">SYNERGY</div><div class="jl-sub">PRESTIGE 12 — LESSON 2/12</div><div class="jl-p">Synergy combines related features.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set spell dmg to <strong>50</strong> and effect power to <strong>20</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.spell)return'Missing magic.spell';if(p.magic.spell.dmg!==50)return'Dmg must be 50';if(!p.magic.effect||p.magic.effect.power!==20)return'Effect power must be 20';return null;}},
  {id:'p12_03',title:'EFFICIENCY',icon:'U3',exercise:true,initialCode:'{\n  "hp": 220,\n  "magic": {\n    "enabled": true,\n    "mana": 80,\n    "spell": { "type": "bolt", "dmg": 35, "cd": 800 }\n  },\n  "ai": {\n    "manaConserve": 0.5,\n    "aim": 0.85\n  }\n}',
    render(){return`<div class="jl-h1">EFFICIENCY</div><div class="jl-sub">PRESTIGE 12 — LESSON 3/12</div><div class="jl-p">Efficiency maximizes resource usage.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set spell cd to <strong>700</strong> and aim to <strong>0.9</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.spell)return'Missing magic.spell';if(p.magic.spell.cd!==700)return'CD must be 700';if(!p.ai||p.ai.aim!==0.9)return'Aim must be 0.9';return null;}},
  {id:'p12_04',title:'ADAPTABILITY',icon:'U4',exercise:true,initialCode:'{\n  "magic": {\n    "enabled": true,\n    "spell": { "type": "bolt", "dmg": 35, "cd": 1000 }\n  },\n  "ranged": {\n    "enabled": true,\n    "dmg": 30,\n    "cd": 1100\n  },\n  "ai": {\n    "priority": { "magic": 0.5, "melee": 0, "ranged": 0.5 },\n    "adaptRate": 0.5\n  }\n}',
    render(){return`<div class="jl-h1">ADAPTABILITY</div><div class="jl-sub">PRESTIGE 12 — LESSON 4/12</div><div class="jl-p">Adaptability handles different situations.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set adaptRate to <strong>0.7</strong>.</div></div>`;},
    validator(p){if(!p.ai||p.ai.adaptRate!==0.7)return'AdaptRate must be 0.7';return null;}},
  {id:'p12_05',title:'SCALING',icon:'U5',exercise:true,initialCode:'{\n  "hp": 200,\n  "armor": 8,\n  "magic": {\n    "enabled": true,\n    "spell": {\n      "type": "bolt",\n      "dmg": 30,\n      "cd": 1000,\n      "critChance": 0.2,\n      "critMult": 2.0\n    }\n  }\n}',
    render(){return`<div class="jl-h1">SCALING</div><div class="jl-sub">PRESTIGE 12 — LESSON 5/12</div><div class="jl-p">Scaling improves with investment.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set critChance to <strong>0.3</strong> and critMult to <strong>2.5</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.spell)return'Missing magic.spell';if(p.magic.spell.critChance!==0.3)return'CritChance must be 0.3';if(p.magic.spell.critMult!==2.5)return'CritMult must be 2.5';return null;}},
  {id:'p12_06',title:'CONSISTENCY',icon:'U6',exercise:true,initialCode:'{\n  "magic": {\n    "enabled": true,\n    "spell": {\n      "type": "bolt",\n      "dmg": 35,\n      "cd": 1000,\n      "critChance": 0.1,\n      "critMult": 1.5\n    },\n    "bolt": {\n      "speed": 6.0,\n      "homing": 0.5\n    }\n  },\n  "ai": {\n    "aim": 0.9,\n    "prediction": 0.7\n  }\n}',
    render(){return`<div class="jl-h1">CONSISTENCY</div><div class="jl-sub">PRESTIGE 12 — LESSON 6/12</div><div class="jl-p">Consistency provides reliable performance.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set aim to <strong>0.95</strong> and homing to <strong>0.7</strong>.</div></div>`;},
    validator(p){if(!p.ai||p.ai.aim!==0.95)return'Aim must be 0.95';if(!p.magic||!p.magic.bolt||p.magic.bolt.homing!==0.7)return'Homing must be 0.7';return null;}},
  {id:'p12_07',title:'VERSATILITY',icon:'U7',exercise:true,initialCode:'{\n  "magic": {\n    "enabled": true,\n    "spell": { "type": "bolt", "dmg": 35, "cd": 1000 },\n    "sig": { "type": "zone", "power": 40, "radius": 100 }\n  },\n  "melee": {\n    "enabled": true,\n    "dmg": 30,\n    "cd": 1100\n  }\n}',
    render(){return`<div class="jl-h1">VERSATILITY</div><div class="jl-sub">PRESTIGE 12 — LESSON 7/12</div><div class="jl-p">Versatility handles many scenarios.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set sig power to <strong>50</strong> and radius to <strong>120</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.sig)return'Missing magic.sig';if(p.magic.sig.power!==50)return'Sig power must be 50';if(p.magic.sig.radius!==120)return'Radius must be 120';return null;}},
  {id:'p12_08',title:'OPTIMIZATION',icon:'U8',exercise:true,initialCode:'{\n  "hp": 240,\n  "armor": 12,\n  "spd": 2.6,\n  "magic": {\n    "enabled": true,\n    "mana": 100,\n    "spell": { "type": "bolt", "dmg": 40, "cd": 950 }\n  },\n  "ai": { "stance": "cunning" }\n}',
    render(){return`<div class="jl-h1">OPTIMIZATION</div><div class="jl-sub">PRESTIGE 12 — LESSON 8/12</div><div class="jl-p">Optimization finds the best configuration.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set spell dmg to <strong>45</strong> and cd to <strong>900</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.spell)return'Missing magic.spell';if(p.magic.spell.dmg!==45)return'Dmg must be 45';if(p.magic.spell.cd!==900)return'CD must be 900';return null;}},
  {id:'p12_09',title:'SPECIALIZATION',icon:'U9',exercise:true,initialCode:'{\n  "school": "fire",\n  "resistances": { "fire": 0.6 },\n  "passive": "burning",\n  "magic": {\n    "enabled": true,\n    "spell": { "type": "bolt", "dmg": 50, "cd": 900 },\n    "effect": { "type": "burn", "power": 20, "duration": 5000 }\n  }\n}',
    render(){return`<div class="jl-h1">SPECIALIZATION</div><div class="jl-sub">PRESTIGE 12 — LESSON 9/12</div><div class="jl-p">Specialization excels in one area.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set spell dmg to <strong>60</strong> and fire resistance to <strong>0.8</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.spell)return'Missing magic.spell';if(p.magic.spell.dmg!==60)return'Dmg must be 60';if(!p.resistances||p.resistances.fire!==0.8)return'Fire resistance must be 0.8';return null;}},
  {id:'p12_10',title:'TEAMWORK',icon:'U10',exercise:true,initialCode:'{\n  "passive": "regeneration",\n  "magic": {\n    "enabled": true,\n    "sig": {\n      "type": "zone",\n      "power": 35,\n      "radius": 120\n    }\n  },\n  "ai": {\n    "flankTendency": 0.5,\n    "pressureResponse": 0.6\n  }\n}',
    render(){return`<div class="jl-h1">TEAMWORK</div><div class="jl-sub">PRESTIGE 12 — LESSON 10/12</div><div class="jl-p">Teamwork supports allies.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set sig power to <strong>45</strong> and radius to <strong>150</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.sig)return'Missing magic.sig';if(p.magic.sig.power!==45)return'Sig power must be 45';if(p.magic.sig.radius!==150)return'Radius must be 150';return null;}},
  {id:'p12_11',title:'INNOVATION',icon:'U11',exercise:true,initialCode:'{\n  "glitch": {\n    "enabled": true,\n    "ability": "blink",\n    "cd": 3000\n  },\n  "magic": {\n    "enabled": true,\n    "spell": {\n      "type": "bolt",\n      "pattern": "spiral",\n      "dmg": 40,\n      "cd": 1000\n    },\n    "bolt": {\n      "speed": 7.0,\n      "spread": 0.3\n    }\n  }\n}',
    render(){return`<div class="jl-h1">INNOVATION</div><div class="jl-sub">PRESTIGE 12 — LESSON 11/12</div><div class="jl-p">Innovation combines unique features.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Set bolt speed to <strong>8.0</strong> and spread to <strong>0.4</strong>.</div></div>`;},
    validator(p){if(!p.magic||!p.magic.bolt)return'Missing magic.bolt';if(p.magic.bolt.speed!==8.0)return'Speed must be 8.0';if(p.magic.bolt.spread!==0.4)return'Spread must be 0.4';return null;}},
  {id:'p12_12',title:'GRAND MASTERY',icon:'U12',exercise:true,initialCode:'{\n  "id": "grand_master",\n  "name": "Grand Master",\n  "school": "arcane",\n  "hp": 350,\n  "armor": 18,\n  "spd": 2.8,\n  "resistances": { "fire": 0.4, "frost": 0.4, "nature": 0.4, "void": 0.4 },\n  "passive": "vampiric",\n  "passive2": "regeneration",\n  "magic": {\n    "enabled": true,\n    "mana": 140,\n    "spell": {\n      "type": "bolt",\n      "pattern": "spiral",\n      "dmg": 55,\n      "cd": 850,\n      "range": 280,\n      "critChance": 0.25,\n      "critMult": 2.2,\n      "armorPen": 0.4\n    },\n    "bolt": {\n      "speed": 7.5,\n      "homing": 0.6,\n      "count": 1\n    },\n    "sig": {\n      "type": "zone",\n      "power": 75,\n      "radius": 140,\n      "duration": 4000\n    },\n    "effect": {\n      "type": "slow",\n      "power": 0.4,\n      "duration": 3000\n    }\n  },\n  "melee": {\n    "enabled": true,\n    "dmg": 40,\n    "cd": 1000,\n    "lunge": 0.5,\n    "parry": 0.4\n  },\n  "ai": {\n    "stance": "cunning",\n    "aggression": 0.6,\n    "dodge": 0.75,\n    "aim": 0.92,\n    "prediction": 0.75,\n    "counterPlay": 0.65,\n    "comboBias": 0.7,\n    "adaptRate": 0.5\n  }\n}',
    render(){return`<div class="jl-h1">GRAND MASTERY</div><div class="jl-sub">PRESTIGE 12 — LESSON 12/12</div><div class="jl-p">Complete mastery of all unit creation concepts.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ FINAL MASTERY EXERCISE</div><div class="jl-ex-body">Set hp to <strong>400</strong> and spell dmg to <strong>65</strong>.</div></div><div class="jl-rule"><div class="jl-rule-hdr">CONGRATULATIONS</div><div class="jl-rule-body">You have mastered all lessons.<br>You are now a true master of JSON unit creation.</div></div>`;},
    validator(p){if(p.hp!==400)return'HP must be 400';if(!p.magic||!p.magic.spell||p.magic.spell.dmg!==65)return'Spell dmg must be 65';return null;}},

// ================================================================
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
