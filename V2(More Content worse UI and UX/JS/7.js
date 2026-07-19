// ================================================================
// PROGRESSION SYSTEM — Player XP, Levels, Missions & Unlocks
// ================================================================

const PROGRESSION_KEY = 'uf_progression_v1';
const MISSIONS_KEY = 'uf_missions_v1';
const UNITS_KEY = 'uf_units_v1';
const PRESTIGE_KEY = 'uf_prestige_v1';

// XP needed to reach next level (cumulative) - will be adjusted based on prestige
const BASE_XP_TABLE = [
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

// Prestige configuration
const PRESTIGE_CONFIG = {
  0: {
    name: 'NOVICE',
    stars: 0,
    maxLevel: 2,
    unlockedUnits: ['pyros', 'ironclad', 'oortho'],
    lessonSet: null,
    features: {
      roster: true,
      editor: false,
      editorIdentity: false,
      editorVisuals: false,
      editorMagic: false,
      editorMagicHalf: false,
      editorMelee: false,
      editorRanged: false,
      editorBehavior: false,
      passives: false,
      exportJson: false,
      newUnit: false,
    }
  },
  1: {
    name: 'APPRENTICE',
    stars: 1,
    maxLevel: 3,
    unlockedUnits: ['glacius'],
    lessonSet: null,
    features: {
      roster: true,
      editor: true,
      editorIdentity: true,
      editorVisuals: false,
      editorMagic: false,
      editorMagicHalf: false,
      editorMelee: false,
      editorRanged: false,
      editorBehavior: false,
      passives: false,
      exportJson: false,
      newUnit: false,
    }
  },
  2: {
    name: 'INITIATE',
    stars: 2,
    maxLevel: 4,
    unlockedUnits: ['shade'],
    lessonSet: 'prestige_2',
    features: {
      roster: true,
      editor: true,
      editorIdentity: true,
      editorVisuals: true,
      editorMagic: false,
      editorMagicHalf: false,
      editorMelee: false,
      editorRanged: false,
      editorBehavior: false,
      passives: false,
      exportJson: false,
      newUnit: false,
    }
  },
  3: {
    name: 'ADEPT',
    stars: 3,
    maxLevel: 5,
    unlockedUnits: ['rifter'],
    lessonSet: 'prestige_3',
    features: {
      roster: true,
      editor: true,
      editorIdentity: true,
      editorVisuals: true,
      editorMagic: false,
      editorMagicHalf: true,
      editorMelee: false,
      editorRanged: false,
      editorBehavior: false,
      passives: false,
      exportJson: false,
      newUnit: false,
    }
  },
  4: {
    name: 'VETERAN',
    stars: 4,
    maxLevel: 6,
    unlockedUnits: ['templar'],
    lessonSet: 'prestige_4',
    features: {
      roster: true,
      editor: true,
      editorIdentity: true,
      editorVisuals: true,
      editorMagic: true,
      editorMagicHalf: false,
      editorMelee: false,
      editorRanged: false,
      editorBehavior: false,
      passives: false,
      exportJson: false,
      newUnit: false,
    }
  },
  5: {
    name: 'EXPERT',
    stars: 5,
    maxLevel: 7,
    unlockedUnits: ['voidmage'],
    lessonSet: 'prestige_5',
    features: {
      roster: true,
      editor: true,
      editorIdentity: true,
      editorVisuals: true,
      editorMagic: true,
      editorMagicHalf: false,
      editorMelee: true,
      editorRanged: false,
      editorBehavior: false,
      passives: false,
      exportJson: false,
      newUnit: false,
    }
  },
  6: {
    name: 'MASTER',
    stars: 6,
    maxLevel: 8,
    unlockedUnits: ['stormcaller'],
    lessonSet: 'prestige_6',
    features: {
      roster: true,
      editor: true,
      editorIdentity: true,
      editorVisuals: true,
      editorMagic: true,
      editorMagicHalf: false,
      editorMelee: true,
      editorRanged: false,
      editorBehavior: false,
      passives: true,
      exportJson: false,
      newUnit: false,
    }
  },
  7: {
    name: 'GRANDMASTER',
    stars: 7,
    maxLevel: 9,
    unlockedUnits: ['warden'],
    lessonSet: 'prestige_7',
    features: {
      roster: true,
      editor: true,
      editorIdentity: true,
      editorVisuals: true,
      editorMagic: true,
      editorMagicHalf: false,
      editorMelee: true,
      editorRanged: false,
      editorBehavior: false,
      passives: true,
      exportJson: true,
      newUnit: false,
    }
  },
  8: {
    name: 'ARCHMAGE',
    stars: 8,
    maxLevel: 10,
    unlockedUnits: ['hexblade'],
    lessonSet: 'prestige_8',
    features: {
      roster: true,
      editor: true,
      editorIdentity: true,
      editorVisuals: true,
      editorMagic: true,
      editorMagicHalf: false,
      editorMelee: true,
      editorRanged: false,
      editorBehavior: false,
      passives: true,
      exportJson: true,
      newUnit: false,
    }
  },
  9: {
    name: 'FORGE LORD',
    stars: 9,
    maxLevel: 10,
    unlockedUnits: ['gunner'],
    lessonSet: 'prestige_9',
    features: {
      roster: true,
      editor: true,
      editorIdentity: true,
      editorVisuals: true,
      editorMagic: true,
      editorMagicHalf: false,
      editorMelee: true,
      editorRanged: true,
      editorBehavior: false,
      passives: true,
      exportJson: true,
      newUnit: true,
    }
  },
  10: {
    name: 'LEGEND',
    stars: 10,
    maxLevel: 10,
    unlockedUnits: ['berserker'],
    lessonSet: 'prestige_10',
    features: {
      roster: true,
      editor: true,
      editorIdentity: true,
      editorVisuals: true,
      editorMagic: true,
      editorMagicHalf: false,
      editorMelee: true,
      editorRanged: true,
      editorBehavior: false,
      passives: true,
      exportJson: true,
      newUnit: true,
    }
  },
  11: {
    name: 'MYTHIC',
    stars: 11,
    maxLevel: 10,
    unlockedUnits: ['tempus'],
    lessonSet: 'prestige_11',
    features: {
      roster: true,
      editor: true,
      editorIdentity: true,
      editorVisuals: true,
      editorMagic: true,
      editorMagicHalf: false,
      editorMelee: true,
      editorRanged: true,
      editorBehavior: true,
      passives: true,
      exportJson: true,
      newUnit: true,
    }
  },
  12: {
    name: 'TRANSCENDENT',
    stars: 12,
    maxLevel: 10,
    unlockedUnits: ['glitch1'],
    lessonSet: 'prestige_12',
    features: {
      roster: true,
      editor: true,
      editorIdentity: true,
      editorVisuals: true,
      editorMagic: true,
      editorMagicHalf: false,
      editorMelee: true,
      editorRanged: true,
      editorBehavior: true,
      passives: true,
      exportJson: true,
      newUnit: true,
    }
  },
  13: {
    name: 'ETERNAL',
    stars: 13,
    maxLevel: 10,
    unlockedUnits: ['glitch2'],
    lessonSet: null,
    features: {
      roster: true,
      editor: true,
      editorIdentity: true,
      editorVisuals: true,
      editorMagic: true,
      editorMagicHalf: false,
      editorMelee: true,
      editorRanged: true,
      editorBehavior: true,
      passives: true,
      exportJson: true,
      newUnit: true,
    }
  }
};

// Lesson sets per prestige (separate lists for flexible sizing)
const LESSON_SETS = {
  prestige_2: ['intro', 'objects', 'types', 'arrays', 'nested', 'errors', 'schema', 'paths', 'spells', 'modify', 'ai_config', 'import'],  // 12 lessons
  prestige_3: ['p3_01', 'p3_02', 'p3_03', 'p3_04', 'p3_05', 'p3_06', 'p3_07', 'p3_08', 'p3_09', 'p3_10', 'p3_11', 'p3_12'],  // 12 lessons
  prestige_4: ['p4_01', 'p4_02', 'p4_03', 'p4_04', 'p4_05', 'p4_06', 'p4_07', 'p4_08', 'p4_09', 'p4_10', 'p4_11', 'p4_12'],  // 12 lessons
  prestige_5: ['p5_01', 'p5_02', 'p5_03', 'p5_04', 'p5_05', 'p5_06', 'p5_07', 'p5_08', 'p5_09', 'p5_10', 'p5_11', 'p5_12'],  // 12 lessons
  prestige_6: ['p6_01', 'p6_02', 'p6_03', 'p6_04', 'p6_05', 'p6_06', 'p6_07', 'p6_08', 'p6_09', 'p6_10', 'p6_11', 'p6_12'],  // 12 lessons
  prestige_7: ['p7_01', 'p7_02', 'p7_03', 'p7_04', 'p7_05', 'p7_06', 'p7_07', 'p7_08', 'p7_09', 'p7_10', 'p7_11', 'p7_12'],  // 12 lessons
  prestige_8: ['p8_01', 'p8_02', 'p8_03', 'p8_04', 'p8_05', 'p8_06', 'p8_07', 'p8_08', 'p8_09', 'p8_10', 'p8_11', 'p8_12'],  // 12 lessons
  prestige_9: ['p9_01', 'p9_02', 'p9_03', 'p9_04', 'p9_05', 'p9_06', 'p9_07', 'p9_08', 'p9_09', 'p9_10', 'p9_11', 'p9_12'],  // 12 lessons
  prestige_10: ['p10_01', 'p10_02', 'p10_03', 'p10_04', 'p10_05', 'p10_06', 'p10_07', 'p10_08', 'p10_09', 'p10_10', 'p10_11', 'p10_12'], // 12 lessons
  prestige_11: ['p11_01', 'p11_02', 'p11_03', 'p11_04', 'p11_05', 'p11_06', 'p11_07', 'p11_08', 'p11_09', 'p11_10', 'p11_11', 'p11_12'], // 12 lessons
  prestige_12: ['p12_01', 'p12_02', 'p12_03', 'p12_04', 'p12_05', 'p12_06', 'p12_07', 'p12_08', 'p12_09', 'p12_10', 'p12_11', 'p12_12', 'p12_13', 'p12_14', 'p12_15', 'p12_16', 'p12_17', 'p12_18', 'p12_19', 'p12_20', 'p12_21', 'p12_22', 'p12_23', 'p12_24'], // 24 lessons
};

// Get XP table based on current prestige level
function getXPTable(prestigeLevel) {
  const config = PRESTIGE_CONFIG[prestigeLevel] || PRESTIGE_CONFIG[0];
  const maxLevel = config.maxLevel;
  return BASE_XP_TABLE.slice(0, maxLevel + 1);
}

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
  prestigeLevel: 0,
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

  get currentConfig() {
    return PRESTIGE_CONFIG[this.prestigeLevel] || PRESTIGE_CONFIG[0];
  },

  get maxLevel() {
    return this.currentConfig.maxLevel;
  },

  get xpTable() {
    return getXPTable(this.prestigeLevel);
  },

  get stars() {
    return this.currentConfig.stars;
  },

  get prestigeName() {
    return this.currentConfig.name;
  },

  canPrestige() {
    return this.level >= this.maxLevel;
  },

  prestige() {
    if (!this.canPrestige() || this.prestigeLevel >= 13) return false;
    
    this.prestigeLevel++;
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
    this.missionsCompleted.clear();
    
    this.save();
    return true;
  },

  getUnlockedUnits() {
    const unlocked = new Set();
    for (let i = 0; i <= this.prestigeLevel; i++) {
      const config = PRESTIGE_CONFIG[i];
      if (config && config.unlockedUnits) {
        config.unlockedUnits.forEach(u => unlocked.add(u));
      }
    }
    return Array.from(unlocked);
  },

  isFeatureUnlocked(feature) {
    return this.currentConfig.features[feature] === true;
  },

  getAvailableLessonSet() {
    return this.currentConfig.lessonSet;
  },

  getUnlockedLessons() {
    const unlocked = new Set();
    for (let i = 0; i <= this.prestigeLevel; i++) {
      const config = PRESTIGE_CONFIG[i];
      if (config && config.lessonSet && LESSON_SETS[config.lessonSet]) {
        LESSON_SETS[config.lessonSet].forEach(lessonId => unlocked.add(lessonId));
      }
    }
    return Array.from(unlocked);
  },

  applyPrestigeToUnits() {
    const unlocked = new Set(this.getUnlockedUnits());
    S.units = S.units.filter(u => unlocked.has(u.id) || (u.id||'').startsWith('c_'));
    const ids = S.units.map(u => u.id);
    if (!ids.includes(S.selected[0])) S.selected[0] = ids[0] || 'pyros';
    if (!ids.includes(S.selected[1])) S.selected[1] = ids[Math.min(1,ids.length-1)] || ids[0];
    if(S.editingId && !ids.includes(S.editingId)) S.editingId = ids[0]||null;
  },

  showPrestigeReadyOverlay() {
    const next = PRESTIGE_CONFIG[this.prestigeLevel + 1];
    if (!next) return;
    const el = document.getElementById('modal');
    if (!el) return;
    const newUnits = next.unlockedUnits||[];
    const newFeats = Object.entries(next.features||{}).filter(([k,v])=>v&&!this.currentConfig.features[k]).map(([k])=>({
      roster:'Roster tab',editor:'Editor tab',editorIdentity:'Identity editor',
      editorVisuals:'Visuals editor',editorMagic:'Full magic editor',editorMagicHalf:'Magic editor (basic)',
      editorMelee:'Melee editor',editorRanged:'Ranged editor',editorBehavior:'Behavior editor',
      passives:'Passive abilities',exportJson:'Export JSON',newUnit:'Create new units'
    }[k]||k)).filter(Boolean);
    el.style.display = 'flex';
    el.innerHTML = `<div class="m-box" style="border:2px solid #ffcc44;width:460px;box-shadow:0 0 80px rgba(255,204,68,.3)">
      <div class="m-hdr" style="background:linear-gradient(90deg,#1a1200,#201800);border-bottom:2px solid #ffcc44">
        <span style="font-size:20px">★</span>
        <span style="color:#ffcc44;font-size:13px;font-weight:bold;letter-spacing:3px">PRESTIGE READY</span>
      </div>
      <div class="m-body" style="text-align:center;padding:24px">
        <div style="font-size:11px;color:#ffcc44;letter-spacing:2px;margin-bottom:4px">${'★'.repeat(this.prestigeLevel+1)}</div>
        <div style="font-size:18px;color:var(--text);font-weight:bold;letter-spacing:2px;margin-bottom:8px">${next.name}</div>
        <div style="font-size:9px;color:var(--dim);margin-bottom:18px;line-height:1.6">You've reached the level cap for this prestige tier.<br>Reset your progress to ascend to the next rank.</div>
        ${newUnits.length?`<div style="margin-bottom:14px"><div style="font-size:8px;color:#ffcc44;letter-spacing:2px;margin-bottom:6px">NEW UNIT UNLOCKED</div><div style="font-size:14px;color:var(--acc);font-weight:bold;letter-spacing:2px">${newUnits.join(', ').toUpperCase()}</div></div>`:''}
        ${newFeats.length?`<div style="margin-bottom:18px"><div style="font-size:8px;color:#44ffaa;letter-spacing:2px;margin-bottom:6px">NEW FEATURES</div>${newFeats.map(f=>`<div style="font-size:9px;color:#6688aa;padding:2px 0">✓ ${f}</div>`).join('')}</div>`:''}
        <div style="font-size:8px;color:#443a10;margin-bottom:18px">⚠ Resets: level, XP, battles, missions · Keeps: prestige, custom units</div>
        <div style="display:flex;gap:10px;justify-content:center">
          <button onclick="document.getElementById('modal').style.display='none'" style="background:transparent;border:1px solid var(--border);color:var(--dim);padding:7px 18px;font-size:10px;font-family:monospace;border-radius:3px;cursor:pointer">NOT YET</button>
          <button onclick="Progression.doPrestige()" style="background:linear-gradient(135deg,#201400,#301c00);border:2px solid #ffcc44;color:#ffcc44;padding:7px 18px;font-size:10px;font-family:monospace;border-radius:3px;cursor:pointer;font-weight:bold">★ PRESTIGE</button>
        </div>
      </div>
    </div>`;
  },

  doPrestige() {
    if (!this.prestige()) return;
    document.getElementById('modal').style.display = 'none';
    this.applyPrestigeToUnits();
    if (typeof renderBattle === 'function') renderBattle();
    else if (typeof setTab === 'function') setTab('battle');
    // Celebrate
    const t = document.createElement('div');
    t.className = 'unlock-toast';
    t.style.cssText = 'border-color:#ffcc44;box-shadow:0 0 60px rgba(255,204,68,.4)';
    t.innerHTML = `<div style="font-size:9px;color:#ffcc44;letter-spacing:3px;margin-bottom:6px">PRESTIGE ★</div><div style="font-size:22px;margin:4px 0">${'★'.repeat(this.prestigeLevel)}</div><div style="font-size:14px;color:var(--acc);letter-spacing:2px;font-weight:bold">${this.prestigeName}</div>`;
    document.body.appendChild(t);
    setTimeout(()=>{t.style.transition='opacity .4s';t.style.opacity='0';setTimeout(()=>t.remove(),400);},2200);
  },

  load() {
    try {
      const data = JSON.parse(localStorage.getItem(PROGRESSION_KEY) || '{}');
      if (data.prestigeLevel !== undefined) this.prestigeLevel = data.prestigeLevel;
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
    this.applyPrestigeToUnits();
  },

  save() {
    try {
      localStorage.setItem(PROGRESSION_KEY, JSON.stringify({
        prestigeLevel: this.prestigeLevel,
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
    const table = this.xpTable;
    if (this.level >= table.length) return 0;
    return table[this.level] - this.xp;
  },

  xpForCurrent() {
    const table = this.xpTable;
    if (this.level <= 1) return this.xp;
    return this.xp - table[this.level - 1];
  },

  xpRange() {
    const table = this.xpTable;
    if (this.level <= 1) return { base: 0, next: table[1] || 100 };
    if (this.level >= table.length) return { base: table[table.length-1], next: table[table.length-1] };
    return { base: table[this.level - 1], next: table[this.level] };
  },

  rankTitle() {
    return RANK_TITLES[Math.min(this.level - 1, RANK_TITLES.length - 1)];
  },

  addXP(amount) {
    if (amount <= 0) return;
    this.xp += amount;
    const table = this.xpTable;
    let leveledUp = false;
    while (this.level < this.maxLevel && this.level < table.length && this.xp >= table[this.level]) {
      this.level++;
      leveledUp = true;
    }
    if (this.level > this.maxLevel) this.level = this.maxLevel;
    this.save();
    if (leveledUp) this._triggerLevelUp();
    this.checkMissions();
  },

  _triggerLevelUp() {
    this._levelUpPending = true;
    setTimeout(() => {
      if (CS && CS.active) { setTimeout(() => this._triggerLevelUp(), 2000); return; }
      this._levelUpPending = false;
      if (this.canPrestige() && this.prestigeLevel < 13) {
        this.showPrestigeReadyOverlay();
      } else {
        this.showLevelUpOverlay();
      }
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
        <div style="font-size:9px;color:#4455aa;letter-spacing:2px;margin-bottom:4px">${'★'.repeat(this.prestigeLevel)||'–'}</div>
        <div style="font-size:48px;color:var(--acc);text-shadow:0 0 30px var(--acc);font-weight:bold;line-height:1;margin-bottom:8px">L${this.level}</div>
        <div style="font-size:14px;color:var(--text);letter-spacing:2px;font-weight:bold;margin-bottom:4px">${this.rankTitle()}</div>
        <div style="font-size:9px;color:var(--dim);margin-bottom:20px">${this.prestigeName} · Prestige ${this.prestigeLevel}</div>
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

  fullReset() {
    this.prestigeLevel = 0;
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
    localStorage.removeItem(UNITS_KEY);
    JsonFreedom.reset();
    this.applyPrestigeToUnits();
  },
};

// Build progression bar HTML for nav injection
function progressionBarHTML() {
  const pct = Progression.getProgressPct();
  const range = Progression.xpRange();
  const p = Progression.prestigeLevel;
  const maxLvl = Progression.maxLevel;
  const atCap = Progression.level >= maxLvl;
  const stars = p > 0 ? '<span style="color:#ffcc44;font-size:9px;letter-spacing:1px">' + '★'.repeat(p) + '</span>' : '';
  const capBadge = atCap && p < 13
    ? '<span style="font-size:7px;color:#ffcc44;letter-spacing:1px;cursor:pointer;animation:dotPulse 1s infinite" onclick="Progression.showPrestigeReadyOverlay()">PRESTIGE READY</span>'
    : '';
  return `<div style="display:flex;align-items:center;gap:8px;margin-right:4px;cursor:pointer" onclick="showMissions()" title="Prestige ${p} · ${Progression.prestigeName}">
    <div style="display:flex;flex-direction:column;gap:1px;align-items:flex-end">
      <span id="prog-rank" style="font-size:8px;color:var(--acc);letter-spacing:1.5px;font-weight:bold">${Progression.prestigeName}</span>
      <span id="prog-xp" style="font-size:7px;color:var(--dim)">${stars||('L'+Progression.level+'/'+maxLvl)} · ${Progression.xp} XP</span>
    </div>
    <div style="width:60px;height:8px;background:#0a0d1a;border:1px solid ${atCap?'#ffcc4488':'var(--border)'};border-radius:2px;overflow:hidden;position:relative">
      <div id="prog-bar-fill" style="width:${pct}%;height:100%;background:linear-gradient(90deg,${atCap?'#ffcc44':'var(--acc)'},${atCap?'#ff8800':'#ff66aa'});transition:width .4s ease;box-shadow:0 0 8px ${atCap?'#ffcc44':'var(--acc)'}"></div>
    </div>
    <span id="prog-level" style="font-size:11px;color:${atCap?'#ffcc44':'var(--acc)'};font-weight:bold;letter-spacing:1px">${atCap&&p<13?'★':'L'+Progression.level}</span>
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
      <div style="display:flex;gap:8px">
        <button class="c-btn" style="background:transparent;border:1px solid #ff4455;color:#ff4455;padding:6px 12px;font-size:9px;letter-spacing:1px;cursor:pointer;border-radius:3px" onclick="Progression.fullReset();location.reload()">FULL RESET</button>
        <button class="c-btn" style="background:var(--acc);color:#fff;border:none;padding:6px 16px;font-size:9px;letter-spacing:1px;cursor:pointer;border-radius:3px" onclick="document.getElementById('modal').style.display='none'">CLOSE</button>
      </div>
    </div>
  </div>`;
}

// Prestige menu overlay
function showPrestigeMenu() {
  const el = document.getElementById('modal');
  if (!el) return;
  const current = Progression.prestigeLevel;
  const unlockedUnits = Progression.getUnlockedUnits();
  const unlockedLessons = Progression.getUnlockedLessons();

  const tiersHtml = Object.entries(PRESTIGE_CONFIG).map(([tier, config]) => {
    const tierNum = parseInt(tier);
    const isUnlocked = tierNum <= current;
    const isCurrent = tierNum === current;
    const isNext = tierNum === current + 1;
    const canPrestigeTo = Progression.canPrestige() && isNext;

    const unitsHtml = config.unlockedUnits.map(u => {
      const def = getDef(u);
      return def ? `<span style="color:${def.color};font-weight:bold">${def.name}</span>` : u;
    }).join(', ');

    const featuresHtml = Object.entries(config.features)
      .filter(([k, v]) => v)
      .map(([k]) => ({
        roster:'Roster',editor:'Editor',editorIdentity:'Identity',editorVisuals:'Visuals',
        editorMagic:'Full Magic',editorMagicHalf:'Magic (Basic)',editorMelee:'Melee',
        editorRanged:'Ranged',editorBehavior:'Behavior',passives:'Passives',
        exportJson:'Export JSON',newUnit:'New Unit'
      }[k] || k))
      .join(', ');

    return `<div class="prestige-tier ${isCurrent ? 'current' : ''} ${isUnlocked ? 'unlocked' : 'locked'}" style="
      padding: 12px 14px;
      margin-bottom: 8px;
      border: 1px solid ${isCurrent ? '#ffcc44' : isUnlocked ? 'var(--border)' : '#1a1a2a'};
      border-radius: 4px;
      background: ${isCurrent ? 'rgba(255,204,68,0.08)' : isUnlocked ? 'var(--panel)' : '#0a0a12'};
      ${isCurrent ? 'box-shadow: 0 0 12px rgba(255,204,68,0.15);' : ''}
    ">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <span style="font-size:14px;color:${isUnlocked ? '#ffcc44' : '#3a3a4a'}">${'★'.repeat(tierNum) || '–'}</span>
        <span style="font-size:11px;color:${isUnlocked ? 'var(--text)' : 'var(--dim)'};font-weight:bold;letter-spacing:2px">${config.name}</span>
        ${isCurrent ? '<span style="margin-left:auto;font-size:7px;color:#ffcc44;background:#1a1200;padding:2px 6px;border-radius:2px;border:1px solid #ffcc4444">CURRENT</span>' : ''}
        ${canPrestigeTo ? '<button onclick="Progression.doPrestige()" style="margin-left:auto;background:linear-gradient(135deg,#201400,#301c00);border:1px solid #ffcc44;color:#ffcc44;padding:4px 10px;font-size:8px;font-family:monospace;border-radius:2px;cursor:pointer;font-weight:bold">★ ASCEND</button>' : ''}
      </div>
      <div style="font-size:8px;color:var(--dim);margin-bottom:4px">Level Cap: ${config.maxLevel} · Stars: ${config.stars}</div>
      ${config.unlockedUnits.length ? `<div style="font-size:8px;color:${isUnlocked ? 'var(--text)' : 'var(--dim)'};margin-bottom:4px"><span style="color:#8899ff">Unit:</span> ${unitsHtml}</div>` : ''}
      ${featuresHtml ? `<div style="font-size:8px;color:${isUnlocked ? 'var(--text)' : 'var(--dim)'}"><span style="color:#44aaff">Features:</span> ${featuresHtml}</div>` : ''}
    </div>`;
  }).join('');

  el.style.display = 'flex';
  el.innerHTML = `<div class="m-box" style="border:2px solid #ffcc44;width:620px;max-height:90vh;display:flex;flex-direction:column;margin:auto;box-shadow:0 0 80px rgba(255,204,68,.25)">
    <div class="m-hdr" style="background:linear-gradient(90deg,#1a1200,#201800);border-bottom:2px solid #ffcc44">
      <div class="dot" style="width:10px;height:10px;background:#ffcc44;box-shadow:0 0 12px #ffcc44"></div>
      <span style="color:#ffcc44;font-size:12px;font-weight:bold;letter-spacing:3px">PRESTIGE TIERS</span>
      <button onclick="document.getElementById('modal').style.display='none'" style="margin-left:auto;background:transparent;border:none;color:var(--dim);font-size:14px;cursor:pointer">\u2715</button>
    </div>
    <div style="padding:16px 18px;border-bottom:1px solid var(--border)">
      <div style="display:flex;align-items:center;gap:16px">
        <div style="text-align:center">
          <div style="font-size:36px;color:#ffcc44;font-weight:bold;line-height:1;text-shadow:0 0 20px rgba(255,204,68,0.5)">${'★'.repeat(current) || '–'}</div>
          <div style="font-size:9px;color:var(--dim);letter-spacing:1px;margin-top:4px">${Progression.prestigeName}</div>
        </div>
        <div style="flex:1">
          <div style="font-size:10px;color:var(--text);margin-bottom:4px">Current Prestige Level: <span style="color:#ffcc44;font-weight:bold">${current}</span> / 13</div>
          <div style="font-size:8px;color:var(--dim);margin-bottom:2px">Level: ${Progression.level} / ${Progression.maxLevel}</div>
          <div style="font-size:8px;color:var(--dim)">XP: ${Progression.xp} / ${Progression.xpRange().next}</div>
        </div>
      </div>
    </div>
    <div style="overflow-y:auto;flex:1;padding:16px 18px">${tiersHtml}</div>
    <div style="padding:10px 18px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
      <button class="c-btn" style="background:transparent;border:1px solid #ff4455;color:#ff4455;padding:6px 12px;font-size:9px;letter-spacing:1px;cursor:pointer;border-radius:3px" onclick="Progression.fullReset();location.reload()">FULL RESET</button>
      <button class="c-btn" style="background:var(--acc);color:#fff;border:none;padding:6px 16px;font-size:9px;letter-spacing:1px;cursor:pointer;border-radius:3px" onclick="document.getElementById('modal').style.display='none'">CLOSE</button>
    </div>
  </div>`;
}

// Load progression on script load
Progression.load();
