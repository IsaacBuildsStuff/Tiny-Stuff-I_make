// ================================================================
// CUTSCENE DATA
// ================================================================
const CUTSCENE_DATA = {
  story_reader: [
    { speaker:'OORTHO', col:'#cc44ff', portrait:'oortho', text:'You can read the glyphs now. Most who enter the Forge never reach this far.', duration:3000 },
  ],
  story_student: [
    { speaker:'OORTHO', col:'#cc44ff', portrait:'oortho', text:'You reshape the arcane structures with your own hand now. Curious.', duration:3000 },
  ],
  story_coder: [
    { speaker:'OORTHO', col:'#cc44ff', portrait:'oortho', text:'Full command of these constructions. You are no longer a visitor here.', duration:3200, effect:'shake' },
  ],
  story_master: [
    { speaker:'OORTHO', col:'#cc44ff', portrait:'oortho', text:'You have mastered the Forge\u2019s language completely.', duration:2800 },
    { speaker:'NARRATOR', col:'#4455aa', portrait:null, text:'The Arcane Sentinel steps aside. The Forge is yours to command.', duration:3600 },
  ],
  oortho_intro: [
    { speaker:'NARRATOR', col:'#4455aa', portrait:null,     text:'Somewhere deep in the Forge, the arcane matrix hums...', duration:1800 },
    { speaker:'OORTHO',   col:'#cc44ff', portrait:'oortho', text:'So. Another challenger stumbles into my domain.', duration:2800, effect:'shake' },
    { speaker:'OORTHO',   col:'#cc44ff', portrait:'oortho', text:'The Arcane Sentinel has not known defeat in a thousand cycles.', duration:3200 },
    { speaker:'PYROS',    col:'#ff5522', portrait:'pyros',  text:'Then today that changes.', duration:2000 },
  ],
  oortho_half_hp: [
    { speaker:'OORTHO',   col:'#cc44ff', portrait:'oortho', text:'Enough games. Feel the true weight of arcane power.', duration:2800, effect:'flash' },
  ],
  oortho_low_hp: [
    { speaker:'OORTHO',   col:'#cc44ff', portrait:'oortho', text:'Impossible... the Sentinel cannot... fall...', duration:3000, effect:'shake' },
  ],
  player_low_hp: [
    { speaker:'OORTHO',   col:'#cc44ff', portrait:'oortho', text:'Your flame gutters. Even fire bows to the arcane.', duration:2800 },
  ],
  player_sig: [
    { speaker:'OORTHO',   col:'#cc44ff', portrait:'oortho', text:'...A signature ability? You are more dangerous than anticipated.', duration:3000 },
  ],
  oortho_defeated: [
    { speaker:'OORTHO',   col:'#cc44ff', portrait:'oortho', text:'I... did not foresee this outcome. Well fought.', duration:3200 },
    { speaker:'NARRATOR', col:'#4455aa', portrait:null,     text:'The Arcane Sentinel falls. The Forge acknowledges a worthy combatant.', duration:4000 },
  ],
  player_defeated: [
    { speaker:'OORTHO',   col:'#cc44ff', portrait:'oortho', text:'The Forge has judged your lesson complete. Try again when you are ready.', duration:3200 },
    { speaker:'NARRATOR', col:'#4455aa', portrait:null,     text:'The fire flickers out. The lesson is not over yet.', duration:3600 },
  ],
  challenge_barrier: [
    { speaker:'OORTHO', col:'#cc44ff', portrait:'oortho', text:'Your signature is too slow to breach my barrier. Rewrite it.', duration:3200, effect:'flash' },
    { speaker:'NARRATOR', col:'#4455aa', portrait:null, text:'The battle pauses. The Forge awaits your JSON.', duration:2800 },
  ],
  challenge_barrier_won: [
    { speaker:'OORTHO', col:'#cc44ff', portrait:'oortho', text:'...You rewrote the construct mid-battle. Impressive.', duration:3000, effect:'shake' },
  ],
  challenge_hp_boost: [
    { speaker:'OORTHO', col:'#cc44ff', portrait:'oortho', text:'Your unit is too fragile. Patch it \u2014 if you know how.', duration:3000 },
    { speaker:'NARRATOR', col:'#4455aa', portrait:null, text:'A JSON terminal appears. The Forge holds its breath.', duration:2400 },
  ],
  challenge_hp_boost_won: [
    { speaker:'OORTHO', col:'#cc44ff', portrait:'oortho', text:'Better. The battle may yet turn in your favor.', duration:2800 },
  ],
  flv_1: [{ speaker:'OORTHO', col:'#cc44ff', portrait:'oortho', text:'Your patterns are predictable. Recalibrating...', duration:2400 }],
  flv_2: [{ speaker:'OORTHO', col:'#cc44ff', portrait:'oortho', text:'The arcane matrix is flawless. You cannot win.', duration:2800 }],
  flv_3: [{ speaker:'OORTHO', col:'#cc44ff', portrait:'oortho', text:'Interesting move. Insufficient, but interesting.', duration:2500 }],
  flv_4: [{ speaker:'PYROS',  col:'#ff5522', portrait:'pyros',  text:'The fire burns brighter the more you feed it.', duration:2400 }],
  flv_5: [{ speaker:'PYROS',  col:'#ff5522', portrait:'pyros',  text:'Keep pushing.', duration:1600 }],
  intro_welcome: [
    { speaker:'NARRATOR', col:'#4455aa', portrait:null, text:'The Forge awakens. Arcane energy crackles through ancient circuits...', duration:3000 },
    { speaker:'OORTHO',   col:'#cc44ff', portrait:'oortho', text:'A new forge-smith enters. Let us see if you can wield the JSON that binds this realm.', duration:4000, effect:'shake' },
    { speaker:'NARRATOR', col:'#4455aa', portrait:null, text:'Design units. Tune their stats. Watch them battle. Master the Forge.', duration:3000 },
  ],
  level_up: [
    { speaker:'NARRATOR', col:'#4455aa', portrait:null, text:'Your mastery of the Forge grows stronger.', duration:2400 },
  ],
};

const CS_FLAVOR = ['flv_1','flv_2','flv_3','flv_4','flv_5'];


// ================================================================
// CUTSCENE ENGINE
// ================================================================
const CS = {
  active: false, slides: [], idx: 0, phase: 'fadein', t: 0, charIdx: 0, alpha: 0,
  onDone: null, portraitT: 0,
  FADE: 650, CROSS: 300, TYPE: 24, HOLD: 1300,
};

function playCutscene(id, onDone) {
  if (CS.active) return;
  const slides = CUTSCENE_DATA[id];
  if (!slides) return;
  CS.active = true; CS.slides = slides; CS.idx = 0; CS.phase = 'fadein';
  CS.t = 0; CS.charIdx = 0; CS.alpha = 0; CS.portraitT = 0; CS.onDone = onDone || null;
  const el = document.getElementById('cs-overlay');
  if (el) { el.style.display = 'flex'; el.style.opacity = '0'; }
  csSetupSlide();
}

function csSetupSlide() {
  const slide = CS.slides[CS.idx];
  if (!slide) return;
  const spkEl = document.getElementById('cs-speaker');
  const textEl = document.getElementById('cs-text');
  const curEl = document.getElementById('cs-cursor');
  const bgEl = document.getElementById('cs-bg-glow');
  const dotsEl = document.getElementById('cs-dots');
  if (spkEl) { spkEl.textContent = slide.speaker; spkEl.style.color = slide.col || '#8899cc'; spkEl.style.textShadow = `0 0 22px ${slide.col || '#8899cc'}55`; }
  if (textEl) textEl.textContent = '';
  if (curEl) curEl.style.display = 'inline';
  if (bgEl) bgEl.style.background = `radial-gradient(ellipse 55% 90% at 18% 50%, ${slide.col || '#334488'}0d, transparent 70%)`;
  if (dotsEl) dotsEl.innerHTML = CS.slides.map((_, i) => `<div class="cs-dot${i === CS.idx ? ' on' : ''}"></div>`).join('');
  if (S.gs) { if (slide.effect === 'shake') S.gs.shake = Math.max(S.gs.shake, 9); if (slide.effect === 'flash') S.gs.flashOvl = { a: 0.45, col: slide.col || '#ffffff' }; }
  CS.charIdx = 0;
  csDrawPortrait(slide);
}

function csDrawPortrait(slide) {
  const canvas = document.getElementById('cs-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const CW = canvas.width, CH = canvas.height;
  ctx.clearRect(0, 0, CW, CH);
  ctx.fillStyle = '#010206'; ctx.fillRect(0, 0, CW, CH);
  if (!slide.portrait) { ctx.font = 'bold 30px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2a3460'; ctx.fillText('\u25C8', CW / 2, CH / 2); return; }
  const def = getDef(slide.portrait);
  if (!def) return;
  const sc2 = SCH[def.school] || SCH.arcane;
  const cx = CW / 2, cy = CH / 2, br = 34;
  const pulse = Math.sin(CS.portraitT * 0.003) * 0.5 + 0.5;
  const grad = ctx.createRadialGradient(cx, cy, br * 0.4, cx, cy, CW * 0.7);
  grad.addColorStop(0, def.color + '1a'); grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, CW, CH);
  const arms = (def.visual && def.visual.runeArms) || 4;
  const runeSpd = (def.visual && def.visual.runeSpeed) || 1;
  const runeAng = CS.portraitT * 0.001 * runeSpd;
  ctx.globalAlpha = 0.18; ctx.strokeStyle = def.color; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, br + 18, 0, PI2); ctx.stroke();
  for (let i = 0; i < arms; i++) { const ra = runeAng + (i / arms) * PI2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ra) * (br + 18), cy + Math.sin(ra) * (br + 18)); ctx.stroke(); }
  ctx.globalAlpha = 1;
  ctx.shadowColor = sc2.glow; ctx.shadowBlur = 20 + pulse * 16; ctx.fillStyle = def.color; ctx.globalAlpha = 0.92;
  ctx.beginPath(); ctx.arc(cx, cy, br, 0, PI2); ctx.fill();
  ctx.fillStyle = '#04050a'; ctx.globalAlpha = 0.82; ctx.beginPath(); ctx.arc(cx, cy, br * 0.65, 0, PI2); ctx.fill();
  ctx.fillStyle = sc2.glow; ctx.globalAlpha = 0.9; ctx.shadowBlur = 12 + pulse * 10; ctx.beginPath(); ctx.arc(cx, cy, br * 0.28, 0, PI2); ctx.fill();
  ctx.shadowBlur = 0; ctx.globalAlpha = 1;
}

function updateCutscene(dt) {
  if (!CS.active) return;
  CS.t += dt; CS.portraitT += dt;
  const slide = CS.slides[CS.idx];
  if (!slide) { endCutscene(); return; }
  csDrawPortrait(slide);
  const el = document.getElementById('cs-overlay');
  const diagEl = document.getElementById('cs-dialog');
  const textEl = document.getElementById('cs-text');
  const curEl = document.getElementById('cs-cursor');
  switch (CS.phase) {
    case 'fadein':
      CS.alpha = Math.min(1, CS.t / CS.FADE);
      if (el) el.style.opacity = CS.alpha;
      if (CS.t >= CS.FADE) { CS.phase = 'type'; CS.t = 0; }
      break;
    case 'type': {
      const ni = Math.min(slide.text.length, Math.floor(CS.t / CS.TYPE));
      if (ni !== CS.charIdx) { CS.charIdx = ni; if (textEl) textEl.textContent = slide.text.slice(0, CS.charIdx); }
      if (CS.charIdx >= slide.text.length) { CS.phase = 'hold'; CS.t = 0; if (curEl) curEl.style.display = 'none'; }
      break;
    }
    case 'hold':
      if (CS.t >= CS.HOLD + (slide.duration || 0)) { CS.phase = CS.idx + 1 < CS.slides.length ? 'crossout' : 'fadeout'; CS.t = 0; }
      break;
    case 'crossout':
      if (diagEl) diagEl.style.opacity = Math.max(0, 1 - CS.t / CS.CROSS);
      if (CS.t >= CS.CROSS) { CS.idx++; csSetupSlide(); CS.phase = 'crossin'; CS.t = 0; if (diagEl) diagEl.style.opacity = '0'; }
      break;
    case 'crossin':
      if (diagEl) diagEl.style.opacity = Math.min(1, CS.t / CS.CROSS);
      if (CS.t >= CS.CROSS) { if (diagEl) diagEl.style.opacity = '1'; CS.phase = 'type'; CS.t = 0; CS.charIdx = 0; if (curEl) curEl.style.display = 'inline'; }
      break;
    case 'fadeout':
      CS.alpha = Math.max(0, 1 - CS.t / CS.FADE);
      if (el) el.style.opacity = CS.alpha;
      if (CS.t >= CS.FADE) endCutscene();
      break;
  }
}

function endCutscene() {
  CS.active = false;
  const el = document.getElementById('cs-overlay');
  if (el) el.style.display = 'none';
  if (CS.onDone) { CS.onDone(); CS.onDone = null; }
}
