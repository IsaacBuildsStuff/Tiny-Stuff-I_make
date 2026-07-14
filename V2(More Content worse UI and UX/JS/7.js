// ================================================================
// PROGRESSION SYSTEM — Player XP, Levels, Missions & Unlocks
// ================================================================

const PROGRESSION_KEY = 'uf_progression_v1';
const MISSIONS_KEY = 'uf_missions_v1';
const UNITS_KEY = 'uf_units_v1';

// XP needed to reach next level (cumulative)
const XP_TABLE = [
  0,      // L1: start
  100,    // L2: first win
  250,    // L3: learning
  450,    // L4: intermediate
  700,    // L5: skilled
  1000,   // L6: advanced
  1400,   // L7: expert
  1900,   // L8: master
  2500,   // L9: grandmaster
  3200,   // L10: forge lord
];

const RANK_TITLES = [
  'NOVICE', 'APPRENTICE', 'INITIATE', 'ADEPT', 'VETERAN',
  'EXPERT', 'MASTER', 'GRANDMASTER', 'ARCHMAGE', 'FORGE LORD'
];

// Mission definitions — structured progression from start to finish
const MISSIONS = [
  {
    id: 'first_boot',
    title: 'ENTER THE FORGE',
    desc: 'Complete the introductory tutorial.',
    xp: 25,
    check: () => TutorialCache.hasSeen(),
  },
  {
    id: 'first_battle',
    title: 'FIRST BLOOD',
    desc: 'Win your first battle in the arena.',
    xp: 75,
    check: () => Progression.stats.battlesWon >= 1,
  },
  {
    id: 'battle_tutorial',
    title: 'ARCANE DUEL',
    desc: 'Complete the OORTHO battle tutorial.',
    xp: 100,
    check: () => TutorialCache.hasDoneBattleTutorial(),
  },
  {
    id: 'json_lessons_3',
    title: 'JSON APPRENTICE',
    desc: 'Complete 3 JSON lessons to reach READER rank.',
    xp: 80,
    check: () => JsonFreedom.getCompleted().size >= 3,
  },
  {
    id: 'json_lessons_6',
    title: 'JSON STUDENT',
    desc: 'Complete 6 JSON lessons to reach STUDENT rank.',
    xp: 120,
    check: () => JsonFreedom.getCompleted().size >= 6,
  },
  {
    id: 'battles_won_3',
    title: 'ARENA FIGHTER',
    desc: 'Win 3 battles total.',
    xp: 100,
    check: () => Progression.stats.battlesWon >= 3,
  },
  {
    id: 'challenge_barrier',
    title: 'BARRIER BREAKER',
    desc: 'Complete the "Break the Barrier" story challenge.',
    xp: 150,
    check: () => Progression.stats.challengesCompleted.has('barrier'),
  },
  {
    id: 'challenge_hp_boost',
    title: 'IRONSMITH',
    desc: 'Complete the "Reinforce Your Unit" story challenge.',
    xp: 150,
    check: () => Progression.stats.challengesCompleted.has('hp_boost'),
  },
  {
    id: 'json_lessons_10',
    title: 'JSON CODER',
    desc: 'Complete 10 JSON lessons to reach CODER rank.',
    xp: 200,
    check: () => JsonFreedom.getCompleted().size >= 10,
  },
  {
    id: 'battles_won_5',
    title: 'CHAMPION',
    desc: 'Win 5 battles total.',
    xp: 150,
    check: () => Progression.stats.battlesWon >= 5,
  },
  {
    id: 'defeat_oortho',
    title: 'SENTINEL SLAYER',
    desc: 'Defeat OORTHO in a standard battle.',
    xp: 300,
    check: () => Progression.stats.oorthoDefeats >= 1,
  },
  {
    id: 'json_master',
    title: 'FORGE MASTER',
    desc: 'Reach MASTER rank in JSON (complete all lessons).',
    xp: 500,
    check: () => JsonFreedom.getRank() >= 4,
  },
  {
    id: 'all_units_tested',
    title: 'TACTICIAN',
    desc: 'Battle with at least 5 different units.',
    xp: 200,
    check: () => Progression.stats.unitsUsed.size >= 5,
  },
  {
    id: 'level_10',
    title: 'FORGE LORD',
    desc: 'Reach Level 10.',
    xp: 0,
    check: () => Progression.level >= 10,
  },
  {
    id: 'complete_all_lessons',
    title: 'TRUE MASTER',
    desc: 'Complete every JSON lesson.',
    xp: 300,
    check: () => JsonFreedom.getCompleted().size >= 12,
  },
];

const Progression = {
  level: 1,
  xp: 0,
  stats: {
    battlesWon: 0,
    battlesLost: 0,
    battlesTotal: 0,
    oorthoDefeats: 0,
    challengesCompleted: new Set(),
    unitsUsed: new Set(),
  },
  missionsCompleted: new Set(),
  _levelUpPending: false,

  load() {
    try {
      const data = JSON.parse(localStorage.getItem(PROGRESSION_KEY) || '{}');
      if (data.level) this.level = data.level;
      if (data.xp !== undefined) this.xp = data.xp;
      if (data.stats) {
        this.stats.battlesWon = data.stats.battlesWon || 0;
        this.stats.battlesLost = data.stats.battlesLost || 0;
        this.stats.battlesTotal = data.stats.battlesTotal || 0;
        this.stats.oorthoDefeats = data.stats.oorthoDefeats || 0;
        this.stats.challengesCompleted = new Set(data.stats.challengesCompleted || []);
        this.stats.unitsUsed = new Set(data.stats.unitsUsed || []);
      }
      this.missionsCompleted = new Set(JSON.parse(localStorage.getItem(MISSIONS_KEY) || '[]'));
      
      const unitsData = JSON.parse(localStorage.getItem(UNITS_KEY) || '[]');
      if (Array.isArray(unitsData) && unitsData.length > 0) {
        S.units = unitsData.map(u => mkDef(u));
      }
    } catch(e) {
      console.error('Load failed:',e);
    }
  },

  save() {
    try {
      localStorage.setItem(PROGRESSION_KEY, JSON.stringify({
        level: this.level,
        xp: this.xp,
        stats: {
          battlesWon: this.stats.battlesWon,
          battlesLost: this.stats.battlesLost,
          battlesTotal: this.stats.battlesTotal,
          oorthoDefeats: this.stats.oorthoDefeats,
          challengesCompleted: [...this.stats.challengesCompleted],
          unitsUsed: [...this.stats.unitsUsed],
        }
      }));
      localStorage.setItem(MISSIONS_KEY, JSON.stringify([...this.missionsCompleted]));
      localStorage.setItem(UNITS_KEY, JSON.stringify(S.units.map(u=>({
        id:u.id,name:u.name,school:u.school,desc:u.desc,hp:u.hp,armor:u.armor,spd:u.spd,
        passive:u.passive,passive2:u.passive2,visual:u.visual,magic:u.magic,melee:u.melee,ranged:u.ranged,
        ai:u.ai,glitch:u.glitch,color:u.color,resistances:u.resistances,move:u.move
      }))));
    } catch(e) {
      console.error('Save failed:',e);
    }
  },

  xpToNext() {
    if (this.level >= XP_TABLE.length) return 0;
    return XP_TABLE[this.level] - this.xp;
  },

  xpForCurrent() {
    if (this.level <= 1) return this.xp;
    return this.xp - XP_TABLE[this.level - 1];
  },

  xpRange() {
    if (this.level <= 1) return { base: 0, next: XP_TABLE[1] || 100 };
    if (this.level >= XP_TABLE.length) return { base: XP_TABLE[XP_TABLE.length - 1], next: XP_TABLE[XP_TABLE.length - 1] };
    return { base: XP_TABLE[this.level - 1], next: XP_TABLE[this.level] };
  },

  rankTitle() {
    return RANK_TITLES[Math.min(this.level - 1, RANK_TITLES.length - 1)];
  },

  addXP(amount) {
    if (amount <= 0) return;
    this.xp += amount;
    let leveledUp = false;
    while (this.level < XP_TABLE.length && this.xp >= XP_TABLE[this.level]) {
      this.level++;
      leveledUp = true;
    }
    this.save();
    if (leveledUp) this._triggerLevelUp();
    this.checkMissions();
  },

  _triggerLevelUp() {
    this._levelUpPending = true;
    // Delay slightly so it doesn't conflict with other cutscenes
    setTimeout(() => {
      if (CS && CS.active) {
        // Retry after cutscene ends
        setTimeout(() => this._triggerLevelUp(), 2000);
        return;
      }
      this._levelUpPending = false;
      this.showLevelUpOverlay();
    }, 1500);
  },

  showLevelUpOverlay() {
    const el = document.getElementById('modal');
    if (!el) return;
    el.style.display = 'flex';
    el.innerHTML = `<div class="m-box" style="border:2px solid var(--acc);width:420px;box-shadow:0 0 80px rgba(204,68,255,.35)">
      <div class="m-hdr" style="background:linear-gradient(90deg,#0d0e28,#1a1e40);border-bottom:2px solid var(--acc)">
        <div class="dot" style="width:10px;height:10px;background:var(--acc);box-shadow:0 0 12px var(--acc)"></div>
        <span style="color:var(--acc);font-size:13px;font-weight:bold;letter-spacing:3px">LEVEL UP</span>
      </div>
      <div class="m-body" style="text-align:center;padding:30px 24px">
        <div style="font-size:48px;color:var(--acc);text-shadow:0 0 30px var(--acc);font-weight:bold;line-height:1;margin-bottom:8px">L${this.level}</div>
        <div style="font-size:14px;color:var(--text);letter-spacing:2px;font-weight:bold;margin-bottom:4px">${this.rankTitle()}</div>
        <div style="font-size:9px;color:var(--dim);margin-bottom:20px">Your mastery of the Forge grows.</div>
        <button class="c-btn" style="background:var(--acc);color:#fff;border:none;padding:8px 24px;font-size:10px;letter-spacing:2px;cursor:pointer;border-radius:3px" onclick="document.getElementById('modal').style.display='none';Progression.checkMissions();Progression.refreshNav()">CONTINUE</button>
      </div>
    </div>`;
    // Flash effect
    if (S.gs) S.gs.flashOvl = { a: 0.3, col: '#cc44ff' };
    if (typeof playCutscene === 'function' && !CS.active) {
      setTimeout(() => { if (!CS.active) playCutscene('level_up'); }, 600);
    }
  },

  recordBattle(won, playerUnitId, enemyUnitId) {
    this.stats.battlesTotal++;
    this.stats.unitsUsed.add(playerUnitId);
    if (won) {
      this.stats.battlesWon++;
      if (enemyUnitId === 'oortho') this.stats.oorthoDefeats++;
      this.addXP(50);
    } else {
      this.stats.battlesLost++;
      this.addXP(10); // Consolation XP
    }
    this.save();
    this.checkMissions();
  },

  recordChallenge(challengeId) {
    this.stats.challengesCompleted.add(challengeId);
    this.save();
    this.checkMissions();
  },

  checkMissions() {
    for (const m of MISSIONS) {
      if (this.missionsCompleted.has(m.id)) continue;
      try {
        if (m.check()) {
          this.missionsCompleted.add(m.id);
          this.addXP(m.xp);
          this.save();
          this.showMissionCompleteOverlay(m);
          return; // One at a time
        }
      } catch(e) {}
    }
  },

  showMissionCompleteOverlay(m) {
    setTimeout(() => {
      if (CS && CS.active) {
        setTimeout(() => this.showMissionCompleteOverlay(m), 2000);
        return;
      }
      const el = document.getElementById('modal');
      if (!el || el.style.display === 'flex') {
        setTimeout(() => this.showMissionCompleteOverlay(m), 1500);
        return;
      }
      el.style.display = 'flex';
      el.innerHTML = `<div class="m-box" style="border:2px solid #44ff88;width:420px;box-shadow:0 0 60px rgba(68,255,136,.25)">
        <div class="m-hdr" style="background:linear-gradient(90deg,#0d0e28,#0a2010);border-bottom:2px solid #44ff88">
          <div class="dot" style="width:10px;height:10px;background:#44ff88;box-shadow:0 0 12px #44ff88"></div>
          <span style="color:#44ff88;font-size:12px;font-weight:bold;letter-spacing:3px">MISSION COMPLETE</span>
        </div>
        <div class="m-body" style="text-align:center;padding:24px">
          <div style="font-size:14px;color:var(--text);font-weight:bold;letter-spacing:1px;margin-bottom:6px">${m.title}</div>
          <div style="font-size:9px;color:var(--dim);margin-bottom:16px">${m.desc}</div>
          <div style="font-size:18px;color:#44ff88;font-weight:bold;margin-bottom:16px">+${m.xp} XP</div>
          <button class="c-btn" style="background:#44ff88;color:#000;border:none;padding:8px 24px;font-size:10px;letter-spacing:2px;cursor:pointer;border-radius:3px" onclick="document.getElementById('modal').style.display='none';Progression.checkMissions();Progression.refreshNav()">CONTINUE</button>
        </div>
      </div>`;
    }, 2000);
  },

  getProgressPct() {
    const range = this.xpRange();
    if (range.next === range.base) return 100;
    return Math.min(100, Math.max(0, Math.round((this.xp - range.base) / (range.next - range.base) * 100)));
  },

  refreshNav() {
    // Re-render current tab's nav if on a rendered view
    if (typeof setTab === 'function' && S.tab) {
      // Don't re-render if modal is open
      const modal = document.getElementById('modal');
      if (!modal || modal.style.display !== 'flex') {
        const navEl = document.querySelector('.hdr');
        if (navEl) {
          // Update the progression bar element if it exists
          const bar = document.getElementById('prog-bar-fill');
          if (bar) bar.style.width = this.getProgressPct() + '%';
          const lvlEl = document.getElementById('prog-level');
          if (lvlEl) lvlEl.textContent = 'L' + this.level;
          const xpEl = document.getElementById('prog-xp');
          if (xpEl) xpEl.textContent = this.xp + '/' + this.xpRange().next;
          const rankEl = document.getElementById('prog-rank');
          if (rankEl) rankEl.textContent = this.rankTitle();
        }
      }
    }
  },

  reset() {
    this.level = 1;
    this.xp = 0;
    this.stats = {
      battlesWon: 0,
      battlesLost: 0,
      battlesTotal: 0,
      oorthoDefeats: 0,
      challengesCompleted: new Set(),
      unitsUsed: new Set(),
    };
    this.missionsCompleted = new Set();
    localStorage.removeItem(PROGRESSION_KEY);
    localStorage.removeItem(MISSIONS_KEY);
  },
};

// Build progression bar HTML for nav injection
function progressionBarHTML() {
  const pct = Progression.getProgressPct();
  const range = Progression.xpRange();
  return `<div style="display:flex;align-items:center;gap:8px;margin-right:4px;cursor:pointer" onclick="showMissions()" title="View missions and progress">
    <div style="display:flex;flex-direction:column;gap:1px;align-items:flex-end">
      <span id="prog-rank" style="font-size:8px;color:var(--acc);letter-spacing:1.5px;font-weight:bold">${Progression.rankTitle()}</span>
      <span id="prog-xp" style="font-size:7px;color:var(--dim)">${Progression.xp}/${range.next} XP</span>
    </div>
    <div style="width:60px;height:8px;background:#0a0d1a;border:1px solid var(--border);border-radius:2px;overflow:hidden;position:relative">
      <div id="prog-bar-fill" style="width:${pct}%;height:100%;background:linear-gradient(90deg,var(--acc),#ff66aa);transition:width .4s ease;box-shadow:0 0 8px var(--acc)"></div>
    </div>
    <span id="prog-level" style="font-size:11px;color:var(--acc);font-weight:bold;letter-spacing:1px">L${Progression.level}</span>
  </div>`;
}

// Missions overview panel
function showMissions() {
  const el = document.getElementById('modal');
  if (!el) return;
  const total = MISSIONS.length;
  const done = Progression.missionsCompleted.size;
  const range = Progression.xpRange();
  const pct = Progression.getProgressPct();

  const missionRows = MISSIONS.map(m => {
    const completed = Progression.missionsCompleted.has(m.id);
    const isChecked = completed;
    return `<div style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border-bottom:1px solid #0d1020;${completed ? 'opacity:1' : 'opacity:.7'}">
      <div style="font-size:14px;color:${completed ? '#44ff88' : '#3a4a70'};flex-shrink:0;margin-top:1px">${completed ? '\u2713' : '\u25CB'}</div>
      <div style="flex:1">
        <div style="font-size:10px;color:${completed ? 'var(--acc)' : 'var(--text)'};font-weight:bold;letter-spacing:1px;margin-bottom:2px">${m.title}</div>
        <div style="font-size:8px;color:var(--dim);line-height:1.5">${m.desc}</div>
      </div>
      <div style="font-size:9px;color:${completed ? '#44ff88' : 'var(--dim)'};font-weight:bold;flex-shrink:0">+${m.xp} XP</div>
    </div>`;
  }).join('');

  el.style.display = 'flex';
  el.innerHTML = `<div class="m-box" style="border:2px solid var(--acc);width:560px;max-height:88vh;display:flex;flex-direction:column;margin:auto;box-shadow:0 0 60px rgba(204,68,255,.25)">
    <div class="m-hdr" style="background:linear-gradient(90deg,#0d0e28,#1a1e40);border-bottom:2px solid var(--acc)">
      <div class="dot" style="width:10px;height:10px;background:var(--acc);box-shadow:0 0 12px var(--acc)"></div>
      <span style="color:var(--acc);font-size:12px;font-weight:bold;letter-spacing:3px">FORGE PROGRESS</span>
      <button onclick="document.getElementById('modal').style.display='none'" style="margin-left:auto;background:transparent;border:none;color:var(--dim);font-size:14px;cursor:pointer">\u2715</button>
    </div>
    <div style="padding:16px 18px;border-bottom:1px solid var(--border)">
      <div style="display:flex;align-items:center;gap:16px">
        <div style="text-align:center">
          <div style="font-size:32px;color:var(--acc);font-weight:bold;line-height:1;text-shadow:0 0 20px var(--acc)">L${Progression.level}</div>
          <div style="font-size:9px;color:var(--dim);letter-spacing:1px;margin-top:2px">${Progression.rankTitle()}</div>
        </div>
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <span style="font-size:8px;color:var(--dim);letter-spacing:1px">XP ${Progression.xp} / ${range.next}</span>
            <span style="font-size:8px;color:var(--dim);letter-spacing:1px">${pct}%</span>
          </div>
          <div style="width:100%;height:10px;background:#0a0d1a;border:1px solid var(--border);border-radius:2px;overflow:hidden">
            <div style="width:${pct}%;height:100%;background:linear-gradient(90deg,var(--acc),#ff66aa);transition:width .4s ease;box-shadow:0 0 8px var(--acc)"></div>
          </div>
          <div style="display:flex;gap:12px;margin-top:8px">
            <span style="font-size:8px;color:var(--dim)">Battles: ${Progression.stats.battlesTotal}</span>
            <span style="font-size:8px;color:#44ff88">Won: ${Progression.stats.battlesWon}</span>
            <span style="font-size:8px;color:var(--dim)">Missions: ${done}/${total}</span>
          </div>
        </div>
      </div>
    </div>
    <div style="overflow-y:auto;flex:1">${missionRows}</div>
    <div style="padding:10px 18px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:8px;color:var(--dim)">${done === total ? '\u2605 ALL MISSIONS COMPLETE — You are a Forge Lord!' : (total - done) + ' missions remaining'}</span>
      <button class="c-btn" style="background:var(--acc);color:#fff;border:none;padding:6px 16px;font-size:9px;letter-spacing:1px;cursor:pointer;border-radius:3px" onclick="document.getElementById('modal').style.display='none'">CLOSE</button>
    </div>
  </div>`;
}

// Load progression on script load
Progression.load();
