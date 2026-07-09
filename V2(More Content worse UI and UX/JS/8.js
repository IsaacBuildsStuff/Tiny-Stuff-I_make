// ================================================================
// STORY CHALLENGES
// ================================================================
const STORY_CHALLENGES = {
  barrier: {
    id: 'barrier', title: 'BREAK THE BARRIER',
    narrative: 'OORTHO\'s barrier regenerates faster than your signature can charge. Increase your unit\'s signature chargeRate above 1.5 to overwhelm it.',
    getInitialCode: () => { const def = getDef(S.selected[0]); return JSON.stringify({ magic: { sig: { ...(def && def.magic ? def.magic.sig : {}) } } }, null, 2); },
    validator(p) { const rate = p && p.magic && p.magic.sig && p.magic.sig.chargeRate; if (typeof rate !== 'number') return 'Must have a magic.sig.chargeRate number field'; if (rate <= 1.5) return `chargeRate must exceed 1.5 \u2014 you wrote ${rate}`; if (rate > 5.0) return 'chargeRate cannot exceed 5.0'; return null; },
    onSuccess(parsed) { const def = getDef(S.selected[0]); if (!def) return; def.magic.sig.chargeRate = parsed.magic.sig.chargeRate; if (S.gs) { const live = S.gs.units[0]; if (live && live.def) { live.def = dc(def); live.def._speedBoost = 0; live.sigCharge = 0; live.flash = 1; live.flashCol = '#44ff88'; pRing(S.gs.parts, live.x, live.y, '#44ff88', 14, 24); S.gs.shake = Math.max(S.gs.shake, 3); } } if(typeof Progression!=='undefined')Progression.recordChallenge('barrier'); playCutscene('challenge_barrier_won'); },
  },
  hp_boost: {
    id: 'hp_boost', title: 'REINFORCE YOUR UNIT',
    narrative: 'Your unit is dangerously low. Edit its HP to 350 or higher and its armor to at least 10 to survive the next assault.',
    getInitialCode: () => { const def = getDef(S.selected[0]); return JSON.stringify({ hp: def ? def.hp : 300, armor: def ? def.armor || 0 : 0 }, null, 2); },
    validator(p) { if (!p || typeof p.hp !== 'number') return 'Must have an "hp" number field'; if (p.hp < 350) return `hp must be \u2265 350 \u2014 you wrote ${p.hp}`; if (typeof p.armor !== 'number') return 'Must have an "armor" number field'; if (p.armor < 10) return `armor must be \u2265 10 \u2014 you wrote ${p.armor}`; return null; },
    onSuccess(parsed) { const def = getDef(S.selected[0]); if (!def) return; def.hp = parsed.hp; def.armor = parsed.armor; if (S.gs) { const live = S.gs.units[0]; if (live) { live.def = dc(def); live.maxHp = parsed.hp; live.hp = Math.min(live.hp, parsed.hp); live.armor = parsed.armor; live.flash = 1; live.flashCol = '#44ff88'; pRing(S.gs.parts, live.x, live.y, '#44ff88', 14, 24); S.gs.shake = Math.max(S.gs.shake, 3); } } if(typeof Progression!=='undefined')Progression.recordChallenge('hp_boost'); playCutscene('challenge_hp_boost_won'); },
  },
};

let _activeChallengeId = null;
let schValidationCache = null;

function openStoryChallenge(challengeId) {
  const ch = STORY_CHALLENGES[challengeId];
  if (!ch) return;
  _activeChallengeId = challengeId; S.paused = true;
  const code = ch.getInitialCode();
  const el = document.getElementById('modal');
  if (!el) return;
  const escapedCode = String(code).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  el.style.display = 'flex';
  el.innerHTML = `<div style="background:linear-gradient(145deg,#06080f,#0a0d1e);border:2px solid #cc44ff;border-radius:8px;width:640px;max-height:88vh;display:flex;flex-direction:column;margin:auto;box-shadow:0 0 60px rgba(204,68,255,.25)"><div style="padding:14px 18px;background:#0d0e28;border-bottom:1px solid #2a1e60;display:flex;gap:12px;align-items:flex-start"><div style="font-size:20px;flex-shrink:0">\u26A1</div><div><div style="font-size:11px;color:#cc44ff;letter-spacing:3px;font-weight:bold;margin-bottom:2px">${ch.title}</div><div style="font-size:9px;color:#6677aa;line-height:1.65">${ch.narrative}</div></div></div><div style="flex:1;overflow:hidden;display:flex;flex-direction:column;padding:14px 18px;gap:8px;min-height:0"><div style="font-size:8px;color:#3a4a70;letter-spacing:2px">EDIT JSON \u2014 CHANGES APPLY TO THE BATTLE</div><div id="sch-val" class="json-val idle" style="margin:0">\u2E61 edit the JSON to meet the requirement</div><div style="display:flex;gap:0;border:1px solid #131e38;border-radius:3px;overflow:hidden;background:#010306;flex:1;min-height:0"><pre id="sch-ln" style="margin:0;flex:0 0 34px;overflow:hidden;background:#02050b;color:#2a3870;font-family:'Courier New',monospace;font-size:10px;line-height:1.7;padding:10px 5px;text-align:right;user-select:none;white-space:pre">${jsonLineNumbers(code)}</pre><textarea id="sch-ta" spellcheck="false" style="flex:1;background:transparent;border:none;outline:none;color:#b8ccdd;font-family:'Courier New',monospace;font-size:10px;line-height:1.7;padding:10px 12px;resize:none;caret-color:#cc44ff;tab-size:2;overflow:auto" oninput="schTaInput(this)" onscroll="document.getElementById('sch-ln').scrollTop=this.scrollTop" onkeydown="if(event.key==='Tab'){event.preventDefault();const s=this.selectionStart;this.setRangeText('  ',s,s,'end');this.dispatchEvent(new Event('input',{bubbles:true}))}">${escapedCode}</textarea></div><div style="font-size:8px;color:#3a4a70;letter-spacing:1.5px">PREVIEW</div><div id="sch-hl" class="json-hl" style="max-height:90px;flex-shrink:0">${jsonHL(code)}</div></div><div style="padding:10px 18px;border-top:1px solid #1a2050;display:flex;gap:8px;align-items:center"><button onclick="schFmt()" class="jbt">\u229E FORMAT</button><button onclick="schReset('${challengeId}')" class="jbt">\u21BA RESET</button><div style="flex:1"></div><button onclick="schCancel()" style="background:transparent;border:1px solid #2a2040;color:#5566aa;padding:5px 14px;font-size:10px;font-family:monospace;border-radius:3px;cursor:pointer">BACK TO BATTLE</button><button id="sch-sub" onclick="schSubmit()" disabled style="background:#0a0e28;border:1px solid #4455ff;color:#8899ff;padding:5px 14px;font-size:10px;font-family:monospace;border-radius:3px;cursor:pointer;opacity:.4;transition:all .15s">\u25B6 APPLY TO BATTLE</button></div></div>`;
  const ta = document.getElementById('sch-ta');
  if (ta) { schTaInput(ta); ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
}

function schTaInput(ta) {
  const ch = STORY_CHALLENGES[_activeChallengeId]; if (!ch || !ta) return;
  const code = ta.value;
  const ln = document.getElementById('sch-ln'); const hl = document.getElementById('sch-hl'); const val = document.getElementById('sch-val'); const sub = document.getElementById('sch-sub');
  if (ln) ln.textContent = jsonLineNumbers(code);
  if (hl) hl.innerHTML = code ? jsonHL(code) : '<span style="color:#1a2540">// preview</span>';
  let vr;
  try { const parsed = JSON.parse(code); const err = ch.validator(parsed); vr = err ? { ok: false, msg: '\u25CB ' + err } : { ok: true, parsed, msg: '\u2713 Valid \u2014 ready to apply to battle' }; }
  catch (e) { vr = { ok: false, msg: '\u2717 ' + jsonSyntaxMessage(code, e) }; }
  if (val) { val.className = 'json-val ' + (vr.ok ? 'ok' : 'err'); val.textContent = vr.msg; }
  if (sub) { sub.disabled = !vr.ok; sub.style.opacity = vr.ok ? '1' : '.4'; sub.style.borderColor = vr.ok ? '#44ffaa' : '#4455ff'; sub.style.color = vr.ok ? '#44ffaa' : '#8899ff'; }
  schValidationCache = vr;
}
function schSubmit() { const vr = schValidationCache; if (!vr || !vr.ok) return; const ch = STORY_CHALLENGES[_activeChallengeId]; if (!ch) return; ch.onSuccess(vr.parsed); document.getElementById('modal').style.display = 'none'; _activeChallengeId = null; S.paused = false; }
function schCancel() { document.getElementById('modal').style.display = 'none'; _activeChallengeId = null; S.paused = false; }
function schFmt() { const ta = document.getElementById('sch-ta'); if (!ta) return; try { ta.value = JSON.stringify(JSON.parse(ta.value), null, 2); ta.dispatchEvent(new Event('input', { bubbles: true })); } catch {} }
function schReset(challengeId) { const ch = STORY_CHALLENGES[challengeId]; if (!ch) return; const ta = document.getElementById('sch-ta'); if (!ta) return; ta.value = ch.getInitialCode(); ta.dispatchEvent(new Event('input', { bubbles: true })); }


// ================================================================
// BATTLE TUTORIAL STATE
// ================================================================
const TUT = { active:false, fired:new Set(), flavorQueue:[], flavorT:0, flavorInterval:13000, challengeQueue:[], challengesFired:new Set() };
const TUT_BEATS = [
  {id:'half',  cs:'oortho_half_hp', forceAt:30000, test:(pHp,eHp)=> eHp>0 && eHp<=0.50},
  {id:'phurt', cs:'player_low_hp',  forceAt:42000, test:(pHp)=> pHp<=0.25},
  {id:'challenge_barrier', cs:'challenge_barrier', forceAt:52000, test:(pHp,eHp)=> eHp>0 && eHp<=0.40, challenge:'barrier'},
  {id:'sig',   cs:'player_sig',     forceAt:62000, test:(pHp,eHp,player)=> (player.sigFires||0)>0},
  {id:'challenge_hp', cs:'challenge_hp_boost', forceAt:76000, test:(pHp,eHp)=> pHp<=0.35, challenge:'hp_boost'},
  {id:'low',   cs:'oortho_low_hp',  forceAt:90000, test:(pHp,eHp)=> eHp>0 && eHp<=0.15},
];

function shuffleArr(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}


// ================================================================
// TUTORIAL CACHE
// ================================================================
const TUTORIAL_KEY='__unitforge_tutorial_seen', TUTORIAL_VERSION=1;
const BATTLE_TUTORIAL_KEY='__unitforge_battle_tutorial', BATTLE_TUTORIAL_VERSION=1;
const TutorialCache={
  hasSeen(){return localStorage.getItem(TUTORIAL_KEY)===`v${TUTORIAL_VERSION}`;},
  mark(){localStorage.setItem(TUTORIAL_KEY,`v${TUTORIAL_VERSION}`);},
  reset(){localStorage.removeItem(TUTORIAL_KEY);},
  hasDoneBattleTutorial(){return localStorage.getItem(BATTLE_TUTORIAL_KEY)===`v${BATTLE_TUTORIAL_VERSION}`;},
  markBattleTutorialDone(){localStorage.setItem(BATTLE_TUTORIAL_KEY,`v${BATTLE_TUTORIAL_VERSION}`);},
  resetBattleTutorial(){localStorage.removeItem(BATTLE_TUTORIAL_KEY);},
};

function renderTutorial(){const t='tutorial';document.getElementById('app').innerHTML=`${nav(t)}${tutorialHtml()}`;TutorialCache.mark();}
function tutorialHtml(){
  return`<div class="tutorial-page">
    <div class="tutorial-hero">
      <div class="tutorial-hero-badge">\u2694 UNIT FORGE</div>
      <div class="tutorial-hero-title">Interactive Combat Simulator</div>
      <div class="tutorial-hero-copy">Learn the Forge through dedicated pages for battle, roster, editor, and JSON. Each screen is a focused workspace rather than one stacked cluster.</div>
    </div>
    <div class="tutorial-grid">
      <div class="tutorial-card"><div class="tutorial-card-title">\uD83C\uDFAF Quick Start</div><div class="tutorial-card-body">Design units, tune their stats, and watch the combat engine react instantly. Every screen is built to feel like its own page.</div></div>
      <div class="tutorial-card"><div class="tutorial-card-title">\u2694 Battle</div><div class="tutorial-card-body">Pick your combatants, restart matches, pause the action, and inspect the live AI decisions from a focused battle view.</div><div class="tutorial-badges"><span class="tutorial-badge">RESTART</span><span class="tutorial-badge">PAUSE</span><span class="tutorial-badge">INTEL</span></div></div>
      <div class="tutorial-card"><div class="tutorial-card-title">\u25C8 Roster</div><div class="tutorial-card-body">Browse the built-in roster, create new units, and send them into battle from their own dedicated page.</div><div class="tutorial-badges"><span class="tutorial-badge">FIGHT</span><span class="tutorial-badge">EDIT</span><span class="tutorial-badge">NEW</span></div></div>
      <div class="tutorial-card"><div class="tutorial-card-title">\u2699 Editor</div><div class="tutorial-card-body">Fine-tune identity, combat stats, visuals, magic, melee, ranged combat, and AI behavior through modular sections.</div></div>
      <div class="tutorial-card"><div class="tutorial-card-title">\u2728 Schools &amp; Passives</div><div class="tutorial-card-body">Experiment with fire, frost, storm, shadow, void, holy, and more. Stack passives for powerful synergies.</div></div>
      <div class="tutorial-card tutorial-card-accent"><div class="tutorial-card-title">\u2694 OORTHO BATTLE TUTORIAL</div><div class="tutorial-card-body">Face the Arcane Sentinel and learn spell timing, signature abilities, positioning, and status effects through a guided duel.</div><div class="tutorial-actions"><button class="tutorial-action-btn" onclick="showBattleTutorialMenu()">\u25B6 START BATTLE TUTORIAL</button><button class="tutorial-action-btn ghost" onclick="TutorialCache.resetBattleTutorial()">\u21BA RESET</button></div></div>
    </div>
    <div class="tutorial-footer-bar">
      <div class="tutorial-status">Tutorial State: ${TutorialCache.hasSeen()?'\u2713 Seen':'\u25CB New'} \u00B7 Version v${TUTORIAL_VERSION}</div>
      <div class="tutorial-actions"><button class="tutorial-action-btn ghost" onclick="TutorialCache.reset();location.reload()">\u21BA RESET</button><button class="tutorial-action-btn primary" onclick="setTab('battle')">\u2192 OPEN BATTLE</button></div>
    </div>
  </div>`;
}

function startBattleTutorial(){
  S.selected[0] = 'pyros'; S.selected[1] = 'oortho';
  TUT.active = true; TUT.fired.clear(); TUT.flavorT = 0;
  TUT.flavorQueue = shuffleArr([...CS_FLAVOR]);
  TUT.challengeQueue = []; TUT.challengesFired.clear();
  restartGame(true); setTab('battle');
  setTimeout(() => playCutscene('oortho_intro'), 400);
}

function tickTutorial(gs, dt){
  if(!TUT.active || !gs || CS.active || gs.winner) return;
  const player = gs.units[0], enemy = gs.units[1];
  if(!player || !enemy) return;
  if(TUT.challengeQueue.length){
    const cid = TUT.challengeQueue.shift();
    if(cid && !TUT.challengesFired.has(cid)){ TUT.challengesFired.add(cid); openStoryChallenge(cid); }
    return;
  }
  const pHp = player.hp / player.maxHp;
  const eHp = enemy.alive ? enemy.hp / enemy.maxHp : 0;
  const scaledTime = gs.time;
  if(!TUT.fired.has('dead') && gs.winner){
    TUT.fired.add('dead'); TUT.active = false;
    TutorialCache.markBattleTutorialDone();
    if(!gs.resultCutscenePlayed){
      gs.resultCutscenePlayed = true;
      const playerWon = player.alive && !enemy.alive;
      playCutscene(playerWon ? 'oortho_defeated' : 'player_defeated');
    }
    return;
  }
  for(const beat of TUT_BEATS){
    if(TUT.fired.has(beat.id)) continue;
    const natural = beat.test(pHp, eHp, player, enemy);
    const forced = scaledTime >= beat.forceAt;
    if(natural || forced){
      TUT.fired.add(beat.id);
      if(beat.challenge) TUT.challengeQueue.push(beat.challenge);
      playCutscene(beat.cs);
      return;
    }
  }
  if(scaledTime < 8000) return;
  TUT.flavorT += dt;
  if(TUT.flavorT >= TUT.flavorInterval && TUT.flavorQueue.length){
    TUT.flavorT = 0;
    playCutscene(TUT.flavorQueue.shift());
  }
}

function showBattleTutorialMenu(){
  const el=document.getElementById('modal');
  el.style.display='flex';
  el.innerHTML=`<div class="m-box" style="border:2px solid #7766ff;width:520px"><div class="m-hdr" style="background:linear-gradient(90deg,#0d0e28,#1a1e40);border-bottom:2px solid #2a3060"><div class="dot" style="width:10px;height:10px;background:#7766ff;box-shadow:0 0 8px #7766ff"></div><span style="color:#aabbff;font-size:12px;font-weight:bold;letter-spacing:2px">\u2694 BATTLE TUTORIAL</span></div><div class="m-body"><div style="font-size:10px;color:var(--text);margin-bottom:16px"><strong style="display:block;margin-bottom:8px;color:#aabbff">LEARN COMBAT FUNDAMENTALS</strong><p style="color:#8899cc;margin-bottom:12px">Face off against OORTHO, the Arcane Sentinel. Through a series of guided challenges, you'll master:</p><ul style="margin-left:16px;color:#8899cc;font-size:9px;line-height:1.7"><li>\u26A1 Casting spells and managing mana</li><li>\u2728 Building and unleashing signature abilities</li><li>\uD83C\uDFC3 Positioning and movement tactics</li><li>\u231B Handling status effects</li><li>\uD83C\uDFAF Adapting to powerful AI opponents</li></ul></div><div style="background:#0a0d1e;border:1px solid #1a2050;border-radius:4px;padding:12px;margin-bottom:12px;font-size:9px;color:#5566aa"><div style="margin-bottom:6px"><strong>\uD83D\uDCCA OPPONENT: OORTHO</strong></div><div>The Arcane Sentinel uses spiral magic, chain lightning, and devastating beam attacks. High durability with adaptive AI. Difficulty: 7/10</div></div><div style="background:#0a0d1e;border:1px solid #1a2050;border-radius:4px;padding:12px;font-size:9px;color:#5566aa"><div style="margin-bottom:6px"><strong>\uD83D\uDD25 YOUR UNIT: PYROS</strong></div><div>The Pyromancer uses fire-based spread spells and powerful nova signature. Berserker passive. Perfect for learning aggressive tactics.</div></div></div><div class="m-foot"><button onclick="document.getElementById('modal').style.display='none'" style="background:transparent;border:1px solid var(--border);color:var(--dim);padding:5px 14px;font-size:11px;font-family:monospace;border-radius:3px;cursor:pointer">CANCEL</button><button onclick="startBattleTutorial();document.getElementById('modal').style.display='none'" style="background:#120e30;border:1px solid var(--acc);color:var(--acc);padding:5px 14px;font-size:11px;font-family:monospace;border-radius:3px;cursor:pointer">\u25B6 START TUTORIAL</button></div></div>`;
}

function getDef(id){return S.units.find(u=>u.id===id);}
function hpCol(r){return r>.5?'#44ff88':r>.25?'#ffaa44':'#ff3344';}

function buildTutorialBattleDef(def, slot){
  const out=dc(def);
  if(!TUT.active) return out;
  if(slot===0 && out.id==='pyros'){
    out.hp=1500; out.armor=60; out.spd=1.25;
    out.magic.spell.dmg=8; out.magic.spell.cd=1500;
    out.magic.mana.max=220; out.magic.sig.power=70;
    out.magic.sig.chargeRate=0.42; out.magic.sig.autoThreshold=.95;
    out.ai.aggression=0.3; out.ai.keepDistance=0.8;
    out.passive.power=0.18; out.passive2.power=0.18;
  }
  if(slot===1 && out.id==='oortho'){
    out.hp=2600; out.armor=110; out.spd=0.95;
    out.magic.spell.dmg=10; out.magic.spell.cd=1800;
    out.magic.mana.max=280; out.magic.sig.power=95;
    out.magic.sig.chargeRate=0.33; out.magic.sig.autoThreshold=.95;
    out.ai.aggression=0.4; out.ai.keepDistance=0.15;
    out.passive.power=0.3; out.passive2.power=0.3;
  }
  return out;
}

function restartGame(forceTutorialMode=false){
  const d0=getDef(S.selected[0]),d1=getDef(S.selected[1]);if(!d0||!d1)return;
  const tutorialMode = forceTutorialMode || TUT.active;
  if (CS.active) endCutscene();
  const bd0=buildTutorialBattleDef(d0,0), bd1=buildTutorialBattleDef(d1,1);
  S.gs=initGs(bd0,bd1);
  S.gs.resultCutscenePlayed=false;
  S.liveHPs=[bd0.hp,bd1.hp];
  S.liveManas=[bd0.magic.enabled?bd0.magic.mana.max*.65:0,bd1.magic.enabled?bd1.magic.mana.max*.65:0];
  S.liveSigCharges=[0,0];S.lt=null;
  TUT.active = tutorialMode;
  if(TUT.active){
    TUT.fired.clear(); TUT.flavorT=0;
    TUT.flavorQueue=shuffleArr([...CS_FLAVOR]);
    TUT.challengeQueue=[]; TUT.challengesFired.clear();
  }
  updateBars();
}

function updateBars(){
  if(!S.gs)return;
  for(let s=0;s<2;s++){
    const u=S.gs.units[s];
    const hR=Math.max(0,u.hp/u.maxHp),mR=u.def.magic.enabled?Math.max(0,u.mana/(u.def.magic.mana.max||1)):0,sc2=u.sigCharge||0;
    const hb=document.getElementById('hb'+s),ht=document.getElementById('ht'+s);
    const mb=document.getElementById('mb'+s),mt=document.getElementById('mt'+s);
    const cb=document.getElementById('cb'+s),ct=document.getElementById('ct'+s);
    const stEl=document.getElementById('st'+s);
    if(hb){hb.style.width=(hR*100)+'%';hb.style.background=hpCol(hR);}
    if(ht){ht.textContent=Math.max(0,Math.round(u.hp))+'/'+u.maxHp;ht.style.color=hpCol(hR);}
    if(mb)mb.style.width=(mR*100)+'%';if(mt&&u.def.magic.enabled)mt.textContent=Math.round(u.mana)+'/'+u.def.magic.mana.max;
    if(cb)cb.style.width=(sc2*100)+'%';if(ct)ct.textContent=Math.round(sc2*100)+'%';
    if(stEl){const stk=Object.keys(u.status||{}).filter(k=>u.status[k].timer>0);stEl.textContent=stk.length?stk.map(k=>k.toUpperCase()).join(' '):'';stEl.style.color=stk.length?(SFX_COL[stk[0]]||'#aaa'):'transparent';}
  }
}

function mkTags(def){
  const t=[];
  if(def.magic.enabled)t.push(`<span class="tag" style="background:${(SCH[def.school]||SCH.arcane).glow}22;color:${def.color};border:1px solid ${def.color}44">${def.school.toUpperCase()}</span>`);
  if(def.melee.enabled)t.push(`<span class="tag" style="background:#40200022;color:#ffaa44;border:1px solid #ffaa4444">${def.melee.weapon.toUpperCase()}</span>`);
  if(def.ranged.enabled)t.push(`<span class="tag" style="background:#20304422;color:#44ccff;border:1px solid #44ccff44">${def.ranged.ammo.toUpperCase()}</span>`);
  [def.passive,def.passive2].filter(p=>p&&p.id!=='none').forEach(p=>{const pd=PASSIVES[p.id];if(pd)t.push(`<span class="tag" style="background:#1a1a3a;color:#8899ff;border:1px solid #3a3a6a">${pd.name}</span>`);});
  if(def.glitch&&def.glitch.enabled&&def.glitch.ability!=='none'){const gd=GLITCH_DEFS[def.glitch.ability];if(gd)t.push(`<span class="tag" style="background:#001a33;color:#44aaff;border:1px solid #44aaff66">${gd.name}</span>`);}
  return t.join('');
}
