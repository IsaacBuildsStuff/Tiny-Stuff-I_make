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
  return{ok:true,parsed,error:null,lessonErr:null,errLine:null};
}

// ================================================================
// IDE RENDER
// ================================================================
function renderJsonIde(){
  const completed=JsonFreedom.getCompleted();
  const rank=JsonFreedom.getRank();
  const rankObj=JSON_RANKS[rank];
  const n=completed.size,total=JSON_LESSONS.length;
  const pct=Math.round((n/total)*100);
  const lesson=JSON_LESSONS.find(l=>l.id===JIS.lesson)||JSON_LESSONS[0];
  const llistHtml=JSON_LESSONS.map(l=>{
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
function jsonGoLesson(id){const l=JSON_LESSONS.find(x=>x.id===id);if(!l)return;JIS.lesson=id;JIS.code=l.initialCode||'';JIS.validation=null;jIdeUndo.reset(JIS.code);jsonSaveDraft(JIS.code);renderJsonIde();}
function jsonMarkRead(id){JsonFreedom.complete(id);showJIdToast(id);checkStoryProgress();const idx=JSON_LESSONS.findIndex(l=>l.id===id);const next=JSON_LESSONS[idx+1];setTimeout(()=>{if(next){JIS.lesson=next.id;JIS.code=next.initialCode||'';}JIS.validation=null;jsonSaveDraft(JIS.code);renderJsonIde();},1200);}

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
function jsonSubmit(){const vr=JIS.validation||jsonRunValidate(JIS.code,JIS.lesson);if(!vr||!vr.ok){console.log('Submit failed:',vr);return;}const id=JIS.lesson;JsonFreedom.complete(id);showJIdToast(id);checkStoryProgress();const idx=JSON_LESSONS.findIndex(l=>l.id===id);const next=JSON_LESSONS[idx+1];setTimeout(()=>{if(next){JIS.lesson=next.id;JIS.code=next.initialCode||'';}JIS.validation=null;jsonSaveDraft(JIS.code);renderJsonIde();},1200);}
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
