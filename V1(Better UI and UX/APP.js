// ================================================================
// MATH
// ================================================================
function getLineColFromPos(text, pos) {
  const lines = text.substring(0, pos).split('\n');
  return {
    line: lines.length,
    col: lines[lines.length - 1].length + 1
  };
}

function parseJsonError(err, text) {
  let line = 1, col = 1;
  let match = err.message.match(/line (\d+) column (\d+)/);
  if (match) {
    line = parseInt(match[1], 10);
    col = parseInt(match[2], 10);
  } else {
    match = err.message.match(/position (\d+)/);
    if (match) {
      const pos = parseInt(match[1], 10);
      const coords = getLineColFromPos(text, pos);
      line = coords.line;
      col = coords.col;
    }
  }
  return { message: err.message, line, col };
}

const PI2=Math.PI*2;
const lerp=(a,b,t)=>a+(b-a)*t;
const ed=(ax,ay,bx,by)=>Math.hypot(bx-ax,by-ay);
const ea=(ax,ay,bx,by)=>Math.atan2(by-ay,bx-ax);
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const rnd=(lo,hi)=>lo+Math.random()*(hi-lo);
const rndA=()=>Math.random()*PI2;
const dc=o=>JSON.parse(JSON.stringify(o));
function dset(obj,path,val){const k=path.split('.');let o=obj;for(let i=0;i<k.length-1;i++){if(!o[k[i]])o[k[i]]={};o=o[k[i]];}o[k[k.length-1]]=val;}
function dget(obj,path){return path.split('.').reduce((o,k)=>o&&o[k]!==undefined?o[k]:undefined,obj);}
function deepMerge(t,s){if(!s)return t;for(const k in s){if(s[k]&&typeof s[k]==='object'&&!Array.isArray(s[k])){if(!t[k]||typeof t[k]!=='object')t[k]={};deepMerge(t[k],s[k]);}else if(s[k]!==undefined)t[k]=s[k];}return t;}

// ================================================================
// MAGIC SCHOOLS
// ================================================================
const SCH={
  fire:    {color:'#ff5522',glow:'#ff2200',trail:'#ff8844',name:'FIRE'},
  frost:   {color:'#44ccff',glow:'#0088ff',trail:'#aaeeff',name:'FROST'},
  storm:   {color:'#ffee33',glow:'#ffaa00',trail:'#ffff88',name:'STORM'},
  arcane:  {color:'#cc44ff',glow:'#8800ff',trail:'#dd88ff',name:'ARCANE'},
  void:    {color:'#9933cc',glow:'#550088',trail:'#bb66ee',name:'VOID'},
  nature:  {color:'#44ff66',glow:'#008833',trail:'#88ffaa',name:'NATURE'},
  shadow:  {color:'#aa44cc',glow:'#660077',trail:'#cc88dd',name:'SHADOW'},
  holy:    {color:'#ffee88',glow:'#ffcc00',trail:'#ffffcc',name:'HOLY'},
  blood:   {color:'#ff3355',glow:'#cc0033',trail:'#ff8899',name:'BLOOD'},
  time:    {color:'#66ffcc',glow:'#00cc88',trail:'#aaffee',name:'TIME'},
  ice:     {color:'#88ddff',glow:'#0055aa',trail:'#cceeff',name:'ICE'},
  rune:    {color:'#8899ff',glow:'#4455cc',trail:'#bbccff',name:'RUNE'},
};

// ================================================================
// STATUS EFFECTS
// ================================================================
const STATUS_DEFS={
  none:    {color:'#888',name:'NONE',desc:'No effect'},
  burn:    {color:'#ff4400',name:'BURN',desc:'Damage over time, fire damage'},
  freeze:  {color:'#44ccff',name:'FREEZE',desc:'Slows movement, amplifies damage taken'},
  shock:   {color:'#ffee00',name:'SHOCK',desc:'Amplifies next hit damage by 40%'},
  poison:  {color:'#44ff44',name:'POISON',desc:'Damage over time, nature damage'},
  weaken:  {color:'#cc88ff',name:'WEAKEN',desc:'Reduces damage dealt by target'},
  bleed:   {color:'#ff3355',name:'BLEED',desc:'Damage over time, physical damage'},
  slow:    {color:'#8888ff',name:'SLOW',desc:'Greatly reduces movement speed'},
  taunt:   {color:'#ffaa44',name:'TAUNT',desc:'Forces aggressive approach'},
  barrier: {color:'#88aaff',name:'BARRIER',desc:'Absorbs incoming damage'},
  regen:   {color:'#44ffaa',name:'REGEN',desc:'Regenerates HP over time'},
  rage:    {color:'#ff2244',name:'RAGE',desc:'Increases damage dealt, reduces HP regen'},
};
const STATUS_N=Object.keys(STATUS_DEFS);
const SFX_COL={burn:'#ff4400',freeze:'#44ccff',shock:'#ffee00',poison:'#44ff44',weaken:'#cc88ff',bleed:'#ff3355',slow:'#8888ff',taunt:'#ffaa44',barrier:'#88aaff',regen:'#44ffaa',rage:'#ff2244'};

// ================================================================
// WEAPONS / AMMO
// ================================================================
const WEAPON_N=['sword','axe','hammer','dagger','spear','fist','claws','staff','whip','scythe'];
const AMMO_N=['bolt','arrow','explosive','seeking','pellet','needle','javelin','boomerang'];
const MOVE_N=['orbit','kite','charge','erratic','random','stationary','strafe','aggressive'];
const PAT_N=['single','spread','wave','spiral','pulse','fan','burst','ring','random'];
const SIG_N=['none','nova','beam','barrage','zone','summon','chain','meteor'];
const STANCE_N=['balanced','aggressive','defensive','sniper','berserk','cunning','duelist','coward','guardian','trickster'];

// ================================================================
// PASSIVE ABILITY LIBRARY
// ================================================================
const PASSIVES={
  none:       {name:'NONE',      desc:'No passive',                                   applyFn:null},
  thorns:     {name:'THORNS',    desc:'Returns 25% of melee damage received',         applyFn:'thorns'},
  vampiric:   {name:'VAMPIRIC',  desc:'Heal 15% of all damage dealt',                 applyFn:'vampiric'},
  berserker:  {name:'BERSERKER', desc:'Deal 10% more damage per 10% HP missing',      applyFn:'berserker'},
  fortress:   {name:'FORTRESS',  desc:'Take 20% less damage when above 50% HP',       applyFn:'fortress'},
  swift:      {name:'SWIFT',     desc:'Gain 20% speed when below 40% HP',             applyFn:'swift'},
  manaburn:   {name:'MANABURN',  desc:'Attacks drain 8 mana from target',             applyFn:'manaburn'},
  laststand:  {name:'LAST STAND',desc:'Double damage when below 20% HP',              applyFn:'laststand'},
  spellweave: {name:'SPELLWEAVE',desc:'Every 3rd spell fires an extra free bolt',     applyFn:'spellweave'},
  vengeance:  {name:'VENGEANCE', desc:'First hit after taking damage deals 50% more', applyFn:'vengeance'},
  momentum:   {name:'MOMENTUM',  desc:'Each melee combo adds 5% crit chance',         applyFn:'momentum'},
  blink:      {name:'BLINK',     desc:'Teleport when below 30% HP (12s cooldown)',    applyFn:'blink'},
};
const PASSIVE_N=Object.keys(PASSIVES);

// ================================================================
// DEFAULT SCHEMAS
// ================================================================
const D_VISUAL={
  bodyRadius:10,glowIntensity:1.0,trailLength:7,trailWidth:1.0,
  auraEnabled:false,auraRadius:25,auraPulse:true,
  runeEnabled:true,runeArms:4,runeSpeed:1.0,
  shockwaveOnHit:false,nameVisible:true,barsVisible:true,
};
const D_MAGIC={
  enabled:true,school:'arcane',
  mana:{max:100,regen:8,cost:18,burstEnabled:false,burstCost:45,burstMultiplier:2.2},
  spell:{type:'bolt',pattern:'single',dmg:20,cd:900,range:220,critChance:0.1,critMult:1.8},
  bolt:{speed:4.5,count:1,spread:0.15,size:4,lifetime:2000,trail:7,homing:0,pierce:false,inaccuracy:0.06,impactRadius:0,bounce:0,chainTargets:0},
  effect:{type:'none',power:5,duration:2000,stackable:false,maxStacks:3},
  sig:{type:'none',chargeRate:1.0,power:80,radius:130,beamLen:400,beamWidth:12,duration:750,burstCount:8,speed:7,autoThreshold:0.85,manualTrigger:false},
};
const D_MELEE={
  enabled:false,weapon:'sword',
  dmg:30,range:50,cd:900,lunge:1.2,knockback:2,cleave:0.3,arcWidth:70,
  critChance:0.12,critMult:2.0,
  combo:{enabled:false,steps:3,dmgBonus:0.3,window:850,resetOnMiss:true},
  parry:{enabled:false,chance:0.2,window:200,counterDmg:1.5},
  charge:{enabled:false,minDist:120,dashSpd:7,cooldown:3000},
  effect:{type:'none',power:5,duration:1500,stackable:false},
};
const D_RANGED={
  enabled:false,ammo:'bolt',
  dmg:18,cd:1100,range:280,critChance:0.1,critMult:1.8,
  bolt:{speed:5.5,count:1,spread:0.08,size:3.5,lifetime:2800,trail:6,homing:0,pierce:false,inaccuracy:0.04,impactRadius:0,bounce:0,chainTargets:0},
  volley:{enabled:false,count:3,delay:120,spread:0.25},
  effect:{type:'none',power:4,duration:1800,stackable:false},
};
const D_AI={
  stance:'balanced',
  priority:{magic:0.5,melee:0.25,ranged:0.25},
  // Movement & Positioning
  aggression:0.5,spacing:0.5,strafe:0.5,randomness:0.2,
  keepDistance:0.5,retreatThreshold:0.2,advanceThreshold:0.75,
  // Targeting
  aim:0.8,prediction:0.5,leadFactor:0.5,
  // Reactions
  dodge:0.4,dodgeTiming:0.5,parryTendency:0.3,
  counterPlay:0.4,baiting:0.2,
  // Aggression patterns
  comboBias:0.5,burstWindow:0.5,targetCommit:0.7,
  // Resource management
  specialBias:0.6,manaConserve:0.3,retreatToHeal:0.3,
  // Adaptation
  adaptRate:0.3,pressureResponse:0.5,flankTendency:0.2,
  // Timing
  attackDelay:0.1,cancelThreshold:0.5,
  // Notes (freeform)
  notes:'',
};
const STANCES={
  balanced:  {aggression:.5,spacing:.5,strafe:.5,dodge:.4,retreatThreshold:.2,aim:.8,prediction:.5,comboBias:.5,keepDistance:.5},
  aggressive:{aggression:.82,spacing:.2,strafe:.35,dodge:.2,retreatThreshold:.08,comboBias:.72,targetCommit:.85,keepDistance:.15,burstWindow:.7},
  defensive: {aggression:.25,spacing:.72,strafe:.65,dodge:.72,retreatThreshold:.38,specialBias:.4,keepDistance:.72,manaConserve:.5,baiting:.4},
  sniper:    {aggression:.18,spacing:.88,strafe:.72,dodge:.55,keepDistance:.9,retreatThreshold:.3,aim:.95,prediction:.82,leadFactor:.75},
  berserk:   {aggression:.97,spacing:.05,strafe:.18,comboBias:.9,targetCommit:.95,retreatThreshold:.04,keepDistance:.05,dodge:.1,burstWindow:.9},
  cunning:   {aggression:.55,randomness:.5,dodge:.65,prediction:.7,baiting:.6,counterPlay:.72,comboBias:.65,flankTendency:.55},
  duelist:   {aggression:.65,spacing:.55,strafe:.72,dodge:.6,counterPlay:.75,parryTendency:.6,comboBias:.68,dodgeTiming:.7},
  coward:    {aggression:.12,spacing:.9,strafe:.8,dodge:.85,keepDistance:.95,retreatThreshold:.45,baiting:.55,manaConserve:.6},
  guardian:  {aggression:.4,spacing:.6,strafe:.55,dodge:.5,retreatThreshold:.15,specialBias:.3,comboBias:.4,keepDistance:.55,adaptRate:.6},
  trickster: {aggression:.6,randomness:.65,baiting:.7,dodge:.7,prediction:.6,flankTendency:.65,comboBias:.55,cancelThreshold:.6},
};

// ================================================================
// UNIT FACTORY
// ================================================================
function mkDef(o){
  const d=dc({id:o.id||'u_'+Date.now(),name:o.name||'UNIT',school:o.school||'arcane',
    desc:o.desc||'',hp:o.hp||250,armor:o.armor||0,spd:o.spd||2.0,
    resistances:{fire:0,frost:0,storm:0,physical:0,magic:0},
    passive:{id:'none',power:1.0},
    passive2:{id:'none',power:1.0},
    visual:dc(D_VISUAL),
    magic:dc(D_MAGIC),melee:dc(D_MELEE),ranged:dc(D_RANGED),ai:dc(D_AI)});
  deepMerge(d,{visual:o.visual||{},magic:o.magic||{enabled:D_MAGIC.enabled},melee:o.melee||{},ranged:o.ranged||{},ai:o.ai||{}});
  if(o.resistances)Object.assign(d.resistances,o.resistances);
  if(o.passive)d.passive=o.passive;
  if(o.passive2)d.passive2=o.passive2;
  const sc=SCH[d.school]||SCH.arcane;
  d.color=d.magic.enabled?sc.color:(o.color||'#ffaa44');
  d.glowColor=sc.glow;d.trailColor=sc.trail;
  return d;
}

// ================================================================
// BASE ROSTER
// ================================================================
const BASE_UNITS=[
  mkDef({id:'pyros',name:'PYROS',school:'fire',desc:'Pyromancer. Scorched-earth spread fire. Nova ultimate. Berserker passive.',
    hp:310,armor:0,spd:2.0,passive:{id:'berserker',power:1.0},
    magic:{school:'fire',mana:{max:100,regen:9,cost:14},spell:{type:'bolt',pattern:'spread',dmg:15,cd:800,range:200,critChance:.12,critMult:2.0},bolt:{speed:3.8,count:4,spread:.38,size:5,trail:8,impactRadius:22},effect:{type:'burn',power:7,duration:2500},sig:{type:'nova',power:72,radius:155,chargeRate:1.2,autoThreshold:.85}},
    visual:{auraEnabled:true,auraRadius:22,runeArms:6},
    ai:{stance:'aggressive',priority:{magic:1,melee:0,ranged:0},aggression:.75,spacing:.38,burstWindow:.7,comboBias:.65}}),

  mkDef({id:'glacius',name:'GLACIUS',school:'frost',desc:'Frost sniper. Homing ice lances freeze on hit. Beam signature. Fortress passive.',
    hp:220,armor:0,spd:2.1,passive:{id:'fortress',power:1.0},
    magic:{school:'frost',mana:{max:88,regen:7,cost:22},spell:{type:'bolt',pattern:'single',dmg:28,cd:1150,range:285,critChance:.14,critMult:2.2},bolt:{speed:8,size:5,homing:.22,trail:10,inaccuracy:.02},effect:{type:'freeze',power:.45,duration:1600},sig:{type:'beam',power:98,beamLen:430,beamWidth:13,duration:720,chargeRate:1.1,autoThreshold:.85}},
    visual:{bodyRadius:9},
    ai:{stance:'sniper',priority:{magic:1,melee:0,ranged:0},aggression:.22,spacing:.88,aim:.95,prediction:.82,leadFactor:.78,keepDistance:.9}}),

  mkDef({id:'ironclad',name:'IRON',school:'rune',desc:'Heavy bruiser. Hammer combos with weaken. Last Stand passive. High armor.',
    hp:390,armor:18,spd:1.65,color:'#ffaa44',passive:{id:'laststand',power:1.0},passive2:{id:'thorns',power:.8},
    magic:{enabled:false},
    melee:{enabled:true,weapon:'hammer',dmg:50,range:58,cd:1500,lunge:3.2,knockback:4.5,cleave:.55,arcWidth:92,critChance:.1,critMult:2.2,combo:{enabled:true,steps:3,dmgBonus:.38,window:1100,resetOnMiss:false},charge:{enabled:true,minDist:130,dashSpd:6,cooldown:3500},effect:{type:'weaken',power:.28,duration:2000}},
    ai:{stance:'berserk',priority:{magic:0,melee:1,ranged:0},aggression:.9,spacing:.1,targetCommit:.92,burstWindow:.8}}),

  mkDef({id:'shade',name:'SHADE',school:'shadow',desc:'Shadow assassin. Dagger bleeds. Barrage sig. Vengeance+Vampiric passives.',
    hp:258,armor:4,spd:2.95,passive:{id:'vengeance',power:1.0},passive2:{id:'vampiric',power:.7},
    magic:{school:'shadow',mana:{max:72,regen:8,cost:12},spell:{type:'bolt',pattern:'burst',dmg:12,cd:1000,range:180},bolt:{speed:4.5,count:3,spread:.4,trail:6},effect:{type:'bleed',power:6,duration:3500},sig:{type:'barrage',power:20,burstCount:10,speed:8.5,chargeRate:1.15,autoThreshold:.85}},
    melee:{enabled:true,weapon:'dagger',dmg:26,range:46,cd:640,lunge:2.5,knockback:1.2,critChance:.18,critMult:2.5,combo:{enabled:true,steps:4,dmgBonus:.5,window:680,resetOnMiss:true},effect:{type:'poison',power:4,duration:3500}},
    ai:{stance:'cunning',priority:{magic:.35,melee:.65,ranged:0},aggression:.7,randomness:.55,dodge:.78,comboBias:.85,baiting:.55,counterPlay:.65}}),

  mkDef({id:'rifter',name:'RIFTER',school:'frost',desc:'Ranged specialist. Freeze arrows. Volley mode. Swift passive for escapes.',
    hp:240,armor:2,spd:2.3,color:'#44ccff',passive:{id:'swift',power:1.0},
    magic:{enabled:false},
    ranged:{enabled:true,ammo:'arrow',dmg:27,cd:1000,range:325,critChance:.14,critMult:2.0,bolt:{speed:8.5,count:1,size:4,trail:9,homing:.14,inaccuracy:.02},volley:{enabled:true,count:3,delay:130,spread:.22},effect:{type:'freeze',power:.4,duration:1500}},
    ai:{stance:'sniper',priority:{magic:0,melee:0,ranged:1},aggression:.22,spacing:.88,aim:.95,prediction:.82,keepDistance:.9,dodge:.6}}),

  mkDef({id:'templar',name:'TEMPLAR',school:'holy',desc:'Holy warrior. Radiant pulses plus hammer combo. Barrier passive. Guardian stance.',
    hp:318,armor:11,spd:1.9,passive:{id:'fortress',power:1.0},
    magic:{school:'holy',mana:{max:100,regen:9,cost:10},spell:{type:'aoe',pattern:'pulse',dmg:9,cd:410,range:168},effect:{type:'none',power:0,duration:0},sig:{type:'nova',power:68,radius:148,chargeRate:1.0,autoThreshold:.85}},
    melee:{enabled:true,weapon:'hammer',dmg:37,range:55,cd:1100,lunge:1.8,knockback:3,cleave:.38,arcWidth:82,critChance:.1,critMult:1.9,combo:{enabled:true,steps:2,dmgBonus:.25,window:1000},effect:{type:'weaken',power:.2,duration:1600}},
    ai:{stance:'guardian',priority:{magic:.45,melee:.55,ranged:0},aggression:.55,spacing:.5,comboBias:.6}}),

  mkDef({id:'voidmage',name:'VOID',school:'void',desc:'Life drain mage. Void beam sig. Vampiric+Spellweave passives.',
    hp:345,armor:0,spd:1.9,passive:{id:'vampiric',power:1.0},passive2:{id:'spellweave',power:1.0},
    magic:{school:'void',mana:{max:90,regen:7,cost:10},spell:{type:'drain',pattern:'single',dmg:9,cd:550,range:175},bolt:{speed:4.5,trail:9,homing:.08},effect:{type:'weaken',power:.2,duration:1800},sig:{type:'beam',power:90,beamLen:385,beamWidth:12,duration:680,chargeRate:.9,autoThreshold:.85}},
    visual:{auraEnabled:true,auraRadius:28,auraPulse:true},
    ai:{stance:'balanced',priority:{magic:1,melee:0,ranged:0},aggression:.6,spacing:.42,retreatThreshold:.12,manaConserve:.2}}),

  mkDef({id:'stormcaller',name:'STORM',school:'storm',desc:'Storm mage. Spiral chain lightning. Barrage sig. Momentum passive.',
    hp:252,armor:0,spd:2.55,passive:{id:'momentum',power:1.0},
    magic:{school:'storm',mana:{max:90,regen:11,cost:13},spell:{type:'bolt',pattern:'spiral',dmg:17,cd:850,range:215,critChance:.12,critMult:1.9},bolt:{speed:5.5,count:5,spread:.28,size:3.8,trail:6,chainTargets:1},effect:{type:'shock',power:9,duration:1200},sig:{type:'barrage',power:23,burstCount:12,speed:9,chargeRate:1.3,autoThreshold:.85}},
    ai:{stance:'cunning',priority:{magic:1,melee:0,ranged:0},aggression:.65,randomness:.55,dodge:.68,burstWindow:.72}}),

  mkDef({id:'warden',name:'WARDEN',school:'nature',desc:'Nature guardian. Spear plus poison zone. Regen passive. Defensive stance.',
    hp:290,armor:5,spd:1.9,passive:{id:'fortress',power:.8},passive2:{id:'vampiric',power:.5},
    magic:{school:'nature',mana:{max:110,regen:13,cost:9},spell:{type:'aoe',pattern:'pulse',dmg:8,cd:410,range:170},effect:{type:'poison',power:3,duration:4000},sig:{type:'zone',power:11,radius:125,duration:4300,chargeRate:.85,autoThreshold:.85}},
    melee:{enabled:true,weapon:'spear',dmg:28,range:72,cd:1200,lunge:2.2,knockback:1.8,cleave:.18,arcWidth:42,effect:{type:'poison',power:4,duration:2500}},
    ai:{stance:'defensive',priority:{magic:.5,melee:.5,ranged:0},aggression:.42,spacing:.6,dodge:.58,retreatThreshold:.28,retreatToHeal:.5}}),

  mkDef({id:'hexblade',name:'HEX',school:'void',desc:'Battlemage. Void bolts plus sword. Duelist stance. Thorns passive.',
    hp:282,armor:6,spd:2.2,passive:{id:'thorns',power:.9},passive2:{id:'vengeance',power:.8},
    magic:{school:'void',mana:{max:80,regen:7,cost:20},spell:{type:'bolt',pattern:'single',dmg:25,cd:1200,range:205,critChance:.12,critMult:2.0},bolt:{speed:6,size:5,homing:.15,trail:9},sig:{type:'beam',power:88,beamLen:360,beamWidth:12,duration:700,chargeRate:1.2,autoThreshold:.85}},
    melee:{enabled:true,weapon:'sword',dmg:32,range:56,cd:950,lunge:3,knockback:2.2,arcWidth:72,critChance:.14,critMult:2.2,combo:{enabled:true,steps:2,dmgBonus:.28,window:900},parry:{enabled:true,chance:.22,window:200,counterDmg:1.5}},
    ai:{stance:'duelist',priority:{magic:.5,melee:.5,ranged:0},aggression:.78,spacing:.32,counterPlay:.7,targetCommit:.85,parryTendency:.55}}),

  mkDef({id:'gunner',name:'GUNNER',school:'fire',desc:'Explosive pellet spread. Volley burst mode. Berserker passive. Pure ranged chaos.',
    hp:262,armor:2,spd:2.35,color:'#ff8844',passive:{id:'berserker',power:.9},
    magic:{enabled:false},
    ranged:{enabled:true,ammo:'explosive',dmg:20,cd:720,range:230,critChance:.1,critMult:1.8,bolt:{speed:5,count:4,spread:.48,size:4.5,trail:5,impactRadius:32},volley:{enabled:true,count:4,delay:90,spread:.3},effect:{type:'burn',power:5,duration:1800}},
    ai:{stance:'aggressive',priority:{magic:0,melee:0,ranged:1},aggression:.72,spacing:.4,strafe:.78,burstWindow:.75}}),

  mkDef({id:'berserker',name:'FURY',school:'blood',desc:'Pure melee rage. Claw combo bleeds. Last Stand+Berserker. Never stops.',
    hp:345,armor:7,spd:2.85,color:'#ff3355',passive:{id:'laststand',power:1.0},passive2:{id:'berserker',power:1.0},
    magic:{enabled:false},
    melee:{enabled:true,weapon:'claws',dmg:33,range:50,cd:600,lunge:3.8,knockback:1.2,cleave:.48,arcWidth:65,critChance:.16,critMult:2.2,combo:{enabled:true,steps:5,dmgBonus:.52,window:720,resetOnMiss:true},charge:{enabled:true,minDist:140,dashSpd:7.5,cooldown:3000},effect:{type:'bleed',power:7,duration:4000}},
    ai:{stance:'berserk',priority:{magic:0,melee:1,ranged:0},aggression:.97,spacing:.05,comboBias:.92,targetCommit:.95,burstWindow:.9}}),

  mkDef({id:'tempus',name:'TEMPUS',school:'time',desc:'Chronomancer. Homing time bolts. Beam sig. Perfect prediction. Spellweave passive.',
    hp:245,armor:0,spd:2.1,passive:{id:'spellweave',power:1.0},
    magic:{school:'time',mana:{max:82,regen:7,cost:24},spell:{type:'bolt',pattern:'single',dmg:26,cd:1300,range:355,critChance:.15,critMult:2.2},bolt:{speed:5.5,size:5,homing:.28,trail:10,inaccuracy:.01},sig:{type:'beam',power:92,beamLen:420,beamWidth:10,duration:700,chargeRate:.95,autoThreshold:.85}},
    visual:{bodyRadius:9,runeArms:3,runeSpeed:0.6},
    ai:{stance:'sniper',priority:{magic:1,melee:0,ranged:0},aggression:.2,spacing:.85,aim:.97,prediction:.9,leadFactor:.85,keepDistance:.88}}),

  mkDef({id:'oortho',name:'OORTHO',school:'arcane',desc:'The Arcane Sentinel. Powerful void mage with devastating chain bolts and reality-warping beam. Dangerous battlefield control and adaptive AI. Tutorial antagonist.',
    hp:420,armor:12,spd:2.0,passive:{id:'fortress',power:1.2},passive2:{id:'spellweave',power:1.0},
    magic:{school:'arcane',mana:{max:140,regen:12,cost:16},spell:{type:'bolt',pattern:'spiral',dmg:22,cd:950,range:240,critChance:.16,critMult:2.3},bolt:{speed:5.2,count:6,spread:.32,size:5.5,trail:9,homing:.18,chainTargets:2,impactRadius:18},effect:{type:'weaken',power:.35,duration:2200},sig:{type:'beam',power:120,beamLen:450,beamWidth:16,duration:850,chargeRate:1.15,autoThreshold:.8,manualTrigger:false}},
    visual:{auraEnabled:true,auraRadius:28,auraPulse:true,runeEnabled:true,runeArms:8,runeSpeed:1.2,shockwaveOnHit:true},
    resistances:{fire:.15,frost:.15,storm:.1,physical:.2,magic:.1},
    ai:{stance:'aggressive',priority:{magic:1,melee:0,ranged:0},aggression:.8,spacing:.3,aim:.92,prediction:.75,dodgeTiming:.65,burstWindow:.85,targetCommit:.9,keepDistance:.25}}),
];

// ================================================================
// GAME STATE
// ================================================================
const W=460,H=460,PAD=18;

function mkUnit(def,x,y,side){
  return{def:dc(def),side,x,y,vx:0,vy:0,hp:def.hp,maxHp:def.hp,armor:def.armor||0,
    mana:def.magic.enabled?def.magic.mana.max*.65:0,
    atkCd:0,meleeCd:0,rangedCd:0,sigCharge:0,sigFires:0,chargeCd:0,
    comboCount:0,comboTimer:0,
    orbitAng:side===0?0:Math.PI,eTimer:0,eVx:0,eVy:0,
    cState:'idle',cTimer:0,cVx:0,cVy:0,
    flash:0,flashCol:'#ffffff',alive:true,
    status:{},// map of status->timer
    passiveState:{spellCount:0,vengeanceReady:false,blinkCd:0},
    runeAng:rndA(),
    brain:{intent:'',log:[],deciding:[],lastAction:'',frameCount:0}};
}
function initGs(d0,d1){
  return{units:[mkUnit(d0,W*.25,H/2,0),mkUnit(d1,W*.75,H/2,1)],
    projs:[],parts:[],zones:[],bQ:[],
    shake:0,flashOvl:null,winner:null,time:0};
}

// ================================================================
// STATUS HELPERS
// ================================================================
function applyStatus(tgt,eff){
  if(!eff||eff.type==='none')return;
  if(!tgt.status)tgt.status={};
  const cur=tgt.status[eff.type];
  if(cur&&eff.stackable!==false){tgt.status[eff.type]={timer:Math.max(cur.timer,eff.duration),power:eff.power,stacks:Math.min((cur.stacks||1)+1,eff.maxStacks||3)};}
  else tgt.status[eff.type]={timer:eff.duration||2000,power:eff.power||5,stacks:1};
}
function hasStatus(u,type){return u.status&&u.status[type]&&u.status[type].timer>0;}
function getStatus(u,type){return hasStatus(u,type)?u.status[type]:null;}
function statusColor(u){
  if(!u.status)return null;
  for(const k of Object.keys(u.status)){if(u.status[k].timer>0)return SFX_COL[k]||null;}
  return null;
}

// ================================================================
// PASSIVE HELPERS
// ================================================================
function passiveModifyDmg(attacker,defender,dmg,isSpell){
  let d=dmg;
  const pa=attacker.def.passive,pa2=attacker.def.passive2;
  // Berserker: more dmg per missing HP
  if(pa.id==='berserker'||pa2.id==='berserker'){const pw=(pa.id==='berserker'?pa:pa2).power;const missing=1-attacker.hp/attacker.maxHp;d*=(1+missing*pw);}
  if(pa.id==='laststand'||pa2.id==='laststand'){if(attacker.hp/attacker.maxHp<0.2)d*=2;}
  if(pa.id==='vengeance'||pa2.id==='vengeance'){if(attacker.passiveState&&attacker.passiveState.vengeanceReady){d*=1.5;attacker.passiveState.vengeanceReady=false;}}
  if(pa.id==='rage'||pa2.id==='rage'){if(hasStatus(attacker,'rage'))d*=1.3;}
  return d;
}
function passiveOnHit(attacker,defender,dmg,gs){
  const pa=attacker.def.passive,pa2=attacker.def.passive2;
  if(pa.id==='vampiric'||pa2.id==='vampiric'){const pw=(pa.id==='vampiric'?pa:pa2).power;attacker.hp=Math.min(attacker.maxHp,attacker.hp+dmg*0.15*pw);}
  if(pa.id==='manaburn'||pa2.id==='manaburn'){if(defender.def.magic.enabled)defender.mana=Math.max(0,defender.mana-8);}
}
function passiveOnReceive(attacker,defender,dmg,gs){
  if(!defender.passiveState)defender.passiveState={};
  // Thorns
  const pa=defender.def.passive,pa2=defender.def.passive2;
  if(pa.id==='thorns'||pa2.id==='thorns'){const pw=(pa.id==='thorns'?pa:pa2).power;attacker.hp-=dmg*0.25*pw;}
  // Vengeance
  if(pa.id==='vengeance'||pa2.id==='vengeance')defender.passiveState.vengeanceReady=true;
  // Blink
  if((pa.id==='blink'||pa2.id==='blink')&&defender.hp/defender.maxHp<0.3&&(defender.passiveState.blinkCd||0)<=0){
    defender.x=clamp(rnd(PAD+20,W-PAD-20),PAD+20,W-PAD-20);defender.y=clamp(rnd(PAD+20,H-PAD-20),PAD+20,H-PAD-20);
    defender.passiveState.blinkCd=12000;pBurst(gs.parts,defender.x,defender.y,defender.def.color,16,2.5);
  }
}
function tickPassives(u,dt,gs){
  if(!u.passiveState)u.passiveState={};
  if(u.passiveState.blinkCd>0)u.passiveState.blinkCd-=dt;
  const pa=u.def.passive;
  if(pa.id==='regen')u.hp=Math.min(u.maxHp,u.hp+3*(dt/1000)*pa.power);
  if(pa.id==='swift'&&u.hp/u.maxHp<0.4)u.def._speedBoost=0.2*pa.power;else u.def._speedBoost=0;
}

// ================================================================
// PARTICLES
// ================================================================
function pBurst(parts,x,y,col,n,spd){for(let i=0;i<n;i++){const a=(i/n)*PI2+rnd(0,.5),s=rnd(spd*.4,spd);parts.push({x:x+Math.cos(a)*7,y:y+Math.sin(a)*7,vx:Math.cos(a)*s,vy:Math.sin(a)*s,col,life:rnd(280,720),maxLife:720,r:rnd(2.5,6),gw:true});}}
function pHit(parts,x,y,col,n){n=n||6;for(let i=0;i<n;i++){const a=rndA(),s=rnd(1,5);parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,col,life:rnd(120,420),maxLife:420,r:rnd(2,5),gw:true});}}
function pRing(parts,x,y,col,n,rad){rad=rad||10;for(let i=0;i<n;i++){const a=(i/n)*PI2;parts.push({x:x+Math.cos(a)*rad,y:y+Math.sin(a)*rad,vx:Math.cos(a)*.6,vy:Math.sin(a)*.6,col,life:rnd(350,820),maxLife:820,r:rnd(1.5,3.5),gw:true});}}
function pSlash(parts,x,y,col,ang,arc){for(let i=0;i<10;i++){const a=ang-arc/2+(i/10)*arc,r2=rnd(18,46);parts.push({x:x+Math.cos(a)*r2,y:y+Math.sin(a)*r2,vx:Math.cos(a)*rnd(.8,2.5),vy:Math.sin(a)*rnd(.8,2.5),col,life:rnd(120,300),maxLife:300,r:rnd(1.5,3.5),gw:false});}}
function pSt(parts,x,y,col){const a=rndA();parts.push({x,y,vx:Math.cos(a)*rnd(.4,1.4),vy:Math.sin(a)*rnd(.4,1.4)-0.8,col,life:rnd(280,600),maxLife:600,r:rnd(1.5,3.5),gw:true});}
function bLog(u,msg,col){if(!u.brain)return;u.brain.log.unshift({msg,col:col||'#8899cc'});if(u.brain.log.length>14)u.brain.log.pop();u.brain.lastAction=msg;}

function spawnOorthoPopupStorm(gs, count=2){
  if(!gs) return;
  const layer=document.getElementById('battle-overlay-layer');
  if(!layer) return;
  const popups=gs.oorthoPopups||(gs.oorthoPopups=[]);
  for(let i=0;i<count;i++){
    const id=`oortho-popup-${Date.now()}-${Math.random().toString(16).slice(2,8)}`;
    const lines=[];
    const lineCount=4+Math.floor(Math.random()*5);
    const lex=['SIGMA','QUANTA','MATRIX','RIFT','ARCANE','GLITCH','REWRITE','STATIC','CIPHER','PULSE','TRACE','AETHER','VOID','LAYER','FRACT','RESONANCE','KERNEL','RANDOM','NEXUS','THRUM'];
    for(let j=0;j<lineCount;j++){
      const words=[];const wc=2+Math.floor(Math.random()*3);
      for(let k=0;k<wc;k++){
        const word=lex[Math.floor(Math.random()*lex.length)];
        words.push(word+(Math.random()<.35?Math.floor(Math.random()*10):''));
      }
      lines.push(words.join(' '));
    }
    const popup={
      id,
      x:12+Math.random()*76,
      y:14+Math.random()*72,
      life:3600+Math.random()*2600,
      maxLife:6200,
      text:lines.join('\n'),
      size:0.72+Math.random()*0.34,
      color:'#44aaff',
      glow:'#66ccff',
      el:null,
      dead:false,
    };
    popups.push(popup);
  }
  syncBattleOverlay(gs);
}

function updateOorthoPopups(gs, dt){
  if(!gs) return;
  const popups=gs.oorthoPopups||[];
  if(!popups.length) return;
  const live=[];
  for(const p of popups){
    if(p.dead) continue;
    p.life-=dt;
    if(p.life<=0){
      if(p.el&&p.el.parentNode)p.el.remove();
      p.dead=true;
      continue;
    }
    live.push(p);
  }
  gs.oorthoPopups=live;
  if(!gs.oorthoPopupTimer) gs.oorthoPopupTimer=5000+Math.random()*4000;
  gs.oorthoPopupTimer-=dt;
  const oortho=gs.units&&gs.units.find(u=>u&&u.def&&u.def.id==='oortho');
  if(oortho&&oortho.alive&&!gs.winner&&gs.oorthoPopupTimer<=0){
    gs.oorthoPopupTimer=5200+Math.random()*7000;
    if(Math.random()<.72) spawnOorthoPopupStorm(gs, 1+(Math.random()<.4?1:0));
  }
  syncBattleOverlay(gs);
}

function syncBattleOverlay(gs){
  if(!gs) return;
  const layer=document.getElementById('battle-overlay-layer');
  if(!layer) return;
  const popups=gs.oorthoPopups||[];
  const existing=[...layer.querySelectorAll('.oortho-popup')];
  const aliveIds=new Set();
  for(const popup of popups){
    aliveIds.add(popup.id);
    let el=popup.el;
    if(!el){
      el=document.createElement('button');
      el.type='button';
      el.className='oortho-popup';
      el.innerHTML=`<div class="oortho-popup-title">OORTHO // SIG</div><div class="oortho-popup-text"></div><div class="oortho-popup-hint">click to clear</div>`;
      el.addEventListener('click', (ev)=>{
        ev.preventDefault();
        ev.stopPropagation();
        popup.dead=true;
        if(popup.el&&popup.el.parentNode)popup.el.remove();
        pBurst(gs.parts||[], popup.x*4.6, popup.y*4.6, '#44aaff', 9, 2.2);
      });
      el.dataset.popupId=popup.id;
      layer.appendChild(el);
      popup.el=el;
    }
    el.dataset.popupId=popup.id;
    const pct=Math.max(0, popup.life/popup.maxLife);
    const textEl=el.querySelector('.oortho-popup-text');
    if(textEl) textEl.textContent=popup.text;
    el.style.left=popup.x+'%';
    el.style.top=popup.y+'%';
    el.style.transform=`translate(-50%,-50%) scale(${0.82 + popup.size*0.25 + pct*0.16})`;
    el.style.opacity=Math.max(0.2, pct*0.95);
    el.style.borderColor=`rgba(68,170,255,${0.2 + pct*0.8})`;
    el.style.boxShadow=`0 0 ${10+pct*24}px rgba(68,170,255,${0.16+pct*0.34})`;
  }
  for(const el of existing){
    if(!aliveIds.has(el.dataset.popupId)) el.remove();
  }
}

// ================================================================
// MOVEMENT
// ================================================================
function moveUnit(u,en,dt){
  const ai=u.def.ai;
  const freeze=getStatus(u,'freeze');const slow=getStatus(u,'slow');
  const spdMult=(freeze?1-freeze.power*0.6:1)*(slow?1-slow.power*0.6:1)*(1+(u.def._speedBoost||0));
  const spd=u.def.spd*58*(dt/1000)*spdMult;
  const d=ed(u.x,u.y,en.x,en.y);
  const a=ea(u.x,u.y,en.x,en.y);
  const retreating=(u.hp/u.maxHp)<ai.retreatThreshold;
  const taunt=getStatus(u,'taunt');
  const prefR=(u.def.move&&u.def.move.prefRange?u.def.move.prefRange:150)*(1+(0.5-ai.aggression)*.5+ai.keepDistance*.3);

  function orbitMove(){
    const dir=retreating?-1.6:1;
    u.orbitAng+=dir*(0.45+ai.strafe*.35)*(dt/1000);
    const tx=en.x+Math.cos(u.orbitAng)*prefR,ty=en.y+Math.sin(u.orbitAng)*prefR;
    const dx=tx-u.x,dy=ty-u.y,dl=Math.hypot(dx,dy)||1;
    u.vx=lerp(u.vx,(dx/dl)*spd,.14);u.vy=lerp(u.vy,(dy/dl)*spd,.14);
  }
  function kiteMove(){
    let fx=0,fy=0;
    if(retreating&&!taunt||d<prefR-25){fx=-Math.cos(a);fy=-Math.sin(a);}
    else if(d>prefR+25){fx=Math.cos(a);fy=Math.sin(a);}
    else{const sv=ai.strafe*2-1;fx=-Math.sin(a)*sv;fy=Math.cos(a)*sv;}
    const r2=ai.randomness*.4;fx+=rnd(-r2,r2);fy+=rnd(-r2,r2);
    const fl=Math.hypot(fx,fy)||1;
    u.vx=lerp(u.vx,(fx/fl)*spd,.12);u.vy=lerp(u.vy,(fy/fl)*spd,.12);
  }

  const mv=u.def.move&&u.def.move.type?u.def.move.type:'orbit';
  switch(mv){
    case'orbit':orbitMove();break;
    case'kite':kiteMove();break;
    case'aggressive':{const fx=Math.cos(a),fy=Math.sin(a);u.vx=lerp(u.vx,fx*spd,.18);u.vy=lerp(u.vy,fy*spd,.18);break;}
    case'strafe':{const sv=Math.sin(u.orbitAng+=0.7*(dt/1000));const fx=-Math.sin(a)*sv+Math.cos(a)*.4,fy=Math.cos(a)*sv+Math.sin(a)*.4;const fl2=Math.hypot(fx,fy)||1;u.vx=lerp(u.vx,(fx/fl2)*spd,.12);u.vy=lerp(u.vy,(fy/fl2)*spd,.12);break;}
    case'charge':{
      if(u.cState==='idle'){
        u.orbitAng+=0.28*(dt/1000);
        const tx=en.x+Math.cos(u.orbitAng)*140,ty=en.y+Math.sin(u.orbitAng)*140;
        const dx=tx-u.x,dy=ty-u.y,dl=Math.hypot(dx,dy)||1;
        u.vx=lerp(u.vx,(dx/dl)*spd*.7,.1);u.vy=lerp(u.vy,(dy/dl)*spd*.7,.1);
      }else if(u.cState==='windup'){u.cTimer-=dt;u.vx*=.82;u.vy*=.82;if(u.cTimer<=0){u.cState='dash';u.cTimer=290;const px=en.x+en.vx*ai.prediction*9,py=en.y+en.vy*ai.prediction*9;const ca=ea(u.x,u.y,px,py);u.cVx=Math.cos(ca)*spd*5.5;u.cVy=Math.sin(ca)*spd*5.5;}}
      else{u.cTimer-=dt;u.vx=u.cVx;u.vy=u.cVy;if(u.cTimer<=0)u.cState='idle';}
      break;}
    case'erratic':{u.eTimer-=dt;if(u.eTimer<=0){u.eTimer=rnd(140,500);const sp2=Math.PI*(0.5+ai.randomness*.65),ra=a+rnd(-sp2,sp2);u.eVx=Math.cos(ra)*spd*rnd(.4,1.7);u.eVy=Math.sin(ra)*spd*rnd(.4,1.7);}u.vx=lerp(u.vx,u.eVx,.2);u.vy=lerp(u.vy,u.eVy,.2);break;}
    case'random':{u.eTimer-=dt;if(u.eTimer<=0){u.eTimer=rnd(350,900);const ra=rndA();u.eVx=Math.cos(ra)*spd;u.eVy=Math.sin(ra)*spd;}u.vx=lerp(u.vx,u.eVx,.09);u.vy=lerp(u.vy,u.eVy,.09);break;}
    case'stationary':u.vx*=.88;u.vy*=.88;break;
    default:orbitMove();
  }
  // Taunt: always approach
  if(taunt&&d>60){u.vx=lerp(u.vx,Math.cos(a)*spd,.2);u.vy=lerp(u.vy,Math.sin(a)*spd,.2);}
  u.x=clamp(u.x+u.vx,PAD+8,W-PAD-8);u.y=clamp(u.y+u.vy,PAD+8,H-PAD-8);
  u.flash=Math.max(0,u.flash-dt*3.5);
  u.runeAng+=dt*0.001*(u.def.visual.runeSpeed||1);
}

// ================================================================
// PROJECTILE FACTORY
// ================================================================
function mkP(x,y,vx,vy,dmg,col,trail,side,o){
  return Object.assign({x,y,vx,vy,dmg,col,trail:trail||col,side,r:4,life:2000,maxLife:2000,trl:[],hit:false,isDrain:false,healFrac:0,homing:0,pierce:false,impactR:0,hitSet:new Set(),isAoe:false,aoeR:0,isBeam:false,beamTo:null,isMelee:false,tMax:6,bounce:0,bounceLeft:0,eff:{type:'none',power:0,duration:0},shk:.8,isCrit:false,chainLeft:0},o);
}

// ================================================================
// MAGIC
// ================================================================
function castMagic(u,en,gs){
  const mg=u.def.magic,ai=u.def.ai;
  const px=en.x+en.vx*ai.prediction*9,py=en.y+en.vy*ai.prediction*9;
  const base=ea(u.x,u.y,px,py);
  const sc=SCH[mg.school]||SCH.arcane;
  const isCrit=Math.random()<(mg.spell.critChance||0.1);
  const dmgBase=mg.spell.dmg*(isCrit?mg.spell.critMult||1.8:1);

  if(!u.passiveState)u.passiveState={};
  u.passiveState.spellCount=(u.passiveState.spellCount||0)+1;
  const spellweave=(u.def.passive.id==='spellweave'||u.def.passive2.id==='spellweave')&&u.passiveState.spellCount%3===0;

  const sp=(dx,dy,ang)=>{
    const inac=mg.bolt.inaccuracy*(1.2-(ai.aim||.8));
    const fa=ang+rnd(-inac,inac);
    return mkP(u.x+dx,u.y+dy,Math.cos(fa)*mg.bolt.speed,Math.sin(fa)*mg.bolt.speed,dmgBase,sc.color,sc.trail,u.side,
      {r:mg.bolt.size*(isCrit?1.3:1),life:mg.bolt.lifetime,maxLife:mg.bolt.lifetime,isDrain:mg.spell.type==='drain',healFrac:.55,homing:mg.bolt.homing,pierce:mg.bolt.pierce,impactR:mg.bolt.impactRadius,tMax:mg.bolt.trail,bounce:mg.bolt.bounce||0,bounceLeft:mg.bolt.bounce||0,eff:mg.effect,shk:.8,isCrit,chainLeft:mg.bolt.chainTargets||0});
  };
  if(mg.spell.type==='aoe'){
    gs.projs.push(mkP(u.x,u.y,0,0,dmgBase,sc.color,sc.trail,u.side,{isAoe:true,aoeR:mg.spell.range*.62,life:420,maxLife:420,eff:mg.effect,shk:2}));
    pBurst(gs.parts,u.x,u.y,sc.color,14,2.8);pRing(gs.parts,u.x,u.y,sc.glow,8);
    if(spellweave)gs.projs.push(sp(0,0,base));return;
  }
  const byPat=(pat)=>{
    switch(pat){
      case'single':gs.projs.push(sp(0,0,base));break;
      case'spread':{const h2=Math.floor(mg.bolt.count/2);for(let i=-h2;i<=h2;i++)gs.projs.push(sp(0,0,base+i*mg.bolt.spread));break;}
      case'wave':for(let i=0;i<mg.bolt.count;i++){const off=i-(mg.bolt.count-1)/2,p2=base+Math.PI/2;gs.projs.push(sp(Math.cos(p2)*off*13,Math.sin(p2)*off*13,base+off*.18));}break;
      case'spiral':for(let i=0;i<mg.bolt.count;i++)gs.projs.push(sp(0,0,base+(i/mg.bolt.count)*PI2));break;
      case'pulse':gs.projs.push(mkP(u.x,u.y,0,0,dmgBase,sc.color,sc.trail,u.side,{isAoe:true,aoeR:mg.spell.range*.62,life:320,maxLife:320,eff:mg.effect,shk:1.5}));for(let i=0;i<10;i++){const ra=(i/10)*PI2;gs.parts.push({x:u.x+Math.cos(ra)*9,y:u.y+Math.sin(ra)*9,vx:Math.cos(ra)*2.4,vy:Math.sin(ra)*2.4,col:sc.color,life:280,maxLife:280,r:2.5,gw:true});}break;
      case'fan':{const tot=mg.bolt.count+2;for(let i=0;i<tot;i++)gs.projs.push(sp(0,0,base-(mg.bolt.spread*1.4)/2+i*(mg.bolt.spread*1.4/(tot-1))));}break;
      case'burst':for(let i=0;i<mg.bolt.count+2;i++)gs.projs.push(sp(rnd(-7,7),rnd(-7,7),base+rnd(-.55,.55)));break;
      case'ring':for(let i=0;i<8+mg.bolt.count;i++)gs.projs.push(sp(0,0,(i/(8+mg.bolt.count))*PI2));break;
      case'random':byPat(['single','spread','wave','spiral','fan'][Math.floor(Math.random()*5)]);break;
      default:gs.projs.push(sp(0,0,base));
    }
  };
  byPat(mg.spell.pattern);
  if(spellweave)gs.projs.push(sp(0,0,base+rnd(-.3,.3)));
  pRing(gs.parts,u.x,u.y,sc.glow,5,9);
}

// ================================================================
// MELEE
// ================================================================
function doMelee(u,en,gs){
  const m=u.def.melee;const a=ea(u.x,u.y,en.x,en.y);
  if(ed(u.x,u.y,en.x,en.y)<=m.range){
    // Parry check
    if(m.parry&&m.parry.enabled&&Math.random()<m.parry.chance){
      const counter=m.dmg*(m.parry.counterDmg||1.5);
      en.hp-=counter;en.flash=1;en.flashCol='#ffffff';
      pBurst(gs.parts,u.x,u.y,u.def.color,12,2.5);gs.shake=Math.max(gs.shake,4);
      bLog(u,'PARRY + COUNTER!','#ffffff');
      return;
    }
    let dmg=m.dmg;
    if(m.combo&&m.combo.enabled&&u.comboCount>0)dmg*=(1+m.combo.dmgBonus*Math.min(u.comboCount,m.combo.steps)/m.combo.steps);
    const isCrit=Math.random()<(m.critChance||.12);
    if(isCrit)dmg*=(m.critMult||2.0);
    dmg=passiveModifyDmg(u,en,dmg,false);
    if(hasStatus(en,'freeze')||hasStatus(en,'weaken'))dmg*=1.3;
    // Resistances
    const physRes=en.def.resistances?en.def.resistances.physical||0:0;
    dmg=Math.max(1,dmg*(1-physRes*.5)-(en.armor||0)*.35);
    en.hp-=dmg;en.flash=1;en.flashCol=isCrit?'#ffffff':u.def.color;
    passiveOnHit(u,en,dmg,gs);passiveOnReceive(u,en,dmg,gs);
    en.vx+=Math.cos(a)*m.knockback;en.vy+=Math.sin(a)*m.knockback;
    u.vx+=Math.cos(a)*m.lunge;u.vy+=Math.sin(a)*m.lunge;
    pHit(gs.parts,en.x,en.y,isCrit?'#ffffff':u.def.color,isCrit?12:8);
    pSlash(gs.parts,u.x,u.y,u.def.color,a,(m.arcWidth*Math.PI)/180);
    if(isCrit)pRing(gs.parts,en.x,en.y,'#ffffff',8,20);
    gs.shake=Math.max(gs.shake,isCrit?5.5:3.2);
    applyStatus(en,m.effect);
    if(m.combo&&m.combo.enabled){if(u.comboTimer>0)u.comboCount=Math.min(u.comboCount+1,m.combo.steps);else u.comboCount=1;u.comboTimer=m.combo.window;}
    bLog(u,(isCrit?'CRIT ':'')+m.weapon.toUpperCase()+(u.comboCount>1?' x'+u.comboCount:''),isCrit?'#ffffff':u.def.color);
  }
  gs.projs.push(mkP(u.x,u.y,0,0,0,u.def.color,u.def.color,u.side,{isMelee:true,arcAng:a,arcW:(m.arcWidth*Math.PI)/180,arcR:m.range,life:200,maxLife:200,hit:true}));
}

// ================================================================
// RANGED
// ================================================================
function doRanged(u,en,gs){
  const rg=u.def.ranged,ai=u.def.ai;
  const px=en.x+en.vx*ai.prediction*9,py=en.y+en.vy*ai.prediction*9;
  const base=ea(u.x,u.y,px,py);
  const col=u.def.magic.enabled?(SCH[u.def.school]||SCH.arcane).color:u.def.color;
  const isCrit=Math.random()<(rg.critChance||.1);
  const dmgBase=rg.dmg*(isCrit?rg.critMult||1.8:1);
  const sp=(ang)=>{const inac=rg.bolt.inaccuracy*(1.2-(ai.aim||.8));const fa=ang+rnd(-inac,inac);return mkP(u.x,u.y,Math.cos(fa)*rg.bolt.speed,Math.sin(fa)*rg.bolt.speed,dmgBase,col,col,u.side,{r:rg.bolt.size*(isCrit?1.3:1),life:rg.bolt.lifetime||2800,maxLife:rg.bolt.lifetime||2800,homing:rg.bolt.homing||0,pierce:rg.bolt.pierce||false,impactR:rg.bolt.impactRadius||0,tMax:rg.bolt.trail||6,bounce:rg.bolt.bounce||0,bounceLeft:rg.bolt.bounce||0,eff:rg.effect,shk:1,isCrit});};
  const cnt=rg.bolt.count||1;
  if(rg.volley&&rg.volley.enabled){
    for(let v=0;v<rg.volley.count;v++){const delay=v*rg.volley.delay;const cs=u.side;gs.bQ.push({d:delay,fn:()=>{for(let i=0;i<cnt;i++){const va=base+(i-(cnt-1)/2)*(rg.bolt.spread||.08)+(Math.random()-.5)*rg.volley.spread;gs.projs.push(sp(va));}}});}
  }else{
    const h2=Math.floor(cnt/2);for(let i=-h2;i<=h2;i++)gs.projs.push(sp(base+i*(rg.bolt.spread||.08)));
  }
  if(isCrit)bLog(u,'CRIT '+rg.ammo.toUpperCase(),'#ffffff');
}

// ================================================================
// SIGNATURE
// ================================================================
function fireSig(u,en,gs){
  u.sigFires=(u.sigFires||0)+1;
  const sig=u.def.magic.sig,sc=SCH[u.def.magic.school]||SCH.arcane;
  const a=ea(u.x,u.y,en.x,en.y);
  if(u.def.id==='oortho' && sig.type==='beam'){
    const popupCount = 5;
    for(let i=0;i<popupCount;i++){
      const t=i/(popupCount-1);
      const px = lerp(u.x, en.x, 0.2 + t*0.6) + rnd(-18, 18);
      const py = lerp(u.y, en.y, 0.2 + t*0.6) + rnd(-18, 18);
      gs.parts.push({x:px,y:py,vx:rnd(-0.2,0.2),vy:rnd(-0.2,0.2),col:'#44aaff',life:1200,maxLife:1200,r:3.5+Math.random()*2.5,gw:true});
      gs.bQ.push({d:i*140,fn:()=>{
        const target = gs.units[1-u.side];
        if(target && target.alive){
          target.hp = Math.max(0, target.hp - 8);
          target.flash = 1;
          target.flashCol = '#44aaff';
          target.status = target.status || {};
          target.status.weaken = {timer:2200,power:10,stacks:1};
          pRing(gs.parts, target.x, target.y, '#44aaff', 10, 18);
        }
      }});
    }
    gs.flashOvl={a:.28,col:'#44aaff'};
  }
  switch(sig.type){
    case'nova':
      gs.projs.push(mkP(u.x,u.y,0,0,sig.power,sc.color,sc.trail,u.side,{isAoe:true,aoeR:sig.radius,life:720,maxLife:720,shk:6}));
      pBurst(gs.parts,u.x,u.y,sc.color,34,4);pRing(gs.parts,u.x,u.y,sc.glow,20,sig.radius*.45);
      gs.shake=Math.max(gs.shake,7);gs.flashOvl={a:.32,col:sc.color};break;
    case'beam':{
      const bx=u.x+Math.cos(a)*sig.beamLen,by=u.y+Math.sin(a)*sig.beamLen;
      gs.projs.push(mkP(u.x,u.y,0,0,sig.power,sc.color,sc.trail,u.side,{isBeam:true,beamTo:{x:bx,y:by},r:sig.beamWidth/2,life:sig.duration,maxLife:sig.duration,shk:8}));
      for(let i=0;i<18;i++){const t=i/17;gs.parts.push({x:lerp(u.x,bx,t),y:lerp(u.y,by,t),vx:rnd(-1.4,1.4),vy:rnd(-1.4,1.4),col:sc.color,life:rnd(280,850),maxLife:850,r:rnd(3.5,10),gw:true});}
      gs.shake=Math.max(gs.shake,9);gs.flashOvl={a:.42,col:sc.color};break;}
    case'barrage':
      for(let i=0;i<sig.burstCount;i++){const delay=i*100,cs=u.side;gs.bQ.push({d:delay,fn:()=>{const t2=gs.units[1-cs];const ca=ea(gs.units[cs].x,gs.units[cs].y,t2.x+rnd(-25,25),t2.y+rnd(-25,25));gs.projs.push(mkP(gs.units[cs].x,gs.units[cs].y,Math.cos(ca)*sig.speed,Math.sin(ca)*sig.speed,sig.power,sc.color,sc.trail,cs,{r:5,homing:.22,life:2700,maxLife:2700,shk:1.2}));}});}
      gs.shake=Math.max(gs.shake,4);gs.flashOvl={a:.22,col:sc.color};break;
    case'zone':
      gs.zones.push({x:en.x+rnd(-18,18),y:en.y+rnd(-18,18),r:sig.radius,dps:sig.power,life:sig.duration,maxLife:sig.duration,col:sc.color,glow:sc.glow,side:u.side});
      pRing(gs.parts,en.x,en.y,sc.color,16,sig.radius*.45);
      gs.flashOvl={a:.18,col:sc.color};break;
    case'chain':{
      // Chain bolts that bounce to nearby positions
      for(let i=0;i<6;i++){const ca2=a+i*(PI2/6);gs.projs.push(mkP(u.x,u.y,Math.cos(ca2)*sig.speed*.6,Math.sin(ca2)*sig.speed*.6,sig.power,sc.color,sc.trail,u.side,{r:5,homing:.35,life:2200,maxLife:2200,shk:2.5}));}
      gs.shake=Math.max(gs.shake,5);gs.flashOvl={a:.25,col:sc.color};break;}
    case'meteor':{
      for(let i=0;i<4;i++){const delay=i*200,cs=u.side;gs.bQ.push({d:delay,fn:()=>{const mx=en.x+rnd(-60,60),my=en.y+rnd(-60,60);gs.projs.push(mkP(u.x,u.y,(mx-u.x)/60,(my-u.y)/60,sig.power*1.2,sc.color,sc.trail,cs,{r:7,life:1800,maxLife:1800,isAoe:false,shk:5}));}});}
      gs.shake=Math.max(gs.shake,5);gs.flashOvl={a:.3,col:sc.color};break;}
  }
  bLog(u,'SIG: '+sig.type.toUpperCase(),'#ffcc44');
}

// ================================================================
// AI TICK
// ================================================================
function aiTick(u,en,gs,dt){
  const ai=u.def.ai,mg=u.def.magic,ml=u.def.melee,rg=u.def.ranged;
  const d=ed(u.x,u.y,en.x,en.y);
  u.brain.frameCount++;

  // Status ticks
  if(u.status){
    for(const k of Object.keys(u.status)){
      const s=u.status[k];s.timer-=dt;
      if(s.timer<=0){delete u.status[k];continue;}
      if(['burn','poison','bleed'].includes(k)){u.hp-=s.power*(s.stacks||1)*(dt/1000);if(Math.random()<.06)pSt(gs.parts,u.x+rnd(-10,10),u.y+rnd(-10,10),SFX_COL[k]||'#ff4400');}
      if(k==='regen')u.hp=Math.min(u.maxHp,u.hp+s.power*(dt/1000));
    }
  }
  if(u.comboTimer>0)u.comboTimer-=dt;else u.comboCount=0;
  tickPassives(u,dt,gs);
  if(mg.enabled)u.mana=Math.min(mg.mana.max,u.mana+mg.mana.regen*(dt/1000));
  if(mg.enabled&&mg.sig.type!=='none'){
    u.sigCharge=Math.min(1,u.sigCharge+dt*0.000082*mg.sig.chargeRate*(1+(ai.specialBias||.6)));
    if(u.sigCharge>=mg.sig.autoThreshold){u.sigCharge=0;fireSig(u,en,gs);}
  }

  const hpPct=u.hp/u.maxHp;const enHpPct=en.hp/en.maxHp;
  let intent=hpPct<ai.retreatThreshold?'RETREATING':d>240?'CLOSING':'ENGAGING';
  if(enHpPct<.2)intent='FINISHING';
  u.brain.intent=intent;u.brain.d=Math.round(d);u.brain.hpPct=hpPct;

  const dec=[];
  const prio=ai.priority;
  const order=Object.entries(prio).sort((a2,b2)=>b2[1]-a2[1]).map(e=>e[0]);

  for(const mode of order){
    if(mode==='magic'&&mg.enabled){
      u.atkCd-=dt;
      const inRange=d<=mg.spell.range,hasMana=u.mana>=mg.mana.cost;
      dec.push({mode:'MAGIC',prio:prio.magic,inRange,hasMana,cd:u.atkCd,cdMax:mg.spell.cd,enabled:true,pat:mg.spell.pattern,school:mg.school});
      if(u.atkCd<=0&&inRange){
        if(hasMana){u.mana-=mg.mana.cost;castMagic(u,en,gs);bLog(u,'CAST '+mg.spell.pattern.toUpperCase(),(SCH[mg.school]||SCH.arcane).color);}
        else{const sc2=SCH[mg.school]||SCH.arcane;const a2=ea(u.x,u.y,en.x,en.y);gs.projs.push(mkP(u.x,u.y,Math.cos(a2)*3,Math.sin(a2)*3,Math.ceil(mg.spell.dmg*.3),sc2.color,sc2.trail,u.side,{r:3,life:1700,maxLife:1700,tMax:4,shk:.4}));bLog(u,'LOW MANA: weak bolt','#775588');}
        u.atkCd=mg.spell.cd;
      }
    }
    else if(mode==='melee'&&ml.enabled){
      u.meleeCd-=dt;
      const inRange=d<=ml.range+7;
      dec.push({mode:'MELEE',prio:prio.melee,inRange,hasMana:true,cd:u.meleeCd,cdMax:ml.cd,enabled:true,pat:ml.weapon});
      if(u.meleeCd<=0&&inRange){
        if(u.def.move&&u.def.move.type==='charge'&&u.cState==='idle'){u.cState='windup';u.cTimer=420;}
        doMelee(u,en,gs);u.meleeCd=ml.cd;
      }
      // Charge ability
      if(ml.charge&&ml.charge.enabled){
        u.chargeCd-=dt;
        if(u.chargeCd<=0&&d>ml.charge.minDist&&d<ml.charge.minDist*1.8){
          const ca3=ea(u.x,u.y,en.x,en.y);
          u.vx=Math.cos(ca3)*ml.charge.dashSpd*58*(dt/1000)*12;
          u.vy=Math.sin(ca3)*ml.charge.dashSpd*58*(dt/1000)*12;
          u.chargeCd=ml.charge.cooldown;
          pBurst(gs.parts,u.x,u.y,u.def.color,10,3);
          bLog(u,'CHARGE!','#ffcc44');
        }
      }
    }
    else if(mode==='ranged'&&rg.enabled){
      u.rangedCd-=dt;
      const inRange=d<=rg.range;
      dec.push({mode:'RANGED',prio:prio.ranged,inRange,hasMana:true,cd:u.rangedCd,cdMax:rg.cd,enabled:true,pat:rg.ammo});
      if(u.rangedCd<=0&&inRange){doRanged(u,en,gs);u.rangedCd=rg.cd;}
    }
  }
  if(!mg.enabled)dec.push({mode:'MAGIC',prio:0,enabled:false,cd:0,cdMax:1,inRange:false,hasMana:false});
  if(!ml.enabled)dec.push({mode:'MELEE',prio:0,enabled:false,cd:0,cdMax:1,inRange:false,hasMana:false});
  if(!rg.enabled)dec.push({mode:'RANGED',prio:0,enabled:false,cd:0,cdMax:1,inRange:false,hasMana:false});
  u.brain.deciding=dec.sort((a2,b2)=>b2.prio-a2.prio);
}

// ================================================================
// GAME UPDATE
// ================================================================
function playBattleEndCutscene(gs){
  if(!gs || !gs.winner || gs.resultCutscenePlayed || CS.active) return;
  gs.resultCutscenePlayed = true;
  const [u0,u1] = gs.units;
  const playerWon = u0.alive && !u1.alive;
  const enemyWon = u1.alive && !u0.alive;
  if(playerWon) playCutscene('oortho_defeated');
  else if(enemyWon) playCutscene('player_defeated');
}

function updateGame(gs,dt){
  if(!gs||gs.winner||CS.active)return;
  gs.time+=dt;gs.shake=Math.max(0,gs.shake-dt*4);
  if(gs.flashOvl){gs.flashOvl.a-=dt*.0038;if(gs.flashOvl.a<=0)gs.flashOvl=null;}
  for(let i=gs.bQ.length-1;i>=0;i--){gs.bQ[i].d-=dt;if(gs.bQ[i].d<=0){gs.bQ[i].fn();gs.bQ.splice(i,1);}}
  const[u0,u1]=gs.units;
  moveUnit(u0,u1,dt);moveUnit(u1,u0,dt);
  aiTick(u0,u1,gs,dt);aiTick(u1,u0,gs,dt);

  for(let i=gs.projs.length-1;i>=0;i--){
    const p=gs.projs[i];p.life-=dt;
    if(p.isMelee){if(p.life<=0)gs.projs.splice(i,1);continue;}
    if(p.isBeam){
      const tgt=gs.units[1-p.side];
      if(tgt.alive&&!p.hit){const ba=ea(p.x,p.y,p.beamTo.x,p.beamTo.y),ta=ea(p.x,p.y,tgt.x,tgt.y);let da=ta-ba;while(da>Math.PI)da-=PI2;while(da<-Math.PI)da+=PI2;if(Math.abs(da)<.52&&ed(p.x,p.y,tgt.x,tgt.y)<=ed(p.x,p.y,p.beamTo.x,p.beamTo.y)){const bdmg=Math.max(.5,p.dmg*(dt/p.maxLife)*2-(tgt.armor||0)*.2);tgt.hp-=bdmg;tgt.flash=1;tgt.flashCol=p.col;pHit(gs.parts,tgt.x,tgt.y,p.col,2);passiveOnHit(gs.units[p.side],tgt,bdmg,gs);}}
      if(p.life<=0)gs.projs.splice(i,1);continue;
    }
    if(p.isAoe){
      const tgt=gs.units[1-p.side];
      if(tgt.alive&&!p.hit&&ed(p.x,p.y,tgt.x,tgt.y)<=p.aoeR){const adm=Math.max(.5,p.dmg-(tgt.armor||0)*.3);tgt.hp-=adm;tgt.flash=1;tgt.flashCol=p.col;pHit(gs.parts,tgt.x,tgt.y,p.col,10);p.hit=true;applyStatus(tgt,p.eff||{type:'none'});gs.shake=Math.max(gs.shake,p.shk||1);passiveOnReceive(gs.units[p.side],tgt,adm,gs);}
      if(p.life<=0)gs.projs.splice(i,1);continue;
    }
    if(p.homing>0){const tgt=gs.units[1-p.side];if(tgt.alive){const ta=ea(p.x,p.y,tgt.x,tgt.y),ca=Math.atan2(p.vy,p.vx);let da=ta-ca;while(da>Math.PI)da-=PI2;while(da<-Math.PI)da+=PI2;const na=ca+da*p.homing*.1,s=Math.hypot(p.vx,p.vy);p.vx=Math.cos(na)*s;p.vy=Math.sin(na)*s;}}
    if(p.trl.length>p.tMax)p.trl.shift();
    p.trl.push({x:p.x,y:p.y});
    const nx=p.x+p.vx,ny=p.y+p.vy;
    if(p.bounceLeft>0&&(nx<PAD||nx>W-PAD||ny<PAD||ny>H-PAD)){if(nx<PAD||nx>W-PAD)p.vx*=-1;if(ny<PAD||ny>H-PAD)p.vy*=-1;p.bounceLeft--;pHit(gs.parts,p.x,p.y,p.col,3);}
    p.x=nx;p.y=ny;
    if(p.x<0||p.x>W||p.y<0||p.y>H||p.life<=0){gs.projs.splice(i,1);continue;}
    const tgt=gs.units[1-p.side];
    if(tgt.alive&&!p.hitSet.has(1-p.side)&&ed(p.x,p.y,tgt.x,tgt.y)<(tgt.def.visual.bodyRadius||10)+2){
      const schk=hasStatus(tgt,'shock');
      let pdm=passiveModifyDmg(gs.units[p.side],tgt,p.dmg,true);
      pdm=Math.max(.5,pdm-(tgt.armor||0)*.3);
      if(schk)pdm*=1.4;
      // Barrier absorb
      const bar=getStatus(tgt,'barrier');if(bar){bar.timer=0;delete tgt.status.barrier;pRing(gs.parts,tgt.x,tgt.y,'#88aaff',12,22);gs.projs.splice(i,1);continue;}
      const physRes=tgt.def.resistances?tgt.def.resistances.physical||0:0;
      pdm*=(1-physRes*.4);
      tgt.hp-=pdm;tgt.flash=1;tgt.flashCol=p.isCrit?'#ffffff':p.col;
      if(p.isDrain){const att=gs.units[p.side];att.hp=Math.min(att.maxHp,att.hp+pdm*p.healFrac);}
      if(p.impactR>0)gs.projs.push(mkP(p.x,p.y,0,0,p.dmg*.38,p.col,p.trail,p.side,{isAoe:true,aoeR:p.impactR,life:350,maxLife:350,eff:p.eff||{type:'none'}}));
      pHit(gs.parts,tgt.x,tgt.y,p.isCrit?'#ffffff':p.col,p.isCrit?10:6);
      if(p.isCrit)pRing(gs.parts,tgt.x,tgt.y,'#ffffff',6,18);
      gs.shake=Math.max(gs.shake,p.shk||1.2);
      applyStatus(tgt,p.eff||{type:'none'});
      passiveOnHit(gs.units[p.side],tgt,pdm,gs);passiveOnReceive(gs.units[p.side],tgt,pdm,gs);
      if(p.pierce)p.hitSet.add(1-p.side);else{gs.projs.splice(i,1);continue;}
    }
  }
  for(let i=gs.zones.length-1;i>=0;i--){const z=gs.zones[i];z.life-=dt;if(z.life<=0){gs.zones.splice(i,1);continue;}const tgt=gs.units[1-z.side];if(tgt.alive&&ed(z.x,z.y,tgt.x,tgt.y)<=z.r){tgt.hp-=z.dps*(dt/1000);tgt.flash=.4;tgt.flashCol=z.col;}if(Math.random()<.05)gs.parts.push({x:z.x+rnd(-z.r,z.r),y:z.y+rnd(-z.r,z.r),vx:rnd(-.7,.7),vy:rnd(-1.4,-.2),col:z.col,life:rnd(350,850),maxLife:850,r:rnd(1.5,3.5),gw:true});}
  for(let i=gs.parts.length-1;i>=0;i--){const p=gs.parts[i];p.life-=dt;if(p.life<=0){gs.parts.splice(i,1);continue;}p.x+=p.vx;p.y+=p.vy;p.vx*=.91;p.vy*=.91;}
  u0.alive=u0.hp>0;u1.alive=u1.hp>0;
  if(!u0.alive||!u1.alive){
    if(!u0.alive&&!u1.alive)gs.winner={name:'DRAW',col:'#ffffff'};
    else if(!u0.alive)gs.winner={name:u1.def.name,col:u1.def.color};
    else gs.winner={name:u0.def.name,col:u0.def.color};
    if(!TUT.active) playBattleEndCutscene(gs);
  }
}

// ================================================================
// RENDERING
// ================================================================
function drawUnit(ctx,u,showIntel){
  if(!u.alive)return;
  const fl=u.flash>.5;const v=u.def.visual||D_VISUAL;
  const gc=SCH[u.def.school]?SCH[u.def.school].glow:u.def.color;
  const br=v.bodyRadius||10;
  const sCol=statusColor(u);

  // Aura
  if(v.auraEnabled){
    const ar=v.auraRadius+(v.auraPulse?Math.sin(Date.now()*.003)*3:0);
    ctx.strokeStyle=u.def.color;ctx.lineWidth=1;ctx.globalAlpha=.12;
    ctx.beginPath();ctx.arc(u.x,u.y,ar,0,PI2);ctx.stroke();ctx.globalAlpha=1;
  }
  // Rune orbit
  if(v.runeEnabled&&u.def.magic.enabled){
    ctx.globalAlpha=.14;ctx.strokeStyle=u.def.color;ctx.lineWidth=.8;
    ctx.beginPath();ctx.arc(u.x,u.y,br+12,0,PI2);ctx.stroke();
    const arms=v.runeArms||4;
    for(let i=0;i<arms;i++){const ra=u.runeAng+(i/arms)*PI2;ctx.beginPath();ctx.moveTo(u.x,u.y);ctx.lineTo(u.x+Math.cos(ra)*(br+12),u.y+Math.sin(ra)*(br+12));ctx.stroke();}
    ctx.globalAlpha=1;
  }
  // Status ring
  if(sCol){ctx.strokeStyle=sCol;ctx.lineWidth=1;ctx.globalAlpha=.5;ctx.setLineDash([3,3]);ctx.beginPath();ctx.arc(u.x,u.y,br+14,0,PI2);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;}
  // Barrier ring
  if(hasStatus(u,'barrier')){ctx.strokeStyle='#88aaff';ctx.lineWidth=2;ctx.globalAlpha=.7;ctx.shadowColor='#88aaff';ctx.shadowBlur=10;ctx.beginPath();ctx.arc(u.x,u.y,br+16,0,PI2);ctx.stroke();ctx.shadowBlur=0;ctx.globalAlpha=1;}
  // Armor ring
  if((u.armor||0)>0){const aR=Math.min(1,(u.armor||0)/25);ctx.strokeStyle='#aabb88';ctx.lineWidth=1.5;ctx.globalAlpha=aR*.4;ctx.setLineDash([4,4]);ctx.beginPath();ctx.arc(u.x,u.y,br+9,0,PI2);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;}
  // Body glow
  ctx.shadowColor=gc;ctx.shadowBlur=(fl?36:18)*(v.glowIntensity||1);
  ctx.fillStyle=fl?u.flashCol:u.def.color;ctx.globalAlpha=.92;
  ctx.beginPath();ctx.arc(u.x,u.y,br,0,PI2);ctx.fill();
  ctx.fillStyle='#04050a';ctx.globalAlpha=.8;
  ctx.beginPath();ctx.arc(u.x,u.y,br*.65,0,PI2);ctx.fill();
  ctx.fillStyle=fl?u.flashCol:gc;ctx.globalAlpha=.9;
  ctx.beginPath();ctx.arc(u.x,u.y,br*.28,0,PI2);ctx.fill();
  ctx.globalAlpha=1;ctx.shadowBlur=0;
  if(v.shockwaveOnHit&&fl){ctx.strokeStyle=u.def.color;ctx.lineWidth=1;ctx.globalAlpha=u.flash*.4;ctx.beginPath();ctx.arc(u.x,u.y,br+22,0,PI2);ctx.stroke();ctx.globalAlpha=1;}

  if(!v.nameVisible)return;
  ctx.fillStyle=u.def.color;ctx.font='bold 7px monospace';ctx.textAlign='center';
  ctx.fillText(u.def.name,u.x,u.y-br-5);

  if(!v.barsVisible)return;
  const bw=br*4.5,hpR=Math.max(0,u.hp/u.maxHp);
  const hc=hpR>.5?'#44ff88':hpR>.25?'#ffaa44':'#ff3344';
  ctx.fillStyle='#0a0c1e';ctx.fillRect(u.x-bw/2,u.y+br+3,bw,4);
  ctx.fillStyle=hc;ctx.fillRect(u.x-bw/2,u.y+br+3,bw*hpR,4);
  if(u.def.magic.enabled){const mR=u.mana/(u.def.magic.mana.max||1);ctx.fillStyle='#0a0c1e';ctx.fillRect(u.x-bw/2,u.y+br+9,bw,2.5);ctx.fillStyle=u.def.color;ctx.globalAlpha=.7;ctx.fillRect(u.x-bw/2,u.y+br+9,bw*mR,2.5);ctx.globalAlpha=1;}
  if(u.def.magic.enabled&&u.def.magic.sig.type!=='none'&&u.sigCharge>.01){ctx.strokeStyle=u.def.color;ctx.lineWidth=1.8;ctx.globalAlpha=.65;ctx.shadowColor=gc;ctx.shadowBlur=7;ctx.beginPath();ctx.arc(u.x,u.y,br+1.5,-Math.PI/2,-Math.PI/2+u.sigCharge*PI2);ctx.stroke();ctx.shadowBlur=0;ctx.globalAlpha=1;}
  if(u.def.melee.combo&&u.def.melee.combo.enabled&&u.comboCount>0){for(let c=0;c<u.comboCount;c++){ctx.fillStyle='#ffaa44';ctx.globalAlpha=.85;ctx.fillRect(u.x-bw/2+c*7,u.y+br+13,5.5,2.5);}ctx.globalAlpha=1;}
}

function renderGame(ctx,gs,showIntel){
  const{units,projs,parts,zones,shake,flashOvl}=gs;
  ctx.save();
  if(shake>.5)ctx.translate(rnd(-shake,shake),rnd(-shake,shake));
  ctx.fillStyle='#040609';ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='#08091a';ctx.lineWidth=1;
  for(let x=0;x<W;x+=30){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=0;y<H;y+=30){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
  ctx.strokeStyle='#131a38';ctx.lineWidth=2;ctx.strokeRect(1,1,W-2,H-2);

  for(const z of zones){const pct=z.life/z.maxLife;ctx.globalAlpha=pct*.17;ctx.fillStyle=z.col;ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,PI2);ctx.fill();ctx.globalAlpha=pct*.5;ctx.strokeStyle=z.col;ctx.lineWidth=1.5;ctx.setLineDash([4,4]);ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,PI2);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;}
  for(const p of parts){const al=p.life/p.maxLife;ctx.globalAlpha=al*.85;ctx.fillStyle=p.col;if(p.gw){ctx.shadowColor=p.col;ctx.shadowBlur=5;}const r2=Math.max(.4,p.r*Math.sqrt(al));ctx.beginPath();ctx.arc(p.x,p.y,r2,0,PI2);ctx.fill();ctx.shadowBlur=0;}
  ctx.globalAlpha=1;

  for(const p of projs){
    const pct=p.life/p.maxLife;
    if(p.isMelee){ctx.strokeStyle=p.col;ctx.lineWidth=p.isCrit?3.5:2.5;ctx.globalAlpha=pct*.85;ctx.shadowColor=p.col;ctx.shadowBlur=p.isCrit?18:10;ctx.beginPath();ctx.arc(p.x,p.y,p.arcR,p.arcAng-p.arcW/2,p.arcAng+p.arcW/2);ctx.stroke();ctx.globalAlpha=1;ctx.shadowBlur=0;continue;}
    if(p.isBeam){ctx.globalAlpha=pct*.95;ctx.strokeStyle=p.col;ctx.lineWidth=p.r*2;ctx.shadowColor=p.col;ctx.shadowBlur=26;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.beamTo.x,p.beamTo.y);ctx.stroke();ctx.lineWidth=p.r*5;ctx.globalAlpha=pct*.16;ctx.stroke();ctx.shadowBlur=0;ctx.globalAlpha=1;continue;}
    if(p.isAoe){ctx.globalAlpha=pct*.2;ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,p.aoeR,0,PI2);ctx.fill();ctx.globalAlpha=pct*.5;ctx.strokeStyle=p.col;ctx.lineWidth=1.5;ctx.stroke();ctx.globalAlpha=1;continue;}
    for(let ti=0;ti<p.trl.length;ti++){const t=ti/p.trl.length,tr=p.r*t;if(tr>.4){ctx.globalAlpha=t*.35;ctx.fillStyle=p.trail;ctx.beginPath();ctx.arc(p.trl[ti].x,p.trl[ti].y,tr,0,PI2);ctx.fill();}}
    ctx.globalAlpha=1;ctx.fillStyle=p.isCrit?'#ffffff':p.col;ctx.shadowColor=p.isCrit?'#ffffff':p.col;ctx.shadowBlur=p.isCrit?20:12;
    ctx.beginPath();ctx.arc(p.x,p.y,p.r*(p.isCrit?1.3:1),0,PI2);ctx.fill();ctx.shadowBlur=0;
  }
  for(const u of units)drawUnit(ctx,u,showIntel);
  if(gs.winner){
    ctx.fillStyle='rgba(3,4,8,.86)';ctx.fillRect(0,0,W,H);
    ctx.shadowColor=gs.winner.col;ctx.shadowBlur=32;
    ctx.fillStyle=gs.winner.col;ctx.font='bold 24px monospace';ctx.textAlign='center';
    ctx.fillText(gs.winner.name==='DRAW'?'DRAW!':gs.winner.name+' WINS!',W/2,H/2-12);
    ctx.shadowBlur=0;ctx.fillStyle='#334';ctx.font='10px monospace';
    ctx.fillText('press RESTART',W/2,H/2+12);
  }
  if(flashOvl&&flashOvl.a>0){ctx.fillStyle=flashOvl.col;ctx.globalAlpha=flashOvl.a*.28;ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;}
  ctx.restore();
}

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
    { speaker:'OORTHO', col:'#cc44ff', portrait:'oortho', text:'You have mastered the Forge’s language completely.', duration:2800 },
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
    { speaker:'OORTHO', col:'#cc44ff', portrait:'oortho', text:'Your unit is too fragile. Patch it — if you know how.', duration:3000 },
    { speaker:'NARRATOR', col:'#4455aa', portrait:null, text:'A JSON terminal appears. The Forge holds its breath.', duration:2400 },
  ],
  challenge_hp_boost_won: [
    { speaker:'OORTHO', col:'#cc44ff', portrait:'oortho', text:'Better. The battle may yet turn in your favor.', duration:2800 },
  ],
  // Flavor — fire randomly during battle
  flv_1: [{ speaker:'OORTHO', col:'#cc44ff', portrait:'oortho', text:'Your patterns are predictable. Recalibrating...', duration:2400 }],
  flv_2: [{ speaker:'OORTHO', col:'#cc44ff', portrait:'oortho', text:'The arcane matrix is flawless. You cannot win.', duration:2800 }],
  flv_3: [{ speaker:'OORTHO', col:'#cc44ff', portrait:'oortho', text:'Interesting move. Insufficient, but interesting.', duration:2500 }],
  flv_4: [{ speaker:'PYROS',  col:'#ff5522', portrait:'pyros',  text:'The fire burns brighter the more you feed it.', duration:2400 }],
  flv_5: [{ speaker:'PYROS',  col:'#ff5522', portrait:'pyros',  text:'Keep pushing.', duration:1600 }],
};

const CS_FLAVOR = ['flv_1','flv_2','flv_3','flv_4','flv_5'];

// ================================================================
// CUTSCENE ENGINE
// ================================================================
const CS = {
  active: false,
  slides: [],
  idx: 0,
  // phases: fadein | type | hold | crossout | crossin | fadeout
  phase: 'fadein',
  t: 0,
  charIdx: 0,
  alpha: 0,
  onDone: null,
  portraitT: 0,
  fired: new Set(),
  flavorT: 0,
  flavorNext: 28000 + Math.random() * 18000,
  // config
  FADE: 650,
  CROSS: 300,
  TYPE: 24,   // ms per char
  HOLD: 1300, // ms after typing before next slide
};

// ── Play a cutscene by id ──────────────────────────────────────
function playCutscene(id, onDone) {
  if (CS.active) return;
  const slides = CUTSCENE_DATA[id];
  if (!slides) return;
  CS.active = true;
  CS.slides = slides;
  CS.idx = 0;
  CS.phase = 'fadein';
  CS.t = 0;
  CS.charIdx = 0;
  CS.alpha = 0;
  CS.portraitT = 0;
  CS.onDone = onDone || null;
  const el = document.getElementById('cs-overlay');
  if (el) { el.style.display = 'flex'; el.style.opacity = '0'; }
  csSetupSlide();
}

// ── Rebuild DOM when slide changes ────────────────────────────
function csSetupSlide() {
  const slide = CS.slides[CS.idx];
  if (!slide) return;

  const spkEl  = document.getElementById('cs-speaker');
  const textEl = document.getElementById('cs-text');
  const curEl  = document.getElementById('cs-cursor');
  const bgEl   = document.getElementById('cs-bg-glow');
  const dotsEl = document.getElementById('cs-dots');

  if (spkEl) {
    spkEl.textContent   = slide.speaker;
    spkEl.style.color       = slide.col || '#8899cc';
    spkEl.style.textShadow  = `0 0 22px ${slide.col || '#8899cc'}55`;
  }
  if (textEl) textEl.textContent = '';
  if (curEl)  curEl.style.display = 'inline';
  if (bgEl)   bgEl.style.background =
    `radial-gradient(ellipse 55% 90% at 18% 50%, ${slide.col || '#334488'}0d, transparent 70%)`;
  if (dotsEl) dotsEl.innerHTML = CS.slides.map((_, i) =>
    `<div class="cs-dot${i === CS.idx ? ' on' : ''}"></div>`).join('');

  // Effects
  if (S.gs) {
    if (slide.effect === 'shake') S.gs.shake = Math.max(S.gs.shake, 9);
    if (slide.effect === 'flash') S.gs.flashOvl = { a: 0.45, col: slide.col || '#ffffff' };
  }

  CS.charIdx = 0;
  csDrawPortrait(slide);
}

// ── Draw animated portrait on canvas each frame ───────────────
function csDrawPortrait(slide) {
  const canvas = document.getElementById('cs-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const CW = canvas.width, CH = canvas.height;
  ctx.clearRect(0, 0, CW, CH);
  ctx.fillStyle = '#010206';
  ctx.fillRect(0, 0, CW, CH);

  if (!slide.portrait) {
    ctx.font = 'bold 30px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#2a3460';
    ctx.fillText('◈', CW / 2, CH / 2);
    return;
  }

  const def = getDef(slide.portrait);
  if (!def) return;

  const sc2   = SCH[def.school] || SCH.arcane;
  const cx    = CW / 2, cy = CH / 2;
  const br    = 34;
  const pulse = Math.sin(CS.portraitT * 0.003) * 0.5 + 0.5;

  // Ambient glow background
  const grad = ctx.createRadialGradient(cx, cy, br * 0.4, cx, cy, CW * 0.7);
  grad.addColorStop(0, def.color + '1a');
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CW, CH);

  // Rune orbit
  const arms     = (def.visual && def.visual.runeArms) || 4;
  const runeSpd  = (def.visual && def.visual.runeSpeed) || 1;
  const runeAng  = CS.portraitT * 0.001 * runeSpd;
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle  = def.color;
  ctx.lineWidth    = 1;
  ctx.beginPath(); ctx.arc(cx, cy, br + 18, 0, PI2); ctx.stroke();
  for (let i = 0; i < arms; i++) {
    const ra = runeAng + (i / arms) * PI2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(ra) * (br + 18), cy + Math.sin(ra) * (br + 18));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Body
  ctx.shadowColor = sc2.glow;
  ctx.shadowBlur  = 20 + pulse * 16;
  ctx.fillStyle   = def.color;
  ctx.globalAlpha = 0.92;
  ctx.beginPath(); ctx.arc(cx, cy, br, 0, PI2); ctx.fill();

  ctx.fillStyle   = '#04050a';
  ctx.globalAlpha = 0.82;
  ctx.beginPath(); ctx.arc(cx, cy, br * 0.65, 0, PI2); ctx.fill();

  ctx.fillStyle   = sc2.glow;
  ctx.globalAlpha = 0.9;
  ctx.shadowBlur  = 12 + pulse * 10;
  ctx.beginPath(); ctx.arc(cx, cy, br * 0.28, 0, PI2); ctx.fill();
  ctx.shadowBlur  = 0;
  ctx.globalAlpha = 1;
}

// ── State machine — call every frame ─────────────────────────
function updateCutscene(dt) {
  if (!CS.active) return;
  CS.t += dt;
  CS.portraitT += dt;

  const slide = CS.slides[CS.idx];
  if (!slide) { endCutscene(); return; }

  // Portrait animates every frame
  csDrawPortrait(slide);

  const el      = document.getElementById('cs-overlay');
  const diagEl  = document.getElementById('cs-dialog');
  const textEl  = document.getElementById('cs-text');
  const curEl   = document.getElementById('cs-cursor');

  switch (CS.phase) {

    case 'fadein':
      CS.alpha = Math.min(1, CS.t / CS.FADE);
      if (el) el.style.opacity = CS.alpha;
      if (CS.t >= CS.FADE) { CS.phase = 'type'; CS.t = 0; }
      break;

    case 'type': {
      const ni = Math.min(slide.text.length, Math.floor(CS.t / CS.TYPE));
      if (ni !== CS.charIdx) {
        CS.charIdx = ni;
        if (textEl) textEl.textContent = slide.text.slice(0, CS.charIdx);
      }
      if (CS.charIdx >= slide.text.length) {
        CS.phase = 'hold'; CS.t = 0;
        if (curEl) curEl.style.display = 'none';
      }
      break;
    }

    case 'hold':
      if (CS.t >= CS.HOLD + (slide.duration || 0)) {
        CS.phase = CS.idx + 1 < CS.slides.length ? 'crossout' : 'fadeout';
        CS.t = 0;
      }
      break;

    case 'crossout':
      if (diagEl) diagEl.style.opacity = Math.max(0, 1 - CS.t / CS.CROSS);
      if (CS.t >= CS.CROSS) {
        CS.idx++;
        csSetupSlide();
        CS.phase = 'crossin'; CS.t = 0;
        if (diagEl) diagEl.style.opacity = '0';
      }
      break;

    case 'crossin':
      if (diagEl) diagEl.style.opacity = Math.min(1, CS.t / CS.CROSS);
      if (CS.t >= CS.CROSS) {
        if (diagEl) diagEl.style.opacity = '1';
        CS.phase = 'type'; CS.t = 0; CS.charIdx = 0;
        if (curEl) curEl.style.display = 'inline';
      }
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

// ================================================================
// APP STATE
// ================================================================
const S={
  units:[...BASE_UNITS],selected:['pyros','ironclad'],
  speed:1,paused:false,showIntel:false,
  gs:null,tab:'battle',editingId:null,editTab:'IDENTITY',
  liveHPs:[null,null],liveManas:[null,null],liveSigCharges:[0,0],
  lt:null,statsT:0,intelT:0,
};

let _restartDebounce = null;

// ================================================================
// STORY CHALLENGES — modal challenges that apply to the live battle
// ================================================================
const STORY_CHALLENGES = {
  barrier: {
    id: 'barrier',
    title: 'BREAK THE BARRIER',
    narrative: 'OORTHO\'s barrier regenerates faster than your signature can charge. Increase your unit\'s signature chargeRate above 1.5 to overwhelm it.',
    getInitialCode: () => {
      const def = getDef(S.selected[0]);
      return JSON.stringify({ magic: { sig: { ...(def && def.magic ? def.magic.sig : {}) } } }, null, 2);
    },
    validator(p) {
      const rate = p && p.magic && p.magic.sig && p.magic.sig.chargeRate;
      if (typeof rate !== 'number') return 'Must have a magic.sig.chargeRate number field';
      if (rate <= 1.5) return `chargeRate must exceed 1.5 — you wrote ${rate}`;
      if (rate > 5.0) return 'chargeRate cannot exceed 5.0 — the Forge would collapse';
      return null;
    },
    onSuccess(parsed) {
      const def = getDef(S.selected[0]);
      if (!def) return;
      def.magic.sig.chargeRate = parsed.magic.sig.chargeRate;
      if (S.gs) {
        const live = S.gs.units[0];
        if (live && live.def) {
          live.def = dc(def);
          live.def._speedBoost = 0;
          live.sigCharge = 0;
          live.flash = 1;
          live.flashCol = '#44ff88';
          pRing(S.gs.parts, live.x, live.y, '#44ff88', 14, 24);
          S.gs.shake = Math.max(S.gs.shake, 3);
        }
      }
      playCutscene('challenge_barrier_won');
    },
  },
  hp_boost: {
    id: 'hp_boost',
    title: 'REINFORCE YOUR UNIT',
    narrative: 'Your unit is dangerously low. Edit its HP to 350 or higher and its armor to at least 10 to survive the next assault.',
    getInitialCode: () => {
      const def = getDef(S.selected[0]);
      return JSON.stringify({ hp: def ? def.hp : 300, armor: def ? def.armor || 0 : 0 }, null, 2);
    },
    validator(p) {
      if (!p || typeof p.hp !== 'number') return 'Must have an "hp" number field';
      if (p.hp < 350) return `hp must be ≥ 350 — you wrote ${p.hp}`;
      if (typeof p.armor !== 'number') return 'Must have an "armor" number field';
      if (p.armor < 10) return `armor must be ≥ 10 — you wrote ${p.armor}`;
      return null;
    },
    onSuccess(parsed) {
      const def = getDef(S.selected[0]);
      if (!def) return;
      def.hp = parsed.hp;
      def.armor = parsed.armor;
      if (S.gs) {
        const live = S.gs.units[0];
        if (live) {
          live.def = dc(def);
          live.maxHp = parsed.hp;
          live.hp = Math.min(live.hp, parsed.hp);
          live.armor = parsed.armor;
          live.flash = 1;
          live.flashCol = '#44ff88';
          pRing(S.gs.parts, live.x, live.y, '#44ff88', 14, 24);
          S.gs.shake = Math.max(S.gs.shake, 3);
        }
      }
      playCutscene('challenge_hp_boost_won');
    },
  },
};

let _activeChallengeId = null;
let schValidationCache = null;

function openStoryChallenge(challengeId) {
  const ch = STORY_CHALLENGES[challengeId];
  if (!ch) return;
  _activeChallengeId = challengeId;
  S.paused = true;
  const code = ch.getInitialCode();
  const el = document.getElementById('modal');
  if (!el) return;
  const escapedCode = String(code).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  el.style.display = 'flex';
  el.innerHTML = `
  <div style="background:linear-gradient(145deg,#06080f,#0a0d1e);border:2px solid #cc44ff;border-radius:8px;width:640px;max-height:88vh;display:flex;flex-direction:column;margin:auto;box-shadow:0 0 60px rgba(204,68,255,.25)">
    <div style="padding:14px 18px;background:#0d0e28;border-bottom:1px solid #2a1e60;display:flex;gap:12px;align-items:flex-start">
      <div style="font-size:20px;flex-shrink:0">⚡</div>
      <div>
        <div style="font-size:11px;color:#cc44ff;letter-spacing:3px;font-weight:bold;margin-bottom:2px">${ch.title}</div>
        <div style="font-size:9px;color:#6677aa;line-height:1.65">${ch.narrative}</div>
      </div>
    </div>
    <div style="flex:1;overflow:hidden;display:flex;flex-direction:column;padding:14px 18px;gap:8px;min-height:0">
      <div style="font-size:8px;color:#3a4a70;letter-spacing:2px">EDIT JSON — CHANGES APPLY TO THE BATTLE</div>
      <div id="sch-val" class="json-val idle" style="margin:0">⬡ edit the JSON to meet the requirement</div>
      <div style="display:flex;gap:0;border:1px solid #131e38;border-radius:3px;overflow:hidden;background:#010306;flex:1;min-height:0">
        <pre id="sch-ln" style="margin:0;flex:0 0 34px;overflow:hidden;background:#02050b;color:#2a3870;font-family:'Courier New',monospace;font-size:10px;line-height:1.7;padding:10px 5px;text-align:right;user-select:none;white-space:pre">${jsonLineNumbers(code)}</pre>
        <textarea id="sch-ta" spellcheck="false"
          style="flex:1;background:transparent;border:none;outline:none;color:#b8ccdd;font-family:'Courier New',monospace;font-size:10px;line-height:1.7;padding:10px 12px;resize:none;caret-color:#cc44ff;tab-size:2;overflow:auto"
          oninput="schTaInput(this)"
          onscroll="document.getElementById('sch-ln').scrollTop=this.scrollTop"
          onkeydown="if(event.key==='Tab'){event.preventDefault();const s=this.selectionStart;this.setRangeText('  ',s,s,'end');this.dispatchEvent(new Event('input',{bubbles:true}))}"
        >${escapedCode}</textarea>
      </div>
      <div style="font-size:8px;color:#3a4a70;letter-spacing:1.5px">PREVIEW</div>
      <div id="sch-hl" class="json-hl" style="max-height:90px;flex-shrink:0">${jsonHL(code)}</div>
    </div>
    <div style="padding:10px 18px;border-top:1px solid #1a2050;display:flex;gap:8px;align-items:center">
      <button onclick="schFmt()" class="jbt">⊞ FORMAT</button>
      <button onclick="schReset('${challengeId}')" class="jbt">↺ RESET</button>
      <div style="flex:1"></div>
      <button onclick="schCancel()" style="background:transparent;border:1px solid #2a2040;color:#5566aa;padding:5px 14px;font-size:10px;font-family:monospace;border-radius:3px;cursor:pointer">BACK TO BATTLE</button>
      <button id="sch-sub" onclick="schSubmit()" disabled style="background:#0a0e28;border:1px solid #4455ff;color:#8899ff;padding:5px 14px;font-size:10px;font-family:monospace;border-radius:3px;cursor:pointer;opacity:.4;transition:all .15s">▶ APPLY TO BATTLE</button>
    </div>
  </div>`;
  const ta = document.getElementById('sch-ta');
  if (ta) {
    schTaInput(ta);
    ta.focus();
    ta.setSelectionRange(ta.value.length, ta.value.length);
  }
}

function schTaInput(ta) {
  const ch = STORY_CHALLENGES[_activeChallengeId];
  if (!ch || !ta) return;
  const code = ta.value;
  const ln = document.getElementById('sch-ln');
  const hl = document.getElementById('sch-hl');
  const val = document.getElementById('sch-val');
  const sub = document.getElementById('sch-sub');
  if (ln) ln.textContent = jsonLineNumbers(code);
  if (hl) hl.innerHTML = code ? jsonHL(code) : '<span style="color:#1a2540">// preview</span>';
  let vr;
  try {
    const parsed = JSON.parse(code);
    const err = ch.validator(parsed);
    vr = err ? { ok: false, msg: '○ ' + err } : { ok: true, parsed, msg: '✓ Valid — ready to apply to battle' };
  } catch (e) {
    vr = { ok: false, msg: '✗ ' + jsonSyntaxMessage(code, e) };
  }
  if (val) { val.className = 'json-val ' + (vr.ok ? 'ok' : 'err'); val.textContent = vr.msg; }
  if (sub) { sub.disabled = !vr.ok; sub.style.opacity = vr.ok ? '1' : '.4'; sub.style.borderColor = vr.ok ? '#44ffaa' : '#4455ff'; sub.style.color = vr.ok ? '#44ffaa' : '#8899ff'; }
  schValidationCache = vr;
}

function schSubmit() {
  const vr = schValidationCache;
  if (!vr || !vr.ok) return;
  const ch = STORY_CHALLENGES[_activeChallengeId];
  if (!ch) return;
  ch.onSuccess(vr.parsed);
  document.getElementById('modal').style.display = 'none';
  _activeChallengeId = null;
  S.paused = false;
}

function schCancel() {
  document.getElementById('modal').style.display = 'none';
  _activeChallengeId = null;
  S.paused = false;
}

function schFmt() {
  const ta = document.getElementById('sch-ta');
  if (!ta) return;
  try {
    ta.value = JSON.stringify(JSON.parse(ta.value), null, 2);
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  } catch {}
}

function schReset(challengeId) {
  const ch = STORY_CHALLENGES[challengeId];
  if (!ch) return;
  const ta = document.getElementById('sch-ta');
  if (!ta) return;
  ta.value = ch.getInitialCode();
  ta.dispatchEvent(new Event('input', { bubbles: true }));
}

// ================================================================
// BATTLE TUTORIAL STATE — guaranteed-coverage scheduler
// ================================================================
const TUT = {
  active:        false,
  fired:         new Set(),
  flavorQueue:   [],
  flavorT:       0,
  flavorInterval:13000, // ms between flavor lines (game-time, respects S.speed)
  challengeQueue: [],
  challengesFired: new Set(),
};

// Each story beat fires on its natural combat condition, OR after a forced
// deadline if that condition never naturally occurs — so every beat is
// guaranteed to play out exactly once per battle.
const TUT_BEATS = [
  {id:'half',  cs:'oortho_half_hp', forceAt:30000, test:(pHp,eHp)=> eHp>0 && eHp<=0.50},
  {id:'phurt', cs:'player_low_hp',  forceAt:42000, test:(pHp)=> pHp<=0.25},
  {id:'challenge_barrier', cs:'challenge_barrier', forceAt:52000, test:(pHp,eHp)=> eHp>0 && eHp<=0.40, challenge:'barrier'},
  {id:'sig',   cs:'player_sig',     forceAt:62000, test:(pHp,eHp,player)=> (player.sigFires||0)>0},
  {id:'challenge_hp', cs:'challenge_hp_boost', forceAt:76000, test:(pHp,eHp)=> pHp<=0.35, challenge:'hp_boost'},
  {id:'low',   cs:'oortho_low_hp',  forceAt:90000, test:(pHp,eHp)=> eHp>0 && eHp<=0.15},
];

function shuffleArr(a){
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

// ================================================================
// TUTORIAL CACHE LOCK & KEY SYSTEM
// ================================================================
const TUTORIAL_KEY='__unitforge_tutorial_seen';
const TUTORIAL_VERSION=1;
const BATTLE_TUTORIAL_KEY='__unitforge_battle_tutorial';
const BATTLE_TUTORIAL_VERSION=1;

const TutorialCache={
  hasSeen(){
    const cached=localStorage.getItem(TUTORIAL_KEY);
    return cached===`v${TUTORIAL_VERSION}`;
  },
  mark(){
    localStorage.setItem(TUTORIAL_KEY,`v${TUTORIAL_VERSION}`);
  },
  reset(){
    localStorage.removeItem(TUTORIAL_KEY);
  },
  getStatus(){
    return{seen:this.hasSeen(),version:TUTORIAL_VERSION,timestamp:localStorage.getItem(TUTORIAL_KEY+'_ts')||'unknown'};
  },
  hasDoneBattleTutorial(){
    return localStorage.getItem(BATTLE_TUTORIAL_KEY)===`v${BATTLE_TUTORIAL_VERSION}`;
  },
  markBattleTutorialDone(){
    localStorage.setItem(BATTLE_TUTORIAL_KEY,`v${BATTLE_TUTORIAL_VERSION}`);
  },
  resetBattleTutorial(){
    localStorage.removeItem(BATTLE_TUTORIAL_KEY);
  },
};

function showTutorial(){const el=document.querySelector('.tutorial-overlay');if(el)el.classList.add('active');}
function hideTutorial(){const el=document.querySelector('.tutorial-overlay');if(el)el.classList.remove('active');}
function renderTutorial(){const t='tutorial';document.getElementById('app').innerHTML=`${nav(t)}${tutorialHtml()}`;TutorialCache.mark();}

function tutorialHtml(){
  return`<div class="tutorial-page">
    <div class="tutorial-hero">
      <div class="tutorial-hero-badge">⚔ UNIT FORGE</div>
      <div class="tutorial-hero-title">Interactive Combat Simulator</div>
      <div class="tutorial-hero-copy">Learn the Forge through dedicated pages for battle, roster, editor, and JSON. Each screen is a focused workspace rather than one stacked cluster.</div>
    </div>
    <div class="tutorial-grid">
      <div class="tutorial-card">
        <div class="tutorial-card-title">🎯 Quick Start</div>
        <div class="tutorial-card-body">Design units, tune their stats, and watch the combat engine react instantly. Every screen is built to feel like its own page.</div>
      </div>
      <div class="tutorial-card">
        <div class="tutorial-card-title">⚔ Battle</div>
        <div class="tutorial-card-body">Pick your combatants, restart matches, pause the action, and inspect the live AI decisions from a focused battle view.</div>
        <div class="tutorial-badges"><span class="tutorial-badge">RESTART</span><span class="tutorial-badge">PAUSE</span><span class="tutorial-badge">INTEL</span></div>
      </div>
      <div class="tutorial-card">
        <div class="tutorial-card-title">◈ Roster</div>
        <div class="tutorial-card-body">Browse the built-in roster, create new units, and send them into battle from their own dedicated page.</div>
        <div class="tutorial-badges"><span class="tutorial-badge">FIGHT</span><span class="tutorial-badge">EDIT</span><span class="tutorial-badge">NEW</span></div>
      </div>
      <div class="tutorial-card">
        <div class="tutorial-card-title">⚙ Editor</div>
        <div class="tutorial-card-body">Fine-tune identity, combat stats, visuals, magic, melee, ranged combat, and AI behavior through modular sections.</div>
      </div>
      <div class="tutorial-card">
        <div class="tutorial-card-title">✨ Schools &amp; Passives</div>
        <div class="tutorial-card-body">Experiment with fire, frost, storm, shadow, void, holy, and more. Stack passives for powerful synergies.</div>
      </div>
      <div class="tutorial-card tutorial-card-accent">
        <div class="tutorial-card-title">⚔ OORTHO BATTLE TUTORIAL</div>
        <div class="tutorial-card-body">Face the Arcane Sentinel and learn spell timing, signature abilities, positioning, and status effects through a guided duel.</div>
        <div class="tutorial-actions">
          <button class="tutorial-action-btn" onclick="showBattleTutorialMenu()">▶ START BATTLE TUTORIAL</button>
          <button class="tutorial-action-btn ghost" onclick="TutorialCache.resetBattleTutorial()">↻ RESET</button>
        </div>
      </div>
    </div>
    <div class="tutorial-footer-bar">
      <div class="tutorial-status">Tutorial State: ${TutorialCache.hasSeen()?'✓ Seen':'○ New'} · Version v${TUTORIAL_VERSION}</div>
      <div class="tutorial-actions">
        <button class="tutorial-action-btn ghost" onclick="TutorialCache.reset();location.reload()">↻ RESET</button>
        <button class="tutorial-action-btn primary" onclick="setTab('battle')">→ OPEN BATTLE</button>
      </div>
    </div>
  </div>`;
}

// ================================================================
// BATTLE TUTORIAL FUNCTIONS
// ================================================================
function startBattleTutorial(){
  S.selected[0] = 'pyros';
  S.selected[1] = 'oortho';
  TUT.active    = true;
  TUT.fired.clear();
  TUT.flavorT   = 0;
  TUT.flavorQueue = shuffleArr([...CS_FLAVOR]);
  TUT.challengeQueue = [];
  TUT.challengesFired.clear();
  restartGame(true);
  setTab('battle');
  setTimeout(() => playCutscene('oortho_intro'), 400);
}

// Guaranteed-coverage tick: every story beat and every flavor line will
// play exactly once per battle, either on its natural trigger or by a
// forced deadline. This function never returns a value — it only ever
// produces side effects (playCutscene calls) and must stay void.
function tickTutorial(gs, dt){
  if(!TUT.active || !gs || CS.active || gs.winner) return;
  const player = gs.units[0], enemy = gs.units[1];
  if(!player || !enemy) return;

  if(TUT.challengeQueue.length){
    const cid = TUT.challengeQueue.shift();
    if(cid && !TUT.challengesFired.has(cid)){
      TUT.challengesFired.add(cid);
      openStoryChallenge(cid);
    }
    return;
  }

  const pHp = player.hp / player.maxHp;
  const eHp = enemy.alive ? enemy.hp / enemy.maxHp : 0;
  const scaledTime = gs.time;

  if(!TUT.fired.has('dead') && gs.winner){
    TUT.fired.add('dead');
    TUT.active = false;
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
    const forced  = scaledTime >= beat.forceAt;
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
  el.innerHTML=`<div class="m-box" style="border:2px solid #7766ff;width:520px">
    <div class="m-hdr" style="background:linear-gradient(90deg,#0d0e28,#1a1e40);border-bottom:2px solid #2a3060">
      <div class="dot" style="width:10px;height:10px;background:#7766ff;box-shadow:0 0 8px #7766ff"></div>
      <span style="color:#aabbff;font-size:12px;font-weight:bold;letter-spacing:2px">⚔ BATTLE TUTORIAL</span>
    </div>
    <div class="m-body">
      <div style="font-size:10px;color:var(--text);margin-bottom:16px">
        <strong style="display:block;margin-bottom:8px;color:#aabbff">LEARN COMBAT FUNDAMENTALS</strong>
        <p style="color:#8899cc;margin-bottom:12px">Face off against OORTHO, the Arcane Sentinel. Through a series of guided challenges, you'll master:</p>
        <ul style="margin-left:16px;color:#8899cc;font-size:9px;line-height:1.7">
          <li>⚡ Casting spells and managing mana</li>
          <li>💫 Building and unleashing signature abilities</li>
          <li>🏃 Positioning and movement tactics</li>
          <li>🛡️ Handling status effects</li>
          <li>🎯 Adapting to powerful AI opponents</li>
        </ul>
      </div>
      <div style="background:#0a0d1e;border:1px solid #1a2050;border-radius:4px;padding:12px;margin-bottom:12px;font-size:9px;color:#5566aa">
        <div style="margin-bottom:6px"><strong>📊 OPPONENT: OORTHO</strong></div>
        <div>The Arcane Sentinel uses spiral magic, chain lightning, and devastating beam attacks. High durability with adaptive AI. Difficulty: 7/10</div>
      </div>
      <div style="background:#0a0d1e;border:1px solid #1a2050;border-radius:4px;padding:12px;font-size:9px;color:#5566aa">
        <div style="margin-bottom:6px"><strong>🔥 YOUR UNIT: PYROS</strong></div>
        <div>The Pyromancer uses fire-based spread spells and powerful nova signature. Berserker passive. Perfect for learning aggressive tactics.</div>
      </div>
    </div>
    <div class="m-foot">
      <button onclick="document.getElementById('modal').style.display='none'" style="background:transparent;border:1px solid var(--border);color:var(--dim);padding:5px 14px;font-size:11px;font-family:monospace;border-radius:3px;cursor:pointer">CANCEL</button>
      <button onclick="startBattleTutorial();document.getElementById('modal').style.display='none'" style="background:#120e30;border:1px solid var(--acc);color:var(--acc);padding:5px 14px;font-size:11px;font-family:monospace;border-radius:3px;cursor:pointer">▶ START TUTORIAL</button>
    </div>
  </div>`;
}

function getDef(id){return S.units.find(u=>u.id===id);}
function hpCol(r){return r>.5?'#44ff88':r>.25?'#ffaa44':'#ff3344';}

function buildTutorialBattleDef(def, slot){
  const out=dc(def);
  if(!TUT.active) return out;
  if(slot===0 && out.id==='pyros'){
    out.hp=1500;
    out.armor=60;
    out.spd=1.25;
    out.magic.spell.dmg=8;
    out.magic.spell.cd=1500;
    out.magic.mana.max=220;
    out.magic.sig.power=70;
    out.magic.sig.chargeRate=0.42;
    out.magic.sig.autoThreshold=.95;
    out.ai.aggression=0.3;
    out.ai.keepDistance=0.8;
    out.passive.power=0.18;
    out.passive2.power=0.18;
  }
  if(slot===1 && out.id==='oortho'){
    out.hp=2600;
    out.armor=110;
    out.spd=0.95;
    out.magic.spell.dmg=10;
    out.magic.spell.cd=1800;
    out.magic.mana.max=280;
    out.magic.sig.power=95;
    out.magic.sig.chargeRate=0.33;
    out.magic.sig.autoThreshold=.95;
    out.ai.aggression=0.4;
    out.ai.keepDistance=0.15;
    out.passive.power=0.3;
    out.passive2.power=0.3;
  }
  return out;
}

function restartGame(forceTutorialMode=false){
  const d0=getDef(S.selected[0]),d1=getDef(S.selected[1]);if(!d0||!d1)return;
  const tutorialMode = forceTutorialMode || TUT.active;
  if (CS.active) endCutscene();
  const bd0=buildTutorialBattleDef(d0,0);
  const bd1=buildTutorialBattleDef(d1,1);
  S.gs=initGs(bd0,bd1);
  S.gs.resultCutscenePlayed=false;
  S.liveHPs=[bd0.hp,bd1.hp];
  S.liveManas=[bd0.magic.enabled?bd0.magic.mana.max*.65:0,bd1.magic.enabled?bd1.magic.mana.max*.65:0];
  S.liveSigCharges=[0,0];S.lt=null;
  TUT.active = tutorialMode;
  if(TUT.active){
    TUT.fired.clear();
    TUT.flavorT=0;
    TUT.flavorQueue=shuffleArr([...CS_FLAVOR]);
    TUT.challengeQueue=[];
    TUT.challengesFired.clear();
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
  return t.join('');
}

// ================================================================
// SIDE PANEL HTML
// ================================================================
function panelHTML(side){
  const sel=S.selected[side],def=getDef(sel);
  const hp=S.liveHPs[side],mana=S.liveManas[side],sig=S.liveSigCharges[side]||0;
  const hpVal=hp!==null?hp:(def?def.hp:0);
  const hpPct=def?Math.max(0,hpVal/def.hp):1;
  const manaPct=def&&def.magic.enabled?Math.max(0,(mana!==null?mana:def.magic.mana.max*.65)/(def.magic.mana.max||1)):0;
  const hc=hpCol(hpPct),col=def?def.color:'#7766ff';
  let info='';
  if(def){
    const prio=def.ai.priority,mp=Math.max(prio.magic||0,prio.melee||0,prio.ranged||0);
    const pa=PASSIVES[def.passive&&def.passive.id]||PASSIVES.none;
    const pa2=PASSIVES[def.passive2&&def.passive2.id]||PASSIVES.none;
    info=`<div class="side-info">
      <div style="display:flex;align-items:center;gap:7px;margin-bottom:5px">
        <div class="dot" style="width:11px;height:11px;background:${col};box-shadow:0 0 7px ${col}"></div>
        <span style="color:${col};font-size:11px;font-weight:bold;letter-spacing:2px;flex:1">${def.name}</span>
        <button class="mb" onclick="goEdit('${def.id}')">EDIT</button>
      </div>
      <div style="margin-bottom:5px;line-height:1.8">${mkTags(def)}</div>
      <p style="font-size:9px;color:var(--dim);line-height:1.5;margin:0 0 8px">${def.desc}</p>
      <div style="margin-bottom:4px"><div style="display:flex;justify-content:space-between;margin-bottom:2px"><span style="font-size:9px;color:var(--dim)">HP</span><span id="ht${side}" style="font-size:9px;color:${hc}">${Math.max(0,Math.round(hpVal))}/${def.hp}</span></div><div class="bar-bg" style="height:5px"><div id="hb${side}" class="bar-f" style="width:${hpPct*100}%;height:5px;background:${hc}"></div></div></div>
      ${def.magic.enabled?`<div style="margin-bottom:4px"><div style="display:flex;justify-content:space-between;margin-bottom:2px"><span style="font-size:9px;color:var(--dim)">MANA</span><span id="mt${side}" style="font-size:9px;color:${col}">${Math.round(mana!==null?mana:def.magic.mana.max*.65)}/${def.magic.mana.max}</span></div><div class="bar-bg" style="height:3px"><div id="mb${side}" class="bar-f" style="width:${manaPct*100}%;height:3px;background:${col};box-shadow:0 0 4px ${col}"></div></div></div>`:''}
      ${def.magic.enabled&&def.magic.sig.type!=='none'?`<div style="margin-bottom:4px"><div style="display:flex;justify-content:space-between;margin-bottom:2px"><span style="font-size:9px;color:var(--dim)">SIG (${def.magic.sig.type.toUpperCase()})</span><span id="ct${side}" style="font-size:9px;color:${col}">${Math.round(sig*100)}%</span></div><div class="bar-bg" style="height:3px"><div id="cb${side}" class="bar-f" style="width:${sig*100}%;height:3px;background:${col};box-shadow:0 0 4px ${col}"></div></div></div>`:''}
      <div style="font-size:9px;color:var(--dim);margin-bottom:7px" id="st${side}"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;margin-bottom:7px">
        ${['magic','melee','ranged'].map(m=>{const v=prio[m]||0;const isMx=v===mp&&v>0;const en2=def[m==='magic'?'magic':m].enabled;return`<div style="background:${isMx?'#120e30':'var(--bg)'};border:1px solid ${isMx?col:'var(--border)'};border-radius:3px;padding:3px 2px;text-align:center"><div style="font-size:8px;color:${isMx?col:'var(--dim)'}">${m.toUpperCase()}</div><div style="font-size:10px;font-weight:bold;color:${isMx?col:en2?'var(--text)':'var(--dim)'}">${Math.round(v*100)}%</div></div>`;}).join('')}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 5px;border-top:1px solid var(--border);padding-top:6px">
        <div class="srow"><span class="sl">STANCE</span><span class="sv">${def.ai.stance.slice(0,7).toUpperCase()}</span></div>
        <div class="srow"><span class="sl">SPD</span><span class="sv">${def.spd}</span></div>
        <div class="srow"><span class="sl">ARMOR</span><span class="sv">${def.armor}</span></div>
        <div class="srow"><span class="sl">PASSIVE</span><span class="sv" style="color:#8899ff;font-size:9px">${pa.name}</span></div>
        ${pa2.name!=='NONE'?`<div class="srow" style="grid-column:1/-1"><span class="sl">PASSIVE 2</span><span class="sv" style="color:#8899ff;font-size:9px">${pa2.name}</span></div>`:''}
      </div>
    </div>`;
  }
  const list=S.units.map(u=>`<div class="u-card ${u.id===sel?'sel':''}" style="${u.id===sel?'border-color:'+u.color+';box-shadow:0 0 7px '+u.color+'22':''}" onclick="selectUnit(${side},'${u.id}')">
    <div style="display:flex;align-items:center;gap:5px;margin-bottom:2px">
      <div class="dot" style="width:8px;height:8px;background:${u.color};box-shadow:0 0 4px ${u.color}"></div>
      <span style="font-size:10px;color:${u.color};font-weight:bold;flex:1">${u.name}</span>
      <button class="mb" onclick="event.stopPropagation();goEdit('${u.id}')">EDIT</button>
    </div>
    <div style="margin-bottom:2px;line-height:1.6">${mkTags(u)}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1px 4px">
      <span style="font-size:9px"><span class="sl">HP </span>${u.hp}</span>
      <span style="font-size:9px"><span class="sl">ARM </span>${u.armor}</span>
      <span style="font-size:9px"><span class="sl">SPD </span>${u.spd}</span>
    </div>
  </div>`).join('');
  return`${info}<div class="side-list"><div style="font-size:9px;color:var(--dim);letter-spacing:2px;margin-bottom:6px">SELECT UNIT</div>${list}</div>`;
}

// ================================================================
// NAV + VIEWS
// ================================================================
function nav(active){
  const jRank=JsonFreedom.getRank();
  const tabs=[
    {id:'battle',  icon:'⚔', label:'BATTLE',   desc:'Watch units fight'},
    {id:'roster',  icon:'◈', label:'ROSTER',   desc:'Browse all units'},
    {id:'editor',  icon:'⚙', label:'EDITOR',   desc:'Customize a unit'},
    {id:'tutorial',icon:'📚',label:'TUTORIAL', desc:'Learn the basics'},
    {id:'json',    icon:'⚡', label:'JSON IDE', desc:['LOCKED','READER','STUDENT','CODER','MASTER'][jRank]},
  ];
  return`<div class="hdr">
    <div style="display:flex;flex-direction:column;gap:1px">
      <span style="font-size:13px;color:var(--acc);letter-spacing:4px;font-weight:bold;line-height:1">UNIT FORGE</span>
      <span style="font-size:7px;color:var(--dim);letter-spacing:2px">COMBAT SIMULATOR</span>
    </div>
    <div style="margin-left:auto;display:flex;gap:5px;align-items:center">
      ${tabs.map(t=>`<button class="nav-btn ${active===t.id?'on':''}" onclick="setTab('${t.id}')">
        <span class="nb-icon">${t.icon}</span>
        <span class="nb-label">${t.label}</span>
        <span class="nb-desc">${t.desc}</span>
      </button>`).join('')}
      <div style="width:1px;height:36px;background:var(--border);margin:0 3px"></div>
      <button onclick="showHelp()" style="background:transparent;border:1px solid #1a2040;color:#3a4a70;padding:4px 10px;font-size:9px;font-family:monospace;border-radius:3px;cursor:pointer;transition:all .15s;letter-spacing:.5px" onmouseover="this.style.borderColor='#4455aa';this.style.color='#8899cc'" onmouseout="this.style.borderColor='#1a2040';this.style.color='#3a4a70'">? HOW TO PLAY</button>
    </div>
  </div>`;
}

function showHelp(){
  const el=document.getElementById('modal');
  el.style.display='flex';
  el.innerHTML=`<div class="help-box">
    <div class="m-hdr" style="border-color:#1a2050">
      <span style="color:var(--acc);font-size:13px;letter-spacing:3px;font-weight:bold">HOW TO PLAY</span>
      <span style="font-size:9px;color:var(--dim);margin-left:8px">UNIT FORGE GUIDE</span>
    </div>
    <div class="m-body">
      <p style="font-size:9px;color:var(--dim);margin-bottom:14px;line-height:1.6">Unit Forge is a non-linear combat simulator. There's no set progression — explore any tab at any time.</p>
      <div class="help-step">
        <div class="help-step-num">1</div>
        <div class="help-step-body">
          <div class="help-step-title">⚔ BATTLE — Watch the fight</div>
          <div class="help-step-desc">Two units battle in real time on the arena canvas. Use the side panels to select which units fight. Hit <strong style="color:#aabb88">RESTART</strong> to run a new match, <strong style="color:#ffaa44">PAUSE</strong> to freeze the action, and <strong style="color:#aabbff">INTEL</strong> to open the live AI decision panel — it shows each unit's decision tree, cooldowns, and action log in real time.</div>
        </div>
      </div>
      <div class="help-step">
        <div class="help-step-num">2</div>
        <div class="help-step-body">
          <div class="help-step-title">◈ ROSTER — Browse & deploy</div>
          <div class="help-step-desc">All available units are shown here as cards. Hit <strong style="color:#44ff88">FIGHT</strong> to send a unit into battle instantly, or <strong style="color:#8899ff">EDIT</strong> to open that unit in the Editor. Use <strong style="color:var(--acc)">+ NEW UNIT</strong> to create one from scratch.</div>
        </div>
      </div>
      <div class="help-step">
        <div class="help-step-num">3</div>
        <div class="help-step-body">
          <div class="help-step-title">⚙ EDITOR — Build your unit</div>
          <div class="help-step-desc">Seven tabs control every aspect of a unit: <strong style="color:#aaa">IDENTITY</strong> (name, school, passives), <strong style="color:#aaa">CORE</strong> (HP, speed, armor), <strong style="color:#aaa">VISUAL</strong> (glow, aura, rune), <strong style="color:#aaa">MAGIC/MELEE/RANGED</strong> (attack systems), and <strong style="color:#aaa">BEHAVIOR</strong> (AI stance & sliders). All changes save instantly. Hit <strong style="color:#44ff88">TEST IN BATTLE</strong> to see the unit fight live.</div>
        </div>
      </div>
      <div style="margin-top:12px;padding:9px 11px;background:#040810;border:1px solid #1a2040;border-radius:4px">
        <div style="font-size:9px;color:#5566aa;letter-spacing:1px;margin-bottom:5px">💡 PRO TIP</div>
        <div style="font-size:9px;color:var(--dim);line-height:1.6">Enable <strong style="color:#aabbff">INTEL</strong> in Battle while tweaking sliders in the Editor — you can see the AI's priorities update in real time. Use <strong style="color:#aabb88">EXPORT JSON</strong> in the Editor to save any unit definition.</div>
      </div>
    </div>
    <div class="m-foot" style="border-color:#1a2050">
      <button onclick="document.getElementById('modal').style.display='none'" style="background:#120e30;border:1px solid var(--acc);color:var(--acc);padding:6px 18px;font-size:11px;font-family:monospace;border-radius:3px;cursor:pointer">GOT IT</button>
    </div>
  </div>`;
}

function renderBattle(){
  const d0=getDef(S.selected[0]),d1=getDef(S.selected[1]);
  const showOB=!localStorage.getItem('cf_ob_dismissed');
  document.getElementById('app').innerHTML=`${nav('battle')}
  <div id="onboard-bar" class="onboard-bar${showOB?'':' hidden'}">
    <span style="font-size:9px;color:#4455aa;letter-spacing:1px;font-weight:bold">QUICK START</span>
    <span class="ob-arrow">›</span>
    <div class="ob-step active"><span class="ob-num">1</span><span>Select units in the side panels</span></div>
    <span class="ob-arrow">›</span>
    <div class="ob-step"><span class="ob-num">2</span><span>Hit <strong style="color:#8899ff">RESTART</strong> to run a new match</span></div>
    <span class="ob-arrow">›</span>
    <div class="ob-step"><span class="ob-num">3</span><span>Enable <strong style="color:#aabbff">LIVE INTEL</strong> to see AI decisions</span></div>
    <span class="ob-arrow">›</span>
    <div class="ob-step"><span class="ob-num">4</span><span>Go to <strong style="color:var(--acc)">EDITOR</strong> to customize units</span></div>
    <button class="ob-close" onclick="dismissOnboard()" title="Dismiss">✕</button>
  </div>
  <div class="content"><div class="battle">
    <div class="side side-l" id="panel-0">${panelHTML(0)}</div>
    <div class="arena-wrap">
      <div id="battle-overlay-layer" class="battle-overlay-layer"></div>
      <canvas id="cv" width="${W}" height="${H}"></canvas>

      <!-- REDESIGNED CONTROL BAR -->
      <div class="ctrl">
        <!-- MATCH CONTROLS -->
        <span style="font-size:7px;color:#2a3460;letter-spacing:1px;text-transform:uppercase">Match</span>
        <div class="tip-host">
          <button class="c-btn c-btn-restart" onclick="restartGame()">↺ RESTART</button>
          <div class="tip"><div class="tip-title">↺ RESTART</div><div class="tip-body">Reset the fight with current unit selections. Units respawn at full HP and mana.</div></div>
        </div>
        <div class="tip-host">
          <button class="c-btn c-btn-pause ${S.paused?'on':''}" id="pbtn" onclick="togglePause()">${S.paused?'▶ RESUME':'⏸ PAUSE'}</button>
          <div class="tip"><div class="tip-title">${S.paused?'▶ RESUME':'⏸ PAUSE'}</div><div class="tip-body">Freeze or resume the battle simulation. Useful for reading the Intel panel.</div></div>
        </div>

        <div class="ctrl-divider"></div>

        <!-- SPEED CONTROLS -->
        <span style="font-size:7px;color:#2a3460;letter-spacing:1px;text-transform:uppercase">Speed</span>
        <div class="tip-host">
          <div class="spd-box">${[.5,1,2,3].map(s=>`<button class="spd-btn ${S.speed===s?'on':''}" onclick="setSpeed(${s})">${s}x</button>`).join('')}</div>
          <div class="tip"><div class="tip-title">SIMULATION SPEED</div><div class="tip-body">0.5x for slow-motion analysis. 3x to fast-forward to the result.</div></div>
        </div>

        <div class="ctrl-divider"></div>

        <!-- INTEL (PROMINENT) -->
        <div class="tip-host">
          <button class="intel-btn ${S.showIntel?'on':''}" id="ibtn" onclick="toggleIntel()">
            <span class="intel-dot"></span>
            <span style="display:flex;flex-direction:column;align-items:flex-start">
              <span>LIVE INTEL</span>
              <span class="intel-label">${S.showIntel?'PANEL OPEN':'AI DECISIONS'}</span>
            </span>
          </button>
          <div class="tip" style="min-width:180px"><div class="tip-title">📊 LIVE INTEL PANEL</div><div class="tip-body">Opens a real-time AI debug panel below the arena. Shows each unit's decision tree, attack cooldowns, intent state (CLOSING / ENGAGING / RETREATING), and the last 8 actions taken. The pulsing dot means data is streaming.</div></div>
        </div>
      </div>

      <div style="font-size:10px;color:var(--dim);letter-spacing:2px">
        <span style="color:${d0?d0.color:'#fff'}">${d0?d0.name:'?'}</span>
        <span style="color:var(--border);margin:0 12px">VS</span>
        <span style="color:${d1?d1.color:'#fff'}">${d1?d1.name:'?'}</span>
      </div>
      <div id="intel-panel" style="width:100%;max-width:900px;display:${S.showIntel?'block':'none'}"></div>
    </div>
    <div class="side side-r" id="panel-1">${panelHTML(1)}</div>
  </div></div>`;
  if(!S.gs)restartGame();
}

function dismissOnboard(){
  localStorage.setItem('cf_ob_dismissed','1');
  const el=document.getElementById('onboard-bar');
  if(el)el.classList.add('hidden');
}

function renderRoster(){
  document.getElementById('app').innerHTML=`${nav('roster')}<div class="content"><div class="roster-v">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
      <span style="font-size:13px;color:var(--text);letter-spacing:2px">UNIT ROSTER</span>
      <span style="font-size:9px;color:var(--dim)">${S.units.length} units</span>
      <button onclick="newUnit()" style="margin-left:auto;background:#120e30;border:1px solid var(--acc);color:var(--acc);padding:6px 14px;font-size:10px;font-family:monospace;border-radius:3px;cursor:pointer">+ NEW UNIT</button>
    </div>
    <div class="r-grid">${S.units.map(def=>`<div class="r-card">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
        <div class="dot" style="width:11px;height:11px;background:${def.color};box-shadow:0 0 6px ${def.color}"></div>
        <span style="font-size:12px;color:${def.color};font-weight:bold;letter-spacing:2px;flex:1">${def.name}</span>
        <button class="mb" onclick="goEdit('${def.id}')">EDIT</button>
        <button class="mb fight" onclick="selectForBattle('${def.id}')">FIGHT</button>
      </div>
      <div style="margin-bottom:6px;line-height:1.8">${mkTags(def)}</div>
      <p style="font-size:9px;color:var(--dim);line-height:1.5;margin-bottom:8px">${def.desc}</p>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:2px 6px;border-top:1px solid var(--border);padding-top:6px">
        <div class="srow"><span class="sl">HP</span><span class="sv">${def.hp}</span></div>
        <div class="srow"><span class="sl">ARM</span><span class="sv">${def.armor}</span></div>
        <div class="srow"><span class="sl">SPD</span><span class="sv">${def.spd}</span></div>
        <div class="srow"><span class="sl">STANCE</span><span class="sv">${def.ai.stance.slice(0,5).toUpperCase()}</span></div>
        <div class="srow"><span class="sl">SIG</span><span class="sv" style="color:${def.magic.enabled&&def.magic.sig.type!=='none'?def.color:'var(--dim)'}">${def.magic.enabled?def.magic.sig.type.toUpperCase():'NONE'}</span></div>
        <div class="srow"><span class="sl">CRIT</span><span class="sv">${Math.round((def.magic.enabled?def.magic.spell.critChance:def.melee.enabled?def.melee.critChance:def.ranged.critChance||.1)*100)}%</span></div>
      </div>
    </div>`).join('')}
    </div></div></div>`;
}

// ================================================================
// INLINE EDITOR (full page, not modal)
// ================================================================
function renderEditor(){
  const def=S.editingId?getDef(S.editingId):null;
  const TABS=['IDENTITY','CORE','VISUAL','MAGIC','MELEE','RANGED','BEHAVIOR'];
  const col=def?def.color:S.acc||'#7766ff';
  document.getElementById('app').innerHTML=`${nav('editor')}<div class="content"><div class="editor-v">
    <!-- Left: unit list -->
    <div class="ed-left">
      <div class="ed-left-hdr">
        <div style="font-size:9px;color:var(--dim);letter-spacing:2px;margin-bottom:7px">SELECT UNIT TO EDIT</div>
        <button onclick="newUnit()" style="width:100%;background:#120e30;border:1px solid var(--acc);color:var(--acc);padding:5px;font-size:10px;font-family:monospace;border-radius:3px;cursor:pointer">+ NEW UNIT</button>
      </div>
      <div class="ed-left-list">${S.units.map(u=>`<div class="u-card ${u.id===S.editingId?'sel':''}" style="${u.id===S.editingId?'border-color:'+u.color+';box-shadow:0 0 7px '+u.color+'22':''}" onclick="setEditId('${u.id}')">
        <div style="display:flex;align-items:center;gap:5px;margin-bottom:2px">
          <div class="dot" style="width:8px;height:8px;background:${u.color};box-shadow:0 0 4px ${u.color}"></div>
          <span style="font-size:10px;color:${u.color};font-weight:bold;flex:1">${u.name}</span>
          <button class="mb" onclick="event.stopPropagation();dupUnit('${u.id}')" style="font-size:7px;padding:1px 4px">DUP</button>
          <button class="mb" onclick="event.stopPropagation();deleteUnit('${u.id}')" style="font-size:7px;padding:1px 4px;border-color:#ff4455;color:#ff4455">DEL</button>
        </div>
        <div style="line-height:1.6">${mkTags(u)}</div>
      </div>`).join('')}
      </div>
    </div>
    <!-- Right: editor panels -->
    <div class="ed-right">
      ${def?`
      <div class="ed-tabs">${TABS.map(t=>`<button class="ed-tab ${t===S.editTab?'on':''}" style="${t===S.editTab?'border-color:'+col+';color:'+col:''}" onclick="setEdTab('${t}')">${t}</button>`).join('')}
        <div style="margin-left:auto;display:flex;gap:6px;align-items:center">
          <button onclick="exportUnit('${def.id}')" style="background:transparent;border:1px solid var(--border);color:var(--dim);font-size:9px;padding:2px 9px;border-radius:3px;cursor:pointer">EXPORT JSON</button>
          <button onclick="testUnit('${def.id}')" style="background:#120e30;border:1px solid #44ff88;color:#44ff88;font-size:9px;padding:2px 9px;border-radius:3px;cursor:pointer">TEST IN BATTLE</button>
        </div>
      </div>
      <div class="ed-body" id="ed-body"></div>
      <div class="ed-footer">
        <div class="dot" style="width:10px;height:10px;background:${col};box-shadow:0 0 8px ${col}"></div>
        <span style="color:${col};font-size:11px;font-weight:bold;letter-spacing:2px">${def.name}</span>
        <span style="font-size:9px;color:var(--dim);margin-left:8px">HP:${def.hp} SPD:${def.spd} ARM:${def.armor}</span>
        ${S.gs && (S.selected[0] === def.id || S.selected[1] === def.id) ? `<button onclick="applyEditorToLiveBattle('${def.id}')" style="margin-left:auto;background:#041a0a;border:1px solid #44ff88;color:#44ff88;font-size:9px;padding:2px 9px;border-radius:3px;cursor:pointer;animation:dirtyPulse 1.5s ease-in-out infinite">⚡ APPLY LIVE</button>` : `<span style="margin-left:auto;font-size:9px;color:var(--dim)">changes save instantly</span>`}
      </div>
      `:`<div style="flex:1;display:flex;align-items:center;justify-content:center;color:var(--dim);font-size:11px;letter-spacing:2px">SELECT A UNIT TO EDIT</div>`}
    </div>
  </div></div>`;
  if(def)renderEditorBody();
}

function renderEditorBody(){
  const def=getDef(S.editingId);if(!def)return;
  const el=document.getElementById('ed-body');if(!el)return;
  const c=def.color;const t=S.editTab;let html='';

  if(t==='IDENTITY'){
    html=`<div class="sec">IDENTITY</div>
    <div class="ig"><div class="il">NAME</div><input class="ti" style="color:${c};font-size:12px" value="${def.name}" maxlength="12" oninput="liveSet('${def.id}','name',this.value.toUpperCase().slice(0,12));this.value=this.value.toUpperCase().slice(0,12);refreshEdFooter()"></div>
    <div class="ig"><div class="il">MAGIC SCHOOL (sets color)</div>
      <div style="display:flex;flex-wrap:wrap;gap:3px">${Object.keys(SCH).map(sk=>{const sc=SCH[sk];return`<button class="sb${def.school===sk?' on':''}" style="${def.school===sk?'border-color:'+sc.color+';color:'+sc.color:''}" onclick="setSchool('${def.id}','${sk}',this.parentNode)">${sc.name}</button>`;}).join('')}</div>
    </div>
    <div class="ig"><div class="il">CUSTOM COLOR OVERRIDE</div>
      <div style="display:flex;align-items:center;gap:10px"><input type="color" value="${c}" oninput="liveSet('${def.id}','color',this.value);refreshEdFooter()" style="border:none;background:none;cursor:pointer;width:40px;height:30px"><span style="font-size:11px;color:${c};font-weight:bold">${c}</span></div>
    </div>
    <div class="ig"><div class="il">DESCRIPTION</div><textarea class="ta" rows="3" oninput="liveSet('${def.id}','desc',this.value)">${def.desc}</textarea></div>
    <div class="sec">PASSIVE ABILITIES</div>
    <p style="font-size:9px;color:var(--dim);margin-bottom:10px;line-height:1.6">Passives are always-on effects that shape the unit's character beyond active combat choices.</p>
    <div class="two-col">
      <div>
        <div class="brl">PRIMARY PASSIVE</div>
        <div class="brs" style="margin-bottom:8px">${PASSIVE_N.map(pk=>{const pd=PASSIVES[pk];const isSel=def.passive&&def.passive.id===pk;return`<button class="sb${isSel?' on':''}" style="${isSel?'border-color:#8899ff;color:#8899ff':''}" onclick="liveSet('${def.id}','passive',{id:'${pk}',power:${def.passive&&def.passive.power||1}});refreshEditorBody()">${pd.name}</button>`;}).join('')}
        </div>
        ${def.passive&&def.passive.id!=='none'?`<div style="font-size:9px;color:var(--dim);margin-bottom:8px;line-height:1.5">${(PASSIVES[def.passive.id]||PASSIVES.none).desc}</div>${mks2(def,'passive.power','POWER',def.passive.power||1,0.1,2.0,0.1,'#8899ff')}`:'' }
      </div>
      <div>
        <div class="brl">SECONDARY PASSIVE</div>
        <div class="brs" style="margin-bottom:8px">${PASSIVE_N.map(pk=>{const pd=PASSIVES[pk];const isSel=def.passive2&&def.passive2.id===pk;return`<button class="sb${isSel?' on':''}" style="${isSel?'border-color:#6677dd;color:#6677dd':''}" onclick="liveSet('${def.id}','passive2',{id:'${pk}',power:${def.passive2&&def.passive2.power||1}});refreshEditorBody()">${pd.name}</button>`;}).join('')}
        </div>
        ${def.passive2&&def.passive2.id!=='none'?`<div style="font-size:9px;color:var(--dim);margin-bottom:8px;line-height:1.5">${(PASSIVES[def.passive2.id]||PASSIVES.none).desc}</div>${mks2(def,'passive2.power','POWER',def.passive2.power||1,0.1,2.0,0.1,'#6677dd')}`:'' }
      </div>
    </div>`;
  }
  else if(t==='CORE'){
    html=`<div class="sec">BASE STATS</div>
    <div class="two-col">
      ${mks2(def,'hp','MAX HP',def.hp,60,800,1,c)}
      ${mks2(def,'armor','ARMOR (dmg reduction)',def.armor,0,35,1,'#aabb88')}
      ${mks2(def,'spd','MOVEMENT SPEED',def.spd,0.5,5.0,0.1,c)}
    </div>
    <div class="sec">RESISTANCES (0-1, reduces that damage type)</div>
    <div class="three-col">
      ${['fire','frost','storm','physical','magic'].map(rt=>mks2(def,'resistances.'+rt,rt.toUpperCase(),def.resistances&&def.resistances[rt]||0,0,0.9,0.05,'#88aacc')).join('')}
    </div>
    <div class="sec">MOVEMENT</div>
    <div class="brl">MOVEMENT STYLE</div>
    <div class="brs" style="margin-bottom:10px">${MOVE_N.map(m=>`<button class="sb${(def.move&&def.move.type||'orbit')===m?' on':''}" style="${(def.move&&def.move.type||'orbit')===m?'border-color:'+c+';color:'+c:''}" onclick="liveSet('${def.id}','move.type','${m}');refreshEditorBody()">${m.toUpperCase()}</button>`).join('')}</div>
    ${mks2(def,'move.prefRange','PREFERRED RANGE',def.move&&def.move.prefRange||150,40,380,1,'var(--text)')}`;
  }
  else if(t==='VISUAL'){
    const v=def.visual||D_VISUAL;
    html=`<div class="sec">UNIT APPEARANCE</div>
    <div class="two-col">
      ${mks2(def,'visual.bodyRadius','BODY RADIUS',v.bodyRadius||10,4,22,0.5,c)}
      ${mks2(def,'visual.glowIntensity','GLOW INTENSITY',v.glowIntensity||1,0.1,3.0,0.1,c)}
      ${mks2(def,'visual.trailLength','TRAIL LENGTH',v.trailLength||7,0,20,1,'var(--text)')}
      ${mks2(def,'visual.trailWidth','TRAIL WIDTH',v.trailWidth||1,0.3,3.0,0.1,'var(--text)')}
    </div>
    <div class="sec">AURA</div>
    <div class="tog-row"><span>AURA ENABLED</span><button class="tog ${v.auraEnabled?'on':''}" onclick="liveSet('${def.id}','visual.auraEnabled',!${v.auraEnabled});refreshEditorBody()">  ${v.auraEnabled?'ON':'OFF'}</button></div>
    ${v.auraEnabled?`<div class="two-col">
      ${mks2(def,'visual.auraRadius','AURA RADIUS',v.auraRadius||25,12,60,1,c)}
      <div class="tog-row"><span class="sl">PULSE AURA</span><button class="tog ${v.auraPulse?'on':''}" onclick="liveSet('${def.id}','visual.auraPulse',!${v.auraPulse});refreshEditorBody()">${v.auraPulse?'ON':'OFF'}</button></div>
    </div>`:''}
    <div class="sec">RUNE ORBIT (magic users)</div>
    <div class="tog-row"><span>RUNE ORBIT</span><button class="tog ${v.runeEnabled!==false?'on':''}" onclick="liveSet('${def.id}','visual.runeEnabled',!${v.runeEnabled!==false});refreshEditorBody()">${v.runeEnabled!==false?'ON':'OFF'}</button></div>
    ${v.runeEnabled!==false?`<div class="two-col">
      ${mks2(def,'visual.runeArms','RUNE ARMS',v.runeArms||4,2,8,1,'var(--dim)')}
      ${mks2(def,'visual.runeSpeed','RUNE SPIN SPEED',v.runeSpeed||1,0.1,4.0,0.1,'var(--dim)')}
    </div>`:''}
    <div class="sec">EXTRAS</div>
    <div class="tog-row"><span>SHOCKWAVE ON HIT</span><button class="tog ${v.shockwaveOnHit?'on':''}" onclick="liveSet('${def.id}','visual.shockwaveOnHit',!${v.shockwaveOnHit});refreshEditorBody()">${v.shockwaveOnHit?'ON':'OFF'}</button></div>
    <div class="tog-row"><span>SHOW NAME LABEL</span><button class="tog ${v.nameVisible!==false?'on':''}" onclick="liveSet('${def.id}','visual.nameVisible',!${v.nameVisible!==false});refreshEditorBody()">${v.nameVisible!==false?'ON':'OFF'}</button></div>
    <div class="tog-row"><span>SHOW HP/MANA BARS</span><button class="tog ${v.barsVisible!==false?'on':''}" onclick="liveSet('${def.id}','visual.barsVisible',!${v.barsVisible!==false});refreshEditorBody()">${v.barsVisible!==false?'ON':'OFF'}</button></div>`;
  }
  else if(t==='MAGIC'){
    const mg=def.magic,sc2=SCH[mg.school]||SCH.arcane;
    html=`<div class="sec">MAGIC SYSTEM</div>
    <div class="tog-row"><span>MAGIC ENABLED</span><button class="tog ${mg.enabled?'on':''}" onclick="liveSet('${def.id}','magic.enabled',!${mg.enabled});refreshEditorBody()">${mg.enabled?'ON':'OFF'}</button></div>
    ${mg.enabled?`
    <div class="sec">MANA SYSTEM</div>
    <div class="two-col">
      ${mks2(def,'magic.mana.max','MAX MANA',mg.mana.max,30,250,5,sc2.color)}
      ${mks2(def,'magic.mana.regen','REGEN / SEC',mg.mana.regen,0.5,35,0.5,'#44aaff')}
      ${mks2(def,'magic.mana.cost','SPELL COST',mg.mana.cost,2,90,1,'#aa44ff')}
    </div>
    <div class="sec">SPELL</div>
    <div class="brl">SPELL TYPE</div><div class="brs" style="margin-bottom:8px">${['bolt','aoe','drain'].map(m=>`<button class="sb${mg.spell.type===m?' on':''}" style="${mg.spell.type===m?'border-color:'+sc2.color+';color:'+sc2.color:''}" onclick="liveSet('${def.id}','magic.spell.type','${m}');refreshEditorBody()">${m.toUpperCase()}</button>`).join('')}</div>
    <div class="brl">CAST PATTERN</div><div class="brs" style="margin-bottom:8px">${PAT_N.map(m=>`<button class="sb${mg.spell.pattern===m?' on':''}" style="${mg.spell.pattern===m?'border-color:'+sc2.color+';color:'+sc2.color:''}" onclick="liveSet('${def.id}','magic.spell.pattern','${m}');refreshEditorBody()">${m.toUpperCase()}</button>`).join('')}</div>
    <div class="three-col">
      ${mks2(def,'magic.spell.dmg','SPELL DAMAGE',mg.spell.dmg,1,120,1,'#ff4455')}
      ${mks2(def,'magic.spell.cd','COOLDOWN (ms)',mg.spell.cd,150,4000,50,'var(--text)')}
      ${mks2(def,'magic.spell.range','CAST RANGE',mg.spell.range,50,550,1,'var(--text)')}
      ${mks2(def,'magic.spell.critChance','CRIT CHANCE',mg.spell.critChance||.1,0,0.6,0.01,'#ffcc44')}
      ${mks2(def,'magic.spell.critMult','CRIT MULTIPLIER',mg.spell.critMult||1.8,1.2,4.0,0.1,'#ffcc44')}
    </div>
    <div class="sec">BOLT PROPERTIES</div>
    <div class="three-col">
      ${mks2(def,'magic.bolt.speed','SPEED',mg.bolt.speed,1,16,0.1,sc2.color)}
      ${mks2(def,'magic.bolt.count','COUNT',mg.bolt.count,1,14,1,'var(--text)')}
      ${mks2(def,'magic.bolt.spread','SPREAD (rad)',mg.bolt.spread,0,1.8,0.01,'var(--text)')}
      ${mks2(def,'magic.bolt.size','SIZE',mg.bolt.size,1,14,0.5,'var(--text)')}
      ${mks2(def,'magic.bolt.lifetime','LIFETIME (ms)',mg.bolt.lifetime,200,5500,100,'var(--text)')}
      ${mks2(def,'magic.bolt.trail','TRAIL LENGTH',mg.bolt.trail,0,22,1,'var(--text)')}
      ${mks2(def,'magic.bolt.homing','HOMING',mg.bolt.homing,0,1,0.01,sc2.color)}
      ${mks2(def,'magic.bolt.inaccuracy','INACCURACY',mg.bolt.inaccuracy,0,1,0.01,'#ff8844')}
      ${mks2(def,'magic.bolt.impactRadius','IMPACT RADIUS',mg.bolt.impactRadius,0,150,1,'var(--text)')}
      ${mks2(def,'magic.bolt.bounce','WALL BOUNCES',mg.bolt.bounce||0,0,5,1,'var(--text)')}
      ${mks2(def,'magic.bolt.chainTargets','CHAIN TARGETS',mg.bolt.chainTargets||0,0,4,1,'var(--text)')}
    </div>
    <div class="tog-row"><span>PIERCE THROUGH</span><button class="tog ${mg.bolt.pierce?'on':''}" onclick="liveSet('${def.id}','magic.bolt.pierce',!${mg.bolt.pierce});refreshEditorBody()">${mg.bolt.pierce?'ON':'OFF'}</button></div>
    <div class="sec">STATUS ON HIT</div>
    <div class="brs" style="margin-bottom:8px">${STATUS_N.map(s=>{const sd=STATUS_DEFS[s];const isSel=mg.effect.type===s;return`<button class="sb${isSel?' on':''}" style="${isSel?'border-color:'+(SFX_COL[s]||sc2.color)+';color:'+(SFX_COL[s]||sc2.color):''}" onclick="liveSet('${def.id}','magic.effect.type','${s}');refreshEditorBody()">${sd.name}</button>`;}).join('')}</div>
    ${mg.effect.type!=='none'?`<div style="font-size:9px;color:var(--dim);margin-bottom:8px;line-height:1.5">${STATUS_DEFS[mg.effect.type].desc}</div><div class="two-col">
      ${mks2(def,'magic.effect.power','EFFECT POWER',mg.effect.power||5,0.5,40,0.5,'var(--text)')}
      ${mks2(def,'magic.effect.duration','DURATION (ms)',mg.effect.duration||2000,300,8000,100,'var(--text)')}
    </div>`:''}
    <div class="sec">SIGNATURE SPELL</div>
    <div class="brs" style="margin-bottom:8px">${SIG_N.map(s=>`<button class="sb${mg.sig.type===s?' on':''}" style="${mg.sig.type===s?'border-color:'+sc2.color+';color:'+sc2.color:''}" onclick="liveSet('${def.id}','magic.sig.type','${s}');refreshEditorBody()">${s.toUpperCase()}</button>`).join('')}</div>
    ${mg.sig.type!=='none'?`<div class="three-col">
      ${mks2(def,'magic.sig.chargeRate','CHARGE RATE',mg.sig.chargeRate,0.2,4,0.1,sc2.color)}
      ${mks2(def,'magic.sig.power','POWER',mg.sig.power,5,300,1,'#ff4455')}
      ${mks2(def,'magic.sig.autoThreshold','AUTO THRESHOLD',mg.sig.autoThreshold,0.3,1.0,0.05,'var(--text)')}
      ${(mg.sig.type==='nova'||mg.sig.type==='zone'||mg.sig.type==='chain')?mks2(def,'magic.sig.radius','RADIUS',mg.sig.radius,30,350,1,'var(--text)'):''}
      ${mg.sig.type==='zone'?mks2(def,'magic.sig.duration','ZONE DURATION',mg.sig.duration,500,12000,250,'var(--text)'):''}
      ${mg.sig.type==='beam'?mks2(def,'magic.sig.beamLen','BEAM LENGTH',mg.sig.beamLen,80,700,1,'var(--text)'):''}
      ${mg.sig.type==='beam'?mks2(def,'magic.sig.beamWidth','BEAM WIDTH',mg.sig.beamWidth,2,55,1,'var(--text)'):''}
      ${mg.sig.type==='beam'?mks2(def,'magic.sig.duration','BEAM DURATION',mg.sig.duration,150,3000,50,'var(--text)'):''}
      ${(mg.sig.type==='barrage'||mg.sig.type==='chain'||mg.sig.type==='meteor')?mks2(def,'magic.sig.burstCount','BURST COUNT',mg.sig.burstCount,2,28,1,'var(--text)'):''}
      ${(mg.sig.type==='barrage'||mg.sig.type==='chain')?mks2(def,'magic.sig.speed','PROJ SPEED',mg.sig.speed,1,18,0.5,'var(--text)'):''}
    </div>`:'<p style="font-size:9px;color:var(--dim);margin-top:6px">Pick a signature type to configure it.</p>'}
    `:'<p style="font-size:9px;color:var(--dim);margin-top:8px">Magic is disabled. Toggle it on above.</p>'}`;
  }
  else if(t==='MELEE'){
    const ml=def.melee;
    html=`<div class="sec">MELEE SYSTEM</div>
    <div class="tog-row"><span>MELEE ENABLED</span><button class="tog ${ml.enabled?'on':''}" onclick="liveSet('${def.id}','melee.enabled',!${ml.enabled});refreshEditorBody()">${ml.enabled?'ON':'OFF'}</button></div>
    ${ml.enabled?`
    <div class="brl">WEAPON TYPE</div><div class="brs" style="margin-bottom:10px">${WEAPON_N.map(w=>`<button class="sb${ml.weapon===w?' on':''}" style="${ml.weapon===w?'border-color:'+c+';color:'+c:''}" onclick="liveSet('${def.id}','melee.weapon','${w}');refreshEditorBody()">${w.toUpperCase()}</button>`).join('')}</div>
    <div class="three-col">
      ${mks2(def,'melee.dmg','DAMAGE',ml.dmg,3,160,1,'#ff4455')}
      ${mks2(def,'melee.range','RANGE',ml.range,15,120,1,'var(--text)')}
      ${mks2(def,'melee.cd','COOLDOWN (ms)',ml.cd,150,3500,50,'var(--text)')}
      ${mks2(def,'melee.lunge','LUNGE FORCE',ml.lunge,0,10,0.1,c)}
      ${mks2(def,'melee.knockback','KNOCKBACK',ml.knockback,0,14,0.1,'var(--text)')}
      ${mks2(def,'melee.cleave','CLEAVE (AoE)',ml.cleave,0,1,0.01,'var(--text)')}
      ${mks2(def,'melee.arcWidth','ARC WIDTH (deg)',ml.arcWidth,15,210,1,'var(--text)')}
      ${mks2(def,'melee.critChance','CRIT CHANCE',ml.critChance||.12,0,0.7,0.01,'#ffcc44')}
      ${mks2(def,'melee.critMult','CRIT MULTIPLIER',ml.critMult||2.0,1.2,4.5,0.1,'#ffcc44')}
    </div>
    <div class="sec">COMBO SYSTEM</div>
    <div class="tog-row"><span>COMBO ENABLED</span><button class="tog ${ml.combo&&ml.combo.enabled?'on':''}" onclick="liveSet('${def.id}','melee.combo.enabled',!${ml.combo&&ml.combo.enabled});refreshEditorBody()">${ml.combo&&ml.combo.enabled?'ON':'OFF'}</button></div>
    ${ml.combo&&ml.combo.enabled?`<div class="three-col">
      ${mks2(def,'melee.combo.steps','COMBO STEPS',ml.combo.steps||3,2,9,1,c)}
      ${mks2(def,'melee.combo.dmgBonus','BONUS PER STEP',ml.combo.dmgBonus||.3,0.05,1.2,0.05,'#ffaa44')}
      ${mks2(def,'melee.combo.window','COMBO WINDOW (ms)',ml.combo.window||850,200,2500,50,'var(--text)')}
    </div>
    <div class="tog-row"><span>RESET ON MISS</span><button class="tog ${ml.combo&&ml.combo.resetOnMiss?'on':''}" onclick="liveSet('${def.id}','melee.combo.resetOnMiss',!${ml.combo&&ml.combo.resetOnMiss});refreshEditorBody()">${ml.combo&&ml.combo.resetOnMiss?'ON':'OFF'}</button></div>`:''}
    <div class="sec">PARRY SYSTEM</div>
    <div class="tog-row"><span>PARRY ENABLED</span><button class="tog ${ml.parry&&ml.parry.enabled?'on':''}" onclick="liveSet('${def.id}','melee.parry.enabled',!${ml.parry&&ml.parry.enabled});refreshEditorBody()">${ml.parry&&ml.parry.enabled?'ON':'OFF'}</button></div>
    ${ml.parry&&ml.parry.enabled?`<div class="three-col">
      ${mks2(def,'melee.parry.chance','PARRY CHANCE',ml.parry.chance||.2,0.05,0.75,0.01,'#44aaff')}
      ${mks2(def,'melee.parry.window','PARRY WINDOW (ms)',ml.parry.window||200,50,500,10,'var(--text)')}
      ${mks2(def,'melee.parry.counterDmg','COUNTER DMG',ml.parry.counterDmg||1.5,1.0,4.0,0.1,c)}
    </div>`:''}
    <div class="sec">CHARGE ABILITY</div>
    <div class="tog-row"><span>CHARGE ENABLED</span><button class="tog ${ml.charge&&ml.charge.enabled?'on':''}" onclick="liveSet('${def.id}','melee.charge.enabled',!${ml.charge&&ml.charge.enabled});refreshEditorBody()">${ml.charge&&ml.charge.enabled?'ON':'OFF'}</button></div>
    ${ml.charge&&ml.charge.enabled?`<div class="three-col">
      ${mks2(def,'melee.charge.minDist','MIN DISTANCE',ml.charge.minDist||120,60,350,5,'var(--text)')}
      ${mks2(def,'melee.charge.dashSpd','DASH SPEED',ml.charge.dashSpd||7,2,16,0.5,c)}
      ${mks2(def,'melee.charge.cooldown','COOLDOWN (ms)',ml.charge.cooldown||3000,500,8000,250,'var(--text)')}
    </div>`:''}
    <div class="sec">HIT EFFECT</div>
    <div class="brs" style="margin-bottom:8px">${STATUS_N.map(s=>{const sd=STATUS_DEFS[s];const isSel=(ml.effect&&ml.effect.type||'none')===s;return`<button class="sb${isSel?' on':''}" style="${isSel?'border-color:'+(SFX_COL[s]||c)+';color:'+(SFX_COL[s]||c):''}" onclick="liveSet('${def.id}','melee.effect.type','${s}');refreshEditorBody()">${sd.name}</button>`;}).join('')}</div>
    ${ml.effect&&ml.effect.type!=='none'?`<div style="font-size:9px;color:var(--dim);margin-bottom:8px">${STATUS_DEFS[ml.effect.type].desc}</div><div class="two-col">
      ${mks2(def,'melee.effect.power','POWER',ml.effect.power||5,0.5,35,0.5,'var(--text)')}
      ${mks2(def,'melee.effect.duration','DURATION (ms)',ml.effect.duration||1500,200,7000,100,'var(--text)')}
    </div>`:''}
    `:'<p style="font-size:9px;color:var(--dim);margin-top:8px">Melee is disabled. Toggle it on above.</p>'}`;
  }
  else if(t==='RANGED'){
    const rg=def.ranged;
    html=`<div class="sec">RANGED SYSTEM</div>
    <div class="tog-row"><span>RANGED ENABLED</span><button class="tog ${rg.enabled?'on':''}" onclick="liveSet('${def.id}','ranged.enabled',!${rg.enabled});refreshEditorBody()">${rg.enabled?'ON':'OFF'}</button></div>
    ${rg.enabled?`
    <div class="brl">AMMO TYPE</div><div class="brs" style="margin-bottom:10px">${AMMO_N.map(a=>`<button class="sb${rg.ammo===a?' on':''}" style="${rg.ammo===a?'border-color:'+c+';color:'+c:''}" onclick="liveSet('${def.id}','ranged.ammo','${a}');refreshEditorBody()">${a.toUpperCase()}</button>`).join('')}</div>
    <div class="three-col">
      ${mks2(def,'ranged.dmg','DAMAGE',rg.dmg,3,120,1,'#ff4455')}
      ${mks2(def,'ranged.cd','COOLDOWN (ms)',rg.cd,150,4000,50,'var(--text)')}
      ${mks2(def,'ranged.range','RANGE',rg.range,60,600,1,'var(--text)')}
      ${mks2(def,'ranged.critChance','CRIT CHANCE',rg.critChance||.1,0,0.6,0.01,'#ffcc44')}
      ${mks2(def,'ranged.critMult','CRIT MULT',rg.critMult||1.8,1.2,4.0,0.1,'#ffcc44')}
    </div>
    <div class="sec">PROJECTILE</div>
    <div class="three-col">
      ${mks2(def,'ranged.bolt.speed','SPEED',rg.bolt.speed,1,18,0.1,c)}
      ${mks2(def,'ranged.bolt.count','COUNT',rg.bolt.count,1,12,1,'var(--text)')}
      ${mks2(def,'ranged.bolt.spread','SPREAD',rg.bolt.spread,0,1.5,0.01,'var(--text)')}
      ${mks2(def,'ranged.bolt.size','SIZE',rg.bolt.size,1,14,0.5,'var(--text)')}
      ${mks2(def,'ranged.bolt.lifetime','LIFETIME (ms)',rg.bolt.lifetime||2800,200,6000,100,'var(--text)')}
      ${mks2(def,'ranged.bolt.trail','TRAIL',rg.bolt.trail,0,20,1,'var(--text)')}
      ${mks2(def,'ranged.bolt.homing','HOMING',rg.bolt.homing||0,0,1,0.01,c)}
      ${mks2(def,'ranged.bolt.inaccuracy','INACCURACY',rg.bolt.inaccuracy,0,1,0.01,'#ff8844')}
      ${mks2(def,'ranged.bolt.impactRadius','IMPACT RADIUS',rg.bolt.impactRadius||0,0,150,1,'var(--text)')}
      ${mks2(def,'ranged.bolt.bounce','WALL BOUNCES',rg.bolt.bounce||0,0,5,1,'var(--text)')}
    </div>
    <div class="tog-row"><span>PIERCE</span><button class="tog ${rg.bolt.pierce?'on':''}" onclick="liveSet('${def.id}','ranged.bolt.pierce',!${rg.bolt.pierce});refreshEditorBody()">${rg.bolt.pierce?'ON':'OFF'}</button></div>
    <div class="sec">VOLLEY MODE</div>
    <div class="tog-row"><span>VOLLEY ENABLED</span><button class="tog ${rg.volley&&rg.volley.enabled?'on':''}" onclick="liveSet('${def.id}','ranged.volley.enabled',!${rg.volley&&rg.volley.enabled});refreshEditorBody()">${rg.volley&&rg.volley.enabled?'ON':'OFF'}</button></div>
    ${rg.volley&&rg.volley.enabled?`<div class="three-col">
      ${mks2(def,'ranged.volley.count','VOLLEY COUNT',rg.volley.count||3,2,8,1,'var(--text)')}
      ${mks2(def,'ranged.volley.delay','SHOT DELAY (ms)',rg.volley.delay||120,30,500,10,'var(--text)')}
      ${mks2(def,'ranged.volley.spread','VOLLEY SPREAD',rg.volley.spread||.25,0,1.2,0.01,'var(--text)')}
    </div>`:''}
    <div class="sec">HIT EFFECT</div>
    <div class="brs" style="margin-bottom:8px">${STATUS_N.map(s=>{const sd=STATUS_DEFS[s];const isSel=(rg.effect&&rg.effect.type||'none')===s;return`<button class="sb${isSel?' on':''}" style="${isSel?'border-color:'+(SFX_COL[s]||c)+';color:'+(SFX_COL[s]||c):''}" onclick="liveSet('${def.id}','ranged.effect.type','${s}');refreshEditorBody()">${sd.name}</button>`;}).join('')}</div>
    ${rg.effect&&rg.effect.type!=='none'?`<div style="font-size:9px;color:var(--dim);margin-bottom:8px">${STATUS_DEFS[rg.effect.type].desc}</div><div class="two-col">
      ${mks2(def,'ranged.effect.power','POWER',rg.effect.power||4,0.5,35,0.5,'var(--text)')}
      ${mks2(def,'ranged.effect.duration','DURATION (ms)',rg.effect.duration||1800,200,7000,100,'var(--text)')}
    </div>`:''}
    `:'<p style="font-size:9px;color:var(--dim);margin-top:8px">Ranged is disabled. Toggle it on above.</p>'}`;
  }
  else if(t==='BEHAVIOR'){
    const ai=def.ai;
    const AI_GROUPS=[
      {label:'MOVEMENT & POSITIONING',keys:[['aggression','AGGRESSION','How hard it closes distance.','.5'],['spacing','SPACING','Preferred spacing between units.','.5'],['strafe','STRAFE','How much it moves laterally.','.5'],['keepDistance','KEEP DISTANCE','Weight toward maintaining range.','.5'],['randomness','RANDOMNESS','Chaos in movement and targeting.','.2'],['flankTendency','FLANK TENDENCY','Tendency to approach from angles.','.2']]},
      {label:'TARGETING & AIM',keys:[['aim','AIM ACCURACY','Reduces bolt inaccuracy.','.8'],['prediction','TARGET PREDICTION','Leads moving targets.','.5'],['leadFactor','LEAD FACTOR','How far ahead to aim.','.5'],['targetCommit','TARGET COMMIT','Stickiness to current attack angle.','.7']]},
      {label:'DEFENSE & REACTIONS',keys:[['dodge','DODGE TENDENCY','How often it repositions under fire.','.4'],['dodgeTiming','DODGE TIMING','Precision of dodge timing.','.5'],['parryTendency','PARRY TENDENCY','Eagerness to attempt parry.','.3'],['counterPlay','COUNTER-PLAY','Response to enemy attack patterns.','.4'],['baiting','BAIT TENDENCY','Willingness to bait attacks.','.2']]},
      {label:'OFFENSE PATTERNS',keys:[['comboBias','COMBO BIAS','Eagerness to chain attacks.','.5'],['burstWindow','BURST WINDOW','Aggression during burst windows.','.5'],['attackDelay','ATTACK DELAY','Hesitation before attacking.','.1'],['cancelThreshold','CANCEL THRESHOLD','When to abort an attack sequence.','.5']]},
      {label:'RESOURCE MANAGEMENT',keys:[['specialBias','SIGNATURE BIAS','Priority on charging signature.','.6'],['manaConserve','MANA CONSERVE','Tendency to hold mana in reserve.','.3'],['retreatThreshold','RETREAT HP','HP% at which it begins retreating.','.2'],['retreatToHeal','RETREAT TO HEAL','Willingness to disengage for regen.','.3'],['advanceThreshold','ADVANCE HP','HP% at which it goes aggressive.','.75']]},
      {label:'ADAPTATION',keys:[['adaptRate','ADAPT RATE','How quickly it adjusts to opponent.','.3'],['pressureResponse','PRESSURE RESPONSE','Response to sustained incoming damage.','.5']]},
    ];
    html=`<div class="sec">STANCE PRESET</div>
    <p style="font-size:9px;color:var(--dim);margin-bottom:9px;line-height:1.5">Presets apply a broad behavioral profile. You can then fine-tune every slider below.</p>
    <div class="brs" style="margin-bottom:10px">${STANCE_N.map(s=>`<button class="sb${ai.stance===s?' on':''}" style="${ai.stance===s?'border-color:'+c+';color:'+c:''}" onclick="applyStance('${def.id}','${s}')">${s.toUpperCase()}</button>`).join('')}</div>
    <div class="sec">COMBAT PRIORITY</div>
    <p style="font-size:9px;color:var(--dim);margin-bottom:9px;line-height:1.5">Controls how the AI chooses between magic, melee and ranged when multiple are enabled. Higher value = tried first.</p>
    <div class="three-col">
      ${mks2(def,'ai.priority.magic','MAGIC',ai.priority.magic||.5,0,1,0.01,'#aa66ff')}
      ${mks2(def,'ai.priority.melee','MELEE',ai.priority.melee||.25,0,1,0.01,'#ffaa44')}
      ${mks2(def,'ai.priority.ranged','RANGED',ai.priority.ranged||.25,0,1,0.01,'#44ccff')}
    </div>
    ${AI_GROUPS.map(g=>`<div class="sec">${g.label}</div><div class="three-col">${g.keys.map(([k,label,hint,def2])=>`<div title="${hint}">${mks2(def,'ai.'+k,label,ai[k]!==undefined?ai[k]:parseFloat(def2),0,1,0.01,c)}</div>`).join('')}</div>`).join('')}
    <div class="sec">NOTES (freeform)</div>
    <textarea class="ta" rows="3" placeholder="Describe this unit's behavioral intent..." oninput="liveSet('${def.id}','ai.notes',this.value)">${ai.notes||''}</textarea>`;
  }

  el.innerHTML=html;
}

// ================================================================
// LIVE EDITOR HELPERS
// ================================================================
function mks2(def,path,label,val,min,max,step,col){
  const id='sv_'+def.id+'_'+path.replace(/\./g,'_');
  const isFlt=(step||1)<1;
  const parse=isFlt?'parseFloat':'parseInt';
  const c2=col||'var(--acc)';
  return`<div class="sr"><div class="sl2"><span>${label}</span><span id="${id}" style="color:${c2}">${typeof val==='number'?val.toFixed(isFlt?2:0):val}</span></div>
  <input type="range" min="${min}" max="${max}" step="${step||1}" value="${val}" style="width:100%;accent-color:${c2}"
    oninput="liveSet('${def.id}','${path}',${parse}(this.value));document.getElementById('${id}').textContent=parseFloat(this.value).toFixed(${isFlt?2:0})">
  </div>`;
}

function liveSet(unitId,path,val){
  const def=getDef(unitId);if(!def)return;
  dset(def,path,val);
  // Cascade school change
  if(path==='school'||path==='magic.school'){
    const sch=def.magic&&def.magic.enabled?def.magic.school||def.school:def.school;
    const sc2=SCH[sch]||SCH.arcane;
    def.color=def.magic.enabled?sc2.color:def.color;def.glowColor=sc2.glow;def.trailColor=sc2.trail;
  }
  // Refresh game if we changed the selected units, but coalesce repeated edits
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
  container.querySelectorAll('.sb').forEach(b=>{const ia=b.textContent.toLowerCase().replace(/ /,'')===SCH[school].name.toLowerCase().replace(/ /,'');b.classList.toggle('on',ia);b.style.borderColor=ia?sc2.color:'';b.style.color=ia?sc2.color:'';});
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

function exportUnit(id){
  const def=getDef(id);if(!def)return;
  const json=JSON.stringify(def,null,2);
  const el=document.getElementById('modal');
  el.style.display='flex';
  el.innerHTML=`<div class="m-box" style="border:2px solid ${def.color};box-shadow:0 0 40px ${def.color}33">
    <div class="m-hdr"><div class="dot" style="width:10px;height:10px;background:${def.color};box-shadow:0 0 8px ${def.color}"></div><span style="color:${def.color};font-size:12px;font-weight:bold;letter-spacing:2px">${def.name} - EXPORT</span></div>
    <div class="m-body"><div style="font-size:9px;color:var(--dim);margin-bottom:8px">Copy this JSON to save the unit definition.</div><pre class="code-pre">${json.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"([^"]+)":/g,'<span class="ck">"$1"</span>:').replace(/: "([^"]*)"/g,': <span class="cs">"$1"</span>').replace(/: (true|false)/g,': <span class="cb">$1</span>').replace(/: (\d+\.?\d*)/g,': <span class="cn">$1</span>')}</pre></div>
    <div class="m-foot"><button onclick="navigator.clipboard&&navigator.clipboard.writeText(JSON.stringify(getDef('${id}'),null,2))" style="background:#120e30;border:1px solid var(--acc);color:var(--acc);padding:5px 14px;font-size:11px;font-family:monospace;border-radius:3px;cursor:pointer">COPY JSON</button><button onclick="document.getElementById('modal').style.display='none'" style="background:transparent;border:1px solid var(--border);color:var(--dim);padding:5px 14px;font-size:11px;font-family:monospace;border-radius:3px;cursor:pointer">CLOSE</button></div>
  </div>`;
}

function applyEditorToLiveBattle(unitId){
  if(!S.gs)return;
  const def=getDef(unitId);if(!def)return;
  const sideIdx=S.selected[0]===unitId?0:S.selected[1]===unitId?1:-1;
  if(sideIdx===-1)return;
  const u=S.gs.units[sideIdx];
  u.def=dc(def);
  u.maxHp=def.hp;
  u.hp=Math.min(u.hp,def.hp);
  u.armor=def.armor||0;
  u.def._speedBoost=0;
  u.flash=1;
  u.flashCol='#44ff88';
  pRing(S.gs.parts,u.x,u.y,'#44ff88',14,24);
  S.gs.shake=Math.max(S.gs.shake,3);
  const footer=document.querySelector('.ed-footer');
  if(footer){
    const prev=footer.innerHTML;
    const msg=document.createElement('span');
    msg.style.cssText='font-size:9px;color:#44ff88;animation:fadeOut .8s ease forwards;margin-left:auto';
    msg.textContent='✓ applied to live battle';
    footer.appendChild(msg);
    setTimeout(()=>msg.remove(),900);
  }
}

function testUnit(id){
  S.selected[0]=id;
  restartGame();
  setTab('battle');
}

function dupUnit(id){
  const def=getDef(id);if(!def)return;
  const dup=dc(def);dup.id='c_'+Date.now();dup.name=def.name.slice(0,10)+'2';
  S.units.push(dup);S.editingId=dup.id;
  renderEditor();
}

function deleteUnit(id){
  if(S.units.length<=2){alert('Need at least 2 units.');return;}
  S.units=S.units.filter(u=>u.id!==id);
  if(S.editingId===id)S.editingId=S.units[0].id;
  if(S.selected[0]===id)S.selected[0]=S.units[0].id;
  if(S.selected[1]===id)S.selected[1]=S.units[Math.min(1,S.units.length-1)].id;
  renderEditor();
}

function newUnit(){
  const nu=mkDef({id:'c_'+Date.now(),name:'UNIT',school:'arcane',desc:'Custom unit.',hp:260,armor:0,spd:2.0});
  S.units.push(nu);S.editingId=nu.id;S.editTab='IDENTITY';
  if(S.tab!=='editor')setTab('editor');else renderEditor();
}

function goEdit(id){S.editingId=id;S.editTab='IDENTITY';setTab('editor');}

function selectForBattle(id){
  if(S.selected[0]===id||S.selected[1]===id){restartGame();setTab('battle');return;}
  S.selected[1]=id;restartGame();setTab('battle');
}

// ================================================================
// CONTROLS
// ================================================================
function setTab(t){
  if(t !== 'battle' && CS.active) endCutscene();
  S.tab=t;
  if(t==='battle')renderBattle();
  else if(t==='roster')renderRoster();
  else if(t==='tutorial')renderTutorial();
  else if(t==='json')renderJsonIde();
  else renderEditor();
}
function selectUnit(side,id){S.selected[side]=id;restartGame();const el=document.getElementById('panel-'+side);if(el)el.innerHTML=panelHTML(side);}
function togglePause(){S.paused=!S.paused;const b=document.getElementById('pbtn');if(b){b.textContent=S.paused?'▶ RESUME':'⏸ PAUSE';b.classList.toggle('on',S.paused);}}
function toggleIntel(){
  S.showIntel=!S.showIntel;
  const b=document.getElementById('ibtn');
  if(b){
    b.classList.toggle('on',S.showIntel);
    const lbl=b.querySelector('.intel-label');
    if(lbl)lbl.textContent=S.showIntel?'PANEL OPEN':'AI DECISIONS';
  }
  const p=document.getElementById('intel-panel');
  if(p)p.style.display=S.showIntel?'block':'none';
}
function setSpeed(s){S.speed=s;document.querySelectorAll('.spd-btn').forEach((b,i)=>{b.classList.toggle('on',[.5,1,2,3][i]===s);});}

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
  }catch(err){
    console.error('Game loop error (recovered):', err);
  }
  const cv=document.getElementById('cv');if(cv&&S.gs)renderGame(cv.getContext('2d'),S.gs,S.showIntel);
  requestAnimationFrame(loop);
}

// ================================================================
// JSON FREEDOM SYSTEM - UNLOCK PROGRESSION
// ================================================================
const JSON_FREEDOM_KEY='__unitforge_jf_v1';
const JSON_DRAFT_KEY='__unitforge_json_draft_v2';

const JSON_RANKS=[
  {name:'LOCKED', tier:'TIER 0',icon:'⬡',desc:'No JSON access — complete lessons to unlock',  minLessons:0},
  {name:'READER', tier:'TIER 1',icon:'◈',desc:'Read & view syntax highlighting', minLessons:2},
  {name:'STUDENT',tier:'TIER 2',icon:'◇',desc:'Format & basic JSON editing',   minLessons:4},
  {name:'CODER',  tier:'TIER 3',icon:'⬢',desc:'Load & edit any unit',   minLessons:6},
  {name:'MASTER', tier:'TIER 4',icon:'⚡',desc:'Full sandbox — create from scratch',   minLessons:8},
];
const JSON_FEATURES=[
  {label:'View JSON lessons',          minRank:0},
  {label:'Syntax highlighting',        minRank:1},
  {label:'Copy unit JSON',             minRank:1},
  {label:'Format JSON (⊞)',            minRank:2},
  {label:'Basic text editing',         minRank:2},
  {label:'Load any unit JSON',         minRank:3},
  {label:'Full editor access',         minRank:3},
  {label:'Import custom units',        minRank:4},
  {label:'Create from scratch',        minRank:4},
  {label:'Advanced validation',        minRank:4},
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
  const rank=JsonFreedom.getRank();
  const fired=StoryProgress.getFired();
  const chapter=STORY_CHAPTERS.find(c=>c.rank===rank&&!fired.has(c.id));
  if(chapter){
    StoryProgress.mark(chapter.id);
    setTimeout(()=>playCutscene(chapter.cs),900);
  }
}

const JsonFreedom={
  getCompleted(){try{return new Set(JSON.parse(localStorage.getItem(JSON_FREEDOM_KEY)||'[]'));}catch{return new Set();}},
  complete(id){
    const s=this.getCompleted();
    s.add(id);
    localStorage.setItem(JSON_FREEDOM_KEY,JSON.stringify([...s]));
  },
  getRank(){const n=this.getCompleted().size;for(let i=JSON_RANKS.length-1;i>=0;i--){if(n>=JSON_RANKS[i].minLessons)return i;}return 0;},
  canSyntaxHighlight(){return this.getRank()>=1;},
  canFormat(){return this.getRank()>=2;},
  canEdit(){return this.getRank()>=2;},
  canLoadUnit(){return this.getRank()>=3;},
  canFullEdit(){return this.getRank()>=3;},
  canImport(){return this.getRank()>=4;},
  canCreateFromScratch(){return this.getRank()>=4;},
  reset(){
    localStorage.removeItem(JSON_FREEDOM_KEY);
    localStorage.removeItem(JSON_DRAFT_KEY);
    StoryProgress.reset();
  },
};

class UndoStack {
  constructor(maxDepth = 60) {
    this.stack = [];
    this.idx = -1;
    this.max = maxDepth;
    this._skipNext = false;
  }
  push(val) {
    if (this._skipNext) { this._skipNext = false; return; }
    if (this.stack[this.idx] === val) return;
    this.stack.splice(this.idx + 1);
    this.stack.push(val);
    if (this.stack.length > this.max) this.stack.shift();
    this.idx = this.stack.length - 1;
  }
  undo() { if (this.idx > 0) { this.idx--; this._skipNext = true; return this.stack[this.idx]; } return null; }
  redo() { if (this.idx < this.stack.length - 1) { this.idx++; this._skipNext = true; return this.stack[this.idx]; } return null; }
  reset(val) { this.stack = [val]; this.idx = 0; }
}

const jIdeUndo = new UndoStack();

// ================================================================
// JSON IDE STATE
// ================================================================
const JIS={
  lesson:'intro',
  code:(()=>{
    try{return localStorage.getItem(JSON_DRAFT_KEY)||'';}catch{return '';}
  })(),
  validation:null,
  uiInit:false,
};

// ================================================================
// JSON SYNTAX HIGHLIGHTER
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

function jsonEsc(v){
  return String(v)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function jsonLineCount(text){
  return Math.max(1,String(text||'').split('\n').length);
}

function jsonLineNumbers(text){
  return Array.from({length:jsonLineCount(text)},(_,i)=>i+1).join('\n');
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
  if(!parsed){
    return `<div style="font-size:9px;color:#3a4a70;line-height:1.75">Valid JSON will show a quick field summary here.</div>`;
  }

  const isObj=parsed&&typeof parsed==='object'&&!Array.isArray(parsed);
  const keys=isObj?Object.keys(parsed):[];
  const type=Array.isArray(parsed)?'ARRAY':(isObj?'OBJECT':typeof parsed).toUpperCase();

  const keyChips=isObj
    ? keys.slice(0,16).map(k=>`<span style="display:inline-block;border:1px solid #1a2040;border-radius:2px;padding:2px 5px;margin:0 4px 4px 0;color:#7799ff;font-size:8px;letter-spacing:.5px">${jsonEsc(k)}</span>`).join('')
    : '';

  const important=isObj
    ? ['id','name','school','hp','spd','armor','desc'].map(k=>{
        if(parsed[k]===undefined)return '';
        const v=parsed[k];
        const txt=Array.isArray(v)?`[${v.length}]`:(v&&typeof v==='object'?`{${Object.keys(v).length}}`:String(v));
        return `<div style="display:flex;justify-content:space-between;gap:10px;padding:3px 0;border-bottom:1px solid #0a1020"><span style="color:#6677aa">${jsonEsc(k)}</span><span style="color:#b8ccdd;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:right">${jsonEsc(txt)}</span></div>`;
      }).filter(Boolean).join('')
    : '';

  return `
    <div style="font-size:8px;color:#3a4a70;letter-spacing:2px;margin-bottom:6px">LIVE PREVIEW</div>
    <div style="font-size:10px;color:#44ffaa;letter-spacing:1px;margin-bottom:10px">TYPE: ${type}</div>
    ${important || `<div style="font-size:9px;color:#6677aa;line-height:1.7">Parsed successfully, but there are no common unit fields to preview.</div>`}
    <div style="font-size:8px;color:#3a4a70;letter-spacing:1px;margin-top:10px;margin-bottom:4px">TOP-LEVEL KEYS (${keys.length})</div>
    <div>${keyChips || '<span style="font-size:9px;color:#3a4a70">None</span>'}</div>
  `;
}

function jsonUpdateUi(text, vr) {
  const lineEl = document.getElementById('jln');
  const ta = document.getElementById('jta');
  if (!lineEl || !ta) return;

  const lines = text.split('\n');
  const lineCount = Math.max(lines.length, 1);
  
  const selectionStart = ta.selectionStart;
  const activeLineNum = text.substring(0, selectionStart).split('\n').length;
  const errLine = (vr && !vr.ok && vr.error) ? vr.error.line : null;

  let gutterHtml = '';
  for (let i = 1; i <= lineCount; i++) {
    let classes = '';
    if (i === activeLineNum) classes += 'active-line ';
    if (i === errLine) classes += 'error-line ';
    gutterHtml += `<div class="${classes.trim()}">${i}</div>`;
  }
  lineEl.innerHTML = gutterHtml;

  const errBox = document.getElementById('jde-err');
  if (errBox) {
    if (vr && !vr.ok && vr.error) {
      errBox.innerHTML = `<span style="color:#ff5555">✗ Line ${vr.error.line}, Col ${vr.error.col}: ${vr.error.message}</span>`;
    } else {
      errBox.innerHTML = `<span style="color:#44ff88">✓ Structure Valid. Ready to compile.</span>`;
    }
  }

  // Update original preview views if present inside your game UI
  const prv = document.getElementById('jde-prv');
  if (prv) {
    prv.innerHTML = jsonPreviewHtml(vr);
  }

  const subBtn = document.getElementById('jde-sub-btn');
  if (subBtn) {
    subBtn.disabled = !vr || !vr.ok;
  }
}



function jsonSaveDraft(text){
  try{localStorage.setItem(JSON_DRAFT_KEY,String(text||''));}catch{}
}

function jsonInitUi(){
  if(JIS.uiInit)return;
  JIS.uiInit=true;

  window.addEventListener('dragover',e=>{
    if(S.tab==='json')e.preventDefault();
  });

  window.addEventListener('drop',async e=>{
    if(S.tab!=='json')return;
    const file=e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0];
    if(!file)return;
    if(!/\.json$/i.test(file.name)&&file.type!=='application/json')return;
    e.preventDefault();
    const text=await file.text();
    const ta=document.getElementById('jta');
    if(ta){
      ta.value=text;
      jsonTaInput(ta);
    }else{
      JIS.code=text;
      jsonSaveDraft(text);
      renderJsonIde();
    }
  });

  window.addEventListener('keydown',e=>{
    if(S.tab!=='json')return;
    if(!(e.ctrlKey||e.metaKey))return;
    const key=String(e.key||'').toLowerCase();
    if(key==='s'){
      e.preventDefault();
      jsonDownload();
    }else if(key==='l'){
      e.preventDefault();
      const file=document.getElementById('jfile');
      if(file)file.click();
    }else if(key==='enter'){
      const vr=JIS.validation;
      if(vr&&vr.ok){
        e.preventDefault();
        if(JIS.lesson==='import')jsonImport();
        else jsonSubmit();
      }
    }else if(key==='f'){
      e.preventDefault();
      jsonFmt();
    }
  });
}

// ================================================================
// LEVELS — structured progression for the JSON curriculum
// ================================================================
const LEVELS = [
  { num: 1, lessonId: 'intro',   title: 'WHAT IS JSON?', objective: 'Understand the two core JSON structures: objects and arrays.', storyId: null },
  { num: 2, lessonId: 'objects', title: 'OBJECTS & KEYS', objective: 'Write a valid JSON object with multiple key-value pairs.', storyId: 'story_reader' },
  { num: 3, lessonId: 'types',   title: 'VALUE TYPES', objective: 'Use all six JSON value types correctly.', storyId: null },
  { num: 4, lessonId: 'arrays',  title: 'ARRAYS', objective: 'Build an array containing three or more items.', storyId: 'story_student' },
  { num: 5, lessonId: 'nested',  title: 'NESTED OBJECTS', objective: 'Nest one object inside another.', storyId: null },
  { num: 6, lessonId: 'schema',  title: 'UNIT SCHEMA', objective: 'Read and understand the full Combat Forge unit schema.', storyId: 'story_coder' },
  { num: 7, lessonId: 'modify',  title: 'MODIFY A UNIT', objective: 'Edit a real unit definition and keep it valid.', storyId: null },
  { num: 8, lessonId: 'import',  title: 'BUILD & IMPORT', objective: 'Build and import an original unit into the live roster.', storyId: 'story_master' },
];

const LEVEL_LOOKUP = Object.fromEntries(LEVELS.map(level => [level.lessonId, level]));

// ================================================================
// JSON LESSONS
// ================================================================
const JSON_LESSONS=[
  {id:'intro',title:'WHAT IS JSON?',icon:'01',exercise:false,initialCode:'',
    render(){return`<div class="jl-h1">WHAT IS JSON?</div><div class="jl-sub">LESSON 1 / 8 — FOUNDATION</div><div class="jl-p"><strong>JSON</strong> (JavaScript Object Notation) is the text format this game uses to define every unit — name, health, speed, weapons, magic, AI personality — everything. It is readable by both humans and machines.</div><div class="jl-p">Mastering JSON gives you <span style="color:#aabbff">direct access to the unit engine</span>. Instead of sliders you write exact values. You create builds the GUI can't make. You import units that have never existed.</div><div class="jl-rule"><div class="jl-rule-hdr">THE CORE IDEA</div><div class="jl-rule-body">JSON has two structures: <strong>objects</strong> (named fields in <code>{}</code>) and <strong>arrays</strong> (ordered lists in <code>[]</code>). Every unit is one big object made of both.</div></div><div class="jl-code">${jsonHL('{\n  "name": "PYROS",\n  "school": "fire",\n  "hp": 310,\n  "active": true\n}')}</div><div class="jl-p" style="font-size:9px;color:#6677aa">Curly braces wrap the object. Keys are in double-quotes. A colon separates key from value. Pairs are separated by commas.</div>`;},
    validator:null},
  {id:'objects',title:'OBJECTS & KEYS',icon:'02',exercise:true,initialCode:'{\n  \n}',
    render(){return`<div class="jl-h1">OBJECTS & KEYS</div><div class="jl-sub">LESSON 2 / 8 — OBJECTS</div><div class="jl-p">An <strong>object</strong> is a collection of key-value pairs in <code style="color:#7799ff">{}</code>. Every unit in this game is an object. Keys name the field; values hold the data.</div><div class="jl-code">${jsonHL('{\n  "id":   "shadow_wraith",\n  "name": "WRAITH",\n  "hp":   280\n}')}</div><div class="jl-rule"><div class="jl-rule-hdr">RULES</div><div class="jl-rule-body">• Keys must be in <strong>double quotes</strong>: <code>"key"</code> ✓ &nbsp; <code>key</code> ✗<br>• Joined by colon: <code>"key": value</code><br>• Pairs separated by commas — no trailing comma after the last one</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Write a valid JSON object with at least <strong>2 key-value pairs</strong>. Any keys and values work.</div></div>`;},
    validator(p){if(typeof p!=='object'||Array.isArray(p)||!p)return'Must be a JSON object {}';if(Object.keys(p).length<2)return'Need at least 2 key-value pairs';return null;}},
  {id:'types',title:'VALUE TYPES',icon:'03',exercise:true,initialCode:'{\n  \n}',
    render(){return`<div class="jl-h1">VALUE TYPES</div><div class="jl-sub">LESSON 3 / 8 — DATA TYPES</div><div class="jl-p">JSON values can be one of 6 types. Units use all of them.</div><div class="jl-code">${jsonHL('{\n  "name":   "VORTEX",\n  "hp":     220,\n  "spd":    2.4,\n  "magic":  true,\n  "target": null\n}')}</div><div class="jl-rule"><div class="jl-rule-hdr">THE 6 TYPES</div><div class="jl-rule-body"><span style="color:#44cc88">String</span> — text in double quotes: <code>"fire"</code><br><span style="color:#ffaa44">Number</span> — integer or decimal: <code>42</code> <code>2.5</code><br><span style="color:#cc77ff">Boolean</span> — <code>true</code> or <code>false</code><br><span style="color:#cc77ff">Null</span> — empty value: <code>null</code><br><span style="color:#7799ff">Object</span> — nested structure: <code>{}</code><br><span style="color:#7799ff">Array</span> — ordered list: <code>[]</code></div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Write a JSON object that contains: a <strong>string</strong>, a <strong>number</strong>, and a <strong>boolean</strong>.</div></div>`;},
    validator(p){if(typeof p!=='object'||Array.isArray(p)||!p)return'Must be a JSON object {}';const vs=Object.values(p);if(!vs.some(v=>typeof v==='string'))return'Missing a string value (text in double quotes)';if(!vs.some(v=>typeof v==='number'))return'Missing a number value (no quotes)';if(!vs.some(v=>typeof v==='boolean'))return'Missing a boolean — true or false';return null;}},
  {id:'arrays',title:'ARRAYS',icon:'04',exercise:true,initialCode:'{\n  \n}',
    render(){return`<div class="jl-h1">ARRAYS</div><div class="jl-sub">LESSON 4 / 8 — ORDERED LISTS</div><div class="jl-p">Arrays store ordered lists with <code style="color:#7799ff">[]</code>. Units use them for passives, projectile patterns, and tags.</div><div class="jl-code">${jsonHL('{\n  "schools":  ["fire", "void", "storm"],\n  "passives": ["berserker", "vampiric"],\n  "range":    [20, 200]\n}')}</div><div class="jl-rule"><div class="jl-rule-hdr">ARRAY RULES</div><div class="jl-rule-body">• Square brackets: <code>[]</code><br>• Items separated by commas<br>• Any value type — even mixed: <code>[1, "fire", true]</code><br>• Can be empty: <code>[]</code> &nbsp; Can hold objects: <code>[{}, {}]</code></div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Write a JSON object with at least one array containing <strong>3 or more items</strong>.</div></div>`;},
    validator(p){if(typeof p!=='object'||Array.isArray(p)||!p)return'Must be a JSON object {}';const arrs=Object.values(p).filter(v=>Array.isArray(v));if(!arrs.length)return'Need at least one array []';if(!arrs.some(a=>a.length>=3))return'Array needs at least 3 items';return null;}},
  {id:'nested',title:'NESTED OBJECTS',icon:'05',exercise:true,initialCode:'{\n  \n}',
    render(){return`<div class="jl-h1">NESTED OBJECTS</div><div class="jl-sub">LESSON 5 / 8 — DEEP STRUCTURE</div><div class="jl-p">Objects can contain other objects. Unit stats, magic systems, and AI behavior are all nested objects.</div><div class="jl-code">${jsonHL('{\n  "name": "PYROS",\n  "magic": {\n    "school": "fire",\n    "dmg":    45,\n    "cd":     800\n  },\n  "ai": {\n    "stance":     "aggressive",\n    "aggression": 0.75\n  }\n}')}</div><div class="jl-rule"><div class="jl-rule-hdr">NESTING RULES</div><div class="jl-rule-body">• Indent nested objects for readability<br>• No depth limit<br>• Commas separate siblings at the <em>same</em> level only<br>• Each <code>{}</code> inside is still a valid JSON object</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE</div><div class="jl-ex-body">Write a JSON object containing at least one <strong>nested object</strong> — a <code>{}</code> inside the outer <code>{}</code>.</div></div>`;},
    validator(p){if(typeof p!=='object'||Array.isArray(p)||!p)return'Must be a JSON object {}';const hasNested=Object.values(p).some(v=>v&&typeof v==='object'&&!Array.isArray(v));if(!hasNested)return'Need a nested object: a {} inside the outer {}';return null;}},
  {id:'schema',title:'UNIT SCHEMA',icon:'06',exercise:false,initialCode:'',
    render(){return`<div class="jl-h1">UNIT SCHEMA</div><div class="jl-sub">LESSON 6 / 8 — COMBAT FORGE FORMAT</div><div class="jl-p">Every unit in this game is a JSON object with this structure. Study each section — you will be modifying one next.</div><div class="jl-code" style="max-height:300px;overflow-y:auto">${jsonHL('{\n  "id":     "unit_id",\n  "name":   "UNIT NAME",\n  "school": "fire",\n  "desc":   "Description.",\n  "hp":     200,\n  "armor":  5,\n  "spd":    2.0,\n  "magic": {\n    "enabled": true,\n    "school":  "fire",\n    "spell":   { "dmg": 35, "cd": 900, "range": 200 },\n    "bolt":    { "speed": 5, "count": 1 },\n    "effect":  { "type": "burn" },\n    "sig":     { "type": "nova", "chargeRate": 1.0 }\n  },\n  "melee": {\n    "enabled": true,\n    "weapon":  "sword",\n    "dmg":     30,\n    "range":   55,\n    "cd":      1000\n  },\n  "ranged": { "enabled": false },\n  "passive":  { "id": "berserker", "power": 1.0 },\n  "passive2": { "id": "none",      "power": 1.0 },\n  "ai": {\n    "stance":     "aggressive",\n    "aggression": 0.75,\n    "spacing":    0.4\n  }\n}')}</div><div class="jl-rule"><div class="jl-rule-hdr">KEY SECTIONS</div><div class="jl-rule-body"><strong>hp / armor / spd</strong> — base stats<br><strong>magic</strong> — spell system (bolts, effects, signature)<br><strong>melee / ranged</strong> — attack modes<br><strong>passive / passive2</strong> — special abilities<br><strong>ai</strong> — personality and behavior</div></div>`;},
    validator:null},
  {id:'modify',title:'MODIFY A UNIT',icon:'07',exercise:true,
    initialCode:'{\n  "id": "template",\n  "name": "TEMPLATE",\n  "school": "fire",\n  "desc": "A starter unit. Edit me.",\n  "hp": 200,\n  "armor": 5,\n  "spd": 2.0,\n  "magic": {\n    "enabled": true,\n    "school": "fire",\n    "spell": { "dmg": 35, "cd": 900, "range": 200 },\n    "effect": { "type": "burn" },\n    "sig": { "type": "nova", "chargeRate": 1.0 }\n  },\n  "melee": { "enabled": false },\n  "ranged": { "enabled": false },\n  "passive": { "id": "berserker", "power": 1.0 },\n  "ai": { "stance": "aggressive", "aggression": 0.75 }\n}',
    render(){return`<div class="jl-h1">MODIFY A UNIT</div><div class="jl-sub">LESSON 7 / 8 — HANDS-ON EDIT</div><div class="jl-p">Below is a real unit template in Combat Forge JSON format. Edit it directly — this is the actual data the game engine reads.</div><div class="jl-ex"><div class="jl-ex-hdr">⚡ EXERCISE — MODIFY</div><div class="jl-ex-body">1. Change <code>"name"</code> to anything other than <code>"TEMPLATE"</code><br>2. Change <code>"hp"</code> to a different number<br>3. Keep the JSON valid — no red errors<br>4. Hit <strong>SUBMIT</strong></div></div>`;},
    validator(p){if(typeof p!=='object'||!p)return'Must be a JSON object';if(!p.name||typeof p.name!=='string')return'Missing "name" field';if(p.name==='TEMPLATE')return'Change "name" to something new';if(typeof p.hp!=='number')return'"hp" must be a number';if(p.hp===200)return'Change "hp" to a different number';return null;}},
  {id:'import',title:'BUILD & IMPORT',icon:'08',exercise:true,
    initialCode:'{\n  "id": "my_unit",\n  "name": "MY UNIT",\n  "school": "void",\n  "desc": "Built from scratch.",\n  "hp": 260,\n  "armor": 8,\n  "spd": 2.2,\n  "magic": {\n    "enabled": true,\n    "school": "void",\n    "spell": { "dmg": 28, "cd": 1100, "range": 220 },\n    "bolt":  { "speed": 5.5, "count": 1 },\n    "effect": { "type": "weaken" },\n    "sig": { "type": "beam", "chargeRate": 1.0 }\n  },\n  "melee": { "enabled": false },\n  "ranged": { "enabled": false },\n  "passive":  { "id": "vampiric",   "power": 1.0 },\n  "passive2": { "id": "spellweave","power": 1.0 },\n  "ai": { "stance": "cunning", "aggression": 0.6, "spacing": 0.5 }\n}',
    render(){return`<div class="jl-h1">BUILD & IMPORT</div><div class="jl-sub">LESSON 8 / 8 — MASTER TRIAL</div><div class="jl-p">This is the final lesson. Build a valid unit and press <strong style="color:#44ffaa">IMPORT TO ROSTER</strong>. Your unit enters the game — selectable in BATTLE, visible in ROSTER.</div><div class="jl-rule"><div class="jl-rule-hdr">REQUIRED FIELDS</div><div class="jl-rule-body"><code>id</code> — unique string, no spaces<br><code>name</code> — display name<br><code>school</code> — fire/frost/storm/arcane/void/nature/shadow/holy/blood/time<br><code>hp</code> — number ≥ 50<br><code>spd</code> — number ≥ 0.5</div></div><div class="jl-ex"><div class="jl-ex-hdr">⚡ MASTER TRIAL</div><div class="jl-ex-body">Customize the template or write your own unit. When validation passes, click <strong>IMPORT TO ROSTER</strong> to add it to the game.</div></div>`;},
    validator(p){if(typeof p!=='object'||!p)return'Must be a JSON object';if(!p.id||typeof p.id!=='string')return'Missing "id" (string, no spaces)';if(p.id.includes(' '))return'"id" must not contain spaces';if(!p.name||typeof p.name!=='string')return'Missing "name"';const vs=['fire','frost','storm','arcane','void','nature','shadow','holy','blood','time','ice','rune'];if(!vs.includes(p.school))return`"school" must be one of: ${vs.join(', ')}`;if(typeof p.hp!=='number'||p.hp<50)return'"hp" must be a number ≥ 50';if(typeof p.spd!=='number'||p.spd<0.5)return'"spd" must be a number ≥ 0.5';return null;}}
];

// ================================================================
// JSON IDE RENDER
// ================================================================
function renderJsonIde(){
  jsonInitUi();

  const completed=JsonFreedom.getCompleted();
  const rank=JsonFreedom.getRank();
  const rankObj=JSON_RANKS[rank];
  const n=completed.size,total=JSON_LESSONS.length;
  const pct=Math.round((n/total)*100);
  const lesson=JSON_LESSONS.find(l=>l.id===JIS.lesson)||JSON_LESSONS[0];
  const currentLevel = LEVEL_LOOKUP[JIS.lesson] || LEVELS[0];

  const llistHtml=JSON_LESSONS.map(l=>{
    const done=completed.has(l.id);const active=l.id===JIS.lesson;
    const icon=done?'✓':(active?'▸':l.icon);
    const col=done?'#44ff88':(active?'var(--acc)':'var(--dim)');
    return`<div class="json-litem${active?' active':''}${done?' done':''}" onclick="jsonGoLesson('${l.id}')"><span class="json-lnum" style="color:${col}">${icon}</span><span class="json-ltitle">${l.title}</span></div>`;
  }).join('');

  const featHtml=JSON_FEATURES.map(f=>{
    const on=rank>=f.minRank;
    return`<div class="rk-feat ${on?'on':'off'}"><span class="rk-feat-icon">${on?'✓':'○'}</span>${f.label}</div>`;
  }).join('');

  const toNext=rank<4?Math.max(0,JSON_RANKS[rank+1].minLessons-n):0;
  const sandboxHtml=rank>=4
    ?`<div class="rk-sandbox active">⚡ MASTER RANK<br><span style="color:#3a6a50;font-size:7px">All sandbox features active. Import any custom unit JSON directly to the roster.</span></div>`
    :`<div class="rk-sandbox">${toNext} more lesson${toNext===1?'':'s'} to unlock <strong>${JSON_RANKS[rank+1].name}</strong>.</div>`;
  const nextChapter=StoryProgress.nextChapter();
  const storyHtml=nextChapter
    ?`<div class="rk-sandbox story">📖 Story beat unlocked at <strong>${JSON_RANKS[nextChapter.rank].name}</strong> rank.</div>`
    :`<div class="rk-sandbox story active">📖 Story complete — the Forge has no more secrets to reveal.</div>`;

  const lc=lesson.render();
  const levelObjectiveHtml = `
    <div class="jl-rule" style="margin-bottom:10px">
      <div class="jl-rule-hdr">LEVEL ${currentLevel.num} / ${LEVELS.length}</div>
      <div class="jl-rule-body">${currentLevel.objective}</div>
    </div>`;
    let edSection = `
    <div style="flex:1; display:flex; flex-direction:column; overflow:hidden; min-height:0">
      <div class="jde-editor">
        <div id="jln"></div>
        <textarea id="jta" class="json-ta" spellcheck="false"
          oninput="jsonTaInput(this)" 
          onscroll="jsonSyncLineNumbers(this)" 
          onkeydown="jsonHandleEditorKeys(event, this)"
          onclick="jsonTaInput(this)"
          onkeyup="jsonTaInput(this)"></textarea>
      </div>
      <div id="jde-err" class="jde-err"></div>
    </div>
  `;

  if(lesson.exercise){
    const code=JIS.code!==''?JIS.code:(JIS.lesson===lesson.id?JIS.code:lesson.initialCode);
    const vr=jsonRunValidate(code,lesson.id);
    if(JIS.validation===null && code!==JIS.code) JIS.validation=vr;

    const isDone=completed.has(lesson.id);
    const isImport=lesson.id==='import';
    const canFmt=JsonFreedom.canFormat();
    const canLoad=JsonFreedom.canLoadUnit();
    const canExport=JsonFreedom.canEdit() || JsonFreedom.canLoadUnit();

    const subBtn=!isDone&&!isImport?`<button class="jbt go" id="jbt-sub" onclick="jsonSubmit()" ${(!vr||!vr.ok)?'disabled':''}>✓ SUBMIT</button>`:'';
    const impBtn=isImport?`<button class="jbt go" id="jbt-imp" onclick="jsonImport()" ${(!vr||!vr.ok)?'disabled':''}>▲ IMPORT TO ROSTER</button>`:'';
    const doneTag=isDone&&!isImport?`<span class="done-tag">✓ DONE</span>`:'';
    const loadSel=canLoad?`<select class="jbt-sel" onchange="jsonLoadUnit(this)"><option value="">⬇ LOAD UNIT</option>${S.units.map(u=>`<option value="${u.id}">${u.name}</option>`).join('')}</select>`:'';
    const fileBtn=canLoad?`<button class="jbt" onclick="document.getElementById('jfile').click()">⭳ FILE</button><input type="file" id="jfile" accept=".json,application/json" style="display:none" onchange="jsonLoadFile(this)">`:'';
    const exportBtn=canExport?`<button class="jbt" onclick="jsonDownload()">⬇ EXPORT</button>`:'';
    const safeCode=(code||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const lineNums=jsonLineNumbers(code||'');

    edSection=
      `<div class="json-tb">
        <button class="jbt" onclick="jsonFmt()" ${!canFmt?'disabled title="Requires STUDENT rank"':''}>⊞ FORMAT</button>
        <button class="jbt" onclick="jsonRst()">↺ RESET</button>
        <button class="jbt" onclick="jsonClr()">✕ CLEAR</button>
        ${exportBtn}
        ${fileBtn}
        ${loadSel}
        ${subBtn}
        ${impBtn}
        ${doneTag}
      </div>

      <div style="display:flex;gap:0;border:1px solid #131e38;border-radius:3px;overflow:hidden;background:#010306;min-height:170px;max-height:320px">
        <pre id="jln" style="margin:0;flex:0 0 38px;overflow-y:auto;overflow-x:hidden;background:#02050b;color:#2a3870;font-family:'Courier New',monospace;font-size:10px;line-height:1.7;padding:10px 6px;text-align:right;user-select:none;white-space:pre">${lineNums}</pre>
        <textarea class="json-ta" id="jta" spellcheck="false" oninput="jsonTaInput(this)" onscroll="jsonSyncLineNumbers(this)" onkeydown="jsonHandleEditorKeys(event,this)" placeholder="// write your JSON here.">${safeCode}</textarea>
      </div>

      <div id="jval" class="json-val ${vr&&vr.ok?'ok':vr&& (vr.syntaxErr||vr.lessonErr)?'err':'idle'}">${!String(code||'').trim()?'⬡ type JSON below to validate...':vr&&vr.syntaxErr?'✗ '+vr.syntaxErr:vr&&vr.lessonErr?'○ '+vr.lessonErr:'✓ Valid JSON — exercise complete!'}</div>

      <div style="font-size:8px;color:var(--dim);letter-spacing:1.5px;margin-bottom:4px;margin-top:2px">SYNTAX PREVIEW</div>
      <div style="display:grid;grid-template-columns:minmax(0,1fr) 220px;gap:8px;align-items:start">
        <div class="json-hl" id="jhl">${code?jsonHL(code):'<span style="color:#1a2540">// output appears here...</span>'}</div>
        <div id="jprev" style="background:#010306;border:1px solid #0a1020;border-radius:3px;padding:9px 10px;font-family:'Courier New',monospace;font-size:9px;line-height:1.7;color:#3a4a70;min-height:120px;overflow:auto">${jsonPreviewHtml(vr)}</div>
      </div>`;
  } else {
    const isDone=completed.has(lesson.id);
    edSection=`<div class="json-cbar">
    ${isDone?`<span class="done-tag">✓ LESSON COMPLETE</span>`:`<button class="jbt go" onclick="jsonMarkRead('${lesson.id}')">✓ MARK COMPLETE &amp; CONTINUE</button>`}</div>`;
  }

  document.getElementById('app').innerHTML=`${nav('json')}<div class="json-ide"><div class="json-lpanel"><div class="json-lhdr"><div style="font-size:8px;color:var(--dim);letter-spacing:2px;margin-bottom:7px">JSON LESSONS</div><div class="rk-bar-bg"><div class="rk-bar-fg" style="width:${pct}%"></div></div><div style="font-size:8px;color:#2a3870;margin-top:4px;letter-spacing:.5px">${n} / ${total} COMPLETE</div></div><div class="json-llist">${llistHtml}</div></div><div class="json-cmid"><div class="json-content">${lc}${levelObjectiveHtml}${edSection}</div></div><div class="json-rpanel"><div style="font-size:8px;color:var(--dim);letter-spacing:2px;margin-bottom:6px">FREEDOM RANK</div><div class="rk-bar-bg" style="margin-bottom:3px"><div class="rk-bar-fg" style="width:${pct}%"></div></div><div style="font-size:8px;color:#2a3870;margin-bottom:12px;letter-spacing:.5px">${n}/${total} — ${pct}%</div><div class="rk-badge"><span class="rk-badge-icon">${rankObj.icon}</span><div class="rk-badge-name">${rankObj.name}</div><div class="rk-badge-tier">${rankObj.tier} · ${rankObj.desc}</div></div><div style="font-size:8px;color:var(--dim);letter-spacing:1.5px;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid var(--border)">SANDBOX FEATURES</div>${featHtml}${sandboxHtml}${storyHtml}<div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border)"><button onclick="JsonFreedom.reset();JIS.lesson='intro';JIS.code='';JIS.validation=null;renderJsonIde()" style="width:100%;background:transparent;border:1px solid #200f0f;color:#3a1818;font-size:8px;padding:4px;border-radius:2px;cursor:pointer;font-family:monospace;transition:all .15s" onmouseover="this.style.borderColor='#ff4433';this.style.color='#ff7766'" onmouseout="this.style.borderColor='#200f0f';this.style.color='#3a1818'">↻ RESET PROGRESS</button></div></div></div>`;
}

function jsonGoLesson(id){
  const lesson=JSON_LESSONS.find(l=>l.id===id);if(!lesson)return;
  JIS.lesson=id;
  JIS.code=lesson.initialCode||'';
  JIS.validation=null;
  jIdeUndo.reset(JIS.code);
  jsonSaveDraft(JIS.code);
  renderJsonIde();
}

function jsonMarkRead(id){
  JsonFreedom.complete(id);
  showJIdToast(id);
  checkStoryProgress();
  const idx=JSON_LESSONS.findIndex(l=>l.id===id);
  const next=JSON_LESSONS[idx+1];
  setTimeout(()=>{
    if(next){JIS.lesson=next.id;JIS.code=next.initialCode||'';}
    JIS.validation=null;
    jsonSaveDraft(JIS.code);
    renderJsonIde();
  },1200);
}

function jsonTaInput(ta) {
  jIdeUndo.push(ta.value);
  JIS.code = ta.value;
  jsonSaveDraft(ta.value);
  const vr = jsonRunValidate(ta.value, JIS.lesson);
  JIS.validation = vr;
  jsonUpdateUi(ta.value, vr);
}


function jsonSyncLineNumbers(ta) {
  const ln = document.getElementById('jln');
  if (ln) ln.scrollTop = ta.scrollTop;
}


function jsonHandleEditorKeys(e, ta) {
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const value = ta.value;

  if (e.key === 'Tab') {
    e.preventDefault();
    if (!e.shiftKey) {
      ta.value = value.substring(0, start) + "  " + value.substring(end);
      ta.selectionStart = ta.selectionEnd = start + 2;
    } else {
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      if (value.substring(lineStart, lineStart + 2) === "  ") {
        ta.value = value.substring(0, lineStart) + value.substring(lineStart + 2);
        ta.selectionStart = ta.selectionEnd = Math.max(lineStart, start - 2);
      }
    }
    jsonTaInput(ta);
    return;
  }

  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault();
    const prev = jIdeUndo.undo();
    if (prev !== null) { ta.value = prev; jsonTaInput(ta); }
    return;
  }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
    e.preventDefault();
    const next = jIdeUndo.redo();
    if (next !== null) { ta.value = next; jsonTaInput(ta); }
    return;
  }

  const pairs = { '{': '}', '[': ']', '"': '"' };
  if (pairs[e.key] !== undefined) {
    e.preventDefault();
    const closeChar = pairs[e.key];
    ta.value = value.substring(0, start) + e.key + closeChar + value.substring(end);
    ta.selectionStart = ta.selectionEnd = start + 1;
    jsonTaInput(ta);
  }
}

function jsonRunValidate(code, lessonId) {
  if (!code || !code.trim()) {
    return { ok: false, error: { message: 'Empty script payload', line: 1, col: 1 } };
  }
  try {
    const parsed = JSON.parse(code);
    // Custom internal game lesson validation rules can execute safely on 'parsed' here
    return { ok: true, parsed, error: null };
  } catch (err) {
    const errDetails = parseJsonError(err, code);
    return { ok: false, parsed: null, error: errDetails };
  }
}

function jsonFmt(){
  if(!JsonFreedom.canFormat()){
    const v=document.getElementById('jval');
    if(v){v.className='json-val err';v.textContent='🔒 Format requires STUDENT rank (4 lessons)';}
    return;
  }
  const ta=document.getElementById('jta');if(!ta)return;
  try{
    ta.value=JSON.stringify(JSON.parse(ta.value),null,2);
    JIS.code=ta.value;
    jsonTaInput(ta);
  }catch(e){
    const v=document.getElementById('jval');
    if(v){v.className='json-val err';v.textContent='✗ Fix syntax errors before formatting';}
  }
}
function jsonClr(){
  const ta=document.getElementById('jta');if(!ta)return;
  ta.value='';
  JIS.code='';
  JIS.validation=null;
  jIdeUndo.reset('');
  jsonSaveDraft('');
  jsonTaInput(ta);
}
function jsonRst(){
  const lesson=JSON_LESSONS.find(l=>l.id===JIS.lesson);if(!lesson)return;
  const ta=document.getElementById('jta');if(!ta)return;
  ta.value=lesson.initialCode||'';
  JIS.code=ta.value;
  jIdeUndo.reset(JIS.code);
  jsonSaveDraft(JIS.code);
  jsonTaInput(ta);
}
function jsonLoadUnit(sel){
  const id=sel.value;sel.value='';if(!id)return;
  const def=getDef(id);if(!def)return;
  const ta=document.getElementById('jta');if(!ta)return;
  ta.value=JSON.stringify(def,null,2);
  JIS.code=ta.value;
  jIdeUndo.reset(JIS.code);
  jsonSaveDraft(JIS.code);
  jsonTaInput(ta);
}
async function jsonLoadFile(input){
  const file=input&&input.files&&input.files[0];
  input.value='';
  if(!file)return;
  const text=await file.text();
  const ta=document.getElementById('jta');
  if(ta){
    ta.value=text;
    jIdeUndo.reset(text);
    jsonTaInput(ta);
  }else{
    JIS.code=text;
    jIdeUndo.reset(text);
    jsonSaveDraft(text);
    renderJsonIde();
  }
}
function jsonDownload(){
  const text=JIS.code||'';
  const blob=new Blob([text],{type:'application/json;charset=utf-8'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=`${(JIS.lesson||'unit').replace(/[^a-z0-9_-]+/gi,'_')||'unit'}.json`;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),500);
}
function jsonSubmit(){
  const vr=JIS.validation||jsonRunValidate(JIS.code,JIS.lesson);
  if(!vr||!vr.ok)return;
  const currentId=JIS.lesson;
  JsonFreedom.complete(currentId);
  showJIdToast(currentId);
  checkStoryProgress();
  const idx=JSON_LESSONS.findIndex(l=>l.id===currentId);
  const next=JSON_LESSONS[idx+1];
  setTimeout(()=>{
    if(next){JIS.lesson=next.id;JIS.code=next.initialCode||'';}
    JIS.validation=null;
    jsonSaveDraft(JIS.code);
    renderJsonIde();
  },1200);
}
function jsonImport(){
  const vr=JIS.validation||jsonRunValidate(JIS.code,JIS.lesson);
  if(!vr||!vr.ok||!vr.parsed)return;
  const def=mkDef(vr.parsed);
  const idx=S.units.findIndex(u=>u.id===def.id);
  if(idx>=0)S.units[idx]=def;else S.units.push(def);
  const alreadyDone=JsonFreedom.getCompleted().has('import');
  JsonFreedom.complete('import');
  if(!alreadyDone){
    showJIdToast('import');
    setTimeout(()=>showImportToast(def.name),1300);
  } else {
    showImportToast(def.name);
  }
  checkStoryProgress();
  setTimeout(()=>{
    JIS.validation=null;
    renderJsonIde();
  },2000);
}
function showJIdToast(completedId){
  const completed=JsonFreedom.getCompleted();
  const newRank=JsonFreedom.getRank();
  const didRankUp=newRank>0&&completed.size===JSON_RANKS[newRank].minLessons;
  const t=document.createElement('div');
  t.className='unlock-toast';
  if(didRankUp){
    const ro=JSON_RANKS[newRank];
    t.innerHTML=`<div style="font-size:9px;color:#44ffaa;letter-spacing:3px;margin-bottom:6px">RANK UP</div><div style="font-size:26px;margin:4px 0">${ro.icon}</div><div style="font-size:15px;color:var(--acc);letter-spacing:3px;font-weight:bold">${ro.name}</div><div style="font-size:8px;color:#4455aa;margin-top:4px;letter-spacing:1px">${ro.desc} unlocked</div>`;
  } else {
    const lesson=JSON_LESSONS.find(l=>l.id===completedId);
    t.innerHTML=`<div style="font-size:9px;color:#44ffaa;letter-spacing:3px;margin-bottom:4px">LESSON COMPLETE</div><div style="font-size:10px;color:#8899cc;letter-spacing:1.5px">${lesson?lesson.title:''}</div>`;
  }
  document.body.appendChild(t);
  setTimeout(()=>{t.style.transition='opacity .3s';t.style.opacity='0';setTimeout(()=>t.remove(),300);},1100);
}
function showImportToast(name){
  const t=document.createElement('div');
  t.className='unlock-toast import-toast';
  t.innerHTML=`<div style="font-size:9px;color:#aabbff;letter-spacing:3px;margin-bottom:6px">UNIT IMPORTED</div><div style="font-size:17px;color:var(--acc);letter-spacing:3px;font-weight:bold;margin-bottom:6px">${name}</div><div style="font-size:8px;color:#4455aa;letter-spacing:1px">Now in ROSTER &amp; BATTLE</div>`;
  document.body.appendChild(t);
  setTimeout(()=>{t.style.transition='opacity .3s';t.style.opacity='0';setTimeout(()=>t.remove(),300);},1800);
}

// Auto-show tutorial on first visit
if(!TutorialCache.hasSeen()){renderTutorial();}else{setTab('battle');}

// Keyboard shortcuts
document.addEventListener('keydown',e=>{
  const target=e.target;
  const tag=(target&&target.tagName||'').toLowerCase();
  const isTyping=tag==='input'||tag==='textarea'||(target&&target.isContentEditable);
  if(isTyping)return;
  if(e.key==='?')setTab('tutorial');
  if(e.key==='t'||e.key==='T')showBattleTutorialMenu();
});
restartGame();
requestAnimationFrame(loop);
