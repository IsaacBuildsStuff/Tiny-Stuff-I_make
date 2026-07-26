// ================================================================
// INTEL PANEL
// ================================================================
function renderIntelPanel(){
  const el=document.getElementById('intel-panel');
  if(!el||!S.gs||!S.showIntel)return;
  const[u0,u1]=S.gs.units;
  const MC={MAGIC:'#aa66ff',MELEE:'#ffaa44',RANGED:'#44ccff'};
  el.innerHTML=`<div class="intel-wrap">${[u0,u1].map(u=>{
    const b=u.brain||{};const dec=b.deciding||[];const logs=b.log||[];
    const decHtml=dec.map(d=>{
      const mc=MC[d.mode]||'#8899cc';const cdPct=Math.max(0,Math.min(1,1-Math.max(0,d.cd||0)/(d.cdMax||1)));
      if(!d.enabled)return`<div style="opacity:.28;display:flex;gap:5px;margin-bottom:2px"><span style="color:${mc};font-size:9px;min-width:50px">${d.mode}</span><span style="font-size:8px;color:var(--dim)">DISABLED</span></div>`;
      return`<div style="margin-bottom:6px"><div style="display:flex;gap:5px;align-items:center;margin-bottom:2px"><span style="color:${mc};font-size:9px;font-weight:bold;min-width:50px">${d.mode}</span><span style="font-size:8px;color:${mc};opacity:.7">${Math.round(d.prio*100)}%</span><span style="font-size:8px;color:${d.inRange?'#44ff88':'#ff4455'};margin-left:2px">${d.inRange?'IN RNG':'OOR'}</span>${d.mode==='MAGIC'?`<span style="font-size:8px;color:${d.hasMana?'#44ff88':'#ff4455'};margin-left:2px">${d.hasMana?'MANA':'NO MANA'}</span>`:''}</div><div style="font-size:8px;color:var(--dim);margin-bottom:2px">${(d.pat||'').toUpperCase()}${d.school?' ('+d.school+')':''}</div><div style="height:3px;background:var(--border);border-radius:2px;overflow:hidden"><div style="width:${cdPct*100}%;height:100%;background:${mc};border-radius:2px"></div></div><div style="font-size:8px;color:var(--dim);margin-top:1px">${(d.cd||0)>0?'CD: '+((d.cd||0)/1000).toFixed(1)+'s':'READY'}</div></div>`;
    }).join('');
    const logHtml=logs.slice(0,8).map((l,i)=>`<div class="log-e" style="color:${l.col};opacity:${1-i*.11}">&gt; ${l.msg}</div>`).join('');
    const passN=[u.def.passive,u.def.passive2].filter(p=>p&&p.id!=='none').map(p=>{const pd=PASSIVES[p.id];return pd?`<span class="tag" style="background:#1a1a3a;color:#8899ff;border:1px solid #3a3a6a;font-size:8px">${pd.name}</span>`:''}).join('');
    const stBar=Object.keys(u.status||{}).filter(k=>u.status[k].timer>0).map(k=>`<span class="tag" style="background:${SFX_COL[k]||'#333'}22;color:${SFX_COL[k]||'#aaa'};border:1px solid ${SFX_COL[k]||'#555'}44;font-size:8px">${k.toUpperCase()}</span>`).join('');
    return`<div class="intel-box"><div class="intel-hdr"><div class="dot" style="width:8px;height:8px;background:${u.def.color};box-shadow:0 0 5px ${u.def.color}"></div><span style="color:${u.def.color};font-weight:bold;letter-spacing:1px">${u.def.name}</span><span style="margin-left:auto;font-size:8px;color:${b.intent==='RETREATING'?'#ff4455':b.intent==='FINISHING'?'#ffcc44':'#44ff88'}">${b.intent||'IDLE'}</span></div>
    <div style="margin-bottom:5px">${passN}${stBar}</div>
    <div style="font-size:8px;color:var(--dim);margin-bottom:5px">HP: <span style="color:${(b.hpPct||1)>.5?'#44ff88':'#ff4455'}">${Math.round((b.hpPct||1)*100)}%</span> DIST: <span style="color:var(--text)">${b.d||0}px</span></div>
    <div style="display:flex;gap:9px"><div style="flex:1"><div style="font-size:8px;color:var(--dim);margin-bottom:4px;letter-spacing:1px">DECISION TREE</div>${decHtml}</div><div style="width:130px;flex-shrink:0"><div style="font-size:8px;color:var(--dim);margin-bottom:4px;letter-spacing:1px">ACTION LOG</div>${logHtml||'<div class="log-e">waiting...</div>'}</div></div></div>`;
  }).join('')}</div>`;
}


// ================================================================
// NAV + VIEWS
// ================================================================
function nav(active){
  const jRank=JsonFreedom.getRank();
  const prestigeStars = typeof Progression !== 'undefined' ? '★'.repeat(Progression.stars) : '';
  const prestigeName = typeof Progression !== 'undefined' ? Progression.prestigeName : 'NOVICE';
  const canEditor = typeof Progression !== 'undefined' ? Progression.isFeatureUnlocked('editor') : true;
  const canJson = typeof Progression !== 'undefined' ? Progression.isFeatureUnlocked('jsonIde') : true;
  const devUnlocked = typeof DevPanel !== 'undefined' ? DevPanel.isUnlocked() : false;

  const tabs=[
    {id:'battle',  icon:'\u2694', label:'BATTLE',   desc:'Watch units fight'},
    {id:'roster',  icon:'\u25C8', label:'ROSTER',   desc:'Browse all units'},
    {id:'editor',  icon:'\u2699', label:'EDITOR',   desc:'Customize a unit', locked:!canEditor},
    {id:'lessons', icon:'\uD83D\uDCDA',label:'LESSONS', desc:'Learn JSON'},
    {id:'tutorial',icon:'\u2795', label:'TUTORIAL',desc:'Quick guide'},
    {id:'json',    icon:'\u26A1', label:'JSON IDE', desc:['LOCKED','READER','STUDENT','CODER','MASTER'][jRank], locked:!canJson},
  ];
  return`<div class="hdr"><div style="display:flex;flex-direction:column;gap:1px"><span style="font-size:13px;color:var(--acc);letter-spacing:4px;font-weight:bold;line-height:1">UNIT FORGE</span><span style="font-size:7px;color:var(--dim);letter-spacing:2px">COMBAT SIMULATOR</span></div><div style="margin-left:auto;display:flex;gap:5px;align-items:center">${tabs.map(t=>t.locked?`<button class="nav-btn locked" disabled style="opacity:.5;cursor:not-allowed"><span class="nb-icon">\uD83D\uDD12</span><span class="nb-label">${t.label}</span><span class="nb-desc">LOCKED</span></button>`:`<button class="nav-btn ${active===t.id?'on':''}" onclick="setTab('${t.id}')"><span class="nb-icon">${t.icon}</span><span class="nb-label">${t.label}</span><span class="nb-desc">${t.desc}</span></button>`).join('')}<div style="width:1px;height:36px;background:var(--border);margin:0 3px"></div>${typeof progressionBarHTML==='function'?progressionBarHTML():''}${devUnlocked?`<button onclick="typeof DevPanel==='object'?DevPanel.showDevPanel():null" style="background:transparent;border:1px solid #ff44ff44;color:#ff44ff;padding:4px 10px;font-size:9px;font-family:monospace;border-radius:3px;cursor:pointer;transition:all .15s;letter-spacing:.5px;margin:0 4px" title="Dev Tools">⚙ DEV</button>`:''}<button onclick="typeof showPrestigeMenu==='function'?showPrestigeMenu():null" style="background:transparent;border:1px solid #ffcc4444;color:#ffcc44;padding:4px 10px;font-size:9px;font-family:monospace;border-radius:3px;cursor:pointer;transition:all .15s;letter-spacing:.5px;margin:0 4px" title="View Prestige Tiers">★ PRESTIGE</button><div style="width:1px;height:36px;background:var(--border);margin:0 3px"></div><button onclick="showHelp()" style="background:transparent;border:1px solid #1a2040;color:#3a4a70;padding:4px 10px;font-size:9px;font-family:monospace;border-radius:3px;cursor:pointer;transition:all .15s;letter-spacing:.5px">? HOW TO PLAY</button></div></div>`;
}

function showHelp(){
  const el=document.getElementById('modal');
  if(!el)return;
  el.style.display='flex';
  el.innerHTML=`<div class="help-box"><div class="m-hdr" style="border-color:#1a2050"><span style="color:var(--acc);font-size:13px;letter-spacing:3px;font-weight:bold">HOW TO PLAY</span><span style="font-size:9px;color:var(--dim);margin-left:8px">UNIT FORGE GUIDE</span></div><div class="m-body"><p style="font-size:9px;color:var(--dim);margin-bottom:14px;line-height:1.6">Unit Forge is a non-linear combat simulator. There's no set progression \u2014 explore any tab at any time.</p><div class="help-step"><div class="help-step-num">1</div><div class="help-step-body"><div class="help-step-title">\u2694 BATTLE \u2014 Watch the fight</div><div class="help-step-desc">Two units battle in real time on the arena canvas. Use the side panels to select which units fight. Hit <strong style="color:#aabb88">RESTART</strong> to run a new match, <strong style="color:#ffaa44">PAUSE</strong> to freeze the action, and <strong style="color:#aabbff">INTEL</strong> to open the live AI decision panel.</div></div></div><div class="help-step"><div class="help-step-num">2</div><div class="help-step-body"><div class="help-step-title">\u25C8 ROSTER \u2014 Browse &amp; deploy</div><div class="help-step-desc">All available units are shown here as cards. Hit <strong style="color:#44ff88">FIGHT</strong> to send a unit into battle instantly, or <strong style="color:#8899ff">EDIT</strong> to open that unit in the Editor. Use <strong style="color:var(--acc)">+ NEW UNIT</strong> to create one from scratch.</div></div></div><div class="help-step"><div class="help-step-num">3</div><div class="help-step-body"><div class="help-step-title">\u2699 EDITOR \u2014 Build your unit</div><div class="help-step-desc">Seven tabs control every aspect of a unit. All changes save instantly. Hit <strong style="color:#44ff88">TEST IN BATTLE</strong> to see the unit fight live.</div></div></div></div><div class="m-foot" style="border-color:#1a2050"><button onclick="document.getElementById('modal').style.display='none'" style="background:#120e30;border:1px solid var(--acc);color:var(--acc);padding:6px 18px;font-size:11px;font-family:monospace;border-radius:3px;cursor:pointer">GOT IT</button></div></div>`;
}

function dismissOnboard(){localStorage.setItem('cf_ob_v6','1');const el=document.getElementById('ob');if(el)el.classList.add('hidden');}

function renderLessons(){
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
    const bg=active?'background:var(--acc)22;border-color:var(--acc)':'background:transparent;border-color:transparent';
    return`<div class="json-litem${active?' active':''}${done?' done':''}" style="${bg};border:1px solid ${active?'var(--acc)':'transparent'};border-radius:4px;padding:8px 10px;margin-bottom:4px;cursor:pointer;transition:all 0.2s" onclick="jsonGoLesson('${l.id}')"><span class="json-lnum" style="color:${col};font-size:10px;font-weight:bold;margin-right:8px">${icon}</span><span class="json-ltitle" style="color:${active?'var(--text)':done?'#44ff88':'var(--dim)'};font-size:10px">${l.title}</span></div>`;
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
  const prestigeLevel = typeof Progression !== 'undefined' ? Progression.prestigeLevel : 0;
  const progressBar = total>0 ? `<div style="width:100%;height:6px;background:#0a1020;border-radius:3px;margin-top:8px;overflow:hidden"><div style="width:${pct}%;height:100%;background:linear-gradient(90deg,var(--acc),#88aaff);border-radius:3px;transition:width 0.3s"></div></div>` : '';
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
  appEl.innerHTML=`${nav('lessons')}<div class="json-ide"><div class="json-lpanel"><div class="json-lhdr"><div style="font-size:8px;color:var(--dim);letter-spacing:2px;margin-bottom:7px">JSON LESSONS</div><div class="rk-bar-bg"><div class="rk-bar-fg" style="width:${pct}%"></div></div><div style="font-size:8px;color:#2a3870;margin-top:4px;letter-spacing:.5px">${n} / ${total} COMPLETE</div></div><div class="json-llist">${llistHtml}</div></div><div class="json-cmid"><div class="json-content">${lc}${edSection}</div></div><div class="json-rpanel"><div style="font-size:8px;color:var(--dim);letter-spacing:2px;margin-bottom:6px">FREEDOM RANK</div><div class="rk-bar-bg" style="margin-bottom:3px"><div class="rk-bar-fg" style="width:${pct}%"></div></div><div style="font-size:8px;color:#2a3870;margin-bottom:12px;letter-spacing:.5px">${n}/${total} — ${pct}%</div><div class="rk-badge"><span class="rk-badge-icon">${rankObj.icon}</span><div class="rk-badge-name">${rankObj.name}</div><div class="rk-badge-tier">${rankObj.tier} · ${rankObj.desc}</div></div><div style="font-size:8px;color:var(--dim);letter-spacing:1.5px;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid var(--border)">SANDBOX FEATURES</div>${featHtml}${sandboxHtml}${storyHtml}<div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border)"><button onclick="JsonFreedom.reset();JIS.lesson='intro';JIS.code='';JIS.validation=null;renderLessons()" style="width:100%;background:transparent;border:1px solid #200f0f;color:#3a1818;font-size:8px;padding:4px;border-radius:2px;cursor:pointer;font-family:monospace">\u21BA RESET PROGRESS</button></div></div></div>`;
}
function renderTutorial(){
  const appEl=document.getElementById('app');
  if(!appEl)return;
  appEl.innerHTML=`${nav('tutorial')}<div class="content"><div class="tutorial-v"><div style="max-width:800px;margin:0 auto;padding:30px 20px"><div style="font-size:24px;color:var(--acc);letter-spacing:4px;font-weight:bold;margin-bottom:8px">QUICK START GUIDE</div><div style="font-size:11px;color:var(--dim);letter-spacing:2px;margin-bottom:30px">UNIT FORGE TUTORIAL</div><div class="tut-section"><div class="tut-num">1</div><div class="tut-body"><div class="tut-title">\u2694 BATTLE TAB</div><div class="tut-desc">Watch two units fight in real-time. Use the side panels to select which units battle. Controls: <strong>RESTART</strong> to begin, <strong>PAUSE</strong> to freeze, <strong>INTEL</strong> to see AI decisions.</div></div></div><div class="tut-section"><div class="tut-num">2</div><div class="tut-body"><div class="tut-title">\u25C8 ROSTER TAB</div><div class="tut-desc">Browse all available units. Click <strong>FIGHT</strong> to send a unit to battle, or <strong>EDIT</strong> to customize it. Use <strong>+ NEW UNIT</strong> to create custom units.</div></div></div><div class="tut-section"><div class="tut-num">3</div><div class="tut-body"><div class="tut-title">\u2699 EDITOR TAB</div><div class="tut-desc">Seven tabs control every aspect of a unit: Identity, Core Stats, Visuals, Magic, Melee, Ranged, and Behavior. Changes save instantly.</div></div></div><div class="tut-section"><div class="tut-num">4</div><div class="tut-body"><div class="tut-title">\uD83D\uDCDA LESSONS TAB</div><div class="tut-desc">Learn JSON through interactive lessons. Complete lessons to unlock Freedom Ranks and gain access to advanced features like the JSON IDE.</div></div></div><div class="tut-section"><div class="tut-num">5</div><div class="tut-body"><div class="tut-title">\u26A1 JSON IDE TAB</div><div class="tut-desc">A pure JSON editing environment for advanced users. Load units, edit their JSON directly, and import changes back to your roster.</div></div></div><div class="tut-section"><div class="tut-num">6</div><div class="tut-body"><div class="tut-title">\u2605 PRESTIGE SYSTEM</div><div class="tut-desc">Earn stars by winning battles. Prestige to unlock new units and prestige tiers. Each prestige tier unlocks additional lessons and features.</div></div></div><div style="margin-top:40px;padding-top:20px;border-top:1px solid var(--border);text-align:center"><button onclick="setTab('battle')" style="background:#120e30;border:1px solid var(--acc);color:var(--acc);padding:10px 24px;font-size:11px;font-family:monospace;border-radius:3px;cursor:pointer;letter-spacing:2px">START BATTING →</button></div></div></div></div>`;
}
function renderBattle(){
  const d0=getDef(S.selected[0]),d1=getDef(S.selected[1]);
  const appEl=document.getElementById('app');
  if(!appEl)return;
  const showOB=!localStorage.getItem('cf_ob_v6');
  document.getElementById('app').innerHTML=`${nav('battle')}<div id="ob" class="onboard-bar${showOB?'':' hidden'}"><span style="font-size:9px;color:#4455aa;letter-spacing:1px;font-weight:bold">QUICK START</span><span class="ob-arrow">›</span><div class="ob-step active"><span class="ob-num">1</span><span>Select units in the side panels</span></div><span class="ob-arrow">›</span><div class="ob-step"><span class="ob-num">2</span><span>Hit <strong style="color:#8899ff">RESTART</strong> to begin</span></div><span class="ob-arrow">›</span><div class="ob-step"><span class="ob-num">3</span><span>Enable <strong style="color:#aabbff">LIVE INTEL</strong> to see AI decisions</span></div><span class="ob-arrow">›</span><div class="ob-step"><span class="ob-num">4</span><span>Go to <strong style="color:var(--acc)">EDITOR</strong> to customize units</span></div><button class="ob-close" onclick="dismissOnboard()" title="Dismiss">✕</button></div><div class="content"><div class="battle"><div class="side side-l" id="panel-0">${panelHTML(0)}</div><div class="arena-wrap"><div id="battle-overlay-layer" class="battle-overlay-layer"></div><canvas id="cv" width="${W}" height="${H}"></canvas><div class="ctrl"><span style="font-size:7px;color:#2a3460;letter-spacing:1px;text-transform:uppercase">Match</span><div class="tip-host"><button class="c-btn c-btn-restart" onclick="restartGame()">↺ RESTART</button><div class="tip"><div class="tip-title">↺ RESTART</div><div class="tip-body">Reset the fight. Both units respawn at full HP and mana.</div></div></div><div class="tip-host"><button class="c-btn c-btn-pause ${S.paused?'on':''}" id="pbtn" onclick="togglePause()">${S.paused?'▶ RESUME':'⏸ PAUSE'}</button><div class="tip"><div class="tip-title">⏸ PAUSE</div><div class="tip-body">Freeze the simulation to read the Intel panel mid-fight.</div></div></div><div class="ctrl-divider"></div><span style="font-size:7px;color:#2a3460;letter-spacing:1px;text-transform:uppercase">Speed</span><div class="tip-host"><div class="spd-box">${[.5,1,2,3].map(s=>`<button class="spd-btn ${S.speed===s?'on':''}" onclick="setSpeed(${s})">${s}x</button>`).join('')}</div><div class="tip"><div class="tip-title">SPEED</div><div class="tip-body">0.5x for slow-motion. 3x to fast-forward to the result.</div></div></div><div class="ctrl-divider"></div><div class="tip-host"><button class="intel-btn ${S.showIntel?'on':''}" id="ibtn" onclick="toggleIntel()"><span class="intel-dot"></span><span style="display:flex;flex-direction:column;align-items:flex-start"><span>LIVE INTEL</span><span class="intel-label">${S.showIntel?'PANEL OPEN':'AI DECISIONS'}</span></span></button><div class="tip" style="min-width:190px"><div class="tip-title">📊 LIVE INTEL</div><div class="tip-body">Real-time AI debug view: decision trees, cooldowns, intent state, and last 8 actions per unit.</div></div></div></div><div style="font-size:10px;color:var(--dim);letter-spacing:2px"><span style="color:${d0?d0.color:'#fff'}">${d0?d0.name:'?'}</span><span style="color:var(--border);margin:0 12px">VS</span><span style="color:${d1?d1.color:'#fff'}">${d1?d1.name:'?'}</span></div><div id="intel-panel" style="width:100%;max-width:900px;display:${S.showIntel?'block':'none'}"></div></div><div class="side side-r" id="panel-1">${panelHTML(1)}</div></div></div>`;
  if(!S.gs)restartGame();
}

function renderRoster(){
  const appEl=document.getElementById('app');
  if(!appEl)return;
  appEl.innerHTML=`${nav('roster')}<div class="content"><div class="roster-v"><div style="display:flex;align-items:center;gap:12px;margin-bottom:14px"><span style="font-size:13px;color:var(--text);letter-spacing:2px">UNIT ROSTER</span><span style="font-size:9px;color:var(--dim)">${S.units.length} units</span><button onclick="newUnit()" style="margin-left:auto;background:#120e30;border:1px solid var(--acc);color:var(--acc);padding:6px 14px;font-size:10px;font-family:monospace;border-radius:3px;cursor:pointer">+ NEW UNIT</button></div><div class="r-grid">${S.units.map(def=>`<div class="r-card"><div style="display:flex;align-items:center;gap:8px;margin-bottom:5px"><div class="dot" style="width:11px;height:11px;background:${def.color};box-shadow:0 0 6px ${def.color}"></div><span style="font-size:12px;color:${def.color};font-weight:bold;letter-spacing:2px;flex:1">${def.name}</span><button class="mb" onclick="goEdit('${def.id}')">EDIT</button><button class="mb fight" onclick="selectForBattle('${def.id}')">FIGHT</button></div><div style="margin-bottom:6px;line-height:1.8">${mkTags(def)}</div><p style="font-size:9px;color:var(--dim);line-height:1.5;margin-bottom:8px">${def.desc}</p><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:2px 6px;border-top:1px solid var(--border);padding-top:6px"><div class="srow"><span class="sl">HP</span><span class="sv">${def.hp}</span></div><div class="srow"><span class="sl">ARM</span><span class="sv">${def.armor}</span></div><div class="srow"><span class="sl">SPD</span><span class="sv">${def.spd}</span></div><div class="srow"><span class="sl">STANCE</span><span class="sv">${def.ai.stance.slice(0,5).toUpperCase()}</span></div><div class="srow"><span class="sl">SIG</span><span class="sv" style="color:${def.magic.enabled&&def.magic.sig.type!=='none'?def.color:'var(--dim)'}">${def.magic.enabled?def.magic.sig.type.toUpperCase():'NONE'}</span></div><div class="srow"><span class="sl">CRIT</span><span class="sv">${Math.round((def.magic.enabled?def.magic.spell.critChance:def.melee.enabled?def.melee.critChance:def.ranged.critChance||.1)*100)}%</span></div></div></div>`).join('')}</div></div></div>`;
}

function renderEditor(){
  const appEl=document.getElementById('app');
  if(!appEl)return;
  const def=S.editingId?getDef(S.editingId):null;
  const jRank=JsonFreedom.getRank();
  const _fu=typeof Progression!=='undefined'?f=>Progression.isFeatureUnlocked(f):()=>true;
  const TABS=[];
  if(_fu('editorIdentity')||_fu('editor')){TABS.push('IDENTITY');TABS.push('CORE');}
  if(_fu('editorVisuals'))TABS.push('VISUAL');
  if(_fu('editorMagicHalf')||_fu('editorMagic'))TABS.push('MAGIC');
  if(_fu('editorMelee'))TABS.push('MELEE');
  if(_fu('editorRanged'))TABS.push('RANGED');
  if(_fu('editorBehavior'))TABS.push('BEHAVIOR');
  if(jRank>=4)TABS.push('GLITCH');
  if(!TABS.length)TABS.push('IDENTITY');
  const col=def?def.color:'#7766ff';
  document.getElementById('app').innerHTML=`${nav('editor')}<div class="content"><div class="editor-v"><div class="ed-left"><div class="ed-left-hdr"><div style="font-size:9px;color:var(--dim);letter-spacing:2px;margin-bottom:7px">SELECT UNIT TO EDIT</div><button onclick="newUnit()" style="width:100%;background:#120e30;border:1px solid var(--acc);color:var(--acc);padding:5px;font-size:10px;font-family:monospace;border-radius:3px;cursor:pointer">+ NEW UNIT</button></div><div class="ed-left-list">${S.units.map(u=>`<div class="u-card ${u.id===S.editingId?'sel':''}" style="${u.id===S.editingId?'border-color:'+u.color+';box-shadow:0 0 7px '+u.color+'22':''}" onclick="setEditId('${u.id}')"><div style="display:flex;align-items:center;gap:5px;margin-bottom:2px"><div class="dot" style="width:8px;height:8px;background:${u.color};box-shadow:0 0 4px ${u.color}"></div><span style="font-size:10px;color:${u.color};font-weight:bold;flex:1">${u.name}</span><button class="mb" onclick="event.stopPropagation();dupUnit('${u.id}')" style="font-size:7px;padding:1px 4px">DUP</button><button class="mb" onclick="event.stopPropagation();deleteUnit('${u.id}')" style="font-size:7px;padding:1px 4px;border-color:#ff4455;color:#ff4455">DEL</button></div><div style="line-height:1.6">${mkTags(u)}</div></div>`).join('')}</div></div><div class="ed-right">${def?`<div class="ed-tabs">${TABS.map(t=>`<button class="ed-tab ${t===S.editTab?'on':''}" style="${t===S.editTab?'border-color:'+col+';color:'+col:''}" onclick="setEdTab('${t}')">${t}</button>`).join('')}<div style="margin-left:auto;display:flex;gap:6px;align-items:center"><button onclick="exportUnit('${def.id}')" style="background:transparent;border:1px solid var(--border);color:var(--dim);font-size:9px;padding:2px 9px;border-radius:3px;cursor:pointer">EXPORT JSON</button><button onclick="testUnit('${def.id}')" style="background:#120e30;border:1px solid #44ff88;color:#44ff88;font-size:9px;padding:2px 9px;border-radius:3px;cursor:pointer">TEST IN BATTLE</button></div></div><div class="ed-body" id="ed-body"></div><div class="ed-footer"><div class="dot" style="width:10px;height:10px;background:${col};box-shadow:0 0 8px ${col}"></div><span style="color:${col};font-size:11px;font-weight:bold;letter-spacing:2px">${def.name}</span><span style="font-size:9px;color:var(--dim);margin-left:8px">HP:${def.hp} SPD:${def.spd} ARM:${def.armor}</span>${S.gs && (S.selected[0] === def.id || S.selected[1] === def.id) ? `<button onclick="applyEditorToLiveBattle('${def.id}')" style="margin-left:auto;background:#041a0a;border:1px solid #44ff88;color:#44ff88;font-size:9px;padding:2px 9px;border-radius:3px;cursor:pointer">\u26A1 APPLY LIVE</button>` : `<span style="margin-left:auto;font-size:9px;color:var(--dim)">changes save instantly</span>`}</div>`:`<div style="flex:1;display:flex;align-items:center;justify-content:center;color:var(--dim);font-size:11px;letter-spacing:2px">SELECT A UNIT TO EDIT</div>`}</div></div></div>`;
  if(def)renderEditorBody();
}

function renderEditorBody(){
  const def=getDef(S.editingId);if(!def)return;
  const el=document.getElementById('ed-body');if(!el)return;
  const c=def.color;const t=S.editTab;let html='';
  if(t==='IDENTITY'){
    html=`<div class="sec">IDENTITY</div><div class="ig"><div class="il">NAME</div><input class="ti" style="color:${c};font-size:12px" value="${def.name}" maxlength="12" oninput="liveSet('${def.id}','name',this.value.toUpperCase().slice(0,12));this.value=this.value.toUpperCase().slice(0,12);refreshEdFooter()"></div><div class="ig"><div class="il">MAGIC SCHOOL (sets color)</div><div style="display:flex;flex-wrap:wrap;gap:3px">${Object.keys(SCH).map(sk=>{const sc=SCH[sk];return`<button class="sb${def.school===sk?' on':''}" style="${def.school===sk?'border-color:'+sc.color+';color:'+sc.color:''}" onclick="setSchool('${def.id}','${sk}',this.parentNode)">${sc.name}</button>`;}).join('')}</div></div><div class="ig"><div class="il">CUSTOM COLOR OVERRIDE</div><div style="display:flex;align-items:center;gap:10px"><input type="color" value="${c}" oninput="liveSet('${def.id}','color',this.value);refreshEdFooter()" style="border:none;background:none;cursor:pointer;width:40px;height:30px"><span style="font-size:11px;color:${c};font-weight:bold">${c}</span></div></div><div class="ig"><div class="il">DESCRIPTION</div><textarea class="ta" rows="3" oninput="liveSet('${def.id}','desc',this.value)">${def.desc}</textarea></div><div class="sec">PASSIVE ABILITIES</div><div class="two-col"><div><div class="brl">PRIMARY PASSIVE</div><div class="brs" style="margin-bottom:8px">${PASSIVE_N.map(pk=>{const pd=PASSIVES[pk];const isSel=def.passive&&def.passive.id===pk;return`<button class="sb${isSel?' on':''}" style="${isSel?'border-color:#8899ff;color:#8899ff':''}" onclick="liveSet('${def.id}','passive',{id:'${pk}',power:${def.passive&&def.passive.power||1}});refreshEditorBody()">${pd.name}</button>`;}).join('')}</div>${def.passive&&def.passive.id!=='none'?`<div style="font-size:9px;color:var(--dim);margin-bottom:8px;line-height:1.5">${(PASSIVES[def.passive.id]||PASSIVES.none).desc}</div>${mks2(def,'passive.power','POWER',def.passive.power||1,0.1,2.0,0.1,'#8899ff')}`:''}</div><div><div class="brl">SECONDARY PASSIVE</div><div class="brs" style="margin-bottom:8px">${PASSIVE_N.map(pk=>{const pd=PASSIVES[pk];const isSel=def.passive2&&def.passive2.id===pk;return`<button class="sb${isSel?' on':''}" style="${isSel?'border-color:#6677dd;color:#6677dd':''}" onclick="liveSet('${def.id}','passive2',{id:'${pk}',power:${def.passive2&&def.passive2.power||1}});refreshEditorBody()">${pd.name}</button>`;}).join('')}</div>${def.passive2&&def.passive2.id!=='none'?`<div style="font-size:9px;color:var(--dim);margin-bottom:8px;line-height:1.5">${(PASSIVES[def.passive2.id]||PASSIVES.none).desc}</div>${mks2(def,'passive2.power','POWER',def.passive2.power||1,0.1,2.0,0.1,'#6677dd')}`:''}</div></div>`;
  }else if(t==='CORE'){
    html=`<div class="sec">BASE STATS</div><div class="two-col">${mks2(def,'hp','MAX HP',def.hp,60,800,1,c)}${mks2(def,'armor','ARMOR (dmg reduction)',def.armor,0,35,1,'#aabb88')}${mks2(def,'spd','MOVEMENT SPEED',def.spd,0.5,5.0,0.1,c)}</div><div class="sec">RESISTANCES (0-1, reduces that damage type)</div><div class="three-col">${['fire','frost','storm','physical','magic'].map(rt=>mks2(def,'resistances.'+rt,rt.toUpperCase(),def.resistances&&def.resistances[rt]||0,0,0.9,0.05,'#88aacc')).join('')}</div><div class="sec">MOVEMENT</div><div class="brl">MOVEMENT STYLE</div><div class="brs" style="margin-bottom:10px">${MOVE_N.map(m=>`<button class="sb${(def.move&&def.move.type||'orbit')===m?' on':''}" style="${(def.move&&def.move.type||'orbit')===m?'border-color:'+c+';color:'+c:''}" onclick="liveSet('${def.id}','move.type','${m}');refreshEditorBody()">${m.toUpperCase()}</button>`).join('')}</div>${mks2(def,'move.prefRange','PREFERRED RANGE',def.move&&def.move.prefRange||150,40,380,1,'var(--text)')}`;
  }else if(t==='VISUAL'){
    const v=def.visual||D_VISUAL;
    html=`<div class="sec">UNIT APPEARANCE</div><div class="two-col">${mks2(def,'visual.bodyRadius','BODY RADIUS',v.bodyRadius||10,4,22,0.5,c)}${mks2(def,'visual.glowIntensity','GLOW INTENSITY',v.glowIntensity||1,0.1,3.0,0.1,c)}${mks2(def,'visual.trailLength','TRAIL LENGTH',v.trailLength||7,0,20,1,'var(--text)')}${mks2(def,'visual.trailWidth','TRAIL WIDTH',v.trailWidth||1,0.3,3.0,0.1,'var(--text)')}</div><div class="sec">AURA</div><div class="tog-row"><span>AURA ENABLED</span><button class="tog ${v.auraEnabled?'on':''}" onclick="liveSet('${def.id}','visual.auraEnabled',!${v.auraEnabled});refreshEditorBody()">${v.auraEnabled?'ON':'OFF'}</button></div>${v.auraEnabled?`<div class="two-col">${mks2(def,'visual.auraRadius','AURA RADIUS',v.auraRadius||25,12,60,1,c)}<div class="tog-row"><span class="sl">PULSE AURA</span><button class="tog ${v.auraPulse?'on':''}" onclick="liveSet('${def.id}','visual.auraPulse',!${v.auraPulse});refreshEditorBody()">${v.auraPulse?'ON':'OFF'}</button></div></div>`:''}<div class="sec">RUNE ORBIT (magic users)</div><div class="tog-row"><span>RUNE ORBIT</span><button class="tog ${v.runeEnabled!==false?'on':''}" onclick="liveSet('${def.id}','visual.runeEnabled',!${v.runeEnabled!==false});refreshEditorBody()">${v.runeEnabled!==false?'ON':'OFF'}</button></div>${v.runeEnabled!==false?`<div class="two-col">${mks2(def,'visual.runeArms','RUNE ARMS',v.runeArms||4,2,8,1,'var(--dim)')}${mks2(def,'visual.runeSpeed','RUNE SPIN SPEED',v.runeSpeed||1,0.1,4.0,0.1,'var(--dim)')}</div>`:''}<div class="sec">EXTRAS</div><div class="tog-row"><span>SHOCKWAVE ON HIT</span><button class="tog ${v.shockwaveOnHit?'on':''}" onclick="liveSet('${def.id}','visual.shockwaveOnHit',!${v.shockwaveOnHit});refreshEditorBody()">${v.shockwaveOnHit?'ON':'OFF'}</button></div><div class="tog-row"><span>SHOW NAME LABEL</span><button class="tog ${v.nameVisible!==false?'on':''}" onclick="liveSet('${def.id}','visual.nameVisible',!${v.nameVisible!==false});refreshEditorBody()">${v.nameVisible!==false?'ON':'OFF'}</button></div><div class="tog-row"><span>SHOW HP/MANA BARS</span><button class="tog ${v.barsVisible!==false?'on':''}" onclick="liveSet('${def.id}','visual.barsVisible',!${v.barsVisible!==false});refreshEditorBody()">${v.barsVisible!==false?'ON':'OFF'}</button></div>`;
  }else if(t==='MAGIC'){
    const mg=def.magic,sc2=SCH[mg.school]||SCH.arcane;
    html=`<div class="sec">MAGIC SYSTEM</div><div class="tog-row"><span>MAGIC ENABLED</span><button class="tog ${mg.enabled?'on':''}" onclick="liveSet('${def.id}','magic.enabled',!${mg.enabled});refreshEditorBody()">${mg.enabled?'ON':'OFF'}</button></div>${mg.enabled?`<div class="sec">MANA SYSTEM</div><div class="two-col">${mks2(def,'magic.mana.max','MAX MANA',mg.mana.max,30,250,5,sc2.color)}${mks2(def,'magic.mana.regen','REGEN / SEC',mg.mana.regen,0.5,35,0.5,'#44aaff')}${mks2(def,'magic.mana.cost','SPELL COST',mg.mana.cost,2,90,1,'#aa44ff')}</div><div class="sec">SPELL</div><div class="brl">SPELL TYPE</div><div class="brs" style="margin-bottom:8px">${['bolt','aoe','drain'].map(m=>`<button class="sb${mg.spell.type===m?' on':''}" style="${mg.spell.type===m?'border-color:'+sc2.color+';color:'+sc2.color:''}" onclick="liveSet('${def.id}','magic.spell.type','${m}');refreshEditorBody()">${m.toUpperCase()}</button>`).join('')}</div><div class="brl">CAST PATTERN</div><div class="brs" style="margin-bottom:8px">${PAT_N.map(m=>`<button class="sb${mg.spell.pattern===m?' on':''}" style="${mg.spell.pattern===m?'border-color:'+sc2.color+';color:'+sc2.color:''}" onclick="liveSet('${def.id}','magic.spell.pattern','${m}');refreshEditorBody()">${m.toUpperCase()}</button>`).join('')}</div><div class="three-col">${mks2(def,'magic.spell.dmg','SPELL DAMAGE',mg.spell.dmg,1,120,1,'#ff4455')}${mks2(def,'magic.spell.cd','COOLDOWN (ms)',mg.spell.cd,150,4000,50,'var(--text)')}${mks2(def,'magic.spell.range','CAST RANGE',mg.spell.range,50,550,1,'var(--text)')}${mks2(def,'magic.spell.critChance','CRIT CHANCE',mg.spell.critChance||.1,0,0.6,0.01,'#ffcc44')}${mks2(def,'magic.spell.critMult','CRIT MULTIPLIER',mg.spell.critMult||1.8,1.2,4.0,0.1,'#ffcc44')}</div><div class="sec">BOLT PROPERTIES</div><div class="three-col">${mks2(def,'magic.bolt.speed','SPEED',mg.bolt.speed,1,16,0.1,sc2.color)}${mks2(def,'magic.bolt.count','COUNT',mg.bolt.count,1,14,1,'var(--text)')}${mks2(def,'magic.bolt.spread','SPREAD (rad)',mg.bolt.spread,0,1.8,0.01,'var(--text)')}${mks2(def,'magic.bolt.size','SIZE',mg.bolt.size,1,14,0.5,'var(--text)')}${mks2(def,'magic.bolt.lifetime','LIFETIME (ms)',mg.bolt.lifetime,200,5500,100,'var(--text)')}${mks2(def,'magic.bolt.trail','TRAIL LENGTH',mg.bolt.trail,0,22,1,'var(--text)')}${mks2(def,'magic.bolt.homing','HOMING',mg.bolt.homing,0,1,0.01,sc2.color)}${mks2(def,'magic.bolt.inaccuracy','INACCURACY',mg.bolt.inaccuracy,0,1,0.01,'#ff8844')}${mks2(def,'magic.bolt.impactRadius','IMPACT RADIUS',mg.bolt.impactRadius,0,150,1,'var(--text)')}${mks2(def,'magic.bolt.bounce','WALL BOUNCES',mg.bolt.bounce||0,0,5,1,'var(--text)')}${mks2(def,'magic.bolt.chainTargets','CHAIN TARGETS',mg.bolt.chainTargets||0,0,4,1,'var(--text)')}</div><div class="tog-row"><span>PIERCE THROUGH</span><button class="tog ${mg.bolt.pierce?'on':''}" onclick="liveSet('${def.id}','magic.bolt.pierce',!${mg.bolt.pierce});refreshEditorBody()">${mg.bolt.pierce?'ON':'OFF'}</button></div><div class="sec">STATUS ON HIT</div><div class="brs" style="margin-bottom:8px">${STATUS_N.map(s=>{const sd=STATUS_DEFS[s];const isSel=mg.effect.type===s;return`<button class="sb${isSel?' on':''}" style="${isSel?'border-color:'+(SFX_COL[s]||sc2.color)+';color:'+(SFX_COL[s]||sc2.color):''}" onclick="liveSet('${def.id}','magic.effect.type','${s}');refreshEditorBody()">${sd.name}</button>`;}).join('')}</div>${mg.effect.type!=='none'?`<div class="two-col">${mks2(def,'magic.effect.power','EFFECT POWER',mg.effect.power||5,0.5,40,0.5,'var(--text)')}${mks2(def,'magic.effect.duration','DURATION (ms)',mg.effect.duration||2000,300,8000,100,'var(--text)')}</div>`:''}<div class="sec">SIGNATURE SPELL</div><div class="brs" style="margin-bottom:8px">${SIG_N.map(s=>`<button class="sb${mg.sig.type===s?' on':''}" style="${mg.sig.type===s?'border-color:'+sc2.color+';color:'+sc2.color:''}" onclick="liveSet('${def.id}','magic.sig.type','${s}');refreshEditorBody()">${s.toUpperCase()}</button>`).join('')}</div>${mg.sig.type!=='none'?`<div class="three-col">${mks2(def,'magic.sig.chargeRate','CHARGE RATE',mg.sig.chargeRate,0.2,4,0.1,sc2.color)}${mks2(def,'magic.sig.power','POWER',mg.sig.power,5,300,1,'#ff4455')}${mks2(def,'magic.sig.autoThreshold','AUTO THRESHOLD',mg.sig.autoThreshold,0.3,1.0,0.05,'var(--text)')}${(mg.sig.type==='nova'||mg.sig.type==='zone'||mg.sig.type==='chain')?mks2(def,'magic.sig.radius','RADIUS',mg.sig.radius,30,350,1,'var(--text)'):''}${mg.sig.type==='zone'?mks2(def,'magic.sig.duration','ZONE DURATION',mg.sig.duration,500,12000,250,'var(--text)'):''}${mg.sig.type==='beam'?mks2(def,'magic.sig.beamLen','BEAM LENGTH',mg.sig.beamLen,80,700,1,'var(--text)'):''}${mg.sig.type==='beam'?mks2(def,'magic.sig.beamWidth','BEAM WIDTH',mg.sig.beamWidth,2,55,1,'var(--text)'):''}${mg.sig.type==='beam'?mks2(def,'magic.sig.duration','BEAM DURATION',mg.sig.duration,150,3000,50,'var(--text)'):''}${(mg.sig.type==='barrage'||mg.sig.type==='chain'||mg.sig.type==='meteor')?mks2(def,'magic.sig.burstCount','BURST COUNT',mg.sig.burstCount,2,28,1,'var(--text)'):''}${(mg.sig.type==='barrage'||mg.sig.type==='chain')?mks2(def,'magic.sig.speed','PROJ SPEED',mg.sig.speed,1,18,0.5,'var(--text)'):''}</div>`:''}`:'<p style="font-size:9px;color:var(--dim);margin-top:8px">Magic is disabled. Toggle it on above.</p>'}`;
  }else if(t==='MELEE'){
    const ml=def.melee;
    html=`<div class="sec">MELEE SYSTEM</div><div class="tog-row"><span>MELEE ENABLED</span><button class="tog ${ml.enabled?'on':''}" onclick="liveSet('${def.id}','melee.enabled',!${ml.enabled});refreshEditorBody()">${ml.enabled?'ON':'OFF'}</button></div>${ml.enabled?`<div class="brl">WEAPON TYPE</div><div class="brs" style="margin-bottom:10px">${WEAPON_N.map(w=>`<button class="sb${ml.weapon===w?' on':''}" style="${ml.weapon===w?'border-color:'+c+';color:'+c:''}" onclick="liveSet('${def.id}','melee.weapon','${w}');refreshEditorBody()">${w.toUpperCase()}</button>`).join('')}</div><div class="three-col">${mks2(def,'melee.dmg','DAMAGE',ml.dmg,3,160,1,'#ff4455')}${mks2(def,'melee.range','RANGE',ml.range,15,120,1,'var(--text)')}${mks2(def,'melee.cd','COOLDOWN (ms)',ml.cd,150,3500,50,'var(--text)')}${mks2(def,'melee.lunge','LUNGE FORCE',ml.lunge,0,10,0.1,c)}${mks2(def,'melee.knockback','KNOCKBACK',ml.knockback,0,14,0.1,'var(--text)')}${mks2(def,'melee.arcWidth','ARC WIDTH (deg)',ml.arcWidth,15,210,1,'var(--text)')}${mks2(def,'melee.critChance','CRIT CHANCE',ml.critChance||.12,0,0.7,0.01,'#ffcc44')}${mks2(def,'melee.critMult','CRIT MULTIPLIER',ml.critMult||2.0,1.2,4.5,0.1,'#ffcc44')}</div><div class="sec">COMBO SYSTEM</div><div class="tog-row"><span>COMBO ENABLED</span><button class="tog ${ml.combo&&ml.combo.enabled?'on':''}" onclick="liveSet('${def.id}','melee.combo.enabled',!${ml.combo&&ml.combo.enabled});refreshEditorBody()">${ml.combo&&ml.combo.enabled?'ON':'OFF'}</button></div>${ml.combo&&ml.combo.enabled?`<div class="three-col">${mks2(def,'melee.combo.steps','COMBO STEPS',ml.combo.steps||3,2,9,1,c)}${mks2(def,'melee.combo.dmgBonus','BONUS PER STEP',ml.combo.dmgBonus||.3,0.05,1.2,0.05,'#ffaa44')}${mks2(def,'melee.combo.window','COMBO WINDOW (ms)',ml.combo.window||850,200,2500,50,'var(--text)')}</div><div class="tog-row"><span>RESET ON MISS</span><button class="tog ${ml.combo&&ml.combo.resetOnMiss?'on':''}" onclick="liveSet('${def.id}','melee.combo.resetOnMiss',!${ml.combo&&ml.combo.resetOnMiss});refreshEditorBody()">${ml.combo&&ml.combo.resetOnMiss?'ON':'OFF'}</button></div>`:''}<div class="sec">PARRY SYSTEM</div><div class="tog-row"><span>PARRY ENABLED</span><button class="tog ${ml.parry&&ml.parry.enabled?'on':''}" onclick="liveSet('${def.id}','melee.parry.enabled',!${ml.parry&&ml.parry.enabled});refreshEditorBody()">${ml.parry&&ml.parry.enabled?'ON':'OFF'}</button></div>${ml.parry&&ml.parry.enabled?`<div class="three-col">${mks2(def,'melee.parry.chance','PARRY CHANCE',ml.parry.chance||.2,0.05,0.75,0.01,'#44aaff')}${mks2(def,'melee.parry.window','PARRY WINDOW (ms)',ml.parry.window||200,50,500,10,'var(--text)')}${mks2(def,'melee.parry.counterDmg','COUNTER DMG',ml.parry.counterDmg||1.5,1.0,4.0,0.1,c)}</div>`:''}<div class="sec">CHARGE ABILITY</div><div class="tog-row"><span>CHARGE ENABLED</span><button class="tog ${ml.charge&&ml.charge.enabled?'on':''}" onclick="liveSet('${def.id}','melee.charge.enabled',!${ml.charge&&ml.charge.enabled});refreshEditorBody()">${ml.charge&&ml.charge.enabled?'ON':'OFF'}</button></div>${ml.charge&&ml.charge.enabled?`<div class="three-col">${mks2(def,'melee.charge.minDist','MIN DISTANCE',ml.charge.minDist||120,60,350,5,'var(--text)')}${mks2(def,'melee.charge.dashSpd','DASH SPEED',ml.charge.dashSpd||7,2,16,0.5,c)}${mks2(def,'melee.charge.cooldown','COOLDOWN (ms)',ml.charge.cooldown||3000,500,8000,250,'var(--text)')}</div>`:''}<div class="sec">HIT EFFECT</div><div class="brs" style="margin-bottom:8px">${STATUS_N.map(s=>{const sd=STATUS_DEFS[s];const isSel=(ml.effect&&ml.effect.type||'none')===s;return`<button class="sb${isSel?' on':''}" style="${isSel?'border-color:'+(SFX_COL[s]||c)+';color:'+(SFX_COL[s]||c):''}" onclick="liveSet('${def.id}','melee.effect.type','${s}');refreshEditorBody()">${sd.name}</button>`;}).join('')}</div>${ml.effect&&ml.effect.type!=='none'?`<div class="two-col">${mks2(def,'melee.effect.power','POWER',ml.effect.power||5,0.5,35,0.5,'var(--text)')}${mks2(def,'melee.effect.duration','DURATION (ms)',ml.effect.duration||1500,200,7000,100,'var(--text)')}</div>`:''}`:'<p style="font-size:9px;color:var(--dim);margin-top:8px">Melee is disabled. Toggle it on above.</p>'}`;
  }else if(t==='RANGED'){
    const rg=def.ranged;
    html=`<div class="sec">RANGED SYSTEM</div><div class="tog-row"><span>RANGED ENABLED</span><button class="tog ${rg.enabled?'on':''}" onclick="liveSet('${def.id}','ranged.enabled',!${rg.enabled});refreshEditorBody()">${rg.enabled?'ON':'OFF'}</button></div>${rg.enabled?`<div class="brl">AMMO TYPE</div><div class="brs" style="margin-bottom:10px">${AMMO_N.map(a=>`<button class="sb${rg.ammo===a?' on':''}" style="${rg.ammo===a?'border-color:'+c+';color:'+c:''}" onclick="liveSet('${def.id}','ranged.ammo','${a}');refreshEditorBody()">${a.toUpperCase()}</button>`).join('')}</div><div class="three-col">${mks2(def,'ranged.dmg','DAMAGE',rg.dmg,3,120,1,'#ff4455')}${mks2(def,'ranged.cd','COOLDOWN (ms)',rg.cd,150,4000,50,'var(--text)')}${mks2(def,'ranged.range','RANGE',rg.range,60,600,1,'var(--text)')}${mks2(def,'ranged.critChance','CRIT CHANCE',rg.critChance||.1,0,0.6,0.01,'#ffcc44')}${mks2(def,'ranged.critMult','CRIT MULT',rg.critMult||1.8,1.2,4.0,0.1,'#ffcc44')}</div><div class="sec">PROJECTILE</div><div class="three-col">${mks2(def,'ranged.bolt.speed','SPEED',rg.bolt.speed,1,18,0.1,c)}${mks2(def,'ranged.bolt.count','COUNT',rg.bolt.count,1,12,1,'var(--text)')}${mks2(def,'ranged.bolt.spread','SPREAD',rg.bolt.spread,0,1.5,0.01,'var(--text)')}${mks2(def,'ranged.bolt.size','SIZE',rg.bolt.size,1,14,0.5,'var(--text)')}${mks2(def,'ranged.bolt.lifetime','LIFETIME (ms)',rg.bolt.lifetime||2800,200,6000,100,'var(--text)')}${mks2(def,'ranged.bolt.trail','TRAIL',rg.bolt.trail,0,20,1,'var(--text)')}${mks2(def,'ranged.bolt.homing','HOMING',rg.bolt.homing||0,0,1,0.01,c)}${mks2(def,'ranged.bolt.inaccuracy','INACCURACY',rg.bolt.inaccuracy,0,1,0.01,'#ff8844')}${mks2(def,'ranged.bolt.impactRadius','IMPACT RADIUS',rg.bolt.impactRadius||0,0,150,1,'var(--text)')}${mks2(def,'ranged.bolt.bounce','WALL BOUNCES',rg.bolt.bounce||0,0,5,1,'var(--text)')}</div><div class="tog-row"><span>PIERCE</span><button class="tog ${rg.bolt.pierce?'on':''}" onclick="liveSet('${def.id}','ranged.bolt.pierce',!${rg.bolt.pierce});refreshEditorBody()">${rg.bolt.pierce?'ON':'OFF'}</button></div><div class="sec">VOLLEY MODE</div><div class="tog-row"><span>VOLLEY ENABLED</span><button class="tog ${rg.volley&&rg.volley.enabled?'on':''}" onclick="liveSet('${def.id}','ranged.volley.enabled',!${rg.volley&&rg.volley.enabled});refreshEditorBody()">${rg.volley&&rg.volley.enabled?'ON':'OFF'}</button></div>${rg.volley&&rg.volley.enabled?`<div class="three-col">${mks2(def,'ranged.volley.count','VOLLEY COUNT',rg.volley.count||3,2,8,1,'var(--text)')}${mks2(def,'ranged.volley.delay','SHOT DELAY (ms)',rg.volley.delay||120,30,500,10,'var(--text)')}${mks2(def,'ranged.volley.spread','VOLLEY SPREAD',rg.volley.spread||.25,0,1.2,0.01,'var(--text)')}</div>`:''}<div class="sec">HIT EFFECT</div><div class="brs" style="margin-bottom:8px">${STATUS_N.map(s=>{const sd=STATUS_DEFS[s];const isSel=(rg.effect&&rg.effect.type||'none')===s;return`<button class="sb${isSel?' on':''}" style="${isSel?'border-color:'+(SFX_COL[s]||c)+';color:'+(SFX_COL[s]||c):''}" onclick="liveSet('${def.id}','ranged.effect.type','${s}');refreshEditorBody()">${sd.name}</button>`;}).join('')}</div>${rg.effect&&rg.effect.type!=='none'?`<div class="two-col">${mks2(def,'ranged.effect.power','POWER',rg.effect.power||4,0.5,35,0.5,'var(--text)')}${mks2(def,'ranged.effect.duration','DURATION (ms)',rg.effect.duration||1800,200,7000,100,'var(--text)')}</div>`:''}`:'<p style="font-size:9px;color:var(--dim);margin-top:8px">Ranged is disabled. Toggle it on above.</p>'}`;
  }else if(t==='BEHAVIOR'){
    const ai=def.ai;
    const MOVE_STYLES=['orbit','kite','aggressive','strafe','charge','erratic','random','stationary'];
    const groups=[{label:'MOVEMENT & POSITIONING',keys:[['aggression','AGGRESSION'],['spacing','SPACING'],['strafe','STRAFE'],['keepDistance','KEEP DISTANCE'],['randomness','RANDOMNESS'],['flankTendency','FLANK TENDENCY']]},{label:'TARGETING & AIM',keys:[['aim','AIM ACCURACY'],['prediction','TARGET PREDICTION'],['leadFactor','LEAD FACTOR'],['targetCommit','TARGET COMMIT']]},{label:'DEFENSE & REACTIONS',keys:[['dodge','DODGE TENDENCY'],['dodgeTiming','DODGE TIMING'],['parryTendency','PARRY TENDENCY'],['counterPlay','COUNTER-PLAY'],['baiting','BAIT TENDENCY']]},{label:'OFFENSE PATTERNS',keys:[['comboBias','COMBO BIAS'],['burstWindow','BURST WINDOW'],['attackDelay','ATTACK DELAY'],['cancelThreshold','CANCEL THRESHOLD']]},{label:'RESOURCE MANAGEMENT',keys:[['specialBias','SIGNATURE BIAS'],['manaConserve','MANA CONSERVE'],['retreatThreshold','RETREAT HP'],['retreatToHeal','RETREAT TO HEAL'],['advanceThreshold','ADVANCE HP']]},{label:'ADAPTATION',keys:[['adaptRate','ADAPT RATE'],['pressureResponse','PRESSURE RESPONSE']]}];
    html=`<div class="sec">STANCE PRESET</div><div class="brs" style="margin-bottom:10px">${STANCE_N.map(s=>`<button class="sb${ai.stance===s?' on':''}" style="${ai.stance===s?'border-color:'+c+';color:'+c:''}" onclick="applyStance('${def.id}','${s}')">${s.toUpperCase()}</button>`).join('')}</div><div class="sec">MOVEMENT STYLE</div><div class="brs" style="margin-bottom:10px">${MOVE_STYLES.map(m=>`<button class="sb${(ai.movementStyle||'orbit')===m?' on':''}" style="${(ai.movementStyle||'orbit')===m?'border-color:'+c+';color:'+c:''}" onclick="liveSet('${def.id}','ai.movementStyle','${m}');refreshEditorBody()">${m.toUpperCase()}</button>`).join('')}</div><div class="sec">MOVEMENT PARAMETERS</div><div class="three-col">${mks2(def,'ai.movementAggression','MOVE AGGRESSION',ai.movementAggression||0.5,0,1,0.01,c)}${mks2(def,'ai.movementVar','MOVE VARIANCE',ai.movementVar||0.2,0,1,0.01,c)}${mks2(def,'ai.orbitRadius','ORBIT RADIUS',ai.orbitRadius||150,50,400,5,c)}</div><div class="three-col">${mks2(def,'ai.pursuitSpeed','PURSUIT SPEED',ai.pursuitSpeed||1.0,0.3,2.0,0.1,'#44ff88')}${mks2(def,'ai.retreatSpeed','RETREAT SPEED',ai.retreatSpeed||1.2,0.3,2.5,0.1,'#ff4455')}</div><div class="sec">COMBAT PRIORITY</div><div class="three-col">${mks2(def,'ai.priority.magic','MAGIC',ai.priority.magic||.5,0,1,0.01,'#aa66ff')}${mks2(def,'ai.priority.melee','MELEE',ai.priority.melee||.25,0,1,0.01,'#ffaa44')}${mks2(def,'ai.priority.ranged','RANGED',ai.priority.ranged||.25,0,1,0.01,'#44ccff')}</div>${groups.map(g=>`<div class="sec">${g.label}</div><div class="three-col">${g.keys.map(([k,label])=>mks2(def,'ai.'+k,label,ai[k]!==undefined?ai[k]:0.5,0,1,0.01,c)).join('')}</div>`).join('')}<div class="sec">NOTES (freeform)</div><textarea class="ta" rows="3" placeholder="Describe this unit's behavioral intent..." oninput="liveSet('${def.id}','ai.notes',this.value)">${ai.notes||''}</textarea>`;
  }else if(t==='GLITCH'){
    const gl=def.glitch||dc(D_GLITCH);
    html=`<div class="sec">GLITCH SYSTEM <span style="font-size:8px;color:#44aaff;margin-left:6px">MASTER RANK</span></div><div class="tog-row"><span>GLITCH ENABLED</span><button class="tog ${gl.enabled?'on':''}" onclick="liveSet('${def.id}','glitch.enabled',!${gl.enabled});refreshEditorBody()">${gl.enabled?'ON':'OFF'}</button></div>${gl.enabled?`<div class="sec">ABILITY</div><div class="brs" style="margin-bottom:10px">${GLITCH_N.map(g=>{const gd=GLITCH_DEFS[g];const isSel=gl.ability===g;return`<button class="sb${isSel?' on':''}" style="${isSel?'border-color:#44aaff;color:#44aaff':''}" onclick="liveSet('${def.id}','glitch.ability','${g}');refreshEditorBody()">${gd.name}</button>`;}).join('')}</div>${gl.ability!=='none'?`<div style="font-size:9px;color:var(--dim);margin-bottom:10px;line-height:1.5">${(GLITCH_DEFS[gl.ability]||GLITCH_DEFS.none).desc}</div><div class="three-col">${mks2(def,'glitch.cd','COOLDOWN (ms)',gl.cd,1000,12000,100,'#44aaff')}${mks2(def,'glitch.power','POWER',gl.power,1,60,1,'#44aaff')}${gl.ability!=='null_pointer'?mks2(def,'glitch.duration','DURATION (ms)',gl.duration,500,10000,100,'#44aaff'):''}${(gl.ability==='popup_block'||gl.ability==='static_field')?mks2(def,'glitch.radius','RADIUS',gl.radius,20,120,1,'#44aaff'):''}${mks2(def,'glitch.range','TRIGGER RANGE',gl.range,50,400,1,'#44aaff')}</div>`:''}`:'<p style="font-size:9px;color:var(--dim);margin-top:8px">Glitch abilities are master-rank exclusives. Enable to configure.</p>'}`;
  }
  el.innerHTML=html;
}

function mks2(def,path,label,val,min,max,step,col){
  const id='sv_'+def.id+'_'+path.replace(/\./g,'_');
  const isFlt=(step||1)<1;
  const parse=isFlt?'parseFloat':'parseInt';
  const c2=col||'var(--acc)';
  return`<div class="sr"><div class="sl2"><span>${label}</span><span id="${id}" style="color:${c2}">${typeof val==='number'?val.toFixed(isFlt?2:0):val}</span></div><input type="range" min="${min}" max="${max}" step="${step||1}" value="${val}" style="width:100%;accent-color:${c2}" oninput="liveSet('${def.id}','${path}',${parse}(this.value));document.getElementById('${id}').textContent=parseFloat(this.value).toFixed(${isFlt?2:0})"></div>`;
}

function liveSet(unitId,path,val){
  const def=getDef(unitId);if(!def)return;
  dset(def,path,val);
  if(path==='school'||path==='magic.school'){
    const sch=def.magic&&def.magic.enabled?def.magic.school||def.school:def.school;
    const sc2=SCH[sch]||SCH.arcane;
    def.color=def.magic.enabled?sc2.color:def.color;def.glowColor=sc2.glow;def.trailColor=sc2.trail;
  }
  if(S.gs&&(S.selected[0]===unitId||S.selected[1]===unitId)){
    clearTimeout(_restartDebounce);
    _restartDebounce=setTimeout(()=>restartGame(),300);
  }
}
function setSchool(unitId,school,container){
  const def=getDef(unitId);if(!def)return;
  def.school=school;def.magic.school=school;
  const sc2=SCH[school]||SCH.arcane;
  if(def.magic.enabled){def.color=sc2.color;def.glowColor=sc2.glow;def.trailColor=sc2.trail;}
  refreshEditorBody();
  if(S.gs&&(S.selected[0]===unitId||S.selected[1]===unitId))restartGame();
}
function applyStance(unitId,stance){
  const def=getDef(unitId);if(!def)return;
  const preset=STANCES[stance]||{};
  def.ai=Object.assign(dc(D_AI),def.ai,preset,{stance});
  refreshEditorBody();
  if(S.gs&&(S.selected[0]===unitId||S.selected[1]===unitId))restartGame();
}
function refreshEditorBody(){if(S.tab==='editor')renderEditorBody();}
function refreshEdFooter(){if(S.tab==='editor')renderEditor();}
function setEditId(id){S.editingId=id;S.editTab='IDENTITY';renderEditor();}
function setEdTab(t){S.editTab=t;renderEditorBody();}
function exportUnit(id){const def=getDef(id);if(!def)return;const el=document.getElementById('modal');el.style.display='flex';el.innerHTML=`<div class="m-box" style="border:2px solid ${def.color};box-shadow:0 0 40px ${def.color}33"><div class="m-hdr"><div class="dot" style="width:10px;height:10px;background:${def.color};box-shadow:0 0 8px ${def.color}"></div><span style="color:${def.color};font-size:12px;font-weight:bold;letter-spacing:2px">${def.name} - EXPORT</span></div><div class="m-body"><div style="font-size:9px;color:var(--dim);margin-bottom:8px">Copy this JSON to save the unit definition.</div><pre class="code-pre">${JSON.stringify(def,null,2).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre></div><div class="m-foot"><button onclick="navigator.clipboard&&navigator.clipboard.writeText(JSON.stringify(getDef('${id}'),null,2))" style="background:#120e30;border:1px solid var(--acc);color:var(--acc);padding:5px 14px;font-size:11px;font-family:monospace;border-radius:3px;cursor:pointer">COPY JSON</button><button onclick="document.getElementById('modal').style.display='none'" style="background:transparent;border:1px solid var(--border);color:var(--dim);padding:5px 14px;font-size:11px;font-family:monospace;border-radius:3px;cursor:pointer">CLOSE</button></div></div>`;}
function applyEditorToLiveBattle(unitId){
  if(!S.gs)return;const def=getDef(unitId);if(!def)return;
  const sideIdx=S.selected[0]===unitId?0:S.selected[1]===unitId?1:-1;
  if(sideIdx===-1)return;
  const u=S.gs.units[sideIdx];
  u.def=dc(def);u.maxHp=def.hp;u.hp=Math.min(u.hp,def.hp);u.armor=def.armor||0;u.def._speedBoost=0;
  u.flash=1;u.flashCol='#44ff88';pRing(S.gs.parts,u.x,u.y,'#44ff88',14,24);S.gs.shake=Math.max(S.gs.shake,3);
}
function testUnit(id){S.selected[0]=id;restartGame();setTab('battle');}
function dupUnit(id){const def=getDef(id);if(!def)return;const dup=dc(def);dup.id='c_'+Date.now();dup.name=def.name.slice(0,10)+'2';S.units.push(dup);S.editingId=dup.id;renderEditor();}
function deleteUnit(id){if(S.units.length<=2){alert('Need at least 2 units.');return;}S.units=S.units.filter(u=>u.id!==id);if(S.editingId===id)S.editingId=S.units[0].id;if(S.selected[0]===id)S.selected[0]=S.units[0].id;if(S.selected[1]===id)S.selected[1]=S.units[Math.min(1,S.units.length-1)].id;renderEditor();}
function newUnit(){const nu=mkDef({id:'c_'+Date.now(),name:'UNIT',school:'arcane',desc:'Custom unit.',hp:260,armor:0,spd:2.0});S.units.push(nu);S.editingId=nu.id;S.editTab='IDENTITY';if(S.tab!=='editor')setTab('editor');else renderEditor();}
function goEdit(id){S.editingId=id;S.editTab='IDENTITY';setTab('editor');}
function selectForBattle(id){if(S.selected[0]===id||S.selected[1]===id){restartGame();setTab('battle');return;}S.selected[1]=id;restartGame();setTab('battle');}

function setTab(t){
  if(t !== 'battle' && CS.active) endCutscene();
  S.tab=t;
  if(t==='battle')renderBattle();
  else if(t==='roster')renderRoster();
  else if(t==='lessons')renderLessons();
  else if(t==='tutorial')renderTutorial();
  else if(t==='json')renderJsonIde();
  else renderEditor();
  // Add dev side tab
  const existingTab = document.getElementById('dev-side-tab');
  if(existingTab) existingTab.remove();
  document.body.insertAdjacentHTML('beforeend', typeof renderDevSideTab==='function'?renderDevSideTab():'');
}
function selectUnit(side,id){S.selected[side]=id;restartGame();const el=document.getElementById('panel-'+side);if(el)el.innerHTML=panelHTML(side);}
function togglePause(){S.paused=!S.paused;const b=document.getElementById('pbtn');if(b){b.textContent=S.paused?'\u25B6 RESUME':'\u23F8 PAUSE';b.classList.toggle('on',S.paused);}}
function toggleIntel(){
  S.showIntel=!S.showIntel;
  const b=document.getElementById('ibtn');
  if(b){b.classList.toggle('on',S.showIntel);const lbl=b.querySelector('.intel-label');if(lbl)lbl.textContent=S.showIntel?'PANEL OPEN':'AI DECISIONS';}
  const p=document.getElementById('intel-panel');if(p)p.style.display=S.showIntel?'block':'none';
}
function setSpeed(s){S.speed=s;document.querySelectorAll('.spd-btn').forEach((b,i)=>{b.classList.toggle('on',[.5,1,2,3][i]===s);});}


// ================================================================
// PRESTIGE HELPERS
// ================================================================
function showLockedMsg(tabId,needed){
  const t=document.createElement('div');
  t.className='unlock-toast';
  t.style.cssText='border-color:#ffcc44;box-shadow:0 0 40px rgba(255,204,68,.25);padding:16px 28px';
  const names={editor:'EDITOR',json:'JSON IDE'};
  t.innerHTML='<div style="font-size:9px;color:#ffcc44;letter-spacing:2px;margin-bottom:6px">\uD83D\uDD12 LOCKED</div>'
    +'<div style="font-size:11px;color:var(--text);margin-bottom:4px">'+(names[tabId]||tabId.toUpperCase())+'</div>'
    +'<div style="font-size:9px;color:var(--dim)">Requires Prestige '+needed+' '+'\u2605'.repeat(needed||1)+'</div>';
  document.body.appendChild(t);
  setTimeout(()=>{t.style.transition='opacity .3s';t.style.opacity='0';setTimeout(()=>t.remove(),300);},1800);
}

// ================================================================
// DEV PANEL SYSTEM
// ================================================================
const DEV_UNLOCK_KEY = '__uf_dev_unlock_v1';
const DEV_PATTERN_KEY = '__uf_dev_pattern_v1';
const DEV_PASSWORD = 'D3Vm0d3';

const DevPanel = {
  isUnlocked() {
    try {
      return localStorage.getItem(DEV_UNLOCK_KEY) === 'true';
    } catch {
      return false;
    }
  },

  unlock() {
    localStorage.setItem(DEV_UNLOCK_KEY, 'true');
  },

  lock() {
    localStorage.removeItem(DEV_UNLOCK_KEY);
  },

  toggle() {
    if (this.isUnlocked()) {
      this.lock();
    } else {
      this.unlock();
    }
  },

  showHiddenInput() {
    const el = document.getElementById('modal');
    if (!el) return;
    el.style.display = 'flex';
    
    const patternOptions = [
      { id: '1', symbol: '1', type: 'number' },
      { id: '2', symbol: '2', type: 'number' },
      { id: '3', symbol: '3', type: 'number' },
      { id: '4', symbol: '4', type: 'number' },
      { id: '5', symbol: '5', type: 'number' },
      { id: '6', symbol: '6', type: 'number' },
      { id: '7', symbol: '7', type: 'number' },
      { id: '8', symbol: '8', type: 'number' },
      { id: '9', symbol: '9', type: 'number' },
      { id: 'red_orb', symbol: '●', color: '#ff4444', type: 'orb' },
      { id: 'blue_orb', symbol: '●', color: '#4444ff', type: 'orb' },
      { id: 'green_orb', symbol: '●', color: '#44ff44', type: 'orb' },
      { id: 'yellow_orb', symbol: '●', color: '#ffff44', type: 'orb' },
      { id: 'purple_orb', symbol: '●', color: '#aa44ff', type: 'orb' },
      { id: 'cyan_orb', symbol: '●', color: '#44ffff', type: 'orb' },
      { id: 'orange_orb', symbol: '●', color: '#ff8844', type: 'orb' },
      { id: 'yellow_triangle', symbol: '▲', color: '#ffff44', type: 'triangle' },
      { id: 'yellow_triangle_inv', symbol: '▼', color: '#ffff44', type: 'triangle' },
      { id: 'lock', symbol: '🔒', type: 'symbol' },
      { id: 'door', symbol: '🚪', type: 'symbol' },
      { id: 'key', symbol: '🔑', type: 'symbol' },
    ];

    const defaultPattern = ['red_orb', 'blue_orb', 'yellow_triangle', 'key'];
    
    let storedPattern;
    try {
      storedPattern = JSON.parse(localStorage.getItem(DEV_PATTERN_KEY));
    } catch {
      storedPattern = null;
    }
    
    const correctPattern = storedPattern || defaultPattern;
    
    window.devSelectedPattern = [];
    
    el.innerHTML = `<div class="m-box" style="border:1px solid #1a2040;width:500px;box-shadow:0 0 40px rgba(0,0,0,.5)">
      <div class="m-hdr" style="background:#0a0a12;border-bottom:1px solid #1a2040">
        <span style="color:var(--dim);font-size:10px;letter-spacing:2px">DEV ACCESS</span>
        <button onclick="document.getElementById('modal').style.display='none'" style="margin-left:auto;background:transparent;border:none;color:var(--dim);font-size:12px;cursor:pointer">\u2715</button>
      </div>
      <div class="m-body" style="padding:16px;text-align:center">
        <div style="font-size:8px;color:var(--dim);margin-bottom:12px">Select the correct pattern (4 symbols)</div>
        <div id="pattern-display" style="display:flex;gap:8px;justify-content:center;margin-bottom:16px;min-height:32px">
          ${[0,1,2,3].map(i => `<div id="pattern-slot-${i}" style="width:32px;height:32px;background:#0a0a12;border:1px solid #1a2040;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:18px;color:var(--dim)"></div>`).join('')}
        </div>
        <div id="pattern-grid" style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-bottom:12px">
          ${patternOptions.map(opt => `<button id="pattern-btn-${opt.id}" onclick="DevPanel.selectPatternItem('${opt.id}')" style="width:44px;height:44px;background:#0a0a12;border:1px solid #1a2040;border-radius:4px;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center;font-size:20px;${opt.color ? 'color:'+opt.color : 'color:var(--text)'}">${opt.symbol}</button>`).join('')}
        </div>
        <div style="display:flex;gap:8px;justify-content:center">
          <button onclick="DevPanel.clearPattern()" style="background:#1a2040;border:1px solid var(--border);color:var(--dim);padding:6px 16px;font-size:9px;font-family:monospace;border-radius:3px;cursor:pointer">CLEAR</button>
          <button onclick="DevPanel.checkPattern()" style="background:#1a2040;border:1px solid var(--border);color:var(--text);padding:6px 16px;font-size:9px;font-family:monospace;border-radius:3px;cursor:pointer">UNLOCK</button>
        </div>
      </div>
    </div>`;
    
    window.devPatternOptions = patternOptions;
    window.devCorrectPattern = correctPattern;
  },

  selectPatternItem(id) {
    if (window.devSelectedPattern.length >= 4) return;
    
    const option = window.devPatternOptions.find(o => o.id === id);
    if (!option) return;
    
    window.devSelectedPattern.push(id);
    
    const slotIndex = window.devSelectedPattern.length - 1;
    const slot = document.getElementById(`pattern-slot-${slotIndex}`);
    if (slot) {
      slot.textContent = option.symbol;
      slot.style.color = option.color || 'var(--text)';
      slot.style.borderColor = option.color || 'var(--border)';
    }
    
    const btn = document.getElementById(`pattern-btn-${id}`);
    if (btn) {
      btn.style.opacity = '0.3';
      btn.style.pointerEvents = 'none';
    }
  },

  clearPattern() {
    window.devSelectedPattern = [];
    
    for (let i = 0; i < 4; i++) {
      const slot = document.getElementById(`pattern-slot-${i}`);
      if (slot) {
        slot.textContent = '';
        slot.style.color = 'var(--dim)';
        slot.style.borderColor = '#1a2040';
      }
    }
    
    window.devPatternOptions.forEach(opt => {
      const btn = document.getElementById(`pattern-btn-${opt.id}`);
      if (btn) {
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
      }
    });
  },

  checkPattern() {
    if (window.devSelectedPattern.length !== 4) {
      alert('Select 4 symbols');
      return;
    }
    
    const isCorrect = window.devSelectedPattern.every((id, index) => id === window.devCorrectPattern[index]);
    
    if (isCorrect) {
      this.unlock();
      document.getElementById('modal').style.display = 'none';
      this.showDevPanel();
    } else {
      this.clearPattern();
      const display = document.getElementById('pattern-display');
      if (display) {
        display.innerHTML = '<div style="color:#ff4455;font-size:10px;padding:8px">Incorrect pattern</div>';
        setTimeout(() => {
          display.innerHTML = `${[0,1,2,3].map(i => `<div id="pattern-slot-${i}" style="width:32px;height:32px;background:#0a0a12;border:1px solid #1a2040;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:18px;color:var(--dim)"></div>`).join('')}`;
        }, 1500);
      }
    }
  },

  showDevPanel() {
    const el = document.getElementById('modal');
    if (!el) return;
    const unlockedUnits = typeof Progression !== 'undefined' ? Progression.getUnlockedUnits() : [];
    const allUnits = S.units.map(u => u.id);

    el.style.display = 'flex';
    el.innerHTML = `<div class="m-box" style="border:2px solid #ff44ff;width:850px;max-height:92vh;display:flex;flex-direction:column;margin:auto;box-shadow:0 0 80px rgba(255,68,255,.25)">
      <div class="m-hdr" style="background:linear-gradient(90deg,#1a001a,#200020);border-bottom:2px solid #ff44ff">
        <div class="dot" style="width:10px;height:10px;background:#ff44ff;box-shadow:0 0 12px #ff44ff"></div>
        <span style="color:#ff44ff;font-size:12px;font-weight:bold;letter-spacing:3px">DEV TOOLS</span>
        <button onclick="document.getElementById('modal').style.display='none'" style="margin-left:auto;background:transparent;border:none;color:var(--dim);font-size:14px;cursor:pointer">\u2715</button>
      </div>
      <div style="padding:12px 16px;border-bottom:1px solid var(--border)">
        <div style="font-size:8px;color:var(--dim);margin-bottom:8px;letter-spacing:1px">QUICK ACTIONS</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button onclick="DevPanel.unlockAllUnits()" style="background:#1a0033;border:1px solid #ff44ff;color:#ff44ff;padding:5px 10px;font-size:8px;font-family:monospace;border-radius:3px;cursor:pointer">UNLOCK ALL UNITS</button>
          <button onclick="DevPanel.setMaxPrestige()" style="background:#1a0033;border:1px solid #ff44ff;color:#ff44ff;padding:5px 10px;font-size:8px;font-family:monospace;border-radius:3px;cursor:pointer">MAX PRESTIGE</button>
          <button onclick="DevPanel.addXP(1000)" style="background:#1a0033;border:1px solid #ff44ff;color:#ff44ff;padding:5px 10px;font-size:8px;font-family:monospace;border-radius:3px;cursor:pointer">+1000 XP</button>
          <button onclick="DevPanel.completeAllMissions()" style="background:#1a0033;border:1px solid #ff44ff;color:#ff44ff;padding:5px 10px;font-size:8px;font-family:monospace;border-radius:3px;cursor:pointer">ALL MISSIONS</button>
          <button onclick="DevPanel.completeAllLessons()" style="background:#1a0033;border:1px solid #ff44ff;color:#ff44ff;padding:5px 10px;font-size:8px;font-family:monospace;border-radius:3px;cursor:pointer">ALL LESSONS</button>
          <button onclick="DevPanel.toggleGodMode()" style="background:#1a0033;border:1px solid #ff44ff;color:#ff44ff;padding:5px 10px;font-size:8px;font-family:monospace;border-radius:3px;cursor:pointer">TOGGLE GOD MODE</button>
          <button onclick="DevPanel.instantWin()" style="background:#1a0033;border:1px solid #44ff88;color:#44ff88;padding:5px 10px;font-size:8px;font-family:monospace;border-radius:3px;cursor:pointer">INSTANT WIN</button>
          <button onclick="DevPanel.instantLose()" style="background:#1a0033;border:1px solid #ff4455;color:#ff4455;padding:5px 10px;font-size:8px;font-family:monospace;border-radius:3px;cursor:pointer">INSTANT LOSE</button>
        </div>
      </div>
      <div style="display:flex;flex:1;min-height:0">
        <div style="width:280px;border-right:1px solid var(--border);overflow-y:auto;padding:12px 16px">
          <div style="font-size:8px;color:var(--dim);margin-bottom:8px;letter-spacing:1px">PROGRESSION</div>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin-bottom:12px">
            <div style="background:#0a0a12;border:1px solid #1a2040;padding:6px;border-radius:3px">
              <div style="font-size:7px;color:var(--dim);margin-bottom:2px">PRESTIGE</div>
              <div style="font-size:12px;color:#ff44ff;font-weight:bold">${typeof Progression !== 'undefined' ? Progression.prestigeLevel : 'N/A'}</div>
            </div>
            <div style="background:#0a0a12;border:1px solid #1a2040;padding:6px;border-radius:3px">
              <div style="font-size:7px;color:var(--dim);margin-bottom:2px">LEVEL</div>
              <div style="font-size:12px;color:#ff44ff;font-weight:bold">${typeof Progression !== 'undefined' ? Progression.level : 'N/A'}</div>
            </div>
            <div style="background:#0a0a12;border:1px solid #1a2040;padding:6px;border-radius:3px">
              <div style="font-size:7px;color:var(--dim);margin-bottom:2px">XP</div>
              <div style="font-size:12px;color:#ff44ff;font-weight:bold">${typeof Progression !== 'undefined' ? Progression.xp : 'N/A'}</div>
            </div>
            <div style="background:#0a0a12;border:1px solid #1a2040;padding:6px;border-radius:3px">
              <div style="font-size:7px;color:var(--dim);margin-bottom:2px">STARS</div>
              <div style="font-size:12px;color:#ff44ff;font-weight:bold">${typeof Progression !== 'undefined' ? Progression.stars : 'N/A'}</div>
            </div>
          </div>
          <div style="font-size:8px;color:var(--dim);margin-bottom:8px;letter-spacing:1px">SET PROGRESSION</div>
          <div style="display:flex;gap:6px;margin-bottom:8px">
            <input type="number" id="dev-prestige-input" placeholder="Prestige" min="0" max="13" value="${typeof Progression !== 'undefined' ? Progression.prestigeLevel : 0}" style="width:60px;background:#0a0a12;border:1px solid #1a2040;color:var(--text);padding:4px;font-size:8px;font-family:monospace;border-radius:3px">
            <input type="number" id="dev-level-input" placeholder="Level" min="1" max="10" value="${typeof Progression !== 'undefined' ? Progression.level : 1}" style="width:50px;background:#0a0a12;border:1px solid #1a2040;color:var(--text);padding:4px;font-size:8px;font-family:monospace;border-radius:3px">
            <input type="number" id="dev-xp-input" placeholder="XP" min="0" value="${typeof Progression !== 'undefined' ? Progression.xp : 0}" style="width:70px;background:#0a0a12;border:1px solid #1a2040;color:var(--text);padding:4px;font-size:8px;font-family:monospace;border-radius:3px">
            <button onclick="DevPanel.setCustomProgression()" style="background:#1a0033;border:1px solid #ff44ff;color:#ff44ff;padding:4px 8px;font-size:8px;font-family:monospace;border-radius:3px;cursor:pointer">SET</button>
          </div>
          <div style="font-size:8px;color:var(--dim);margin-bottom:8px;letter-spacing:1px">DATA MANAGEMENT</div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <button onclick="DevPanel.exportSaveData()" style="background:#1a0033;border:1px solid #44aaff;color:#44aaff;padding:5px 10px;font-size:8px;font-family:monospace;border-radius:3px;cursor:pointer">EXPORT SAVE DATA</button>
            <button onclick="DevPanel.showImportSave()" style="background:#1a0033;border:1px solid #44aaff;color:#44aaff;padding:5px 10px;font-size:8px;font-family:monospace;border-radius:3px;cursor:pointer">IMPORT SAVE DATA</button>
            <button onclick="DevPanel.clearAllData()" style="background:#1a0033;border:1px solid #ff4455;color:#ff4455;padding:5px 10px;font-size:8px;font-family:monospace;border-radius:3px;cursor:pointer">CLEAR ALL DATA</button>
            <button onclick="DevPanel.resetProgression()" style="background:#1a0033;border:1px solid #ffaa44;color:#ffaa44;padding:5px 10px;font-size:8px;font-family:monospace;border-radius:3px;cursor:pointer">RESET PROGRESSION</button>
          </div>
          <div style="font-size:8px;color:var(--dim);margin-bottom:8px;letter-spacing:1px;margin-top:12px">BATTLE CONTROLS</div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <button onclick="DevPanel.toggleAI()" style="background:#1a0033;border:1px solid #ff44ff;color:#ff44ff;padding:5px 10px;font-size:8px;font-family:monospace;border-radius:3px;cursor:pointer">TOGGLE AI</button>
            <button onclick="DevPanel.setBattleSpeed(0.5)" style="background:#1a0033;border:1px solid var(--border);color:var(--dim);padding:5px 10px;font-size:8px;font-family:monospace;border-radius:3px;cursor:pointer">SPEED 0.5x</button>
            <button onclick="DevPanel.setBattleSpeed(1)" style="background:#1a0033;border:1px solid var(--border);color:var(--dim);padding:5px 10px;font-size:8px;font-family:monospace;border-radius:3px;cursor:pointer">SPEED 1x</button>
            <button onclick="DevPanel.setBattleSpeed(2)" style="background:#1a0033;border:1px solid var(--border);color:var(--dim);padding:5px 10px;font-size:8px;font-family:monospace;border-radius:3px;cursor:pointer">SPEED 2x</button>
            <button onclick="DevPanel.setBattleSpeed(3)" style="background:#1a0033;border:1px solid var(--border);color:var(--dim);padding:5px 10px;font-size:8px;font-family:monospace;border-radius:3px;cursor:pointer">SPEED 3x</button>
          </div>
          <div style="font-size:8px;color:var(--dim);margin-bottom:8px;letter-spacing:1px;margin-top:12px">SECURITY</div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <button onclick="DevPanel.showChangePattern()" style="background:#ffaa0022;border:1px solid #ffaa00;color:#ffaa00;padding:5px 10px;font-size:8px;font-family:monospace;border-radius:3px;cursor:pointer">🔒 D3V53CR3T5 🔒</button>
          </div>
        </div>
        <div style="flex:1;overflow-y:auto;padding:12px 16px">
          <div style="font-size:8px;color:var(--dim);margin-bottom:8px;letter-spacing:1px">GAME STATE</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:12px">
            <div style="background:#0a0a12;border:1px solid #1a2040;padding:6px;border-radius:3px">
              <div style="font-size:7px;color:var(--dim);margin-bottom:2px">UNITS</div>
              <div style="font-size:12px;color:#ff44ff;font-weight:bold">${S.units.length}</div>
            </div>
            <div style="background:#0a0a12;border:1px solid #1a2040;padding:6px;border-radius:3px">
              <div style="font-size:7px;color:var(--dim);margin-bottom:2px">GOD MODE</div>
              <div style="font-size:12px;color:${S.godMode ? '#44ff88' : '#ff4455'};font-weight:bold">${S.godMode ? 'ON' : 'OFF'}</div>
            </div>
            <div style="background:#0a0a12;border:1px solid #1a2040;padding:6px;border-radius:3px">
              <div style="font-size:7px;color:var(--dim);margin-bottom:2px">AI ENABLED</div>
              <div style="font-size:12px;color:${S.aiDisabled ? '#ff4455' : '#44ff88'};font-weight:bold">${S.aiDisabled ? 'OFF' : 'ON'}</div>
            </div>
          </div>
          <div style="font-size:8px;color:var(--dim);margin-bottom:8px;letter-spacing:1px">UNIT LIST</div>
          <div style="background:#0a0a12;border:1px solid #1a2040;padding:8px;border-radius:3px;max-height:180px;overflow-y:auto">
            ${S.units.map(u => `<div style="display:flex;justify-content:space-between;align-items:center;font-size:8px;color:${u.color};padding:2px 0;border-bottom:1px solid #1a2040"><span>${u.id} - ${u.name}</span><button onclick="DevPanel.editUnit('${u.id}')" style="background:#1a0033;border:1px solid #ff44ff44;color:#ff44ff;padding:2px 6px;font-size:7px;font-family:monospace;border-radius:2px;cursor:pointer">EDIT</button></div>`).join('')}
          </div>
          <div style="font-size:8px;color:var(--dim);margin-bottom:8px;letter-spacing:1px;margin-top:12px">BATTLE STATE</div>
          <div style="background:#0a0a12;border:1px solid #1a2040;padding:8px;border-radius:3px">
            ${S.gs ? `<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px">
              <div><span style="font-size:7px;color:var(--dim)">WINNER:</span> <span style="font-size:9px;color:${S.gs.winner === 0 ? '#44ff88' : S.gs.winner === 1 ? '#ff4455' : 'var(--dim)'}">${S.gs.winner === 0 ? 'PLAYER' : S.gs.winner === 1 ? 'ENEMY' : 'NONE'}</span></div>
              <div><span style="font-size:7px;color:var(--dim)">TIME:</span> <span style="font-size:9px;color:var(--text)">${Math.floor(S.gs.time / 1000)}s</span></div>
              <div><span style="font-size:7px;color:var(--dim)">PAUSED:</span> <span style="font-size:9px;color:${S.paused ? '#ffaa44' : 'var(--dim)'}">${S.paused ? 'YES' : 'NO'}</span></div>
              <div><span style="font-size:7px;color:var(--dim)">SPEED:</span> <span style="font-size:9px;color:var(--text)">${S.speed}x</span></div>
            </div>` : '<div style="font-size:8px;color:var(--dim)">No active battle</div>'}
          </div>
          <div style="font-size:8px;color:var(--dim);margin-bottom:8px;letter-spacing:1px;margin-top:12px">TESTING</div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <button onclick="DevPanel.triggerCutscene('intro_welcome')" style="background:#1a0033;border:1px solid #aa44ff;color:#aa44ff;padding:5px 10px;font-size:8px;font-family:monospace;border-radius:3px;cursor:pointer">PLAY INTRO CUTSCENE</button>
            <button onclick="DevPanel.triggerCutscene('oortho_defeated')" style="background:#1a0033;border:1px solid #aa44ff;color:#aa44ff;padding:5px 10px;font-size:8px;font-family:monospace;border-radius:3px;cursor:pointer">PLAY VICTORY CUTSCENE</button>
            <button onclick="DevPanel.triggerCutscene('player_defeated')" style="background:#1a0033;border:1px solid #aa44ff;color:#aa44ff;padding:5px 10px;font-size:8px;font-family:monospace;border-radius:3px;cursor:pointer">PLAY DEFEAT CUTSCENE</button>
          </div>
        </div>
      </div>
      <div style="padding:10px 16px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
        <button onclick="DevPanel.lock();document.getElementById('modal').style.display='none';if(typeof renderBattle==='function')renderBattle()" style="background:transparent;border:1px solid #ff4455;color:#ff4455;padding:6px 12px;font-size:9px;letter-spacing:1px;cursor:pointer;border-radius:3px">LOCK DEV PANEL</button>
        <button onclick="document.getElementById('modal').style.display='none'" style="background:var(--acc);color:#fff;border:none;padding:6px 16px;font-size:9px;letter-spacing:1px;cursor:pointer;border-radius:3px">CLOSE</button>
      </div>
    </div>`;
  },

  unlockAllUnits() {
    const allUnitIds = S.units.map(u => u.id);
    if (typeof Progression !== 'undefined') {
      Progression.prestigeLevel = 13;
      Progression.applyPrestigeToUnits();
    }
    this.showDevPanel();
  },

  setMaxPrestige() {
    if (typeof Progression !== 'undefined') {
      Progression.prestigeLevel = 13;
      Progression.level = 10;
      Progression.xp = 3200;
      Progression.save();
      Progression.applyPrestigeToUnits();
    }
    this.showDevPanel();
  },

  addXP(amount) {
    if (typeof Progression !== 'undefined') {
      Progression.addXP(amount);
      Progression.save();
      Progression.refreshNav();
    }
    this.showDevPanel();
  },

  completeAllMissions() {
    if (typeof Progression !== 'undefined') {
      MISSIONS.forEach(m => Progression.missionsCompleted.add(m.id));
      Progression.save();
    }
    this.showDevPanel();
  },

  completeAllLessons() {
    if (typeof JsonFreedom !== 'undefined') {
      JSON_LESSONS.forEach(l => JsonFreedom.complete(l.id));
    }
    this.showDevPanel();
  },

  toggleGodMode() {
    if (typeof S !== 'undefined') {
      S.godMode = !S.godMode;
      if (S.godMode && S.gs) {
        S.gs.units.forEach(u => {
          u.hp = u.maxHp;
          u.mana = u.def.magic.mana.max;
        });
      }
    }
    this.showDevPanel();
  },

  instantWin() {
    if (S.gs) {
      S.gs.winner = 0;
      S.gs.units[1].hp = 0;
      S.gs.units[1].alive = false;
    }
    this.showDevPanel();
  },

  instantLose() {
    if (S.gs) {
      S.gs.winner = 1;
      S.gs.units[0].hp = 0;
      S.gs.units[0].alive = false;
    }
    this.showDevPanel();
  },

  setCustomProgression() {
    const prestigeInput = document.getElementById('dev-prestige-input');
    const levelInput = document.getElementById('dev-level-input');
    const xpInput = document.getElementById('dev-xp-input');
    if (!prestigeInput || !levelInput || !xpInput) return;
    if (typeof Progression !== 'undefined') {
      Progression.prestigeLevel = parseInt(prestigeInput.value) || 0;
      Progression.level = parseInt(levelInput.value) || 1;
      Progression.xp = parseInt(xpInput.value) || 0;
      Progression.save();
      Progression.applyPrestigeToUnits();
    }
    this.showDevPanel();
  },

  exportSaveData() {
    const saveData = {
      progression: typeof Progression !== 'undefined' ? localStorage.getItem(PROGRESSION_KEY) : null,
      missions: typeof Progression !== 'undefined' ? localStorage.getItem(MISSIONS_KEY) : null,
      units: localStorage.getItem(UNITS_KEY),
      prestige: localStorage.getItem(PRESTIGE_KEY),
      jsonFreedom: localStorage.getItem(JSON_FREEDOM_KEY),
      jsonDraft: localStorage.getItem(JSON_DRAFT_KEY),
      storyFired: localStorage.getItem(STORY_FIRED_KEY),
      devUnlocked: localStorage.getItem(DEV_UNLOCK_KEY),
    };
    const el = document.getElementById('modal');
    if (!el) return;
    el.style.display = 'flex';
    el.innerHTML = `<div class="m-box" style="border:2px solid #44aaff;width:600px;max-height:90vh;display:flex;flex-direction:column;margin:auto;box-shadow:0 0 60px rgba(68,170,255,.25)">
      <div class="m-hdr" style="background:linear-gradient(90deg,#001a2a,#002040);border-bottom:2px solid #44aaff">
        <span style="color:#44aaff;font-size:12px;font-weight:bold;letter-spacing:3px">EXPORT SAVE DATA</span>
        <button onclick="document.getElementById('modal').style.display='none'" style="margin-left:auto;background:transparent;border:none;color:var(--dim);font-size:14px;cursor:pointer">\u2715</button>
      </div>
      <div class="m-body" style="padding:16px">
        <div style="font-size:9px;color:var(--dim);margin-bottom:8px">Copy this JSON to backup your save data:</div>
        <pre class="code-pre" style="max-height:400px;overflow-y:auto">${JSON.stringify(saveData, null, 2)}</pre>
      </div>
      <div class="m-foot">
        <button onclick="navigator.clipboard.writeText(JSON.stringify(saveData, null,2));document.getElementById('modal').style.display='none'" style="background:#002040;border:1px solid #44aaff;color:#44aaff;padding:6px 16px;font-size:10px;font-family:monospace;border-radius:3px;cursor:pointer">COPY TO CLIPBOARD</button>
        <button onclick="document.getElementById('modal').style.display='none'" style="background:transparent;border:1px solid var(--border);color:var(--dim);padding:6px 16px;font-size:10px;font-family:monospace;border-radius:3px;cursor:pointer">CLOSE</button>
      </div>
    </div>`;
  },

  showImportSave() {
    const el = document.getElementById('modal');
    if (!el) return;
    el.style.display = 'flex';
    el.innerHTML = `<div class="m-box" style="border:2px solid #44aaff;width:600px;max-height:90vh;display:flex;flex-direction:column;margin:auto;box-shadow:0 0 60px rgba(68,170,255,.25)">
      <div class="m-hdr" style="background:linear-gradient(90deg,#001a2a,#002040);border-bottom:2px solid #44aaff">
        <span style="color:#44aaff;font-size:12px;font-weight:bold;letter-spacing:3px">IMPORT SAVE DATA</span>
        <button onclick="document.getElementById('modal').style.display='none'" style="margin-left:auto;background:transparent;border:none;color:var(--dim);font-size:14px;cursor:pointer">\u2715</button>
      </div>
      <div class="m-body" style="padding:16px">
        <div style="font-size:9px;color:var(--dim);margin-bottom:8px">Paste your save data JSON below:</div>
        <textarea id="import-save-textarea" style="width:100%;height:200px;background:#0a0a12;border:1px solid #1a2040;color:var(--text);padding:8px;font-size:9px;font-family:monospace;border-radius:3px;resize:none"></textarea>
      </div>
      <div class="m-foot">
        <button onclick="DevPanel.importSaveData()" style="background:#002040;border:1px solid #44aaff;color:#44aaff;padding:6px 16px;font-size:10px;font-family:monospace;border-radius:3px;cursor:pointer">IMPORT</button>
        <button onclick="document.getElementById('modal').style.display='none'" style="background:transparent;border:1px solid var(--border);color:var(--dim);padding:6px 16px;font-size:10px;font-family:monospace;border-radius:3px;cursor:pointer">CANCEL</button>
      </div>
    </div>`;
  },

  importSaveData() {
    const textarea = document.getElementById('import-save-textarea');
    if (!textarea) return;
    try {
      const saveData = JSON.parse(textarea.value);
      if (saveData.progression) localStorage.setItem(PROGRESSION_KEY, saveData.progression);
      if (saveData.missions) localStorage.setItem(MISSIONS_KEY, saveData.missions);
      if (saveData.units) localStorage.setItem(UNITS_KEY, saveData.units);
      if (saveData.prestige) localStorage.setItem(PRESTIGE_KEY, saveData.prestige);
      if (saveData.jsonFreedom) localStorage.setItem(JSON_FREEDOM_KEY, saveData.jsonFreedom);
      if (saveData.jsonDraft) localStorage.setItem(JSON_DRAFT_KEY, saveData.jsonDraft);
      if (saveData.storyFired) localStorage.setItem(STORY_FIRED_KEY, saveData.storyFired);
      if (saveData.devUnlocked) localStorage.setItem(DEV_UNLOCK_KEY, saveData.devUnlocked);
      document.getElementById('modal').style.display = 'none';
      location.reload();
    } catch (e) {
      alert('Invalid JSON data');
    }
  },

  clearAllData() {
    if (confirm('Are you sure you want to clear ALL data? This cannot be undone.')) {
      localStorage.clear();
      location.reload();
    }
  },

  resetProgression() {
    if (confirm('Are you sure you want to reset progression? This cannot be undone.')) {
      localStorage.removeItem(PROGRESSION_KEY);
      localStorage.removeItem(MISSIONS_KEY);
      localStorage.removeItem(PRESTIGE_KEY);
      localStorage.removeItem(JSON_FREEDOM_KEY);
      localStorage.removeItem(JSON_DRAFT_KEY);
      localStorage.removeItem(STORY_FIRED_KEY);
      location.reload();
    }
  },

  toggleAI() {
    if (typeof S !== 'undefined') {
      S.aiDisabled = !S.aiDisabled;
    }
    this.showDevPanel();
  },

  setBattleSpeed(speed) {
    if (typeof S !== 'undefined') {
      S.speed = speed;
    }
    this.showDevPanel();
  },

  editUnit(id) {
    document.getElementById('modal').style.display = 'none';
    S.editingId = id;
    S.editTab = 'IDENTITY';
    setTab('editor');
  },

  triggerCutscene(id) {
    if (typeof playCutscene === 'function') {
      playCutscene(id);
    }
  },

  showChangePattern() {
    const el = document.getElementById('modal');
    if (!el) return;
    el.style.display = 'flex';
    
    const patternOptions = [
      { id: '1', symbol: '1', type: 'number' },
      { id: '2', symbol: '2', type: 'number' },
      { id: '3', symbol: '3', type: 'number' },
      { id: '4', symbol: '4', type: 'number' },
      { id: '5', symbol: '5', type: 'number' },
      { id: '6', symbol: '6', type: 'number' },
      { id: '7', symbol: '7', type: 'number' },
      { id: '8', symbol: '8', type: 'number' },
      { id: '9', symbol: '9', type: 'number' },
      { id: 'red_orb', symbol: '●', color: '#ff4444', type: 'orb' },
      { id: 'blue_orb', symbol: '●', color: '#4444ff', type: 'orb' },
      { id: 'green_orb', symbol: '●', color: '#44ff44', type: 'orb' },
      { id: 'yellow_orb', symbol: '●', color: '#ffff44', type: 'orb' },
      { id: 'purple_orb', symbol: '●', color: '#aa44ff', type: 'orb' },
      { id: 'cyan_orb', symbol: '●', color: '#44ffff', type: 'orb' },
      { id: 'orange_orb', symbol: '●', color: '#ff8844', type: 'orb' },
      { id: 'yellow_triangle', symbol: '▲', color: '#ffff44', type: 'triangle' },
      { id: 'yellow_triangle_inv', symbol: '▼', color: '#ffff44', type: 'triangle' },
      { id: 'lock', symbol: '🔒', type: 'symbol' },
      { id: 'door', symbol: '🚪', type: 'symbol' },
      { id: 'key', symbol: '🔑', type: 'symbol' },
    ];

    let currentPattern = JSON.parse(localStorage.getItem(DEV_PATTERN_KEY) || "null");

if (!Array.isArray(currentPattern)) {
    currentPattern = [
        'red_orb',
        'blue_orb',
        'yellow_triangle',
        'key'
    ];
}

window.devNewPattern = [...currentPattern];
    console.log(localStorage.getItem(DEV_PATTERN_KEY));
    console.log(currentPattern);
    console.log(typeof currentPattern);
    window.devNewPattern = [...currentPattern];
    
    el.innerHTML = `<div class="m-box" style="border:2px solid #ffaa00;width:500px;box-shadow:0 0 40px rgba(255,170,0,.25)">
      <div class="m-hdr" style="background:linear-gradient(90deg,#1a1500,#201a00);border-bottom:2px solid #ffaa00">
        <span style="color:#ffaa00;font-size:12px;font-weight:bold;letter-spacing:3px">CHANGE PATTERN</span>
        <button onclick="document.getElementById('modal').style.display='none'" style="margin-left:auto;background:transparent;border:none;color:var(--dim);font-size:14px;cursor:pointer">\u2715</button>
      </div>
      <div class="m-body" style="padding:16px;text-align:center">
        <div style="font-size:8px;color:var(--dim);margin-bottom:12px">Select new pattern (4 symbols)</div>
        <div id="new-pattern-display" style="display:flex;gap:8px;justify-content:center;margin-bottom:16px;min-height:32px">
          ${[0,1,2,3].map(i => {
            const opt = patternOptions.find(o => o.id === currentPattern[i]);
            return `<div id="new-pattern-slot-${i}" style="width:32px;height:32px;background:#0a0a12;border:1px solid #ffaa00;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:18px;color:${opt ? opt.color || 'var(--text)' : 'var(--dim)'}">${opt ? opt.symbol : ''}</div>`;
          }).join('')}
        </div>
        <div id="new-pattern-grid" style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-bottom:12px">
          ${patternOptions.map(opt => `<button id="new-pattern-btn-${opt.id}" onclick="DevPanel.selectNewPatternItem('${opt.id}')" style="width:44px;height:44px;background:#0a0a12;border:1px solid #1a2040;border-radius:4px;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center;font-size:20px;${opt.color ? 'color:'+opt.color : 'color:var(--text)'}">${opt.symbol}</button>`).join('')}
        </div>
        <div style="display:flex;gap:8px;justify-content:center">
          <button onclick="DevPanel.clearNewPattern()" style="background:#1a1500;border:1px solid var(--border);color:var(--dim);padding:6px 16px;font-size:9px;font-family:monospace;border-radius:3px;cursor:pointer">CLEAR</button>
          <button onclick="DevPanel.saveNewPattern()" style="background:#1a1500;border:1px solid #ffaa00;color:#ffaa00;padding:6px 16px;font-size:9px;font-family:monospace;border-radius:3px;cursor:pointer">SAVE</button>
        </div>
      </div>
    </div>`;
    
    window.devNewPatternOptions = patternOptions;
    this.updateNewPatternUI();
  },

  selectNewPatternItem(id) {
    if (window.devNewPattern.length >= 4) return;
    
    const option = window.devNewPatternOptions.find(o => o.id === id);
    if (!option) return;
    
    window.devNewPattern.push(id);
    this.updateNewPatternUI();
  },

  clearNewPattern() {
    window.devNewPattern = [];
    this.updateNewPatternUI();
  },

  updateNewPatternUI() {
    for (let i = 0; i < 4; i++) {
      const slot = document.getElementById(`new-pattern-slot-${i}`);
      if (slot) {
        const optId = window.devNewPattern[i];
        const opt = optId ? window.devNewPatternOptions.find(o => o.id === optId) : null;
        slot.textContent = opt ? opt.symbol : '';
        slot.style.color = opt ? opt.color || 'var(--text)' : 'var(--dim)';
        slot.style.borderColor = opt ? '#ffaa00' : '#1a2040';
      }
    }
    
    window.devNewPatternOptions.forEach(opt => {
      const btn = document.getElementById(`new-pattern-btn-${opt.id}`);
      if (btn) {
        const isSelected = window.devNewPattern.includes(opt.id);
        btn.style.opacity = isSelected ? '0.3' : '1';
        btn.style.pointerEvents = isSelected ? 'none' : 'auto';
      }
    });
  },

  saveNewPattern() {
    if (window.devNewPattern.length !== 4) {
      alert('Select 4 symbols');
      return;
    }
    
    try {
      localStorage.setItem(DEV_PATTERN_KEY, JSON.stringify(window.devNewPattern));
      document.getElementById('modal').style.display = 'none';
      this.showDevPanel();
    } catch (e) {
      alert('Failed to save pattern');
    }
  },
};

// Hidden dev trigger - small clickable area in footer
function renderDevTrigger() {
  if (!DevPanel.isUnlocked()) return '';
  return `<div onclick="DevPanel.showDevPanel()" style="position:fixed;bottom:4px;right:4px;width:12px;height:12px;background:#ff44ff22;border:1px solid #ff44ff44;border-radius:2px;cursor:pointer;opacity:0.3;transition:opacity .2s" title="Dev Panel"></div>`;
}

// Small unnoticeable side tab for dev password input
function renderDevSideTab() {
  if (DevPanel.isUnlocked()) return '';
  return `<div id="dev-fake-bg" style="position:fixed;bottom:10px;right:10px;width:20px;height:20px;background:#0a0a12;border:1px solid #1a1a2a;z-index:999;cursor:pointer" onclick="DevPanel.showHiddenInput()"></div>
  <div id="dev-side-tab" style="position:fixed;bottom:10px;right:10px;width:20px;height:20px;background:#080808;border:1px solid #080808;cursor:pointer;z-index:1000;opacity:0.5" onclick="DevPanel.showHiddenInput()" title=""></div>`;
}

// ================================================================
// GAME LOOP
// ================================================================
function loop(ts){
  if(S.lt===null)S.lt=ts;
  const dt=Math.min(ts-S.lt,50);S.lt=ts;
  try{
    updateCutscene(dt);
    if(S.gs&&!S.paused&&!S.gs.winner&&!CS.active){
      updateGame(S.gs, dt*S.speed);
      updateOorthoPopups(S.gs, dt*S.speed);
      tickTutorial(S.gs, dt*S.speed);
      S.statsT+=dt;
      if(S.statsT>85){S.statsT=0;if(S.gs){const[u0,u1]=S.gs.units;S.liveHPs=[Math.max(0,u0.hp),Math.max(0,u1.hp)];S.liveManas=[u0.mana,u1.mana];S.liveSigCharges=[u0.sigCharge,u1.sigCharge];}updateBars();}
      S.intelT+=dt;
      if(S.intelT>120){S.intelT=0;if(S.showIntel)renderIntelPanel();}
    }
  }catch(err){console.error('Game loop error (recovered):',err);}
  const cv=document.getElementById('cv');if(cv&&S.gs)renderGame(cv.getContext('2d'),S.gs,S.showIntel);
  requestAnimationFrame(loop);
}
